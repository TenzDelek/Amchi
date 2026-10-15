import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { parseUnifiedDiff } from "../src/git/diff.js";
import { buildIndex, CodeGraph } from "../src/graph/indexer.js";
import { TrackedLLM } from "../src/llm/index.js";
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
      const batches = planBatches(files, graph, 100_000, 3).map((b) => b.files.map((f) => f.path).sort());
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
      const batches = planBatches(files, graph, 100_000, 5);
      expect(batches.map((b) => b.files.length)).toEqual([5, 2]);
      expect(batches.flatMap((b) => b.files.map((f) => f.path)).sort()).toEqual(files.map((f) => f.path).sort());
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

  it("refuses calls after the deadline and forwards it to the provider", async () => {
    const inner = new SlowLLM();
    const future = new TrackedLLM(inner, 1e9, Date.now() + 60_000);
    await future.chat({ system: "", user: "hi" });
    expect(inner.calls[0].deadline).toBe(future.deadline);
    const past = new TrackedLLM(inner, 1e9, Date.now() - 1);
    await expect(past.chat({ system: "", user: "hi" })).rejects.toBeInstanceOf(DeadlineExceededError);
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
      const many = graph.importersOfMissingMany(["src/gone.ts", "src/also.ts", "src/x.ts"]);
      expect(many.get("src/gone.ts")).toEqual(["src/x.ts"]);
      expect(many.get("src/also.ts")?.sort()).toEqual(["src/x.ts", "src/y.ts"]);
      expect(many.get("src/x.ts")).toEqual([]); // exists: real importers (none)
      expect(graph.importersOfMissing("src/also.ts").sort()).toEqual(["src/x.ts", "src/y.ts"]);
    } finally {
      repo.cleanup();
    }
  });
});
