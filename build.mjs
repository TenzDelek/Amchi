// Bundles the action and CLI into dist/ with esbuild and copies the
// tree-sitter WASM runtime + grammars next to them, so the action runs
// without `npm install` on the runner.
import { build } from "esbuild";
import { cpSync, mkdirSync, rmSync, readdirSync, writeFileSync, chmodSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const GRAMMARS = [
  "typescript", "tsx", "javascript", "python", "go", "rust", "java", "kotlin",
  "c", "cpp", "c_sharp", "php", "swift", "scala", "lua", "elixir",
];

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/grammars", { recursive: true });

const common = {
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  sourcemap: false,
  logLevel: "info",
  // CJS deps (Octokit, web-tree-sitter) need require/__dirname inside an ESM bundle.
  banner: {
    js: [
      "import { createRequire as __cgCreateRequire } from 'node:module';",
      "import { fileURLToPath as __cgFileURLToPath } from 'node:url';",
      "import { dirname as __cgDirname } from 'node:path';",
      "const require = __cgCreateRequire(import.meta.url);",
      "const __filename = __cgFileURLToPath(import.meta.url);",
      "const __dirname = __cgDirname(__filename);",
    ].join("\n"),
  },
};

await build({ ...common, entryPoints: ["src/index.ts"], outfile: "dist/index.js" });
await build({ ...common, entryPoints: ["src/cli.ts"], outfile: "dist/cli.js" });

// Runtime wasm for web-tree-sitter
const wtsDir = dirname(require.resolve("web-tree-sitter"));
cpSync(join(wtsDir, "tree-sitter.wasm"), "dist/tree-sitter.wasm");

// Language grammars
const wasmDir = join(dirname(require.resolve("tree-sitter-wasms/package.json")), "out");
const available = new Set(readdirSync(wasmDir));
for (const g of GRAMMARS) {
  const f = `tree-sitter-${g}.wasm`;
  if (available.has(f)) cpSync(join(wasmDir, f), join("dist/grammars", f));
  else console.warn(`grammar not found, skipping: ${f}`);
}

// Grammars that ship in their own npm package (tree-sitter-wasms has no compatible build).
for (const g of ["dart"]) {
  try {
    cpSync(require.resolve(`tree-sitter-${g}/tree-sitter-${g}.wasm`), join("dist/grammars", `tree-sitter-${g}.wasm`));
  } catch {
    console.warn(`grammar not found, skipping: tree-sitter-${g}`);
  }
}

// Make the CLI executable and mark dist as ESM.
writeFileSync("dist/package.json", JSON.stringify({ type: "module" }) + "\n");
chmodSync("dist/cli.js", 0o755);
console.log("build complete");
