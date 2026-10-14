import * as core from "@actions/core";
import { context } from "@actions/github";
import { loadConfig, severityRank, type Config, type Severity } from "./config.js";
import { answerQuestion } from "./chat/chat.js";
import { Git } from "./git/git.js";
import { parseUnifiedDiff } from "./git/diff.js";
import { GitHubClient, type PullInfo } from "./github/client.js";
import { openWorkspace } from "./graph/workspace.js";
import { createEmbedder, createLLM, keysFromEnv, type TrackedLLM } from "./llm/index.js";
import { renderSummary, parseState, type ReviewState } from "./review/render.js";
import { runReview } from "./run.js";
import { similar } from "./review/reviewer.js";
import { isAbsolute } from "node:path";
import { log, setVerbose } from "./util/log.js";

function input(name: string): string {
  return core.getInput(name) || "";
}

function configOverrides(): Partial<Config> {
  const o: Record<string, unknown> = {};
  if (input("provider")) o.provider = input("provider");
  if (input("model")) o.model = input("model");
  if (input("base_url")) o.base_url = input("base_url");
  if (input("embeddings")) o.embeddings = input("embeddings");
  const review: Record<string, unknown> = {};
  if (input("max_comments")) review.max_comments = Number(input("max_comments"));
  if (input("min_severity")) review.min_severity = input("min_severity");
  if (input("verify")) review.verify = input("verify") === "true";
  if (input("fail_on")) review.fail_on = input("fail_on");
  if (Object.keys(review).length) o.review = review;
  if (input("trigger")) o.chat = { trigger: input("trigger") };
  if (input("max_total_input_tokens")) o.limits = { max_total_input_tokens: Number(input("max_total_input_tokens")) };
  return o as Partial<Config>;
}

async function main() {
  setVerbose(core.isDebug());
  // Map action inputs to the env vars the providers read.
  if (input("openai_api_key")) process.env.OPENAI_API_KEY = input("openai_api_key");
  if (input("anthropic_api_key")) process.env.ANTHROPIC_API_KEY = input("anthropic_api_key");
  if (input("gemini_api_key")) process.env.GEMINI_API_KEY = input("gemini_api_key");

  const root = process.env.GITHUB_WORKSPACE || process.cwd();
  // Config from the checked-out tree; for PR events it's replaced by the base commit's config below.
  let cfg = loadActionConfig(root);
  const keys = keysFromEnv();
  const token = input("github_token") || process.env.GITHUB_TOKEN || "";
  const { owner, repo } = context.repo;
  const gh = token ? new GitHubClient(token, owner, repo) : null;
  const event = context.eventName;
  const mode = input("mode") || "auto";
  const payload = context.payload as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

  log.info(`takche · event=${event} mode=${mode}`);

  if (mode === "index" || (mode === "auto" && ["push", "workflow_dispatch", "schedule"].includes(event))) {
    const embedder = createEmbedder(cfg, keys);
    const ws = await openWorkspace(root, cfg, embedder, { commit: context.sha });
    core.setOutput("indexed_files", ws.stats.total);
    return;
  }
  if (!gh) throw new Error("github_token is required to review pull requests");

  // ---------------------------------------------------------------- chat / commands
  if (event === "issue_comment" || event === "pull_request_review_comment") {
    const comment = payload.comment;
    const body: string = comment?.body ?? "";
    if (payload.action !== "created" || comment?.user?.type === "Bot") return;
    // Never answer ourselves (matters when github_token is a PAT posting as a user).
    if (body.includes("<!-- takche:") || (await gh.isOwnComment(comment?.user))) return;
    const number: number | undefined = payload.issue?.number ?? payload.pull_request?.number;
    const isPr = event === "pull_request_review_comment" || !!payload.issue?.pull_request;
    // The workspace holds the PR head, which the PR author controls: read config from the base commit.
    const pr: PullInfo | undefined = isPr && number ? await gh.getPull(number) : undefined;
    if (pr) cfg = loadActionConfig(root, pr.baseSha);
    const trigger = cfg.chat.trigger;
    if (!body.toLowerCase().includes(trigger.toLowerCase())) {
      log.info(`Comment does not mention ${trigger}; nothing to do`);
      return;
    }
    if (!cfg.chat.allowed_associations.includes(comment.author_association)) {
      log.info(`Ignoring ${trigger} from ${comment.user?.login} (association ${comment.author_association})`);
      return;
    }
    const question = body.replace(new RegExp(escapeRe(trigger), "ig"), "").trim();
    if (!hasKey(cfg, keys)) {
      log.info("No LLM API key available to this run (fork PRs don't receive secrets); skipping");
      return;
    }
    const kind = event === "issue_comment" ? "issue" : "review";
    await gh.react(kind, comment.id, "eyes");

    if (pr && /^(review|re-?review|full review)\b/i.test(question)) {
      await reviewPr(gh, cfg, keys, root, pr, { force: true });
      await gh.react(kind, comment.id, "rocket");
      return;
    }
    if (!cfg.chat.enabled) return;
    if (!question) {
      await gh.replyToIssueComment(number!, `Ask me something after \`${trigger}\`, e.g. \`${trigger} where is the session token validated?\``);
      return;
    }

    const llm = createLLM(cfg, keys);
    const embedder = createEmbedder(cfg, keys);
    let prFiles = undefined;
    if (pr) {
      checkoutHead(root, pr.headSha);
      const git = new Git(root);
      git.ensureCommit(pr.baseSha);
      const mb = git.mergeBase(pr.baseSha, pr.headSha) ?? pr.baseSha;
      prFiles = parseUnifiedDiff(git.diff(mb, pr.headSha));
    }
    const ws = await openWorkspace(root, cfg, embedder, { commit: pr?.headSha ?? context.sha });
    const blobBase = `${context.serverUrl}/${owner}/${repo}/blob/${pr?.headSha ?? context.sha}`;
    let thread;
    let rootId: number | undefined;
    if (event === "pull_request_review_comment") {
      rootId = comment.in_reply_to_id ?? comment.id;
      thread = {
        path: comment.path,
        line: comment.line ?? comment.original_line,
        diffHunk: comment.diff_hunk,
        history: await gh.threadHistory(number!, rootId!),
      };
    }
    try {
      const answer = await answerQuestion({
        question,
        graph: ws.graph,
        searcher: ws.searcher,
        llm,
        pr: pr && prFiles ? { title: pr.title, body: pr.body, files: prFiles } : undefined,
        thread,
        blobBase,
      });
      if (rootId) await gh.replyInThread(number!, rootId, answer);
      else {
        const quoted = question.split("\n").map((l) => `> ${l}`).join("\n");
        await gh.replyToIssueComment(number!, `${quoted}\n\n${answer}`);
      }
      logUsage(llm);
    } catch (e) {
      await gh.react(kind, comment.id, "confused");
      throw e;
    }
    return;
  }

  // ---------------------------------------------------------------- pull request review
  if (event === "pull_request" || event === "pull_request_target") {
    const number = payload.pull_request?.number as number;
    const pr = await gh.getPull(number);
    if (pr.state !== "open") {
      log.info("PR is not open; skipping");
      return;
    }
    cfg = loadActionConfig(root, pr.baseSha);
    if (!hasKey(cfg, keys)) {
      log.info("No LLM API key available to this run (fork PRs don't receive secrets); skipping review");
      core.setOutput("skipped", "no API key");
      return;
    }
    await reviewPr(gh, cfg, keys, root, pr, { force: false });
    return;
  }

  log.info(`Event ${event} is not handled; nothing to do`);
}

function loadActionConfig(root: string, baseSha?: string): Config {
  let readFile: ((name: string) => string | null) | undefined;
  if (baseSha) {
    const git = new Git(root);
    git.ensureCommit(baseSha);
    readFile = (name: string) => {
      if (isAbsolute(name)) return null;
      const out = git.run(["show", `${baseSha}:${name.replace(/^\.?\//, "")}`], { allowFail: true });
      return out || null;
    };
  }
  return loadConfig(root, input("config_path") || undefined, configOverrides(), { readFile, trusted: false });
}

function hasKey(cfg: Config, keys: ReturnType<typeof keysFromEnv>): boolean {
  return cfg.provider === "mock" || !!(keys.openai || keys.anthropic || keys.gemini);
}

function shouldSkip(cfg: Config, pr: PullInfo, force: boolean): string | null {
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

function checkoutHead(root: string, headSha: string) {
  const git = new Git(root);
  const head = git.revParse("HEAD");
  if (head === headSha) return;
  log.info(`Workspace is at ${head?.slice(0, 7) ?? "?"}, checking out PR head ${headSha.slice(0, 7)}`);
  if (!git.ensureCommit(headSha)) throw new Error(`Could not fetch PR head ${headSha}. Use actions/checkout with fetch-depth: 0.`);
  git.run(["checkout", "--detach", "--force", headSha]);
}

async function reviewPr(
  gh: GitHubClient,
  cfg: Config,
  keys: ReturnType<typeof keysFromEnv>,
  root: string,
  pr: PullInfo,
  opts: { force: boolean },
) {
  const skip = shouldSkip(cfg, pr, opts.force);
  if (skip) {
    log.info(`Skipping review: ${skip}`);
    core.setOutput("skipped", skip);
    return;
  }
  checkoutHead(root, pr.headSha);
  const git = new Git(root);
  if (!git.ensureCommit(pr.baseSha)) throw new Error(`Could not fetch base commit ${pr.baseSha}. Use actions/checkout with fetch-depth: 0.`);

  const existing = await gh.findSummaryComment(pr.number);
  const state: ReviewState = existing ? parseState(existing.body) : {};
  let incrementalFrom: string | undefined;
  if (!opts.force && state.lastSha) {
    if (state.lastSha === pr.headSha) {
      log.info(`Commit ${pr.headSha.slice(0, 7)} was already reviewed; comment "${cfg.chat.trigger} review" to force a re-run`);
      return;
    }
    if (cfg.review.incremental && git.ensureCommit(state.lastSha) && git.isAncestor(state.lastSha, pr.headSha)) {
      incrementalFrom = state.lastSha;
    }
  }

  const llm = createLLM(cfg, keys);
  const embedder = createEmbedder(cfg, keys);
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
  });
  const { out } = res;

  // Never repeat a comment that was already posted on this PR (even if resolved),
  // including the same issue re-titled by the model on a later run.
  const posted = await gh.existingComments(pr.number);
  const postedFps = new Set(posted.map((p) => p.fingerprint));
  const fresh = out.inline.filter(
    (f) =>
      !postedFps.has(f.fingerprint) &&
      !posted.some((p) => p.path === f.path && Math.abs(p.line - (f.endLine ?? f.line)) <= 3 && similar(p.title, f.title)),
  );
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
  // Anything GitHub refused to anchor goes into the summary instead.
  out.outside.push(...failedToPlace);
  out.inline = out.inline.filter((f) => !failedToPlace.includes(f));

  const summary = renderSummary(
    out,
    {
      baseSha: res.mergeBase,
      headSha: pr.headSha,
      incrementalFrom: res.incrementalFrom,
      provider: llm.provider,
      model: llm.model,
      usage: llm.usage,
      trigger: cfg.chat.trigger,
      allFiles: res.allFiles,
    },
    state,
  );
  await gh.upsertSummary(pr.number, summary, existing?.id);
  logUsage(llm);

  core.setOutput("findings", out.inline.length + out.outside.length);
  core.setOutput("confidence", out.summary?.confidence ?? "");
  core.setOutput("input_tokens", llm.usage.inputTokens);
  core.setOutput("output_tokens", llm.usage.outputTokens);
  await core.summary.addRaw(summary.replace(/<!--.*?-->/gs, "")).write().catch(() => undefined);

  const failOn = cfg.review.fail_on;
  if (failOn !== "none") {
    const bad = [...out.inline, ...out.outside].filter((f) => severityRank(f.severity) >= severityRank(failOn));
    if (bad.length) core.setFailed(`${bad.length} finding(s) at or above "${failOn}" severity`);
  }
}

function logUsage(llm: TrackedLLM) {
  const u = llm.usage;
  log.info(`LLM usage: ${u.calls} call(s), ${u.inputTokens.toLocaleString()} input / ${u.outputTokens.toLocaleString()} output tokens`);
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main().catch((e) => {
  core.setFailed((e as Error).stack || String(e));
});
