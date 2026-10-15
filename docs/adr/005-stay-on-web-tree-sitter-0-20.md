# ADR-005: Stay on web-tree-sitter 0.20 until grammars are built in-house

**Status:** Accepted
**Date:** 2026-10-15
**Deciders:** TenzDelek (maintainer)

## Context

Parsing uses `web-tree-sitter` 0.20.8 with grammar wasm files from the community
package `tree-sitter-wasms` 0.1.x plus `tree-sitter-dart`. The runtime is seven
minor versions behind, the grammar package has no maintenance guarantee, and the
Swift grammar forces the action to relaunch itself with `--liftoff-only` to avoid a
V8 out-of-memory crash while the wasm is compiled.

A time-boxed spike on 2026-10-15 loaded every bundled grammar with
`web-tree-sitter` 0.27.1 (language ABI 15, minimum compatible 13):

- All 36 grammar files in `tree-sitter-wasms/out` and `tree-sitter-dart`'s own
  wasm failed in `Language.load` at `getDylinkMetadata`, before any ABI check.
  The new runtime requires the `dylink.0` section emitted by recent Emscripten;
  the grammars carry the older `dylink` layout.
- Grammar ABI compatibility is therefore not the blocker; the Emscripten
  toolchain used to build the wasm is. Prebuilt grammar files from other npm
  packages have the same problem unless they were built with a matching
  tree-sitter CLI.

## Decision

Keep `web-tree-sitter` pinned at 0.20.8 and `tree-sitter-wasms` at 0.1.x, keep
the `--liftoff-only` relaunch, and record the upgrade path: build all seventeen
grammars ourselves with a tree-sitter CLI matched to the runtime version
(`tree-sitter build --wasm`, which needs Emscripten or Docker) as a release
step that commits the wasm files into `dist/grammars`.

## Options Considered

### Option A: Stay pinned (chosen)

| Dimension | Assessment |
|-----------|------------|
| Complexity | None |
| Cost | None now; the relaunch costs a few percent of parse time |
| Scalability | Fine; parsing is not the bottleneck |
| Team familiarity | High |

**Pros:** nothing changes for users; the known workaround is in place and tested.
**Cons:** runtime fixes stay out of reach; a grammar bug can only be fixed by
rebuilding anyway.

### Option B: Upgrade the runtime and switch to per-grammar npm packages

**Pros:** official sources per language.
**Cons:** the spike shows their prebuilt wasm does not load either; most also run
native `node-gyp` install scripts, which every contributor would pay for.

### Option C: Build grammars in-house with a matched tree-sitter CLI

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium: a Docker-based build step and seventeen grammar sources pinned by commit |
| Cost | A longer release build; `dist/grammars` stays about 30 MB |
| Scalability | Unblocks every future runtime upgrade |
| Team familiarity | Low |

**Pros:** removes the dependency on an unmaintained package; lets us pick grammar
versions; may remove the need for the relaunch if newer builds avoid the huge
functions.
**Cons:** real engineering and CI time for a problem users do not currently feel.

## Trade-off Analysis

C is the only real upgrade path and it is worth doing once a runtime or grammar
fix is actually needed. Until then A costs nothing, so the decision is to do
nothing now and to do C, not B, when the time comes.

## Consequences

- Easier: nothing to maintain today; the relaunch keeps large grammars working.
- Harder: any grammar fix requires the in-house build first.
- Revisit: when a user hits a parser bug fixed upstream, when the relaunch stops
  working on a Node release, or when `tree-sitter-wasms` disappears from npm.

## Action Items

1. [x] Spike the runtime upgrade against the bundled grammars (failed at dylink metadata).
2. [ ] When triggered: add a Docker-based `grammars` build script, pin grammar sources, rebuild, upgrade the runtime, re-test the Swift OOM without the relaunch.
