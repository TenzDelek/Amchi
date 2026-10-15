# ADR-004: Incremental search index

**Status:** Proposed
**Date:** 2026-10-15
**Deciders:** TenzDelek (maintainer)

## Context

Only tree-sitter parsing is incremental today. On every run the indexer reads
and hashes every file to find changed ones, `buildChunks` reads every file again
to produce search chunks, and the `Searcher` constructor rebuilds BM25 postings
over all chunks. The content cache in `CodeGraph.read` evicts at 2000 entries, so
on larger repos it thrashes during chunking. Chunk text for the whole repository
is held in memory alongside the index.

On a small or medium repository this costs a few seconds and is dwarfed by LLM
latency. On a monorepo near the `index.max_files` cap of 25,000 files it is the
dominant non-LLM cost and the largest memory consumer on a standard runner.

Constraints: the cache lives in `actions/cache` as a gzipped JSON file; there is
no server-side store by design; a format change forces a one-time full reparse
for every user.

## Decision

Proposed, not yet implemented: store each file's chunk spans and term
frequencies in its index entry at parse time, so the searcher builds postings
from the index without reading files, and chunk text is read lazily only for
search hits and for embedding new chunks. Use the stored commit and `git diff
--name-only` to find candidate changes instead of hashing every file, keeping
the hash check only for files git reports as changed.

Trigger for doing the work: a user reports indexing time or memory as a problem
on a large repository, or the `index` timing in the job summary regularly
exceeds the review timing.

## Options Considered

### Option A: Status quo

| Dimension | Assessment |
|-----------|------------|
| Complexity | None |
| Cost | Seconds per run on typical repos; tens of seconds plus memory pressure on large ones |
| Scalability | Limited by runner memory |
| Team familiarity | High |

**Pros:** simple, correct, already shipped.
**Cons:** every run pays for the whole repository regardless of what changed.

### Option B: Store chunk spans and term frequencies in the index (recommended)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium: indexer, chunking, searcher, `INDEX_VERSION` bump |
| Cost | Index grows roughly two to three times before gzip; most of it compresses well |
| Scalability | Per-run cost proportional to changed files plus postings build from memory |
| Team familiarity | Medium |

**Pros:** removes the full-repository read; chunk text loaded on demand; search
hashes available for embeddings without reading content.
**Cons:** one-time full reparse for all users; larger cache entries; JSON parse
time of the index itself grows.

### Option C: Git-based change detection only

Use `git diff --name-only <cached commit> HEAD` to skip hashing unchanged files.

**Pros:** small change; cuts the hashing read.
**Cons:** chunking still needs every file's text, so the bigger read remains.
Worth doing as part of B, not instead of it.

### Option D: External store (SQLite file in the cache, or a vector database)

**Pros:** proper incremental updates and queries.
**Cons:** SQLite would need a native or WASM dependency and the same cache
transport; a vector database breaks the zero-infrastructure premise of the
action. Not consistent with the product's positioning.

## Trade-off Analysis

B is the only option that removes the full read while staying inside the current
cache mechanism. Its main costs, index size and a one-time reparse, are paid once
and are acceptable if the trigger condition is real. Until then A is adequate,
which is why this record is Proposed rather than Accepted.

## Consequences

If adopted:

- Easier: large-repo runs get faster and use less memory; the searcher no longer
  depends on reading the working tree at construction time.
- Harder: the index format carries search data, so chunking rules become part of
  the cache contract and any change to them needs a version bump.
- Revisit: whether the `index.json.gz` single-file format should be split into
  per-file entries once it grows, and whether the embedding store should move
  into the same file.

## Action Items

1. [ ] Add the `index` timing to the job summary on a few large repositories to
   confirm the trigger condition (already printed; collect numbers).
2. [ ] Prototype term-frequency storage and measure index size and parse time.
3. [ ] If accepted, bump `INDEX_VERSION`, implement, and note the one-time reparse
   in release notes.
