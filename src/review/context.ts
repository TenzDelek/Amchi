import type { CodeGraph } from "../graph/indexer.js";
import type { SymbolInfo } from "../graph/parser.js";
import type { Searcher } from "../graph/search.js";
import { changedRanges, type FileDiff } from "../git/diff.js";
import { estimateTokens, lineSlice, numberLines, tokenize } from "../util/text.js";

export interface ContextSection {
  title: string;
  body: string;
  priority: number;
}

/** Names so common (builtins, collection methods) that name-matching them is mostly noise. */
const COMMON_NAMES = new Set([
  "map", "filter", "reduce", "forEach", "find", "findIndex", "some", "every", "includes", "indexOf", "slice", "splice",
  "push", "pop", "shift", "unshift", "concat", "join", "split", "replace", "match", "test", "exec", "trim", "keys",
  "values", "entries", "get", "set", "has", "delete", "add", "clear", "then", "catch", "finally", "toString",
  "valueOf", "call", "apply", "bind", "log", "warn", "error", "info", "debug", "parse", "stringify", "from", "of",
  "append", "extend", "insert", "remove", "update", "items", "format", "len", "print", "str", "int", "list", "dict",
  "range", "open", "close", "read", "write", "send", "emit", "on", "off", "next", "resolve", "reject", "assert",
  "equal", "expect", "toBe", "toEqual", "it", "describe", "test", "new", "make", "Println", "Printf", "Errorf",
  "String", "Error", "length", "size", "sort", "reverse", "copy", "clone", "unwrap", "expect", "into", "iter",
  "collect", "to_string", "as_str", "Ok", "Err", "Some", "None",
]);

const DEF_RE = /\b(?:function|def|func|class|fn|interface|type|struct|enum|trait)\s+([A-Za-z_$][\w$]*)/;

function rawSnippet(graph: CodeGraph, path: string, start: number, end: number, maxLines = 60): string | null {
  const content = graph.read(path);
  if (content == null) return null;
  const e = Math.min(end, start + maxLines - 1);
  const body = numberLines(lineSlice(content, start, e), start);
  const more = end > e ? `\n      … (${end - e} more lines)` : "";
  return `\`${path}:${start}-${end}\`\n\`\`\`\n${body}${more}\n\`\`\``;
}

/** Find the line in [start,end] that calls `name` (for showing call sites). */
function callSiteLine(graph: CodeGraph, path: string, sym: SymbolInfo, name: string): number | null {
  const content = graph.read(path);
  if (!content) return null;
  const lines = content.split("\n");
  const re = new RegExp(`\\b${name.replace(/[$]/g, "\\$")}\\s*[(<{!]|\\bnew\\s+${name.replace(/[$]/g, "\\$")}\\b`);
  for (let i = sym.start; i <= Math.min(sym.end, lines.length); i++) {
    if (re.test(lines[i - 1])) return i;
  }
  return null;
}

/**
 * Collect repository context for one changed file, ordered by usefulness and
 * trimmed to `budget` tokens.
 */
export async function buildFileContext(
  fd: FileDiff,
  graph: CodeGraph,
  searcher: Searcher,
  budget: number,
  prPaths: Set<string>,
): Promise<string> {
  const sections: ContextSection[] = [];
  const path = fd.path;
  // Track what has been shown so later sections don't repeat it.
  const seen: { path: string; start: number; end: number }[] = [];
  const overlapsSeen = (p: string, s: number, e: number) => seen.some((x) => x.path === p && x.start <= e && x.end >= s);
  const snippet = (p: string, s: number, e: number, maxLines = 60) => {
    const sn = rawSnippet(graph, p, s, e, maxLines);
    if (sn) seen.push({ path: p, start: s, end: e });
    return sn;
  };
  const entry = graph.file(path);
  const ranges = changedRanges(fd);
  const addedText = fd.hunks
    .flatMap((h) => h.lines.filter((l) => l.type === "add").map((l) => l.text))
    .join("\n");
  const deletedText = fd.hunks
    .flatMap((h) => h.lines.filter((l) => l.type === "del").map((l) => l.text))
    .join("\n");
  const addedTokens = new Set(tokenize(addedText).concat(addedText.match(/[A-Za-z_$][\w$]*/g) ?? []));

  // 1. Enclosing definitions of the changed lines (full bodies, numbered).
  const changedSyms = new Map<string, SymbolInfo>();
  if (entry && fd.status !== "deleted") {
    for (const [s, e] of ranges) {
      const syms = graph.symbolsOverlapping(path, s, e);
      // innermost symbol that is not a huge container
      const inner = [...syms].reverse().find((x) => x.end - x.start < 250) ?? syms[syms.length - 1];
      if (inner) changedSyms.set(`${inner.name}@${inner.start}`, inner);
      // also record every function-ish symbol touched (for caller analysis)
      for (const x of syms) if (!["class", "module", "namespace", "impl"].includes(x.kind)) changedSyms.set(`${x.name}@${x.start}`, x);
    }
    const shown = new Set<string>();
    for (const sym of changedSyms.values()) {
      if (sym.end - sym.start > 200) continue;
      const key = `${sym.start}-${sym.end}`;
      if (shown.has(key)) continue;
      shown.add(key);
      const sn = snippet(path, sym.start, sym.end, 200);
      if (sn) sections.push({ title: `Full ${sym.kind} \`${sym.name}\` after the change`, body: sn, priority: 100 });
    }
  }

  // 2. Definitions of functions/types used in the added code.
  if (entry) {
    const calls = new Set<string>();
    for (const sym of changedSyms.values()) for (const c of sym.calls) if (addedTokens.has(c)) calls.add(c);
    for (const c of entry.topLevelCalls) if (addedTokens.has(c)) calls.add(c);
    let n = 0;
    for (const name of calls) {
      if (n >= 10) break;
      const all = graph.definitionsOf(name, path).filter(
        (d) => !(d.path === path && [...changedSyms.values()].some((s) => s.start === d.symbol.start)),
      );
      // Precision over recall: only trust a name match when the definition is in this file,
      // in a file it imports, or is the only definition with that name in the repo.
      const defs = all.filter((d) => d.path === path || graph.dependsOn(path, d.path));
      if (!defs.length && all.length === 1 && !COMMON_NAMES.has(name)) defs.push(all[0]);
      const d = defs[0];
      if (!d) continue;
      const sn = snippet(d.path, d.symbol.start, d.symbol.end, 40);
      if (sn) {
        sections.push({
          title: `Definition of \`${name}\` (called by the changed code)${defs.length > 1 ? ` — ${defs.length} definitions found, showing best match` : ""}`,
          body: sn,
          priority: 80 - n,
        });
        n++;
      }
    }
  }

  // 3. Callers of changed symbols (impact of signature/behaviour changes).
  {
    let n = 0;
    for (const sym of changedSyms.values()) {
      if (["class", "module", "namespace", "impl", "interface"].includes(sym.kind)) continue;
      if (COMMON_NAMES.has(sym.name)) continue;
      const unique = (graph.defsByName.get(sym.name)?.length ?? 0) <= 1;
      const relevant = graph
        .callersOf(sym.name)
        .filter((c) => !(c.path === path && c.symbol.start === sym.start))
        .filter((c) => unique || c.path === path || graph.dependsOn(c.path, path));
      const callers = relevant.slice(0, 6);
      if (!callers.length) continue;
      const parts: string[] = [];
      for (const c of callers) {
        const line = callSiteLine(graph, c.path, c.symbol, sym.name);
        if (line == null) continue;
        const sn = snippet(c.path, Math.max(c.symbol.start, line - 3), Math.min(c.symbol.end, line + 3), 8);
        if (sn) parts.push(`in \`${c.symbol.name}\`${prPaths.has(c.path) ? " (also changed in this PR)" : ""}:\n${sn}`);
      }
      if (parts.length) {
        const total = relevant.length;
        sections.push({
          title: `Callers of \`${sym.name}\` (${total} total${total > parts.length ? `, showing ${parts.length}` : ""})`,
          body: parts.join("\n\n"),
          priority: 70 - n,
        });
        n++;
      }
      if (n >= 5) break;
    }
  }

  // 4. Removed definitions that are still referenced elsewhere.
  {
    const removed = new Set<string>();
    for (const l of deletedText.split("\n")) {
      const m = l.match(DEF_RE);
      if (m && !graph.defsByName.has(m[1])) removed.add(m[1]);
    }
    for (const name of removed) {
      const refs = graph.callersOf(name).slice(0, 5);
      if (!refs.length) continue;
      const list = refs
        .map((r) => {
          const line = callSiteLine(graph, r.path, r.symbol, name);
          return `- \`${r.path}:${line ?? r.symbol.start}\` in \`${r.symbol.name}\``;
        })
        .join("\n");
      sections.push({
        title: `⚠ \`${name}\` was removed/renamed in this diff but is still referenced`,
        body: list,
        priority: 95,
      });
    }
  }

  // 5. Who depends on this file + related tests.
  {
    const importers = graph.importersOf(path);
    const tests = graph.testsFor(path);
    const lines: string[] = [];
    if (importers.length) {
      lines.push(
        `Imported by ${importers.length} file(s): ${importers.slice(0, 10).map((p) => `\`${p}\``).join(", ")}${importers.length > 10 ? ", …" : ""}`,
      );
    }
    if (entry?.resolved.length) {
      lines.push(`Imports: ${entry.resolved.slice(0, 10).map((p) => `\`${p}\``).join(", ")}`);
    }
    if (tests.length) {
      const changed = tests.filter((t) => prPaths.has(t));
      lines.push(
        `Related tests: ${tests.map((t) => `\`${t}\``).join(", ")}${changed.length ? ` (updated in this PR: ${changed.join(", ")})` : " (not updated in this PR)"}`,
      );
    }
    if (lines.length) sections.push({ title: "Dependencies", body: lines.join("\n"), priority: 60 });
  }

  // 6. Similar code elsewhere (duplicated logic, conventions to follow).
  if (addedText.trim().length > 40) {
    const query = [...changedSyms.values()].map((s) => s.name).join(" ") + "\n" + addedText.slice(0, 2000);
    const hits = await searcher.search(
      query,
      6,
      (c) => c.path !== path && !!c.name && !overlapsSeen(c.path, c.start, c.end),
    );
    const parts: string[] = [];
    for (const h of hits.slice(0, 3)) {
      const sn = snippet(h.chunk.path, h.chunk.start, h.chunk.end, 30);
      if (sn) parts.push(sn);
    }
    if (parts.length) {
      sections.push({
        title: "Similar code elsewhere in the repo (check for duplication or established conventions)",
        body: parts.join("\n\n"),
        priority: 40,
      });
    }
  }

  // Pack by priority within budget.
  sections.sort((a, b) => b.priority - a.priority);
  const out: string[] = [];
  let used = 0;
  for (const s of sections) {
    const text = `### ${s.title}\n${s.body}`;
    const t = estimateTokens(text);
    if (used + t > budget) continue;
    out.push(text);
    used += t;
  }
  return out.join("\n\n");
}
