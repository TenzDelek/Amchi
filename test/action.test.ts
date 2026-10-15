import { afterAll, describe, expect, it } from "vitest";
import { freshFindings, reviewPr, shouldSkip, silentReporter, type PrPort, type Reporter } from "../src/action/review-pr.js";
import { loadConfig, type Config } from "../src/config.js";
import type { PostedComment, PullInfo } from "../src/github/client.js";
import { parseState, FP_RE } from "../src/review/render.js";
import type { Finding } from "../src/review/reviewer.js";
import { TempRepo } from "./helpers.js";

/** In-memory GitHub: one summary comment, a list of inline comments, and a log of every call. */
class FakePr implements PrPort {
  summary: { id: number; body: string } | null = null;
  comments: PostedComment[] = [];
  calls: string[] = [];
  /** Findings `postReview` should pretend GitHub rejected. */
  reject: (f: Finding) => boolean = () => false;
  private nextId = 100;

  async findSummaryComment() {
    this.calls.push("findSummaryComment");
    return this.summary;
  }
  async existingComments() {
    this.calls.push("existingComments");
    return [...this.comments];
  }
  async postReview(_n: number, _sha: string, findings: Finding[], event: string) {
    this.calls.push(`postReview:${event}:${findings.length}`);
    const failed: Finding[] = [];
    for (const f of findings) {
      if (this.reject(f)) failed.push(f);
      else this.comments.push({ id: this.nextId, url: `https://x/r${this.nextId++}`, path: f.path, line: f.endLine ?? f.line, title: f.title, fingerprint: f.fingerprint });
    }
    return failed;
  }
  async upsertSummary(_n: number, body: string, existingId?: number) {
    this.calls.push(`upsertSummary:${existingId ? "update" : "create"}`);
    this.summary = { id: existingId ?? 1, body };
  }
}

function recordingReporter() {
  const outputs: Record<string, string | number> = {};
  let failed: string | null = null;
  const report: Reporter = { output: (k, v) => void (outputs[k] = v), summary: async () => undefined, fail: (m) => void (failed = m) };
  return { report, outputs, failed: () => failed };
}

function pull(repo: TempRepo, base: string, head: string, over: Partial<PullInfo> = {}): PullInfo {
  return { number: 7, title: "Discounts", body: "", draft: false, author: "dev", labels: [], baseSha: base, headSha: head, baseRef: "main", headRef: "feature", state: "open", ...over };
}

function setup() {
  const repo = new TempRepo();
  repo.write({
    "src/cart.ts": "export function total(items: number[]): number {\n  return items.reduce((s, i) => s + i, 0);\n}\n",
    "src/other.ts": "export function other() { return 1; }\n",
  });
  const base = repo.commit("init");
  repo.git("checkout", "-q", "-b", "feature");
  repo.write({ "src/cart.ts": "export function total(items: number[]): number {\n  console.log(items);\n  return items.reduce((s, i) => s + i, 0);\n}\nexport function coupon(code: string) {\n  return eval(code);\n}\n" });
  const head = repo.commit("discounts");
  const cfg = loadConfig(repo.dir, undefined, { provider: "mock" });
  return { repo, base, head, cfg };
}

describe("shouldSkip", () => {
  const cfg = loadConfig("/nonexistent");
  const pr = pull(new TempRepo(), "a", "b");
  it("applies the skip rules unless forced", () => {
    expect(shouldSkip(cfg, pr, false)).toBeNull();
    expect(shouldSkip(cfg, { ...pr, draft: true }, false)).toBe("draft PR");
    expect(shouldSkip(cfg, { ...pr, author: "Dependabot[bot]" }, false)).toMatch(/author/);
    expect(shouldSkip(cfg, { ...pr, labels: ["no-ai-review"] }, false)).toBe('label "no-ai-review"');
    expect(shouldSkip(cfg, { ...pr, title: "WIP: [wip] thing" }, false)).toMatch(/title contains/);
    expect(shouldSkip(cfg, { ...pr, draft: true }, true)).toBeNull();
  });
});

describe("freshFindings", () => {
  const f = (over: Partial<Finding>): Finding => ({ path: "a.ts", line: 10, severity: "high", category: "bug", title: "Null pointer dereference on user", body: "", confidence: 0.9, fingerprint: "fp1", ...over });
  it("drops findings already posted by fingerprint or by nearby similar title", () => {
    const posted: PostedComment[] = [{ id: 1, url: "u", path: "a.ts", line: 11, title: "Null pointer dereference on user object", fingerprint: "other" }];
    expect(freshFindings([f({})], posted)).toHaveLength(0); // similar title within 3 lines
    expect(freshFindings([f({ line: 30 })], posted)).toHaveLength(1);
    expect(freshFindings([f({ line: 30, fingerprint: "other" })], posted)).toHaveLength(0); // same fingerprint anywhere
    expect(freshFindings([f({ title: "Totally different problem" })], posted)).toHaveLength(1);
  });
});

describe("reviewPr orchestration", () => {
  const { repo, base, head, cfg } = setup();
  afterAll(() => repo.cleanup());

  it("skips without touching GitHub when a skip rule matches", async () => {
    const gh = new FakePr();
    const { report, outputs } = recordingReporter();
    const r = await reviewPr({ gh, report }, cfg, {}, repo.dir, pull(repo, base, head, { draft: true }), { force: false });
    expect(r.skipped).toBe("draft PR");
    expect(outputs.skipped).toBe("draft PR");
    expect(gh.calls).toEqual([]);
  });

  it("first run: posts inline comments, creates the summary with state, sets outputs", async () => {
    const gh = new FakePr();
    const { report, outputs } = recordingReporter();
    const r = await reviewPr({ gh, report }, cfg, {}, repo.dir, pull(repo, base, head), { force: false });
    expect(r.skipped).toBeUndefined();
    expect(r.posted!.map((f) => f.title).sort()).toEqual(["Debug logging left in code", "eval() on dynamic input allows code injection"]);
    expect(gh.calls).toEqual(["findSummaryComment", "existingComments", "postReview:COMMENT:2", "existingComments", "upsertSummary:create"]);
    const st = parseState(gh.summary!.body);
    expect(st.lastSha).toBe(head);
    expect(st.reviews).toBe(1);
    expect(Object.keys(st.issues ?? {})).toHaveLength(2);
    expect(gh.summary!.body).toContain("[▶](https://x/r100)"); // findings link to their inline comments
    expect(outputs.findings).toBe(2);
    expect(outputs.confidence).toBe(2);
    expect(r.out!.funnel.posted).toBe(2);
  });

  it("second run on the same commit does nothing", async () => {
    const gh = new FakePr();
    await reviewPr({ gh, report: silentReporter }, cfg, {}, repo.dir, pull(repo, base, head), { force: false });
    gh.calls = [];
    const r = await reviewPr({ gh, report: silentReporter }, cfg, {}, repo.dir, pull(repo, base, head), { force: false });
    expect(r.skipped).toMatch(/already reviewed/);
    expect(gh.calls).toEqual(["findSummaryComment"]);
  });

  it("forced re-run reposts nothing that is already on the PR and updates the summary in place", async () => {
    const gh = new FakePr();
    await reviewPr({ gh, report: silentReporter }, cfg, {}, repo.dir, pull(repo, base, head), { force: false });
    const before = gh.comments.length;
    const r = await reviewPr({ gh, report: silentReporter }, cfg, {}, repo.dir, pull(repo, base, head), { force: true });
    expect(r.posted).toHaveLength(0);
    expect(gh.comments).toHaveLength(before);
    expect(gh.calls.filter((c) => c.startsWith("postReview"))).toEqual(["postReview:COMMENT:2", "postReview:COMMENT:0"]);
    expect(gh.calls.at(-1)).toBe("upsertSummary:update");
    expect(parseState(gh.summary!.body).reviews).toBe(2);
  });

  it("incremental push reviews only the new commit and keeps earlier file summaries", async () => {
    const gh = new FakePr();
    await reviewPr({ gh, report: silentReporter }, cfg, {}, repo.dir, pull(repo, base, head), { force: false });
    repo.write({ "src/other.ts": "export function other() { console.log('x'); return 2; }\n" });
    const head2 = repo.commit("touch other");
    try {
      const r = await reviewPr({ gh, report: silentReporter }, cfg, {}, repo.dir, pull(repo, base, head2), { force: false });
      expect(r.incrementalFrom).toBe(head);
      expect(r.posted!.map((f) => f.path)).toEqual(["src/other.ts"]);
      const st = parseState(gh.summary!.body);
      expect(st.lastSha).toBe(head2);
      expect(st.files?.["src/cart.ts"]).toContain("Mock summary"); // carried over from the first run
      expect(gh.summary!.body).toContain("(incremental)");
    } finally {
      repo.git("reset", "-q", "--hard", head);
    }
  });

  it("partial run keeps lastSha, records pending files, and the next run picks them up", async () => {
    const gh = new FakePr();
    const tight: Config = { ...cfg, limits: { ...cfg.limits, max_run_seconds: 1e-9 } }; // deadline is already in the past
    const r = await reviewPr({ gh, report: silentReporter }, tight, {}, repo.dir, pull(repo, base, head), { force: false });
    expect(r.out!.deadlineHit).toBe(true);
    expect(r.posted).toHaveLength(0);
    const st = parseState(gh.summary!.body);
    expect(st.lastSha).toBeUndefined();
    expect(st.pending).toEqual(["src/cart.ts"]);
    expect(gh.summary!.body).toContain("Run deadline reached");

    const r2 = await reviewPr({ gh, report: silentReporter }, cfg, {}, repo.dir, pull(repo, base, head), { force: false });
    expect(r2.skipped).toBeUndefined();
    expect(r2.posted).toHaveLength(2);
    expect(parseState(gh.summary!.body).lastSha).toBe(head);
    expect(parseState(gh.summary!.body).pending).toBeUndefined();
  });

  it("findings GitHub refuses to place move into the summary and are not counted as posted", async () => {
    const gh = new FakePr();
    gh.reject = (f) => f.title.startsWith("eval");
    const { report, outputs } = recordingReporter();
    const r = await reviewPr({ gh, report }, cfg, {}, repo.dir, pull(repo, base, head), { force: false });
    expect(r.posted!.map((f) => f.title)).toEqual(["Debug logging left in code"]);
    expect(r.out!.funnel.posted).toBe(1);
    expect(r.out!.outside.map((f) => f.title)).toEqual(["eval() on dynamic input allows code injection"]);
    expect(outputs.findings).toBe(2);
    expect(gh.summary!.body).toContain("`src/cart.ts:6`"); // listed with its location instead of a link
  });

  it("request_changes_on and fail_on act on the posted severities", async () => {
    const gh = new FakePr();
    const strict: Config = { ...cfg, review: { ...cfg.review, request_changes_on: "critical", fail_on: "high" } };
    const { report, failed } = recordingReporter();
    await reviewPr({ gh, report }, strict, {}, repo.dir, pull(repo, base, head), { force: false });
    expect(gh.calls).toContain("postReview:REQUEST_CHANGES:2");
    expect(failed()).toMatch(/1 finding\(s\) at or above "high"/);
    expect(gh.comments.every((c) => FP_RE.test(`<!-- amchi:fp=${c.fingerprint} -->`))).toBe(true);
  });
});
