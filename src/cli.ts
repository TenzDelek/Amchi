#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadConfig, type Config } from "./config.js";
import { answerQuestion } from "./chat/chat.js";
import { Git } from "./git/git.js";
import { openWorkspace } from "./graph/workspace.js";
import { createEmbedder, createLLM, keysFromEnv } from "./llm/index.js";
import { renderLocalReport } from "./review/render.js";
import { renderFunnel, renderTimings } from "./review/reviewer.js";
import { runReview } from "./run.js";
import { log, setVerbose } from "./util/log.js";
import { relaunchWithBaselineWasm } from "./util/relaunch.js";

const HELP = `amchi — AI code review with a code graph

Usage:
  amchi review [--base <ref>] [--head <ref>] [options]
      Review the changes between base and head (default: merge-base with main..HEAD)
      and print a markdown report.
  amchi ask "<question>" [options]
      Ask a question about the repository.
  amchi index [options]
      Build or update the code graph cache (.amchi/).

Options:
  --repo <dir>        Repository root (default: current directory)
  --provider <name>   openai | anthropic | gemini | mock (default: auto from API keys)
  --model <id>        Model id (default depends on provider)
  --base-url <url>    OpenAI-compatible endpoint (Ollama, OpenRouter, Azure, …)
  --config <file>     Config file (default: .codereview.yml)
  --title <text>      PR title to give the reviewer (default: latest commit subject)
  --verify            Run the false-positive verification pass
  --out <file>        Write the report to a file instead of stdout
  --json              Output raw JSON findings
  --debug             Verbose logs

API keys are read from OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY.
`;

function parseArgs(argv: string[]) {
  const pos: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--") && !["verify", "json", "debug", "help"].includes(key)) {
        flags[key] = next;
        i++;
      } else flags[key] = true;
    } else if (a === "-h") flags.help = true;
    else pos.push(a);
  }
  return { pos, flags };
}

function str(v: string | boolean | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function defaultBase(git: Git): string {
  for (const ref of ["origin/main", "origin/master", "main", "master", "origin/develop", "develop"]) {
    if (git.revParse(ref)) return ref;
  }
  return "HEAD~1";
}

async function main() {
  relaunchWithBaselineWasm();
  const { pos, flags } = parseArgs(process.argv.slice(2));
  const cmd = pos[0];
  if (!cmd || flags.help) {
    process.stdout.write(HELP);
    return;
  }
  if (flags.debug) setVerbose(true);
  const root = resolve(str(flags.repo) ?? process.cwd());
  const overrides: Record<string, unknown> = {};
  if (str(flags.provider)) overrides.provider = str(flags.provider);
  if (str(flags.model)) overrides.model = str(flags.model);
  if (str(flags["base-url"])) overrides.base_url = str(flags["base-url"]);
  if (flags.verify) overrides.review = { verify: true };
  const cfg: Config = loadConfig(root, str(flags.config), overrides as Partial<Config>);
  const keys = keysFromEnv();
  const git = new Git(root);

  if (cmd === "index") {
    await openWorkspace(root, cfg, createEmbedder(cfg, keys), { commit: git.revParse("HEAD") ?? undefined });
    return;
  }

  if (cmd === "ask") {
    const question = pos.slice(1).join(" ").trim();
    if (!question) throw new Error('Usage: amchi ask "<question>"');
    const llm = createLLM(cfg, keys);
    const ws = await openWorkspace(root, cfg, createEmbedder(cfg, keys));
    const answer = await answerQuestion({ question, graph: ws.graph, searcher: ws.searcher, llm });
    output(answer, flags);
    return;
  }

  if (cmd === "review") {
    const base = str(flags.base) ?? defaultBase(git);
    const head = str(flags.head) ?? "HEAD";
    const baseSha = git.revParse(base);
    const headSha = git.revParse(head);
    if (!baseSha) throw new Error(`Unknown base ref: ${base}`);
    if (!headSha) throw new Error(`Unknown head ref: ${head}`);
    // Context is read from the working tree, so it must match the head commit.
    if (headSha !== git.revParse("HEAD")) {
      throw new Error(`--head ${head} is not the checked-out commit. Run "git checkout ${head}" first so the code graph matches the diff.`);
    }
    if (git.run(["status", "--porcelain", "--untracked-files=no"], { allowFail: true }).trim()) {
      log.warn("You have uncommitted changes; they are indexed for context but not reviewed. Commit them to review them.");
    }
    const deadline = cfg.limits.max_run_seconds > 0 ? Date.now() + cfg.limits.max_run_seconds * 1000 : undefined;
    const llm = createLLM(cfg, keys, { deadline });
    const embedder = createEmbedder(cfg, keys);
    const title = str(flags.title) ?? git.run(["log", "-1", "--format=%s", headSha]).trim();
    const body = git.run(["log", "-1", "--format=%b", headSha]).trim();
    const res = await runReview({ root, cfg, llm, embedder, baseSha, headSha, title, body, deadline });
    if (flags.json) {
      output(JSON.stringify({ ...res.out, reviewed: res.out.reviewed.map((f) => f.path), usage: llm.usage }, null, 2), flags);
    } else {
      output(
        renderLocalReport(res.out, {
          baseSha: res.mergeBase,
          headSha,
          headSubject: title,
          provider: llm.provider,
          model: llm.model,
          usage: llm.usage,
          trigger: cfg.chat.trigger,
          allFiles: res.allFiles,
        }),
        flags,
      );
    }
    log.info(`LLM usage: ${llm.usage.calls} call(s), ${llm.usage.inputTokens.toLocaleString()} in / ${llm.usage.outputTokens.toLocaleString()} out tokens`);
    log.info(`Findings funnel: ${renderFunnel(res.out.funnel)} · timings: ${renderTimings(res.out.timings)}`);
    return;
  }

  throw new Error(`Unknown command "${cmd}". Run with --help.`);
}

function output(text: string, flags: Record<string, string | boolean>) {
  const out = str(flags.out);
  if (out) {
    writeFileSync(out, text);
    log.info(`Wrote ${out}`);
  } else process.stdout.write(`${text}\n`);
}

main().catch((e) => {
  log.error((e as Error).message);
  process.exit(1);
});
