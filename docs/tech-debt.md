# Technical debt

Inventory as of 2026-10-15, scored with `priority = (impact + risk) × (6 − effort)`.
Impact: how much it slows work (1–5). Risk: what happens if left alone (1–5).
Effort: 1 under an hour, 2 half a day, 3 up to two days, 4 up to a week, 5 more.

Re-score when an item is fixed or its trigger fires; delete rows rather than letting them go stale.
Phase 1 was completed on 2026-10-15; items 2, 3, 4, 5 and 12 are closed and kept in the table only until the next re-score.

## Prioritised list

| # | Item | Type | Impact | Risk | Effort | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | No tests for the action's orchestration in `src/index.ts`: event dispatch, skip rules, incremental state, dedupe against earlier comments, posting and `lastSha` handling. The end-to-end test stops at `runReview`. | Test | 3 | 4 | 3 | 21 |
| 2 | `@actions/github` 6.x pulls `undici` 5 and `@fastify/busboy` 2 with two high-severity advisories (multipart DoS, CRLF injection). Not reachable through our usage, but the vulnerable code ships in `dist/` and `npm audit` fails. `@actions/core` is two majors behind too. | Dependency | 2 | 3 | 2 | 20 |
| 3 | Duplicated constants and helpers: the 4-chars-per-token estimate in `util/text.ts`, `llm/index.ts` and `llm/mock.ts`; `rank()` in `render.ts` duplicating `severityRank()`; the deadline computed identically in `index.ts` and `cli.ts`; three "container kind" sets in `parser.ts`, `search.ts` and `context.ts`. | Code | 2 | 2 | 1 | 20 |
| 4 | `.codereview.yml` is deep-merged without a schema, so a misspelled key (`min_serverity`) is silently ignored and the user gets defaults. | Code | 3 | 2 | 2 | 20 |
| 5 | Retrieval and review tuning lives in bare numbers: 23 literal limits in `context.ts` (250, 200, 60, 40, 10, 6, 5, 3, 2000) and more in `reviewer.ts` (0.45, 0.9, 1500, 2500, 5 files, 40 lines, ±3 lines). Changing one requires reading the code to learn what it means. | Code | 2 | 2 | 2 | 16 |
| 6 | Releases are manual: moving the `v2` tag, writing `CHANGELOG.md`, and remembering that `dist/` must match `src/` (CI checks the last one). | Infrastructure | 2 | 2 | 2 | 16 |
| 7 | Four functions over 100 lines carry whole stages: `reviewPullRequest` (204), `buildFileContext` (208), `main` (136) and `reviewPr` (120). Each mixes selection, orchestration and rendering, so a change in one stage is tested through all of them. | Code | 3 | 2 | 3 | 15 |
| 8 | `web-tree-sitter` is pinned at 0.20.8 (latest 0.27) because the grammars come from the community package `tree-sitter-wasms` 0.1.x built for that ABI. Runtime fixes, including possibly the wasm tiering OOM that forced `--liftoff-only`, are out of reach, and the grammar source has no maintenance guarantee. `parser.ts` types nodes as `any` for the same reason. | Dependency | 2 | 4 | 4 | 12 |
| 9 | No linter or formatter. Style is consistent today by habit; `any` escapes and unused imports are caught only by `tsc`. | Infrastructure | 2 | 1 | 2 | 12 |
| 10 | Per-PR state lives in a hidden block in the summary comment: 65k character ceiling, file summaries truncated at 20k, `pending` capped at 200 paths, and a regex parse of model-adjacent text. Works at current scale; fails quietly past it. | Architecture | 2 | 3 | 4 | 10 |
| 11 | The search index is rebuilt from every file on every run (chunks, BM25 postings, content cache that thrashes past 2000 files). See ADR-004 for the design and the trigger. | Architecture | 3 | 2 | 4 | 10 |
| 12 | Language list drift: `languages.ts` defines 17 grammars, the README diagram says 15 and the list omits Elixir, and `build.mjs` keeps its own grammar list that also copies an unused `vue` grammar into the 29 MB `dist/grammars`. | Documentation | 1 | 1 | 1 | 10 |
| 13 | Call edges are keyed by bare name, so methods that share a name across classes collapse into one caller list. The parser records `parent` but calls carry no receiver. Precision ceiling of the whole context builder. | Architecture | 3 | 2 | 5 | 5 |

## Justification, briefly

- **1, 7.** The orchestration in `index.ts` is where users see regressions (duplicate comments, wrong `lastSha`, skipped PRs) and it is the one layer with no test. Splitting the long functions into stages with typed inputs and outputs is what makes that layer testable without a GitHub mock for every case, so 7 is the enabler for 1.
- **2.** Shipping code with public advisories in a security-adjacent tool costs trust even when the path is unreachable. Octokit usage is confined to `github/client.ts`, so the major-version bump is contained.
- **3, 4, 5.** Cheap, and each removes a class of silent error: a token estimate that drifts between two copies, a severity ordering that disagrees with config, a config typo that nobody notices for weeks.
- **6.** A release workflow that runs on a tag, checks `dist/`, and moves the major tag removes the one step that can ship a stale bundle.
- **8.** Highest risk item that is not cheap. Worth a time-boxed spike to see whether current `web-tree-sitter` can load the existing grammars; if it cannot, the fix is a grammar build step of our own.
- **10, 11, 13.** Real but trigger-gated. Each has a documented decision or a known trigger; revisit when a user reports the symptom, not before.

## Remediation plan

Each phase fits alongside feature work; nothing here blocks a release.

### Phase 1: quick wins (one or two days, any time)

1. [x] Collapse the duplicated constants and helpers (item 3): one `CHARS_PER_TOKEN`, one `severityRank`, one `runDeadline(cfg)`, one container-kind set exported from `parser.ts`.
2. [x] Name the retrieval and review limits (item 5) as a single exported object with a comment per field, so `context.ts` and `reviewer.ts` read as policy.
3. [x] Warn on unknown config keys (item 4): walk the parsed YAML against `DEFAULT_CONFIG` and log each key that has no counterpart.
4. [x] Fix the language list (item 12): a test keeps `build.mjs`'s grammar list equal to `languages.ts`, `vue` is dropped, the README count and list are corrected.
5. [x] Upgrade `@actions/github` and `@actions/core` (item 2), rerun the posting tests, rebuild `dist/`, confirm `npm audit --omit=dev` is clean.

### Phase 2: structure and safety net (one focused week)

6. [ ] Split `reviewPullRequest` into `selectFiles`, `planBatches` (exists), `reviewBatch`, `resolveFindings`, `summarize`, and `index.ts`'s `reviewPr` into `loadState`, `postFindings`, `writeSummary` (item 7). Pure functions in, typed results out; the funnel becomes a by-product.
7. [ ] Test the action orchestration (item 1) with a fake `GitHubClient`: skip rules, incremental delta with a merge from main, dedupe against earlier comments including retitled findings, `lastSha` retained on partial runs, `pending` scheduled first.
8. [ ] Add a release workflow (item 6): on a `v*.*.*` tag, run CI, verify `dist/` matches, create the GitHub release from the matching `CHANGELOG.md` section, and move the `v2` major tag.
9. [ ] Add a linter with a minimal rule set and run it in CI (item 9); keep the `any` in `parser.ts` behind one documented cast.

### Phase 3: trigger-gated

10. [ ] Spike `web-tree-sitter` 0.27 against the bundled grammars (item 8); if they load, upgrade and drop the relaunch; if not, decide between building grammars in `build.mjs` or staying pinned with a note.
11. [ ] Incremental search index (item 11) when the `index` timing in job summaries regularly exceeds the `review` timing. Design in ADR-004.
12. [ ] Move per-PR state out of the summary comment (item 10) when a repo hits the comment size limit or the `pending` cap.
13. [ ] Receiver-qualified call edges (item 13) only after 10, since it needs parser changes.
