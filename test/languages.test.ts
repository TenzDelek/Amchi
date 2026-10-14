import { describe, expect, it } from "vitest";
import { parseSource } from "../src/graph/parser.js";

const CASES: [string, string, string[], string[]][] = [
  ["kotlin", "import com.acme.Store\nclass A { fun run() { Store().save(1) } }\nfun top() = A().run()", ["A", "run", "top"], ["save"]],
  ["c_sharp", "using Acme.Store;\nclass A { void Run() { var s = new Store(); s.Save(); } }", ["A", "Run"], ["Store", "Save"]],
  ["php", "<?php\nuse Acme\\Store;\nclass A { function run() { $s = new Store(); $s->save(); helper(); } }\nfunction helper() {}", ["A", "run", "helper"], ["save", "helper"]],
  ["swift", "import Foundation\nclass A { func run() { save(1) } }\nfunc save(_ x: Int) {}", ["A", "run", "save"], ["save"]],
  ["scala", "import acme.Store\nobject A { def run(): Unit = Store.save(1) }", ["A", "run"], ["save"]],
  ["cpp", "#include \"store.h\"\nclass A { public: void run(); };\nvoid A::run() { save(1); }\nint main() { A a; a.run(); }", ["A", "run", "main"], ["save"]],
  ["c", "#include <stdio.h>\nstatic int add(int a, int b) { return a + b; }\nint main() { printf(\"%d\", add(1,2)); }", ["add", "main"], ["add", "printf"]],
  ["lua", "local function helper() return 1 end\nfunction run() return helper() end", ["helper", "run"], ["helper"]],
  ["tsx", "import React from 'react';\nexport function Button({ onClick }: P) { return <button onClick={() => track('x')} />; }", ["Button"], ["track"]],
  ["javascript", "const x = require('./x');\nmodule.exports = function a() { return x.go(); };\nclass B { m() { return a(); } }", ["B", "m"], []],
];

describe("language coverage", () => {
  for (const [lang, src, syms, calls] of CASES) {
    it(lang, async () => {
      const p = (await parseSource(src, lang))!;
      expect(p, `${lang} grammar loads`).toBeTruthy();
      const names = p.symbols.map((s) => s.name);
      for (const s of syms) expect(names, `${lang} symbols`).toContain(s);
      const allCalls = new Set([...p.symbols.flatMap((s) => s.calls), ...p.topLevelCalls]);
      for (const c of calls) expect([...allCalls], `${lang} calls`).toContain(c);
    });
  }
  it("dart: classes, methods, constructors, selector calls, imports and body ranges", async () => {
    const src = `import 'package:flutter/material.dart';
import '../providers/prayer_requests_providers.dart' as prov;
part 'bar.g.dart';

enum PrayerSort { newest, oldest }
mixin Loggable { void log(String m) => print(m); }
extension IntX on int { int doubled() => this * 2; }
abstract class Repo { Future<List<int>> fetch(); }

class PrayerRequestsNotifier extends StateNotifier<int> with Loggable {
  final Repo repo;
  PrayerRequestsNotifier(this.repo) : super(0);
  PrayerRequestsNotifier.named() : repo = FakeRepo(), super(1);
  factory PrayerRequestsNotifier.create() => PrayerRequestsNotifier(FakeRepo());

  Future<void> refreshLatest() async {
    final items = await repo.fetch();
    _shiftCount(1);
    list..add(1)..clear();
    items.map((e) => e * 2).toList();
  }
  void _shiftCount(int n) { state += n; }
  int get count => state;
}

void main() { runApp(const MyApp()); }
class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(home: Scaffold(body: Text('hi')));
}
`;
    const p = (await parseSource(src, "dart"))!;
    expect(p).toBeTruthy();
    const by = Object.fromEntries(p.symbols.map((s) => [`${s.parent ?? ""}.${s.name}`, s]));
    expect(by[".PrayerSort"].kind).toBe("enum");
    expect(by[".Loggable"].kind).toBe("mixin");
    expect(by["Loggable.log"].kind).toBe("method");
    expect(by["IntX.doubled"].kind).toBe("method");
    expect(by["Repo.fetch"].kind).toBe("method");
    expect(by["PrayerRequestsNotifier.PrayerRequestsNotifier"].kind).toBe("constructor");
    expect(by["PrayerRequestsNotifier.named"].kind).toBe("constructor");
    expect(by["PrayerRequestsNotifier.create"].kind).toBe("constructor");
    expect(by["MyApp.MyApp"].kind).toBe("constructor");
    expect(by[".main"].kind).toBe("function");
    expect(by["MyApp.build"].calls).toEqual(["MaterialApp", "Scaffold", "Text"]);
    // The body is a sibling of the signature: the symbol must span it and own its calls.
    const r = by["PrayerRequestsNotifier.refreshLatest"];
    expect(r.end - r.start).toBeGreaterThanOrEqual(5);
    expect(r.calls).toEqual(expect.arrayContaining(["fetch", "_shiftCount", "add", "clear", "map", "toList"]));
    expect(by["PrayerRequestsNotifier.named"].calls).toContain("FakeRepo");
    expect(by[".main"].calls).toEqual(expect.arrayContaining(["runApp", "MyApp"]));
    expect(p.imports).toEqual(["package:flutter/material.dart", "../providers/prayer_requests_providers.dart", "bar.g.dart"]);
  });

  it("parses elixir without crashing", async () => {
    const p = await parseSource("defmodule A do\n  def run, do: Store.save(1)\nend", "elixir");
    expect(p).toBeTruthy();
  });
  it("records require() as an import", async () => {
    const p = (await parseSource("const x = require('./x');", "javascript"))!;
    expect(p.imports).toContain("./x");
  });
});
