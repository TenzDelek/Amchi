import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { LANGS, type LangSpec } from "./languages.js";
import { log } from "../util/log.js";
import TreeSitter from "web-tree-sitter";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSNode = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParserT = any;

export interface SymbolInfo {
  name: string;
  kind: string;
  /** 1-based inclusive line range */
  start: number;
  end: number;
  /** Enclosing class/impl/module name, if any. */
  parent?: string;
  /** First line of the definition, trimmed. */
  signature: string;
  /** Names this symbol calls / instantiates (deduped). */
  calls: string[];
}

export interface ParsedFile {
  symbols: SymbolInfo[];
  /** Raw import specifiers as written in source. */
  imports: string[];
  /** Calls made at file/module level (outside any symbol). */
  topLevelCalls: string[];
}

const IDENT_TYPES = new Set([
  "identifier", "type_identifier", "property_identifier", "field_identifier", "simple_identifier",
  "constant", "name", "shorthand_property_identifier", "private_property_identifier",
  "namespace_identifier", "scoped_type_identifier", "qualified_identifier",
]);

const FN_VALUE_TYPES = new Set([
  "arrow_function", "function_expression", "function", "generator_function", "class",
]);

const STRING_TYPES = new Set([
  "string", "string_literal", "interpreted_string_literal", "raw_string_literal", "string_fragment",
  "system_lib_string", "string_content",
]);

let ParserCls: ParserT | null = null;
const languages = new Map<string, unknown>();

/** Locate the folder holding tree-sitter WASM files (dist/ when bundled, node_modules in dev). */
function wasmPaths(): { runtime: string; grammarDir: string } {
  const here = dirname(fileURLToPath(import.meta.url));
  const bundled = join(here, "tree-sitter.wasm");
  if (existsSync(bundled)) return { runtime: bundled, grammarDir: join(here, "grammars") };
  const wtsDir = dirname(require.resolve("web-tree-sitter"));
  const grammarDir = join(dirname(require.resolve("tree-sitter-wasms/package.json")), "out");
  return { runtime: join(wtsDir, "tree-sitter.wasm"), grammarDir };
}

async function getParser(lang: string): Promise<ParserT | null> {
  const spec = LANGS[lang];
  if (!spec) return null;
  const { runtime, grammarDir } = wasmPaths();
  if (!ParserCls) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const P: any = TreeSitter;
    await P.init({ locateFile: () => runtime });
    ParserCls = P;
  }
  if (!languages.has(spec.grammar)) {
    const file = join(grammarDir, `tree-sitter-${spec.grammar}.wasm`);
    if (!existsSync(file)) {
      languages.set(spec.grammar, null);
    } else {
      try {
        languages.set(spec.grammar, await ParserCls.Language.load(file));
      } catch (e) {
        log.warn(`Could not load grammar ${spec.grammar}: ${(e as Error).message}`);
        languages.set(spec.grammar, null);
      }
    }
  }
  const language = languages.get(spec.grammar);
  if (!language) return null;
  const parser = new ParserCls();
  parser.setLanguage(language);
  return parser;
}

function rightmostIdent(node: TSNode, depth = 0): string | null {
  if (!node || depth > 6) return null;
  if (IDENT_TYPES.has(node.type)) {
    // qualified names like a::b::c or a.b -> last segment
    const t: string = node.text;
    const parts = t.split(/::|\.|->|\\/);
    return parts[parts.length - 1] || t;
  }
  for (const field of ["name", "property", "field", "attribute", "method"]) {
    const f = node.childForFieldName?.(field);
    if (f) {
      const r = rightmostIdent(f, depth + 1);
      if (r) return r;
    }
  }
  for (let i = node.namedChildCount - 1; i >= 0; i--) {
    const c = node.namedChild(i);
    if (c && (c.type === "arguments" || c.type === "argument_list" || c.type === "type_arguments")) continue;
    const r = rightmostIdent(c, depth + 1);
    if (r) return r;
  }
  return null;
}

function defName(node: TSNode, lang: string): string | null {
  // C/C++: declarator chain
  if ((lang === "c" || lang === "cpp") && node.type === "function_definition") {
    let d = node.childForFieldName("declarator");
    for (let i = 0; d && i < 6; i++) {
      if (IDENT_TYPES.has(d.type) || d.type === "destructor_name" || d.type === "operator_name") {
        return rightmostIdent(d) ?? d.text;
      }
      d = d.childForFieldName("declarator") ?? d.namedChild(0);
    }
    return null;
  }
  if (node.type === "impl_item") {
    const t = node.childForFieldName("type");
    const tr = node.childForFieldName("trait");
    return t ? `${tr ? `${tr.text} for ` : ""}${t.text}` : null;
  }
  const nameNode = node.childForFieldName("name");
  if (nameNode) return rightmostIdent(nameNode) ?? nameNode.text;
  for (let i = 0; i < node.namedChildCount; i++) {
    const c = node.namedChild(i);
    if (IDENT_TYPES.has(c.type)) return c.text;
  }
  return null;
}

function calleeName(node: TSNode): string | null {
  for (const field of ["function", "name", "method", "constructor", "type", "macro"]) {
    const f = node.childForFieldName?.(field);
    if (f) return rightmostIdent(f);
  }
  return node.namedChildCount ? rightmostIdent(node.namedChild(0)) : null;
}

function firstString(node: TSNode, depth = 0): string | null {
  if (!node || depth > 5) return null;
  if (STRING_TYPES.has(node.type)) return node.text.replace(/^[@rbuf]*["'`<]+|["'`>]+$/gi, "");
  for (let i = 0; i < node.namedChildCount; i++) {
    const r = firstString(node.namedChild(i), depth + 1);
    if (r) return r;
  }
  return null;
}

function importSpecs(node: TSNode, lang: string): string[] {
  switch (node.type) {
    case "import_statement":
      if (lang === "python") {
        const out: string[] = [];
        for (let i = 0; i < node.namedChildCount; i++) {
          const c = node.namedChild(i);
          if (c.type === "dotted_name") out.push(c.text);
          else if (c.type === "aliased_import") out.push(c.childForFieldName("name")?.text ?? c.text);
        }
        return out;
      }
      return [node.childForFieldName("source") ? firstString(node.childForFieldName("source")) : firstString(node)].filter(
        Boolean,
      ) as string[];
    case "export_statement": {
      const src = node.childForFieldName("source");
      return src ? [firstString(src)].filter(Boolean) as string[] : [];
    }
    case "import_from_statement": {
      const mod = node.childForFieldName("module_name");
      if (!mod) return [];
      const base = mod.text as string;
      // `from . import a, b` -> ".a", ".b" so they resolve to modules
      if (/^\.+$/.test(base)) {
        const names: string[] = [];
        for (let i = 0; i < node.namedChildCount; i++) {
          const c = node.namedChild(i);
          if (c.id !== mod.id && (c.type === "dotted_name" || c.type === "aliased_import")) {
            names.push(base + (c.childForFieldName?.("name")?.text ?? c.text));
          }
        }
        return names.length ? names : [base];
      }
      return [base];
    }
    case "import_spec":
      return [firstString(node.childForFieldName("path") ?? node)].filter(Boolean) as string[];
    case "preproc_include": {
      const p = node.childForFieldName("path");
      return p ? [p.text.replace(/^["<]|[">]$/g, "")] : [];
    }
    case "use_declaration": {
      const a = node.childForFieldName("argument");
      return a ? [a.text] : [];
    }
    case "import_declaration":
    case "import_header":
    case "using_directive":
    case "namespace_use_declaration":
      return [
        (node.text as string)
          .replace(/^\s*(import|using|use)\s+(static\s+)?/, "")
          .replace(/[;\s]+$/, "")
          .replace(/\s+as\s+\w+$/, "")
          .replace(/\.\*$/, ""),
      ];
    default:
      return [];
  }
}

function signatureOf(node: TSNode): string {
  const text: string = node.text;
  const first = text.split("\n")[0].trim();
  return first.length > 200 ? `${first.slice(0, 200)}…` : first;
}

const CONTAINER_KINDS = new Set(["class", "interface", "struct", "impl", "trait", "module", "object", "namespace", "enum", "protocol"]);

export async function parseSource(content: string, lang: string): Promise<ParsedFile | null> {
  const spec: LangSpec | undefined = LANGS[lang];
  if (!spec) return null;
  const parser = await getParser(lang);
  if (!parser) return null;

  let tree: TSNode;
  try {
    tree = parser.parse(content);
  } catch (e) {
    log.debug(`parse failed (${lang}): ${(e as Error).message}`);
    return null;
  }
  const defTypes = spec.defs;
  const callTypes = new Set(spec.calls);
  const importTypes = new Set(spec.imports);

  const symbols: SymbolInfo[] = [];
  const imports = new Set<string>();
  const topCalls = new Set<string>();
  const symbolCalls = new Map<SymbolInfo, Set<string>>();

  // Iterative DFS with a stack of enclosing symbols.
  type Frame = { node: TSNode; owner: SymbolInfo | null; container: string | undefined };
  const stack: Frame[] = [{ node: tree.rootNode, owner: null, container: undefined }];
  let visited = 0;
  while (stack.length) {
    const { node, owner, container } = stack.pop()!;
    if (++visited > 400_000) break; // pathological files

    let nextOwner = owner;
    let nextContainer = container;
    const kind = defTypes[node.type];
    if (kind) {
      let accept = true;
      if (node.type === "variable_declarator" || node.type === "public_field_definition") {
        const v = node.childForFieldName("value");
        accept = !!v && FN_VALUE_TYPES.has(v.type);
      }
      const name = accept ? defName(node, lang) : null;
      if (name) {
        let k = kind;
        if (k === "function" && container && (lang === "rust" || lang === "python" || lang === "kotlin" || lang === "scala" || lang === "swift" || lang === "php" || lang === "cpp")) {
          k = "method";
        }
        const sym: SymbolInfo = {
          name,
          kind: k,
          start: node.startPosition.row + 1,
          end: node.endPosition.row + 1,
          parent: container,
          signature: signatureOf(node),
          calls: [],
        };
        symbols.push(sym);
        symbolCalls.set(sym, new Set());
        nextOwner = sym;
        if (CONTAINER_KINDS.has(k)) nextContainer = name.replace(/^.* for /, "");
      }
    }

    if (callTypes.has(node.type)) {
      const callee = calleeName(node);
      if (callee) {
        if ((callee === "require" || callee === "require_relative" || callee === "import") && node.namedChildCount) {
          const s = firstString(node.childForFieldName("arguments") ?? node);
          if (s) imports.add(callee === "require_relative" && !s.startsWith(".") ? `./${s}` : s);
        } else if (callee.length > 1) {
          if (owner) symbolCalls.get(owner)!.add(callee);
          else topCalls.add(callee);
        }
      }
    }
    if (node.type === "import" && lang !== "python") {
      // dynamic import("x") in JS: parent is call_expression handled above
    }
    if (importTypes.has(node.type)) {
      for (const s of importSpecs(node, lang)) if (s) imports.add(s);
    }

    for (let i = node.namedChildCount - 1; i >= 0; i--) {
      stack.push({ node: node.namedChild(i), owner: nextOwner, container: nextContainer });
    }
  }
  tree.delete?.();
  parser.delete?.();

  for (const [sym, calls] of symbolCalls) {
    calls.delete(sym.name); // ignore direct recursion noise
    sym.calls = [...calls].slice(0, 200);
  }
  symbols.sort((a, b) => a.start - b.start || b.end - a.end);
  return { symbols, imports: [...imports].slice(0, 300), topLevelCalls: [...topCalls].slice(0, 200) };
}
