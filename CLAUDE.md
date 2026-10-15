# Amchi

Self-hosted AI pull-request reviewer: a GitHub Action plus CLI that builds a tree-sitter code graph of the repo and reviews diffs with the user's own LLM key. README covers what it does, the pipeline stages and the layout of `src/`; this file holds only what the tree does not say.

## Working here

- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` are the whole loop. The linter is oxlint, because typescript-eslint does not support TypeScript 7. The vitest config pins `--liftoff-only` for workers; keep it, or the Swift grammar can kill a worker with a V8 zone OOM (SIGTRAP).
- `tree-sitter-wasms` grammars cannot be loaded by newer `web-tree-sitter` runtimes; ADR-005 has the spike and the upgrade path. Leave both pinned.
- Review orchestration lives in `src/action/review-pr.ts` behind `PrPort` and `Reporter`; add GitHub-facing scenarios to `test/action.test.ts` with the fake port there rather than mocking Octokit.
- `dist/` is committed and is what GitHub runs. After any change under `src/`, run the build and commit `dist/` in the same commit.
- Offline runs: `--provider mock` drives the whole pipeline with a pattern-matching LLM. `AMCHI_DUMP_PROMPTS=<dir>` writes every prompt/response pair as markdown, which is the fastest way to see what the model was shown.

## Invariants

- Review config comes from the PR's **base** commit, and `base_url` / `index.dir` are accepted only from action inputs (`trusted: false` in `loadConfig`). A PR must not be able to change its own rules or redirect a key.
- Only the bot's own comments are trusted for state and dedupe. Marker regexes accept both `amchi:` and the pre-rename `takche:` prefix; keep both.
- Bump `INDEX_VERSION` in `src/graph/indexer.ts` whenever parser output or chunking changes, so cached indexes rebuild.
- A run that failed, hit the token budget or hit the deadline keeps the previous `lastSha` and records the unreviewed paths as `pending` in the summary's state block; the next run schedules them first.
- Repository code is sent only to the vendor doing the review unless `embeddings` names another one explicitly.

## Decisions

Before changing how files are batched into LLM calls, the run deadline, embeddings selection, or the index/cache format, read the matching record in `docs/adr/` (one file per decision, index in its README) and add or supersede a record when you change the decision.
