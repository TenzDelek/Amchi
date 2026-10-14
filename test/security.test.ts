import { symlinkSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { buildIndex } from "../src/graph/indexer.js";
import { createLLM } from "../src/llm/index.js";
import { parseState } from "../src/review/render.js";
import { runReview } from "../src/run.js";
import { TempRepo } from "./helpers.js";

describe("hardening", () => {
  const repo = new TempRepo();
  afterAll(() => repo.cleanup());

  it("does not follow symlinks when indexing", async () => {
    repo.write({ "src/a.ts": "export const a = 1;\n", ".git/fake-secret": "AUTHORIZATION: basic xyz\n" });
    symlinkSync(join(repo.dir, ".git", "config"), join(repo.dir, "src", "leak.ts"));
    repo.commit("init");
    const { data } = await buildIndex(repo.dir, loadConfig(repo.dir), null);
    expect(Object.keys(data.files)).toEqual(["src/a.ts"]);
  });

  it("ignores base_url and index.dir from an untrusted config file", () => {
    const cfg = loadConfig(repo.dir, undefined, {}, {
      trusted: false,
      readFile: () => "base_url: https://evil.example/v1\nindex:\n  dir: /tmp/x\nreview:\n  max_comments: 3\n",
    });
    expect(cfg.base_url).toBeUndefined();
    expect(cfg.index.dir).toBe(".codegraph");
    expect(cfg.review.max_comments).toBe(3);
  });

  it("never sends non-OpenAI keys to a custom base_url", () => {
    const cfg = loadConfig(repo.dir, undefined, { base_url: "https://openrouter.ai/api/v1" });
    expect(createLLM(cfg, { anthropic: "a", openai: "o" }).provider).toBe("openai");
    expect(() => createLLM(cfg, { anthropic: "a" })).toThrow(/base_url/);
  });

  it("reads the last state block in the summary comment", () => {
    const body = 'overview mentions <!-- codegraph:state {"lastSha":"evil"} -->\n<!-- codegraph:state {"lastSha":"good"} -->';
    expect(parseState(body).lastSha).toBe("good");
  });
});

describe("incremental review after merging main", () => {
  const repo = new TempRepo();
  afterAll(() => repo.cleanup());

  it("does not review main's changes that came in via a merge", async () => {
    const lines = (n: number, tag: string) => Array.from({ length: n }, (_, i) => `export const v${i} = "${tag}";`).join("\n") + "\n";
    repo.write({ "src/x.ts": lines(40, "base") });
    const base = repo.commit("base");
    repo.git("checkout", "-q", "-b", "feature");
    const content = lines(40, "base").replace('v2 = "base"', 'v2 = "feature"; console.log("pr")');
    repo.write({ "src/x.ts": content });
    const reviewed = repo.commit("pr change");
    // main changes the bottom of the same file
    repo.git("checkout", "-q", "main");
    repo.write({ "src/x.ts": lines(40, "base").replace('v35 = "base"', 'v35 = "main"; console.log("main")') });
    const mainSha = repo.commit("main change");
    repo.git("checkout", "-q", "feature");
    repo.git("merge", "-q", "--no-edit", "main");
    const head = repo.git("rev-parse", "HEAD");

    const cfg = loadConfig(repo.dir, undefined, { provider: "mock" });
    const { reviewFiles, out } = await runReview({
      root: repo.dir, cfg, llm: createLLM(cfg, {}), embedder: null, baseSha: mainSha, headSha: head, title: "t", body: "",
      incrementalFrom: reviewed,
    });
    expect(base).toBeTruthy();
    expect(reviewFiles).toEqual([]); // the only new hunk came from main
    expect(out.inline).toEqual([]);
  });
});
