import { runDeadline, severityRank, type Config, type Severity } from "../config.js";
import { Git } from "../git/git.js";
import type { PostedComment, PullInfo } from "../github/client.js";
import { createEmbedder, createLLM, type Keys, type TrackedLLM } from "../llm/index.js";
import { parseState, renderSummary, setBadgeStyle, type ReviewState } from "../review/render.js";
import { renderFunnel, renderTimings, similar, type Finding, type ReviewOutput } from "../review/reviewer.js";
import { runReview } from "../run.js";
import { log } from "../util/log.js";

/** The part of GitHub the review orchestration needs; `GitHubClient` satisfies it, tests use a fake. */
export interface PrPort {
  findSummaryComment(number: number): Promise<{ id: number; body: string } | null>;
  existingComments(number: number): Promise<PostedComment[]>;
  postReview(number: number, commitId: string, findings: Finding[], event: "COMMENT" | "REQUEST_CHANGES", body: string): Promise<Finding[]>;
  upsertSummary(number: number, body: string, existingId?: number): Promise<void>;
}

/** Where run results go besides the PR: action outputs, the job summary, the check status. */
export interface Reporter {
  output(name: string, value: string | number): void;
  summary(markdown: string): Promise<void>;
  fail(message: string): void;
}

export const silentReporter: Reporter = { output: () => undefined, summary: async () => undefined, fail: () => undefined };

export interface ReviewPrResult {
  /** Why nothing was done, when nothing was done. */
  skipped?: string;
  out?: ReviewOutput;
  /** Findings posted as new inline comments this run. */
  posted?: Finding[];
  summary?: string;
  incrementalFrom?: string;
}

/** Why a PR is not reviewed, or null when it is. `force` (an explicit "@bot review") overrides every rule. */
export function shouldSkip(cfg: Config, pr: PullInfo, force: boolean): string | null {
  if (force) return null;
  if (!cfg.review.enabled) return "reviews disabled in config";
  if (cfg.review.skip_drafts && pr.draft) return "draft PR";
  if (cfg.review.skip_authors.map((a) => a.toLowerCase()).includes(pr.author.toLowerCase())) return `author ${pr.author} is skipped`;
  const label = pr.labels.find((l) => cfg.review.skip_labels.includes(l));
  if (label) return `label "${label}"`;
  const title = pr.title.toLowerCase();
  const pat = cfg.review.skip_title_patterns.find((p) => title.includes(p.toLowerCase()));
  if (pat) return `title contains "${pat}"`;
  return null;
}

/** Put the working tree at the PR head so the code graph matches the diff. */
export function checkoutHead(root: string, headSha: string) {
  const git = new Git(root);
  const head = git.revParse("HEAD");
  if (head === headSha) return;
  log.info(`Workspace is at ${head?.slice(0, 7) ?? "?"}, checking out PR head ${headSha.slice(0, 7)}`);
  if (!git.ensureCommit(headSha)) throw new Error(`Could not fetch PR head ${headSha}. Use actions/checkout with fetch-depth: 0.`);
  git.run(["checkout", "--detach", "--force", headSha]);
}

/**
 * Findings not already on the PR. A finding is "already posted" when a comment of
 * ours carries its fingerprint, or sits within three lines of it with a similar
 * title (the model re-titling the same issue on a later run).
 */
export function freshFindings(findings: Finding[], posted: PostedComment[]): Finding[] {
  const postedFps = new Set(posted.map((p) => p.fingerprint));
  return findings.filter(
    (f) =>
      !postedFps.has(f.fingerprint) &&
      !posted.some((p) => p.path === f.path && Math.abs(p.line - (f.endLine ?? f.line)) <= 3 && similar(p.title, f.title)),
  );
}

/** Review one pull request end to end: state, diff, model, posting, summary, outputs. */
export async function reviewPr(
  deps: { gh: PrPort; report: Reporter },
  cfg: Config,
  keys: Keys,
  root: string,
  pr: PullInfo,
  opts: { force: boolean },
): Promise<ReviewPrResult> {
  const { gh, report } = deps;
  const skip = shouldSkip(cfg, pr, opts.force);
  if (skip) {
    log.info(`Skipping review: ${skip}`);
    report.output("skipped", skip);
    return { skipped: skip };
  }
  setBadgeStyle(cfg.review.badges);
  checkoutHead(root, pr.headSha);
  const git = new Git(root);
  if (!git.ensureCommit(pr.baseSha)) throw new Error(`Could not fetch base commit ${pr.baseSha}. Use actions/checkout with fetch-depth: 0.`);

  // ---- state from the previous run --------------------------------------------
  const existing = await gh.findSummaryComment(pr.number);
  const state: ReviewState = existing ? parseState(existing.body) : {};
  let incrementalFrom: string | undefined;
  if (!opts.force && state.lastSha) {
    if (state.lastSha === pr.headSha) {
      const why = `commit ${pr.headSha.slice(0, 7)} was already reviewed`;
      log.info(`${why}; comment "${cfg.chat.trigger} review" to force a re-run`);
      return { skipped: why };
    }
    if (cfg.review.incremental && git.ensureCommit(state.lastSha) && git.isAncestor(state.lastSha, pr.headSha)) {
      incrementalFrom = state.lastSha;
    }
  }

  // ---- review ------------------------------------------------------------------
  // The run gets a wall-clock budget (indexing included) so partial results are posted before the job's own timeout kills it.
  const deadline = runDeadline(cfg);
  const llm = createLLM(cfg, keys, { deadline });
  const embedder = createEmbedder(cfg, keys, { deadline });
  const res = await runReview({
    root,
    cfg,
    llm,
    embedder,
    baseSha: pr.baseSha,
    headSha: pr.headSha,
    title: pr.title,
    body: pr.body,
    incrementalFrom,
    previousFileSummaries: incrementalFrom ? state.files : undefined,
    deadline,
    priorityPaths: state.pending,
  });
  const { out } = res;

  // ---- post ----------------------------------------------------------------------
  const posted = await gh.existingComments(pr.number);
  const fresh = freshFindings(out.inline, posted);
  if (fresh.length < out.inline.length) log.info(`Skipping ${out.inline.length - fresh.length} finding(s) already posted earlier`);

  const threshold = cfg.review.request_changes_on;
  const blocking = threshold !== "none" && fresh.some((f) => severityRank(f.severity) >= severityRank(threshold as Severity));
  const failedToPlace = await gh.postReview(
    pr.number,
    pr.headSha,
    fresh,
    blocking ? "REQUEST_CHANGES" : "COMMENT",
    fresh.length ? `Found ${fresh.length} issue(s) — see the summary comment for an overview.` : "",
  );
  out.funnel.posted = fresh.length - failedToPlace.length;
  // Anything GitHub refused to anchor goes into the summary instead.
  out.outside.push(...failedToPlace);
  out.inline = out.inline.filter((f) => !failedToPlace.includes(f));

  // Link each finding in the summary to its inline comment (from this or an earlier run).
  const commentUrls: Record<string, string> = {};
  const all = fresh.length ? await gh.existingComments(pr.number) : posted;
  for (const p of all) if (p.fingerprint) commentUrls[p.fingerprint] = p.url;

  const summary = renderSummary(
    out,
    {
      baseSha: res.mergeBase,
      headSha: pr.headSha,
      headSubject: git.run(["log", "-1", "--format=%s", pr.headSha], { allowFail: true }).trim() || undefined,
      incrementalFrom: res.incrementalFrom,
      provider: llm.provider,
      model: llm.model,
      usage: llm.usage,
      trigger: cfg.chat.trigger,
      allFiles: res.allFiles,
      commentUrls,
      botName: cfg.chat.trigger.replace(/^@/, "") || "Amchi",
    },
    state,
  );
  await gh.upsertSummary(pr.number, summary, existing?.id);
  logUsage(llm);
  log.info(`Findings funnel: ${renderFunnel(out.funnel)} · timings: ${renderTimings(out.timings)}`);

  // ---- report --------------------------------------------------------------------
  report.output("findings", out.inline.length + out.outside.length);
  report.output("confidence", out.summary?.confidence ?? "");
  report.output("input_tokens", llm.usage.inputTokens);
  report.output("output_tokens", llm.usage.outputTokens);
  await report.summary(
    `${summary.replace(/<!--.*?-->/gs, "")}\n\n<sub>Findings funnel: ${renderFunnel(out.funnel)} · ${renderTimings(out.timings)}</sub>\n`,
  );
  const failOn = cfg.review.fail_on;
  if (failOn !== "none") {
    const bad = [...out.inline, ...out.outside].filter((f) => severityRank(f.severity) >= severityRank(failOn));
    if (bad.length) report.fail(`${bad.length} finding(s) at or above "${failOn}" severity`);
  }
  return { out, posted: fresh.filter((f) => !failedToPlace.includes(f)), summary, incrementalFrom: res.incrementalFrom };
}

export function logUsage(llm: TrackedLLM) {
  const u = llm.usage;
  log.info(`LLM usage: ${u.calls} call(s), ${u.inputTokens.toLocaleString()} input / ${u.outputTokens.toLocaleString()} output tokens`);
}
