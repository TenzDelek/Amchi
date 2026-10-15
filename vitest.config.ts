import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Some tree-sitter grammars (Swift) make V8's optimizing wasm compiler exhaust its
    // zone memory and kill the worker with SIGTRAP. Baseline-only compilation avoids
    // it, the same way src/util/relaunch.ts does for the action itself.
    execArgv: ["--liftoff-only"],
  },
});
