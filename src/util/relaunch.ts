import { spawnSync } from "node:child_process";

const FLAG = "--liftoff-only";
const MARK = "AMCHI_BASELINE_WASM";

/**
 * Some tree-sitter grammars (Swift in particular) contain WASM functions so large
 * that V8's optimizing compiler exhausts its zone memory when it tiers them up on a
 * background thread. The process then dies with "Fatal process out of memory: Zone",
 * typically a few seconds into indexing a repo with iOS code.
 *
 * V8 ignores tiering flags once it has started and refuses them in NODE_OPTIONS, so
 * the only reliable fix is to run ourselves again with the baseline compiler only.
 * Parsing is a few percent slower, which is irrelevant next to LLM latency.
 */
export function relaunchWithBaselineWasm(): void {
  if (process.env[MARK] || process.execArgv.includes(FLAG)) return;
  const probe = spawnSync(process.execPath, [FLAG, "-e", "0"], { stdio: "ignore" });
  if (probe.status !== 0) return; // flag unknown on this Node build: carry on in-process
  const child = spawnSync(process.execPath, [FLAG, ...process.execArgv, ...process.argv.slice(1)], {
    stdio: "inherit",
    env: { ...process.env, [MARK]: "1" },
  });
  if (child.error) return; // could not spawn: carry on in-process
  process.exit(child.status ?? 1);
}
