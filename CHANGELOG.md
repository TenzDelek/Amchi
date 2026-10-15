# Changelog

Notable changes to Amchi. Each entry names the behaviour a user or operator will notice; design rationale lives in [`docs/adr/`](docs/adr/README.md).

## Unreleased

### Behaviour changes

- **Embeddings follow the review provider.** `embeddings: auto` now only calls the embedding API of the vendor doing the review (OpenAI or Gemini). Reviewing with Claude no longer sends repository chunks to OpenAI or Gemini just because that key is present. To keep semantic search on a Claude setup, add `embeddings: openai` or `embeddings: gemini` to `.codereview.yml`; the run log says so when auto turns embeddings off. Retrieval without embeddings uses keyword search plus the code graph. See [ADR-003](docs/adr/003-embeddings-follow-the-review-provider.md).
- **Runs have a time budget.** New `limits.max_run_seconds` (default 900, also the `max_run_seconds` action input), counted from the start of indexing. Files not reviewed in time are listed as skipped, the partial review and summary are still posted, and the next run reviews those files first. A call that is already in flight gets 90 seconds past the deadline rather than being cut off. Set it to `0` to disable, and keep it below the job's `timeout-minutes`. See [ADR-002](docs/adr/002-run-deadline-with-partial-posting.md).
- **Related files are reviewed together.** Changed files that import each other, or that call a function the other one changes, go into the same model call, so a signature change is reviewed next to its updated callers. Batch sizes are less even than before as a result. See [ADR-001](docs/adr/001-batch-changed-files-by-graph-affinity.md).

### Added

- `verify_model`: run the `review.verify` pass on a cheaper model from the same provider.
- Findings funnel and per-stage timings (`raw → verified → anchored → passing → capped → posted`) in the run log and the GitHub job summary. The PR comment is unchanged.
- The summary notes when findings were posted without the verify pass because the deadline or token budget ended it early.
- `docs/adr/`: architecture decision records, and a `CLAUDE.md` for agents working on the repo.

### Fixed

- The per-run token budget could be exceeded by up to one call per concurrent worker, because concurrent calls all passed the budget check before any of them was counted. In-flight calls are now reserved.
- Two reviews of the same PR could overlap and post the same finding twice when `@amchi review` ran alongside a push. The example workflow now puts both in the PR's concurrency group; questions keep their own.
- The example workflow's cache key no longer writes a new entry on every run, and comment-triggered runs no longer share the default branch's key.
- Deleting many files in one PR no longer scans the whole repository once per deleted file.
- Numeric action inputs and `limits.*` values that are not valid non-negative numbers fall back to their defaults with a warning instead of silently disabling a guard.
- The embeddings hint no longer suggests `embeddings: openai` when a custom `base_url` is set, since that would send the endpoint's key to api.openai.com.
- `npm test` pins `--liftoff-only` for vitest workers, so the Swift grammar can no longer kill a test worker with a V8 out-of-memory crash.

### Upgrading

Point the workflow at the new tag and copy the `concurrency`, `cache` and `timeout-minutes` lines from [`examples/workflow.yml`](examples/workflow.yml). Claude users who want semantic search back add one `embeddings:` line as described above.

## 2.0.1 — 2026-10-14

- The action relaunches itself with `--liftoff-only` so large tree-sitter grammars (Swift) cannot exhaust V8's zone memory while indexing.
- Description no longer compares against other reviewers.

## 2.0.0

Renamed from Takche to Amchi. Comments and state posted under the old `takche:` markers are still recognised. Full Dart/Flutter code-graph support, with `package:` imports resolved through `pubspec.yaml`.
