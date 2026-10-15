# Architecture decision records

One file per decision, numbered in order. A record is **Accepted** once the
change is implemented, **Proposed** while it is still a plan, and
**Superseded** when a later record replaces it.

| ADR | Title | Status |
| --- | --- | --- |
| [001](001-batch-changed-files-by-graph-affinity.md) | Batch changed files by graph affinity | Accepted |
| [002](002-run-deadline-with-partial-posting.md) | Wall-clock run deadline with partial posting | Accepted |
| [003](003-embeddings-follow-the-review-provider.md) | Embeddings default to the review provider's own vendor | Accepted |
| [004](004-incremental-search-index.md) | Incremental search index | Accepted |
| [005](005-stay-on-web-tree-sitter-0-20.md) | Stay on web-tree-sitter 0.20 until grammars are built in-house | Accepted |

The prioritised debt inventory and remediation plan are in [`../tech-debt.md`](../tech-debt.md).
