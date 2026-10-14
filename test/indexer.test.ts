import { afterAll, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { buildIndex, CodeGraph } from "../src/graph/indexer.js";
import { buildChunks, Searcher } from "../src/graph/search.js";
import { TempRepo } from "./helpers.js";

describe("indexer", () => {
  const repo = new TempRepo();
  afterAll(() => repo.cleanup());
  repo.write({
    "go.mod": "module github.com/acme/app\n",
    "src/lib/math.ts": "export function add(a: number, b: number) { return a + b; }\n",
    "src/index.ts": 'import { add } from "./lib/math.js";\nexport function main() { return add(1, 2); }\n',
    "src/alias.ts": 'import { add } from "@/lib/math";\nexport const twice = (n: number) => add(n, n);\n',
    "pkg/util/strings.py": "def shout(s):\n    return s.upper()\n",
    "pkg/app.py": "from .util.strings import shout\nfrom pkg.util import strings\n\ndef run():\n    return shout('x')\n",
    "internal/store/store.go": "package store\n\nfunc Load(id string) string { return id }\n",
    "cmd/main.go": 'package main\n\nimport "github.com/acme/app/internal/store"\n\nfunc main() { store.Load("x") }\n',
    "tests/math.test.ts": 'import { add } from "../src/lib/math";\n',
    "package-lock.json": "{}",
    "README.md": "# Demo\nSome docs about add and math.\n",
  });
  repo.commit("init");
  const cfg = loadConfig(repo.dir);

  it("builds a graph with resolved imports, defs and callers", async () => {
    const { data, stats } = await buildIndex(repo.dir, cfg, null);
    expect(Object.keys(data.files)).not.toContain("package-lock.json");
    expect(Object.keys(data.files)).toContain("README.md");
    expect(stats.parsed).toBe(stats.total);

    expect(data.files["src/index.ts"].resolved).toEqual(["src/lib/math.ts"]);
    expect(data.files["src/alias.ts"].resolved).toEqual(["src/lib/math.ts"]);
    expect(data.files["pkg/app.py"].resolved).toEqual(expect.arrayContaining(["pkg/util/strings.py"]));
    expect(data.files["cmd/main.go"].resolved).toEqual(["internal/store/store.go"]);

    const g = new CodeGraph(repo.dir, data);
    expect(g.definitionsOf("add").map((d) => d.path)).toEqual(["src/lib/math.ts"]);
    expect(g.callersOf("add").map((c) => c.symbol.name).sort()).toEqual(["main", "twice"]);
    expect(g.callersOf("Load").map((c) => c.path)).toEqual(["cmd/main.go"]);
    expect(g.importersOf("src/lib/math.ts").sort()).toEqual(["src/alias.ts", "src/index.ts", "tests/math.test.ts"]);
    expect(g.testsFor("src/lib/math.ts")).toEqual(["tests/math.test.ts"]);
    expect(g.symbolsOverlapping("src/index.ts", 2, 2).map((s) => s.name)).toEqual(["main"]);
  });

  it("re-uses cached entries incrementally", async () => {
    const first = await buildIndex(repo.dir, cfg, null);
    repo.write({ "src/lib/math.ts": "export function add(a: number, b: number) { return a + b + 0; }\n" });
    const second = await buildIndex(repo.dir, cfg, first.data);
    expect(second.stats.parsed).toBe(1);
    expect(second.stats.reused).toBe(second.stats.total - 1);
  });

  it("finds importers of a deleted file", async () => {
    const { data } = await buildIndex(repo.dir, cfg, null);
    const g = new CodeGraph(repo.dir, data);
    // pretend math.ts was deleted
    const copy = { ...data, files: { ...data.files } };
    delete copy.files["src/lib/math.ts"];
    const g2 = new CodeGraph(repo.dir, copy);
    expect(g2.importersOfMissing("src/lib/math.ts").sort()).toEqual(["src/alias.ts", "src/index.ts", "tests/math.test.ts"]);
    expect(g.importersOfMissing("src/lib/math.ts").length).toBe(3);
  });

  it("searches chunks with BM25", async () => {
    const { data } = await buildIndex(repo.dir, cfg, null);
    const g = new CodeGraph(repo.dir, data);
    const s = new Searcher(buildChunks(g));
    const hits = await s.search("uppercase shout string", 3);
    expect(hits[0].chunk.path).toBe("pkg/util/strings.py");
  });
});

describe("indexer: dart / flutter", () => {
  const repo = new TempRepo();
  afterAll(() => repo.cleanup());
  repo.write({
    "pubspec.yaml": "name: prayer_app\ndescription: demo\n",
    "lib/main.dart": "import 'package:flutter/material.dart';\nimport 'package:prayer_app/features/store.dart';\nimport 'widgets/home.dart';\n\nvoid main() { runApp(const Home()); loadAll(); }\n",
    "lib/features/store.dart": "Future<void> loadAll() async {}\n",
    "lib/widgets/home.dart": "import '../features/store.dart';\nclass Home { void init() { loadAll(); } }\n",
    "packages/shared/lib/util.dart": "int twice(int x) => x * 2;\n",
    "lib/uses_shared.dart": "import 'package:shared/util.dart';\nint four() => twice(2);\n",
    "test/store_test.dart": "import 'package:prayer_app/features/store.dart';\n",
  });
  repo.commit("init");

  it("resolves package:, relative and monorepo imports and tracks callers", async () => {
    const { data } = await buildIndex(repo.dir, loadConfig(repo.dir), null);
    expect(data.files["lib/main.dart"].lang).toBe("dart");
    expect(data.files["lib/main.dart"].resolved.sort()).toEqual(["lib/features/store.dart", "lib/widgets/home.dart"]);
    expect(data.files["lib/widgets/home.dart"].resolved).toEqual(["lib/features/store.dart"]);
    expect(data.files["lib/uses_shared.dart"].resolved).toEqual(["packages/shared/lib/util.dart"]);
    const g = new CodeGraph(repo.dir, data);
    expect(g.definitionsOf("loadAll").map((d) => d.path)).toEqual(["lib/features/store.dart"]);
    expect(g.callersOf("loadAll").map((c) => `${c.path}:${c.symbol.name}`).sort()).toEqual(["lib/main.dart:main", "lib/widgets/home.dart:init"]);
    expect(g.testsFor("lib/features/store.dart")).toEqual(["test/store_test.dart"]);
  });
});
