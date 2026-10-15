import { describe, expect, it, vi } from "vitest";
import { loadConfig } from "../src/config.js";
import { parseUnifiedDiff } from "../src/git/diff.js";
import { buildIndex, CodeGraph } from "../src/graph/indexer.js";
import { CALL_GRACE_MS, createEmbedder, TrackedLLM } from "../src/llm/index.js";
import { parseState, renderSummary } from "../src/review/render.js";
import { BudgetExceededError, DeadlineExceededError, type ChatRequest, type LLM } from "../src/llm/types.js";
import { MockChat } from "../src/llm/mock.js";
import { planBatches, relatedGroups, reviewPullRequest } from "../src/review/reviewer.js";
import { Searcher, buildChunks } from "../src/graph/search.js";
import { TempRepo } from "./helpers.js";

async function graphFor(repo: TempRepo) {
  const cfg = loadConfig(repo.dir, undefined, { provider: "mock" });
  const { data } = await buildIndex(repo.dir, cfg, null);
  return { cfg, graph: new CodeGraph(repo.dir, data) };
}

function diffs(repo: TempRepo, base: string, head: string) {
  return parseUnifiedDiff(repo.git("diff", "--no-color", "-U3", base, head));
}

describe("batch planning by graph affinity", () => {
  it("keeps a changed function and its changed callers in one batch", async () => {
    const repo = new TempRepo();
    try {
      repo.write({
        "src/a.ts": "export function total(x: number) { return x; }\n",
        "src/b.ts": 'import { total } from "./a";\nexport function b() { return total(1); }\n',
        "src/c.ts": 'import { total } from "./a";\nexport function c() { return total(2); }\n',
        "src/zz_unrelated.ts": "export function z() { return 1; }\n",
        "src/yy_unrelated.ts": "export function y() { return 1; }\n",
      });
      const base = repo.commit("init");
      repo.write({
        "src/zz_unrelated.ts": "export function z() { return 2; }\nexport function z2() { return 3; }\nexport function z3() { return 4; }\n",
        "src/yy_unrelated.ts": "export function y() { return 2; }\nexport function y2() { return 3; }\n",
        "src/a.ts": "export function total(x: number, y = 0) { return x + y; }\n",
        "src/b.ts": 'import { total } from "./a";\nexport function b() { return total(1, 1); }\n',
        "src/c.ts": 'import { total } from "./a";\nexport function c() { return total(2, 2); }\n',
      });
      const head = repo.commit("change");
      const { graph } = await graphFor(repo);
      const files = diffs(repo, base, head);
      const groups = relatedGroups(files, graph).map((g) => g.map((f) => f.path).sort());
      expect(groups).toContainEqual(["src/a.ts", "src/b.ts", "src/c.ts"]);
      expect(groups).toContainEqual(["src/zz_unrelated.ts"]);

      // Three files per call: the related trio stays together even though the unrelated files have bigger diffs.
      const batches = planBatches(files, graph, 100_000, new Set(), 3).map((b) => b.files.map((f) => f.path).sort());
      expect(batches).toContainEqual(["src/a.ts", "src/b.ts", "src/c.ts"]);
      expect(batches.flat().sort()).toEqual(files.map((f) => f.path).sort());
    } finally {
      repo.cleanup();
    }
  });

  it("splits a group that is larger than one batch without dropping files", async () => {
    const repo = new TempRepo();
    try {
      const names = ["a", "b", "c", "d", "e", "f", "g"];
      const src = (n: string, v: number) => (n === "a" ? `export function fa() { return ${v}; }\n` : `import { fa } from "./a";\nexport function f${n}() { return fa() + ${v}; }\n`);
      repo.write(Object.fromEntries(names.map((n) => [`src/${n}.ts`, src(n, 1)])));
      const base = repo.commit("init");
      repo.write(Object.fromEntries(names.map((n) => [`src/${n}.ts`, src(n, 2)])));
      const head = repo.commit("change");
      const { graph } = await graphFor(repo);
      const files = diffs(repo, base, head);
      expect(relatedGroups(files, graph)).toHaveLength(1);
      const batches = planBatches(files, graph, 100_000, new Set(), 5);
      expect(batches.map((b) => b.files.length)).toEqual([5, 2]);
      // The hub (the file every other one depends on) leads the first batch.
      expect(batches[0].files[0].path).toBe("src/a.ts");
      expect(batches.flatMap((b) => b.files.map((f) => f.path)).sort()).toEqual(files.map((f) => f.path).sort());
    } finally {
      repo.cleanup();
    }
  });
});

describe("batch planning: caller edges and priority", () => {
  it("links a changed function to a changed caller even without an import edge", async () => {
    const repo = new TempRepo();
    try {
      repo.write({
        "src/a.ts": "function uniqueHelperName(x: number) { return x; }\n",
        "src/b.ts": "function useIt() { return uniqueHelperName(1); }\n",
        "src/c.ts": "export function other() { return 1; }\n",
      });
      const base = repo.commit("init");
      repo.write({
        "src/a.ts": "function uniqueHelperName(x: number, y = 0) { return x + y; }\n",
        "src/b.ts": "function useIt() { return uniqueHelperName(1, 2); }\n",
        "src/c.ts": "export function other() { return 2; }\n",
      });
      const head = repo.commit("change");
      const { graph } = await graphFor(repo);
      const files = diffs(repo, base, head);
      const groups = relatedGroups(files, graph).map((g) => g.map((f) => f.path).sort());
      expect(groups).toContainEqual(["src/a.ts", "src/b.ts"]);
      expect(groups).toContainEqual(["src/c.ts"]);
    } finally {
      repo.cleanup();
    }
  });

  it("schedules groups with left-over files from the previous run first", async () => {
    const repo = new TempRepo();
    try {
      repo.write({ "src/big.ts": "export function big() { return 1; }\n", "src/small.ts": "export function small() { return 1; }\n" });
      const base = repo.commit("init");
      repo.write({
        "src/big.ts": "export function big() { return 2; }\nexport function big2() { return 3; }\nexport function big3() { return 4; }\n",
        "src/small.ts": "export function small() { return 2; }\n",
      });
      const head = repo.commit("change");
      const { graph } = await graphFor(repo);
      const files = diffs(repo, base, head);
      expect(planBatches(files, graph, 100_000, new Set(), 1).map((b) => b.files[0].path)).toEqual(["src/big.ts", "src/small.ts"]);
      expect(planBatches(files, graph, 100_000, new Set(["src/small.ts"]), 1).map((b) => b.files[0].path)).toEqual(["src/small.ts", "src/big.ts"]);
    } finally {
      repo.cleanup();
    }
  });
});

describe("TrackedLLM budget and deadline", () => {
  class SlowLLM implements LLM {
    provider = "slow";
    model = "slow";
    calls: ChatRequest[] = [];
    async chat(req: ChatRequest) {
      this.calls.push(req);
      await new Promise((r) => setTimeout(r, 20));
      return { text: "{}", inputTokens: 1000, outputTokens: 1 };
    }
  }

  it("reserves in-flight tokens so concurrent calls cannot all pass the budget check", async () => {
    const inner = new SlowLLM();
    const llm = new TrackedLLM(inner, 2000);
    const req = { system: "", user: "x".repeat(4000) }; // ~1000 tokens each
    const results = await Promise.allSettled([llm.chat(req), llm.chat(req), llm.chat(req)]);
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const budget = results.filter((r) => r.status === "rejected" && r.reason instanceof BudgetExceededError).length;
    expect(ok).toBe(2);
    expect(budget).toBe(1);
    expect(inner.calls).toHaveLength(2);
  });

  it("refuses calls after the deadline but lets started calls run into the grace period", async () => {
    const inner = new SlowLLM();
    const future = new TrackedLLM(inner, 1e9, Date.now() + 60_000);
    await future.chat({ system: "", user: "hi" });
    expect(inner.calls[0].deadline).toBe(future.deadline! + CALL_GRACE_MS);
    const past = new TrackedLLM(inner, 1e9, Date.now() - 1);
    await expect(past.chat({ system: "", user: "hi" })).rejects.toBeInstanceOf(DeadlineExceededError);
  });
});

describe("embedder and config guards", () => {
  it("gives embedders the run deadline plus grace", () => {
    const cfg = loadConfig("/nonexistent", undefined, { embeddings: "gemini" });
    const emb = createEmbedder(cfg, { gemini: "g" }, { deadline: 1000 });
    expect(emb?.deadline).toBe(1000 + CALL_GRACE_MS);
    expect(createEmbedder(cfg, { gemini: "g" })?.deadline).toBeUndefined();
  });

  it("falls back to default limits for NaN or negative values", () => {
    const cfg = loadConfig("/nonexistent", undefined, { limits: { max_run_seconds: Number.NaN, max_total_input_tokens: -5 } as never });
    expect(cfg.limits.max_run_seconds).toBe(900);
    expect(cfg.limits.max_total_input_tokens).toBe(1_500_000);
    expect(loadConfig("/nonexistent", undefined, { limits: { max_run_seconds: 0 } as never }).limits.max_run_seconds).toBe(0);
  });
});

describe("review deadline", () => {
  it("skips batches once the deadline has passed and reports it", async () => {
    const repo = new TempRepo();
    try {
      repo.write({ "src/a.ts": "export function a() { return 1; }\n", "src/b.ts": "export function b() { return 1; }\n" });
      const base = repo.commit("init");
      repo.write({ "src/a.ts": "export function a() { console.log(1); return 1; }\n", "src/b.ts": "export function b() { console.log(1); return 1; }\n" });
      const head = repo.commit("change");
      const { cfg, graph } = await graphFor(repo);
      const files = diffs(repo, base, head);
      const searcher = new Searcher(buildChunks(graph));
      const pr = { title: "t", body: "", changedFiles: [] };
      const out = await reviewPullRequest({ files, pr, graph, searcher, llm: new MockChat(), cfg, deadline: Date.now() - 1 });
      expect(out.deadlineHit).toBe(true);
      expect(out.skipped.map((s) => s.reason)).toEqual(["run deadline reached", "run deadline reached"]);
      expect(out.inline).toHaveLength(0);
      expect(out.funnel).toMatchObject({ raw: 0, capped: 0 });

      const ok = await reviewPullRequest({ files, pr, graph, searcher, llm: new MockChat(), cfg, deadline: Date.now() + 60_000 });
      expect(ok.deadlineHit).toBe(false);
      expect(ok.funnel.raw).toBe(2);
      expect(ok.funnel.capped).toBe(2);
      expect(ok.timings.review).toBeGreaterThanOrEqual(0);
    } finally {
      repo.cleanup();
    }
  });

  it("keeps findings but reports them as unverified when the verify pass hits the deadline", async () => {
    const repo = new TempRepo();
    try {
      repo.write({ "src/a.ts": "export function a() { return 1; }\n" });
      const base = repo.commit("init");
      repo.write({ "src/a.ts": "export function a() { console.log(1); return 1; }\n" });
      const head = repo.commit("change");
      const { cfg, graph } = await graphFor(repo);
      const files = diffs(repo, base, head);
      const searcher = new Searcher(buildChunks(graph));
      const mock = new MockChat();
      const llm: LLM = {
        provider: "mock",
        model: "mock",
        chat: async (req) => {
          if (req.label?.startsWith("verify:")) throw new DeadlineExceededError("deadline");
          return mock.chat(req);
        },
      };
      const out = await reviewPullRequest({ files, pr: { title: "t", body: "", changedFiles: [] }, graph, searcher, llm, cfg, verify: true });
      expect(out.inline).toHaveLength(1);
      expect(out.unverified).toBe(1);
      expect(out.deadlineHit).toBe(false); // the review itself completed; only verification was cut short
      const md = renderSummary(
        out,
        { baseSha: base, headSha: head, provider: "mock", model: "m", usage: { calls: 1, inputTokens: 1, outputTokens: 1, embeddingTexts: 0 }, trigger: "@amchi", allFiles: files },
        {},
      );
      expect(md).toContain("posted without the verification pass");
      expect(parseState(md).lastSha).toBe(head);
    } finally {
      repo.cleanup();
    }
  });

  it("records unreviewed files in the state comment so the next run can schedule them first", () => {
    const base = { inline: [], outside: [], dropped: 0, fileSummaries: {}, summary: null, reviewed: [], budgetHit: false, unverified: 0, funnel: { raw: 0, verified: 0, anchored: 0, passing: 0, capped: 0 }, timings: { context: 0, review: 0, verify: 0, summary: 0 } };
    const meta = { baseSha: "1".repeat(40), headSha: "2".repeat(40), provider: "mock", model: "m", usage: { calls: 1, inputTokens: 1, outputTokens: 1, embeddingTexts: 0 }, trigger: "@amchi", allFiles: [] };
    const partial = renderSummary(
      { ...base, skipped: [{ path: "x.ts", reason: "run deadline reached" }, { path: "y.ts", reason: "ignored by config" }], failed: ["z.ts"], deadlineHit: true },
      meta,
      { lastSha: "0".repeat(40) },
    );
    const st = parseState(partial);
    expect(st.pending?.sort()).toEqual(["x.ts", "z.ts"]);
    expect(st.lastSha).toBe("0".repeat(40));
    const complete = renderSummary({ ...base, skipped: [], failed: [], deadlineHit: false }, meta, { pending: ["x.ts"] });
    expect(parseState(complete).pending).toBeUndefined();
    expect(parseState(complete).lastSha).toBe("2".repeat(40));
  });
});

describe("importersOfMissingMany", () => {
  it("matches the single-path version with one pass", async () => {
    const repo = new TempRepo();
    try {
      repo.write({
        "src/x.ts": 'import { a } from "./gone";\nimport { b } from "./also";\nexport const x = a + b;\n',
        "src/y.ts": 'import { b } from "./also";\nexport const y = b;\n',
      });
      repo.commit("init");
      const { graph } = await graphFor(repo);
      const many = graph.importersOfMissingMany(["src/gone.ts", "src/also.ts", "src/x.ts", "src/gone.ts"]);
      expect(many.get("src/gone.ts")).toEqual(["src/x.ts"]);
      expect(many.get("src/also.ts")?.sort()).toEqual(["src/x.ts", "src/y.ts"]);
      expect(many.get("src/x.ts")).toEqual([]); // exists: real importers (none)
      expect(graph.importersOfMissing("src/also.ts").sort()).toEqual(["src/x.ts", "src/y.ts"]);
    } finally {
      repo.cleanup();
    }
  });
});

describe("config schema warnings", () => {
  it("warns about misspelled or unknown keys instead of ignoring them silently", async () => {
    const { log } = await import("../src/util/log.js");
    const warn = vi.spyOn(log, "warn").mockImplementation(() => undefined);
    try {
      const yaml = "model: x\nreview:\n  min_serverity: high\n  max_comments: 3\nlimits:\n  max_run_seconds: 10\nbogus: 1\n";
      const cfg = loadConfig("/nonexistent", undefined, {}, { readFile: (n) => (n === ".codereview.yml" ? yaml : null) });
      const msgs = warn.mock.calls.map((c) => c[0]);
      expect(msgs).toContain('Unknown config key "review.min_serverity" is ignored');
      expect(msgs).toContain('Unknown config key "bogus" is ignored');
      expect(msgs.some((m) => m.includes('"model"'))).toBe(false); // optional keys without a default are known
      expect(cfg.review.max_comments).toBe(3);
      expect(cfg.limits.max_run_seconds).toBe(10);
    } finally {
      warn.mockRestore();
    }
  });
});
