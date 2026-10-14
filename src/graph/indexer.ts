import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { DEFAULT_IGNORE, matchesAny, type Config } from "../config.js";
import { log } from "../util/log.js";
import { sha1 } from "../util/text.js";
import { isIndexableText, langForPath } from "./languages.js";
import { parseSource, type SymbolInfo } from "./parser.js";

/** Bump when parser output changes so cached entries get re-parsed. */
export const INDEX_VERSION = 3;

export interface FileEntry {
  path: string;
  hash: string;
  lang: string | null;
  lines: number;
  symbols: SymbolInfo[];
  imports: string[];
  /** Imports resolved to repo-relative paths. */
  resolved: string[];
  topLevelCalls: string[];
}

export interface IndexData {
  version: number;
  commit?: string;
  updatedAt: string;
  files: Record<string, FileEntry>;
}

export interface IndexStats {
  total: number;
  parsed: number;
  reused: number;
  removed: number;
  ms: number;
}

// ---------------------------------------------------------------------------
// Persistence (.codegraph/index.json.gz)
// ---------------------------------------------------------------------------

export function indexFile(dir: string) {
  return join(dir, "index.json.gz");
}

export function loadIndex(dir: string): IndexData | null {
  const f = indexFile(dir);
  if (!existsSync(f)) return null;
  try {
    const data = JSON.parse(gunzipSync(readFileSync(f)).toString("utf8")) as IndexData;
    if (data.version !== INDEX_VERSION) {
      log.info(`Index version changed (${data.version} → ${INDEX_VERSION}); rebuilding`);
      return null;
    }
    return data;
  } catch (e) {
    log.warn(`Could not read index cache: ${(e as Error).message}`);
    return null;
  }
}

export function saveIndex(dir: string, data: IndexData) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(indexFile(dir), gzipSync(JSON.stringify(data)));
  // Keep the cache out of commits if someone runs the CLI locally.
  const gi = join(dir, ".gitignore");
  if (!existsSync(gi)) writeFileSync(gi, "*\n");
}

// ---------------------------------------------------------------------------
// File listing
// ---------------------------------------------------------------------------

export function listRepoFiles(root: string): string[] {
  try {
    const out = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
      cwd: root,
      maxBuffer: 512 * 1024 * 1024,
    });
    return [...new Set(out.toString("utf8").split("\0").filter(Boolean))];
  } catch {
    log.warn("git ls-files failed; walking the directory instead");
    const out: string[] = [];
    const walk = (rel: string) => {
      for (const name of readdirSync(join(root, rel))) {
        if (name === ".git" || name === "node_modules" || name === ".codegraph") continue;
        const r = rel ? `${rel}/${name}` : name;
        const st = lstatSync(join(root, r));
        if (st.isDirectory()) walk(r);
        else if (st.isFile()) out.push(r);
      }
    };
    walk("");
    return out;
  }
}

function shouldIndex(path: string, cfg: Config): boolean {
  if (path.startsWith(`${cfg.index.dir}/`) || path === ".git" || path.startsWith(".git/") || path.includes("/.git/")) return false;
  if (!isIndexableText(path)) return false;
  return !matchesAny(path, [...DEFAULT_IGNORE, ...cfg.index.ignore]);
}

// ---------------------------------------------------------------------------
// Build / incremental update
// ---------------------------------------------------------------------------

export async function buildIndex(
  root: string,
  cfg: Config,
  prev: IndexData | null,
  commit?: string,
): Promise<{ data: IndexData; stats: IndexStats }> {
  const t0 = Date.now();
  let paths = listRepoFiles(root).filter((p) => shouldIndex(p, cfg));
  if (paths.length > cfg.index.max_files) {
    log.warn(`Repo has ${paths.length} indexable files; indexing the first ${cfg.index.max_files} (index.max_files)`);
    paths = paths.slice(0, cfg.index.max_files);
  }
  const files: Record<string, FileEntry> = {};
  let parsed = 0;
  let reused = 0;
  const maxBytes = cfg.index.max_file_kb * 1024;

  for (const path of paths) {
    const abs = join(root, path);
    let buf: Buffer;
    try {
      // lstat: never follow symlinks — a committed link to ../.git/config or a
      // runner file would otherwise be read and sent to the LLM.
      const st = lstatSync(abs);
      if (!st.isFile() || st.size > maxBytes) continue;
      buf = readFileSync(abs);
    } catch {
      continue;
    }
    if (buf.subarray(0, 8000).includes(0)) continue; // binary
    const content = buf.toString("utf8");
    const hash = sha1(content);
    const old = prev?.files[path];
    if (old && old.hash === hash) {
      files[path] = { ...old, resolved: [] };
      reused++;
      continue;
    }
    const lang = langForPath(path);
    const entry: FileEntry = {
      path,
      hash,
      lang,
      lines: content.split("\n").length,
      symbols: [],
      imports: [],
      resolved: [],
      topLevelCalls: [],
    };
    if (lang) {
      const p = await parseSource(content, lang);
      if (p) {
        entry.symbols = p.symbols;
        entry.imports = p.imports;
        entry.topLevelCalls = p.topLevelCalls;
      }
    }
    files[path] = entry;
    parsed++;
  }

  let goModule: string | undefined;
  try {
    goModule = readFileSync(join(root, "go.mod"), "utf8").match(/^module\s+(\S+)/m)?.[1];
  } catch {
    /* not a Go module */
  }
  const resolver = new ImportResolver(Object.keys(files), goModule);
  for (const f of Object.values(files)) {
    f.resolved = [...new Set(f.imports.map((i) => resolver.resolve(f.path, i, f.lang)).filter(Boolean) as string[])];
  }

  const removed = prev ? Object.keys(prev.files).filter((p) => !files[p]).length : 0;
  const data: IndexData = { version: INDEX_VERSION, commit, updatedAt: new Date().toISOString(), files };
  const stats = { total: Object.keys(files).length, parsed, reused, removed, ms: Date.now() - t0 };
  log.info(
    `Indexed ${stats.total} files (${parsed} parsed, ${reused} cached, ${removed} removed) in ${(stats.ms / 1000).toFixed(1)}s`,
  );
  return { data, stats };
}

// ---------------------------------------------------------------------------
// Import resolution
// ---------------------------------------------------------------------------

const JS_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts", ".vue", ".svelte"];

function stripExt(p: string) {
  return p.replace(/\.[^./]+$/, "");
}

export class ImportResolver {
  private set: Set<string>;
  /** basename without extension -> paths */
  private byStem = new Map<string, string[]>();
  /** directory -> files directly in it */
  private byDir = new Map<string, string[]>();

  constructor(
    paths: string[],
    private goModule?: string,
  ) {
    this.set = new Set(paths);
    for (const p of paths) {
      const stem = stripExt(posix.basename(p));
      (this.byStem.get(stem) ?? this.byStem.set(stem, []).get(stem)!).push(p);
      const d = posix.dirname(p);
      (this.byDir.get(d) ?? this.byDir.set(d, []).get(d)!).push(p);
    }
  }

  private tryFile(base: string, exts: string[], indexNames: string[]): string | null {
    const norm = posix.normalize(base).replace(/^\.\//, "");
    if (this.set.has(norm)) return norm;
    const noExt = stripExt(norm);
    for (const e of exts) {
      if (this.set.has(norm + e)) return norm + e;
      if (this.set.has(noExt + e)) return noExt + e;
    }
    for (const idx of indexNames) {
      for (const e of exts) if (this.set.has(`${norm}/${idx}${e}`)) return `${norm}/${idx}${e}`;
    }
    return null;
  }

  /** Find a file whose path (without extension) ends with `suffix`. Prefers shortest path. */
  private bySuffix(suffix: string, exts: string[]): string | null {
    const clean = suffix.replace(/^\/+/, "");
    const stem = stripExt(posix.basename(clean));
    const cands = (this.byStem.get(stem) ?? []).filter((p) => {
      const ext = p.slice(p.lastIndexOf("."));
      if (exts.length && !exts.includes(ext)) return false;
      const np = stripExt(p);
      return np === stripExt(clean) || np.endsWith(`/${stripExt(clean)}`);
    });
    cands.sort((a, b) => a.length - b.length);
    return cands[0] ?? null;
  }

  resolve(from: string, spec: string, lang: string | null): string | null {
    const dir = posix.dirname(from);
    switch (lang) {
      case "typescript":
      case "tsx":
      case "javascript": {
        if (spec.startsWith(".")) {
          // TS ESM projects import "./x.js" for "./x.ts"
          const base = posix.join(dir, spec);
          return this.tryFile(base, JS_EXTS, ["index"]) ?? this.tryFile(base.replace(/\.(m|c)?js$/, ""), JS_EXTS, ["index"]);
        }
        // path aliases: @/foo, ~/foo, src/foo
        const m = spec.match(/^(?:@|~|#)\/(.*)$/);
        if (m) {
          return (
            this.tryFile(`src/${m[1]}`, JS_EXTS, ["index"]) ??
            this.tryFile(m[1], JS_EXTS, ["index"]) ??
            this.bySuffix(m[1], JS_EXTS)
          );
        }
        if (spec.includes("/") && !spec.startsWith("@")) {
          return this.tryFile(spec, JS_EXTS, ["index"]) ?? this.tryFile(`src/${spec}`, JS_EXTS, ["index"]);
        }
        return null; // bare package import
      }
      case "python": {
        const exts = [".py", ".pyi"];
        if (spec.startsWith(".")) {
          const dots = spec.match(/^\.+/)![0].length;
          let base = dir;
          for (let i = 1; i < dots; i++) base = posix.dirname(base);
          const rest = spec.slice(dots).replace(/\./g, "/");
          const target = rest ? posix.join(base, rest) : base;
          return this.tryFile(target, exts, ["__init__"]);
        }
        const asPath = spec.replace(/\./g, "/");
        return (
          this.tryFile(asPath, exts, ["__init__"]) ??
          this.tryFile(`src/${asPath}`, exts, ["__init__"]) ??
          (asPath.includes("/") ? this.bySuffix(asPath, exts) : null)
        );
      }
      case "go": {
        if (this.goModule && (spec === this.goModule || spec.startsWith(`${this.goModule}/`))) {
          const rel = spec.slice(this.goModule.length).replace(/^\//, "") || ".";
          const list = this.byDir.get(rel) ?? [];
          return list.find((p) => p.endsWith(".go") && !p.endsWith("_test.go")) ?? null;
        }
        // github.com/org/repo/internal/store -> any dir ending with internal/store
        const segs = spec.split("/");
        if (segs.length < 2 && !this.byDir.has(spec)) return null;
        for (let i = 0; i < segs.length; i++) {
          const suffix = segs.slice(i).join("/");
          for (const [d, list] of this.byDir) {
            if (d === suffix || d.endsWith(`/${suffix}`)) {
              const goFile = list.find((p) => p.endsWith(".go") && !p.endsWith("_test.go"));
              if (goFile) return goFile;
            }
          }
          if (segs.length - i <= 2) break; // don't match on a single generic segment
        }
        return null;
      }
      case "java":
      case "kotlin":
      case "scala":
        return this.bySuffix(spec.replace(/\./g, "/"), [".java", ".kt", ".kts", ".scala"]);
      case "c_sharp":
        return null;
      case "rust": {
        const path = spec
          .replace(/^(crate|self|super)::/, "")
          .replace(/::\{.*$/, "")
          .split("::");
        while (path.length) {
          const p = path.join("/");
          const hit = this.bySuffix(p, [".rs"]) ?? this.tryFile(`src/${p}`, [".rs"], ["mod"]);
          if (hit) return hit;
          path.pop();
        }
        return null;
      }
      case "c":
      case "cpp":
        return this.tryFile(posix.join(dir, spec), [], []) ?? this.bySuffix(spec, []);
      case "php":
        return this.bySuffix(spec.replace(/\\/g, "/"), [".php"]);
      case "ruby":
        return spec.startsWith(".")
          ? this.tryFile(posix.join(dir, spec), [".rb"], [])
          : this.bySuffix(spec, [".rb"]);
      case "swift":
      default:
        return null;
    }
  }
}

// ---------------------------------------------------------------------------
// In-memory graph with query helpers
// ---------------------------------------------------------------------------

export interface SymRef {
  path: string;
  symbol: SymbolInfo;
}

export class CodeGraph {
  readonly defsByName = new Map<string, SymRef[]>();
  readonly callersByName = new Map<string, SymRef[]>();
  readonly importers = new Map<string, Set<string>>();
  private contentCache = new Map<string, string | null>();

  constructor(
    readonly root: string,
    readonly data: IndexData,
  ) {
    for (const f of Object.values(data.files)) {
      for (const s of f.symbols) {
        push(this.defsByName, s.name, { path: f.path, symbol: s });
        for (const c of s.calls) push(this.callersByName, c, { path: f.path, symbol: s });
      }
      for (const r of f.resolved) {
        (this.importers.get(r) ?? this.importers.set(r, new Set()).get(r)!).add(f.path);
      }
    }
  }

  file(path: string): FileEntry | undefined {
    return this.data.files[path];
  }

  read(path: string): string | null {
    if (this.contentCache.has(path)) return this.contentCache.get(path)!;
    let c: string | null = null;
    try {
      if (!this.data.files[path] && lstatSync(join(this.root, path)).isSymbolicLink()) throw new Error("symlink");
      c = readFileSync(join(this.root, path), "utf8");
    } catch {
      c = null;
    }
    if (this.contentCache.size > 2000) this.contentCache.clear();
    this.contentCache.set(path, c);
    return c;
  }

  /** Symbols overlapping [start, end]; innermost (smallest) last. */
  symbolsOverlapping(path: string, start: number, end: number): SymbolInfo[] {
    const f = this.data.files[path];
    if (!f) return [];
    return f.symbols
      .filter((s) => s.start <= end && s.end >= start)
      .sort((a, b) => b.end - b.start - (a.end - a.start));
  }

  /** Definitions for a name, preferring files imported by `fromPath`, then same dir. */
  definitionsOf(name: string, fromPath?: string): SymRef[] {
    const defs = this.defsByName.get(name) ?? [];
    if (!fromPath) return defs;
    const imported = new Set(this.data.files[fromPath]?.resolved ?? []);
    const dir = dirname(fromPath);
    const score = (r: SymRef) =>
      (r.path === fromPath ? 3 : 0) + (imported.has(r.path) ? 2 : 0) + (dirname(r.path) === dir ? 1 : 0);
    return [...defs].sort((a, b) => score(b) - score(a));
  }

  /**
   * Does `from` import `target`, directly or through one barrel file
   * (index.ts / __init__.py / mod.rs re-exports)?
   */
  dependsOn(from: string, target: string): boolean {
    if (from === target) return true;
    const resolved = this.data.files[from]?.resolved ?? [];
    if (resolved.includes(target)) return true;
    for (const r of resolved) {
      if (/(^|\/)(index\.[cm]?[jt]sx?|__init__\.py|mod\.rs|lib\.rs)$/.test(r) && this.data.files[r]?.resolved.includes(target)) {
        return true;
      }
    }
    return false;
  }

  callersOf(name: string): SymRef[] {
    return this.callersByName.get(name) ?? [];
  }

  importersOf(path: string): string[] {
    return [...(this.importers.get(path) ?? [])];
  }

  /** Files whose imports would resolve to `path` if it existed (for deleted/moved files). */
  importersOfMissing(path: string): string[] {
    if (this.data.files[path]) return this.importersOf(path);
    const resolver = new ImportResolver([...Object.keys(this.data.files), path]);
    const out: string[] = [];
    for (const f of Object.values(this.data.files)) {
      if (f.imports.some((i) => resolver.resolve(f.path, i, f.lang) === path)) out.push(f.path);
    }
    return out;
  }

  testsFor(path: string): string[] {
    const stem = stripExt(posix.basename(path)).replace(/(\.test|\.spec|_test|Test|Tests|_spec)$/, "");
    if (stem.length < 2) return [];
    const re = new RegExp(
      `(^|/)(test_${esc(stem)}|${esc(stem)}(\\.test|\\.spec|_test|_spec|Test|Tests))\\.[a-z]+$|(^|/)(__tests__|tests?|spec)/(.*/)?${esc(stem)}\\.[a-z]+$`,
      "i",
    );
    return Object.keys(this.data.files)
      .filter((p) => p !== path && re.test(p))
      .slice(0, 5);
  }
}

function esc(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V) {
  const arr = m.get(k);
  if (arr) {
    if (arr.length < 500) arr.push(v);
  } else m.set(k, [v]);
}
