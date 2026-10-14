import { afterAll, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { createEmbedder, createLLM, keysFromEnv } from "../src/llm/index.js";
import { parseState, renderInlineComment, renderSummary, FP_RE } from "../src/review/render.js";
import { runReview } from "../src/run.js";
import { GitHubClient } from "../src/github/client.js";
import type { Finding } from "../src/review/reviewer.js";
import { TempRepo } from "./helpers.js";

function setup() {
  const repo = new TempRepo();
  repo.write({
    "src/cart.ts": [
      'import { fmt } from "./fmt";',
      "export interface Item { price: number; qty: number }",
      "export function total(items: Item[]): number {",
      "  return items.reduce((s, i) => s + i.price * i.qty, 0);",
      "}",
      "export function label(items: Item[]) {",
      "  return fmt(total(items));",
      "}",
      "",
    ].join("\n"),
    "src/fmt.ts": "export function fmt(n: number) { return `$${n}`; }\n",
    "src/order.ts": 'import { total } from "./cart";\nexport function order(items: any[]) { return total(items); }\n',
  });
  const base = repo.commit("init");
  repo.git("checkout", "-q", "-b", "feature");
  repo.write({
    "src/cart.ts": [
      'import { fmt } from "./fmt";',
      "export interface Item { price: number; qty: number }",
      "export function total(items: Item[], discount?: number): number {",
      "  const sub = items.reduce((s, i) => s + i.price * i.qty, 0);",
      "  if (discount == null) return sub;",
      '  console.log("discount", discount);',
      "  return sub - sub * discount;",
      "}",
      "export function label(items: Item[]) {",
      "  return fmt(total(items));",
      "}",
      "export function coupon(code: string) {",
      "  return eval(code);",
      "}",
      "",
    ].join("\n"),
  });
  repo.remove("src/fmt.ts");
  const head = repo.commit("discounts");
  return { repo, base, head };
}

describe("end-to-end review with the mock provider", () => {
  const { repo, base, head } = setup();
  afterAll(() => repo.cleanup());

  it("produces anchored findings, suggestions and a summary", async () => {
    const cfg = loadConfig(repo.dir, undefined, { provider: "mock" });
    const llm = createLLM(cfg, keysFromEnv({}));
    const res = await runReview({
      root: repo.dir, cfg, llm, embedder: createEmbedder(cfg, {}), baseSha: base, headSha: head, title: "Discounts", body: "",
    });
    const { out } = res;
    expect(res.allFiles.map((f) => f.path).sort()).toEqual(["src/cart.ts", "src/fmt.ts"]);
    const byTitle = Object.fromEntries(out.inline.map((f) => [f.title, f]));
    expect(byTitle["eval() on dynamic input allows code injection"].line).toBe(13);
    expect(byTitle["Loose null comparison"].suggestion).toBe("  if (discount === null) return sub;");
    expect(byTitle["Debug logging left in code"].severity).toBe("low");
    // deleted file still imported -> deterministic note
    expect(out.outside.some((f) => f.title.includes("src/fmt.ts") && f.path === "src/cart.ts")).toBe(true);
    expect(out.summary?.confidence).toBe(2);
    expect(out.fileSummaries["src/cart.ts"]).toContain("Mock summary");
    expect(out.skipped).toEqual([{ path: "src/fmt.ts", reason: "deleted" }]);
    expect(llm.usage.calls).toBe(2);
  });

  it("respects min_severity and max_comments", async () => {
    const cfg = loadConfig(repo.dir, undefined, {
      provider: "mock",
      review: { min_severity: "medium", max_comments: 1 } as never,
    });
    const llm = createLLM(cfg, {});
    const { out } = await runReview({ root: repo.dir, cfg, llm, embedder: null, baseSha: base, headSha: head, title: "t", body: "" });
    expect(out.inline).toHaveLength(1);
    expect(out.inline[0].severity).toBe("critical");
    expect(out.dropped).toBeGreaterThan(0);
  });

  it("does incremental reviews of only new commits", async () => {
    repo.write({ "src/order.ts": 'import { total } from "./cart";\nexport function order(items: any[]) { console.log(items); return total(items); }\n' });
    const head2 = repo.commit("log orders");
    const cfg = loadConfig(repo.dir, undefined, { provider: "mock" });
    const llm = createLLM(cfg, {});
    const { out, reviewFiles, allFiles } = await runReview({
      root: repo.dir, cfg, llm, embedder: null, baseSha: base, headSha: head2, title: "t", body: "",
      incrementalFrom: head, previousFileSummaries: { "src/cart.ts": "earlier summary" },
    });
    expect(reviewFiles.map((f) => f.path)).toEqual(["src/order.ts"]);
    expect(allFiles.map((f) => f.path).sort()).toEqual(["src/cart.ts", "src/fmt.ts", "src/order.ts"]);
    expect(out.inline.map((f) => `${f.path}:${f.line}`)).toEqual(["src/order.ts:2"]);
    expect(out.fileSummaries["src/cart.ts"]).toBe("earlier summary");
  });
});

describe("rendering", () => {
  const f: Finding = {
    path: "a.ts", line: 3, severity: "high", category: "bug", title: "Off by one", body: "Loop skips the last item.",
    suggestion: "for (let i = 0; i <= n; i++) {", confidence: 0.9, fingerprint: "abc123",
  };

  it("renders inline comments with a suggestion and fingerprint", () => {
    const body = renderInlineComment(f);
    expect(body).toContain("```suggestion\nfor (let i = 0; i <= n; i++) {\n```");
    expect(body.match(FP_RE)?.[1]).toBe("abc123");
  });

  it("round-trips state through the summary comment, even with '--' in text", () => {
    const md = renderSummary(
      { inline: [f], outside: [], dropped: 0, fileSummaries: { "a.ts": "uses --flag --> safely" }, summary: null, reviewed: [], skipped: [], failed: [], budgetHit: false },
      { baseSha: "1".repeat(40), headSha: "2".repeat(40), provider: "mock", model: "m", usage: { calls: 1, inputTokens: 10, outputTokens: 5, embeddingTexts: 0 }, trigger: "@takche", allFiles: [] },
      {},
    );
    const comments = md.match(/<!--[\s\S]*?-->/g)!;
    expect(comments).toHaveLength(2); // summary marker + state, nothing broke out early
    const st = parseState(md);
    expect(st.lastSha).toBe("2".repeat(40));
    expect(st.files?.["a.ts"]).toBe("uses --flag --> safely");
  });
});

describe("GitHubClient.postReview", () => {
  it("falls back to single comments when the batch is rejected", async () => {
    const gh = new GitHubClient("t", "o", "r");
    const calls: string[] = [];
    const rest = gh.octokit.rest as unknown as Record<string, Record<string, unknown>>;
    rest.pulls.createReview = async () => {
      calls.push("batch");
      throw Object.assign(new Error("Unprocessable"), { status: 422 });
    };
    rest.pulls.createReviewComment = async (p: { line: number }) => {
      calls.push(`single:${p.line}`);
      if (p.line === 99) throw Object.assign(new Error("line not in diff"), { status: 422 });
      return {};
    };
    const mk = (line: number): Finding => ({
      path: "a.ts", line, severity: "low", category: "bug", title: `t${line}`, body: "b", confidence: 1, fingerprint: `f${line}`,
    });
    const failed = await gh.postReview(1, "sha", [mk(3), mk(99)], "COMMENT", "body");
    expect(calls).toEqual(["batch", "single:3", "single:99"]);
    expect(failed.map((f) => f.line)).toEqual([99]);
  });
});
