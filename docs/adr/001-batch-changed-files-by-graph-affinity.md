# ADR-001: Batch changed files by graph affinity

**Status:** Accepted
**Date:** 2026-10-15
**Deciders:** TenzDelek (maintainer)

## Context

Each review call to the model carries up to five changed files, their diffs, and
per-file repository context (enclosing functions, callees, callers, tests, similar
code). Batches used to be formed by sorting files by diff size and packing them
greedily under 45% of `limits.max_input_tokens_per_call`.

That rule ignores how files relate. A PR that changes a function's signature in
one file and updates its callers in two others would often spread those three
files over separate calls. The callers section of the context builder only tags a
caller as "also changed in this PR"; it does not show the caller's new code. The
model then reviews the signature change without seeing whether the callers were
updated correctly, which is exactly the class of bug a code graph is meant to
catch.

Constraints: no extra LLM calls, no change to the context budget, the per-call
limits must still hold, and batches must stay deterministic for a given graph.

## Decision

Group changed files into connected components before packing. Two files are
linked when one imports the other (resolved edge in the graph), or when one
calls a symbol that the other's diff touches, using the same precision rule as
the context builder (the name is unique in the repo, or the caller imports the
file). Components are ordered by total diff size, files within a component by
size. A component that does not fit in the remaining space of the current batch
starts a fresh batch, so it stays together where possible. Components larger
than one batch are split with the old size rule, after ordering the component's
files by how many links they have inside the PR, so the hub file lands in the
first batch with its closest callers. Files in later sub-batches still see the
hub's new definitions through the context builder, but not its diff. Components
containing files a previous run could not review go first (see ADR-002).

Implemented in `relatedGroups` and `planBatches` in `src/review/reviewer.ts`.

## Options Considered

### Option A: Keep size-based packing

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low (status quo) |
| Cost | Unchanged |
| Scalability | Fine |
| Team familiarity | High |

**Pros:** simplest, evenly sized batches.
**Cons:** related files split across calls; the graph's main advantage is lost at
the call boundary.

### Option B: Group by graph affinity, then pack (chosen)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium (union-find over changed files) |
| Cost | Same or slightly fewer tokens: callers in the same batch need no separate snippet |
| Scalability | O(changed files × their edges); negligible |
| Team familiarity | Medium |

**Pros:** signature changes reviewed next to updated callers; no new calls; falls
back to size packing for unrelated files.
**Cons:** batches become uneven; a highly connected PR becomes one group and
packs sequentially, so ordering matters more than before.

### Option C: PR-wide impact preamble in every call

Emit one block listing every changed symbol and its callers, prepended to each
batch.

**Pros:** every call sees the whole impact map.
**Cons:** repeated in every batch, so it costs tokens proportional to the number
of batches; still does not show the updated caller code.

### Option D: Two-pass review (cheap triage, then deep calls)

**Pros:** could choose which files need cross-file context.
**Cons:** adds a call per run and a second prompt to maintain; harder to reason
about cost; not needed to fix the split-caller problem.

## Trade-off Analysis

Option B fixes the concrete failure with no cost increase, which outweighs the
loss of evenly sized batches. Option C is complementary rather than an
alternative and can be added later if the funnel shows breaking-change findings
are still missed. Option D is deferred until there is evidence that context, not
batching, is the limiting factor.

## Consequences

- Easier: the model sees a change and its in-PR callers together.
- Harder: predicting batch count from file count; tests that assumed size order.
- Known limit: a component that spans several batches loses the hub's diff in
  all but the first batch; a PR touching a well-connected module degenerates to
  size packing.
- Revisit: whether to add the PR-wide preamble (Option C) once the findings
  funnel is populated on real PRs; whether `maxFiles = 5` is still the right cap
  when batches are related.

## Action Items

1. [x] Implement `relatedGroups` and `planBatches` with tests.
2. [ ] Compare breaking-change findings on a sample of real PRs before and after,
   using the funnel in the job summary.
3. [ ] Decide on Option C after that comparison.
