/**
 * Per-language configuration for the generic tree-sitter extractor.
 * Rather than maintaining query files per grammar, we walk the AST and
 * classify node types. This is resilient across grammar versions.
 */

export interface LangSpec {
  grammar: string;
  /** AST node type -> symbol kind */
  defs: Record<string, string>;
  /** Node types that represent a call / instantiation. */
  calls: string[];
  /** Node types that represent an import. */
  imports: string[];
  /** Node types that only wrap a definition (e.g. decorators, export). */
  wrappers?: string[];
}

const JS_DEFS = {
  function_declaration: "function",
  generator_function_declaration: "function",
  method_definition: "method",
  class_declaration: "class",
  abstract_class_declaration: "class",
  interface_declaration: "interface",
  type_alias_declaration: "type",
  enum_declaration: "enum",
  // const foo = () => {} / function() {}
  variable_declarator: "function",
  public_field_definition: "method",
};
const JS_CALLS = ["call_expression", "new_expression"];
const JS_IMPORTS = ["import_statement", "export_statement"];

export const LANGS: Record<string, LangSpec> = {
  typescript: { grammar: "typescript", defs: JS_DEFS, calls: JS_CALLS, imports: JS_IMPORTS },
  tsx: { grammar: "tsx", defs: JS_DEFS, calls: JS_CALLS, imports: JS_IMPORTS },
  javascript: { grammar: "javascript", defs: JS_DEFS, calls: JS_CALLS, imports: JS_IMPORTS },
  python: {
    grammar: "python",
    defs: { function_definition: "function", class_definition: "class" },
    calls: ["call"],
    imports: ["import_statement", "import_from_statement"],
    wrappers: ["decorated_definition"],
  },
  go: {
    grammar: "go",
    defs: { function_declaration: "function", method_declaration: "method", type_spec: "type" },
    calls: ["call_expression", "composite_literal"],
    imports: ["import_spec"],
  },
  rust: {
    grammar: "rust",
    defs: {
      function_item: "function",
      struct_item: "struct",
      enum_item: "enum",
      trait_item: "trait",
      impl_item: "impl",
      mod_item: "module",
      type_item: "type",
      macro_definition: "macro",
    },
    calls: ["call_expression", "macro_invocation", "struct_expression"],
    imports: ["use_declaration"],
  },
  java: {
    grammar: "java",
    defs: {
      class_declaration: "class",
      interface_declaration: "interface",
      enum_declaration: "enum",
      record_declaration: "class",
      method_declaration: "method",
      constructor_declaration: "constructor",
    },
    calls: ["method_invocation", "object_creation_expression"],
    imports: ["import_declaration"],
  },
  kotlin: {
    grammar: "kotlin",
    defs: { class_declaration: "class", object_declaration: "object", function_declaration: "function" },
    calls: ["call_expression"],
    imports: ["import_header"],
  },
  c: {
    grammar: "c",
    defs: { function_definition: "function", struct_specifier: "struct", enum_specifier: "enum" },
    calls: ["call_expression"],
    imports: ["preproc_include"],
  },
  cpp: {
    grammar: "cpp",
    defs: {
      function_definition: "function",
      class_specifier: "class",
      struct_specifier: "struct",
      enum_specifier: "enum",
      namespace_definition: "namespace",
    },
    calls: ["call_expression", "new_expression"],
    imports: ["preproc_include"],
  },
  c_sharp: {
    grammar: "c_sharp",
    defs: {
      class_declaration: "class",
      interface_declaration: "interface",
      struct_declaration: "struct",
      enum_declaration: "enum",
      record_declaration: "class",
      method_declaration: "method",
      constructor_declaration: "constructor",
    },
    calls: ["invocation_expression", "object_creation_expression"],
    imports: ["using_directive"],
  },
  php: {
    grammar: "php",
    defs: {
      function_definition: "function",
      method_declaration: "method",
      class_declaration: "class",
      interface_declaration: "interface",
      trait_declaration: "trait",
    },
    calls: ["function_call_expression", "member_call_expression", "scoped_call_expression", "object_creation_expression"],
    imports: ["namespace_use_declaration"],
  },
  swift: {
    grammar: "swift",
    defs: {
      function_declaration: "function",
      class_declaration: "class",
      protocol_declaration: "protocol",
    },
    calls: ["call_expression"],
    imports: ["import_declaration"],
  },
  scala: {
    grammar: "scala",
    defs: {
      function_definition: "function",
      class_definition: "class",
      object_definition: "object",
      trait_definition: "trait",
    },
    calls: ["call_expression"],
    imports: ["import_declaration"],
  },
  lua: {
    grammar: "lua",
    defs: {
      function_declaration: "function",
      function_definition_statement: "function",
      local_function_definition_statement: "function",
    },
    calls: ["call", "function_call"],
    imports: [],
  },
  elixir: {
    grammar: "elixir",
    defs: {},
    calls: ["call"],
    imports: [],
  },
};

const EXT_TO_LANG: Record<string, string> = {
  ts: "typescript", mts: "typescript", cts: "typescript",
  tsx: "tsx",
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  py: "python", pyi: "python",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin", kts: "kotlin",
  c: "c", h: "c",
  cc: "cpp", cpp: "cpp", cxx: "cpp", hpp: "cpp", hh: "cpp", hxx: "cpp",
  cs: "c_sharp",
  php: "php",
  swift: "swift",
  scala: "scala", sc: "scala",
  lua: "lua",
  ex: "elixir", exs: "elixir",
};

/** Plain-text files we index for search (no AST) because they often matter in reviews. */
const TEXT_EXTS = new Set([
  "md", "mdx", "txt", "rst", "json", "yml", "yaml", "toml", "ini", "cfg", "conf", "env",
  "sql", "graphql", "gql", "proto", "prisma", "sh", "bash", "zsh", "ps1", "dockerfile",
  "html", "htm", "css", "scss", "sass", "less", "vue", "svelte", "astro", "tf", "hcl",
  "xml", "rb", "rake", "gradle", "properties", "dart", "r", "jl", "m", "mm", "pl", "clj", "erl", "hs", "ml", "zig", "nim",
]);

export function langForPath(path: string): string | null {
  const base = path.split("/").pop() ?? path;
  const ext = base.includes(".") ? base.split(".").pop()!.toLowerCase() : "";
  return EXT_TO_LANG[ext] ?? null;
}

export function isIndexableText(path: string): boolean {
  const base = (path.split("/").pop() ?? path).toLowerCase();
  if (base === "dockerfile" || base === "makefile" || base.endsWith(".dockerfile")) return true;
  const ext = base.includes(".") ? base.split(".").pop()! : "";
  return !!EXT_TO_LANG[ext] || TEXT_EXTS.has(ext);
}
