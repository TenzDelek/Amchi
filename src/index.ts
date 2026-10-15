import * as core from "@actions/core";
import { context } from "@actions/github";
import { loadConfig, type Config } from "./config.js";
import { answerQuestion } from "./chat/chat.js";
import { Git } from "./git/git.js";
import { parseUnifiedDiff } from "./git/diff.js";
import { GitHubClient, type PullInfo } from "./github/client.js";
import { openWorkspace } from "./graph/workspace.js";
import { createEmbedder, createLLM, keysFromEnv } from "./llm/index.js";
import { MARKER_PREFIX_RE } from "./review/render.js";
import { checkoutHead, logUsage, reviewPr, type Reporter } from "./action/review-pr.js";
import { isAbsolute } from "node:path";
import { log, setVerbose } from "./util/log.js";
import { relaunchWithBaselineWasm } from "./util/relaunch.js";

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
  const limits: Record<string, unknown> = {};
  const num = (name: string) => {
    const raw = input(name);
    if (!raw) return undefined;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      log.warn(`Ignoring input ${name}="${raw}": expected a non-negative number`);
      return undefined;
    }
    return n;
  };
  if (num("max_total_input_tokens") !== undefined) limits.max_total_input_tokens = num("max_total_input_tokens");
  if (num("max_run_seconds") !== undefined) limits.max_run_seconds = num("max_run_seconds");
  if (Object.keys(limits).length) o.limits = limits;
  return o as Partial<Config>;
}

async function main() {
  relaunchWithBaselineWasm();
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

  log.info(`amchi · event=${event} mode=${mode}`);

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
    if (MARKER_PREFIX_RE.test(body) || (await gh.isOwnComment(comment?.user))) return;
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
      await reviewPr({ gh, report: actionsReporter }, cfg, keys, root, pr, { force: true });
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
    await reviewPr({ gh, report: actionsReporter }, cfg, keys, root, pr, { force: false });
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

/** Results go to action outputs, the job summary and the check status. */
const actionsReporter: Reporter = {
  output: (name, value) => core.setOutput(name, value),
  summary: (md) => core.summary.addRaw(md).write().then(() => undefined).catch(() => undefined),
  fail: (msg) => core.setFailed(msg),
};

function hasKey(cfg: Config, keys: ReturnType<typeof keysFromEnv>): boolean {
  return cfg.provider === "mock" || !!(keys.openai || keys.anthropic || keys.gemini);
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main().catch((e) => {
  core.setFailed((e as Error).stack || String(e));
});
