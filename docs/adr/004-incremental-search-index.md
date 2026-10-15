# ADR-004: Incremental search index

**Status:** Accepted
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

Implemented 2026-10-15 (`INDEX_VERSION` 4). Each file's index entry carries its
chunk spans with term frequencies, document length and content hash, computed
when the file is parsed. The searcher builds BM25 postings from the index alone;
chunk text is regenerated from the file only when a chunk must be embedded. The
index records the commit it was built at and whether the working tree was dirty;
when it was clean and the commit is still present, `git diff --name-only` plus
`git status` give the set of files that may have changed and every other file is
reused without being opened. A dirty cache or a missing commit falls back to
hashing every file, as before.

Measured on this repository (58 files, 406 chunks): the gzipped index grew from
17 KB to 91 KB (raw JSON 77 KB to 347 KB), about five times rather than the two
to three estimated below. The term-frequency maps are the bulk of it. A global
term dictionary with numeric ids per chunk would cut the raw size by roughly
half; it is left as a follow-up until a large repository shows the cache size or
parse time matters.

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

1. [x] Implement chunk metadata in the index, git-based change detection, and the
   index-driven searcher; bump `INDEX_VERSION`; note the one-time reparse in the
   changelog.
2. [ ] Collect index size and `index` timing from a large repository's job summary.
3. [ ] If size matters there, add a global term dictionary with numeric ids per chunk.
