# ADR-002: Wall-clock run deadline with partial posting

**Status:** Accepted
**Date:** 2026-10-15
**Deciders:** TenzDelek (maintainer)

## Context

The action posts results only after every review batch, the optional verify
pass and the summary have completed. A single LLM request may retry up to six
times with a 240 second timeout and exponential backoff, so one slow or
rate-limited call can exceed the 20 minute `timeout-minutes` in the example
workflow. When the runner kills the job, nothing is posted, the summary comment's
`lastSha` is not advanced, and the next push repeats the whole run.

The summary already handles incomplete runs: when any file failed or the token
budget was hit, it keeps the previous `lastSha` so the next run covers the gap.
What was missing was a way to stop early on purpose and reach the posting step.

Constraints: no infrastructure beyond the action; users control the job timeout;
partial results must be clearly marked and must not advance `lastSha`.

## Decision

Give the run a wall-clock budget, `limits.max_run_seconds` (default 900, also
an action input). The clock starts before indexing, because the job timeout it
protects against counts indexing too. The deadline is passed to:

- the batch scheduler, which skips batches not started by the deadline with the
  reason "run deadline reached";
- `TrackedLLM`, which refuses to start a call past the deadline;
- the HTTP layer, which caps each request timeout and each retry wait to the
  time remaining and raises `DeadlineExceededError` (with the underlying error
  as cause) for anything the deadline cut short;
- the embedders, so query-time embedding during context retrieval cannot hold a
  worker past the deadline.

Only the start of a call is strict: a call that began before the deadline may
run 90 seconds past it, because aborting it would waste input tokens the
provider has already billed. The verify pass stops at the deadline and posts the
remaining findings unverified, with a note in the summary.

The summary call gets a 90 second grace period so a partial run still receives a
confidence score. The summary comment shows a deadline note, `deadlineHit`
keeps `lastSha` at its previous value, and the paths that were skipped or
failed are stored in the state block as `pending`, so the next run schedules
their groups first instead of repeating the same prefix of the PR. The example
workflow sets the step's `timeout-minutes` above the default deadline.

## Options Considered

### Option A: Rely on the job timeout

| Dimension | Assessment |
|-----------|------------|
| Complexity | None |
| Cost | Wasted tokens on killed runs |
| Scalability | Poor on large PRs or flaky providers |
| Team familiarity | High |

**Pros:** nothing to maintain.
**Cons:** killed runs post nothing and repeat all work; users see only a failed
check with no findings.

### Option B: Deadline threaded through scheduler, LLM wrapper and HTTP (chosen)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium (one optional field through three layers) |
| Cost | Neutral; avoids repeated work |
| Scalability | Good; bounded run time regardless of PR size |
| Team familiarity | Medium |

**Pros:** partial results always reach the PR; next run covers the rest; works
for the CLI too.
**Cons:** a second limit next to the token budget to document; users with long
job timeouts must raise it.

### Option C: Post findings incrementally after each batch

**Pros:** nothing is lost even on a hard kill.
**Cons:** many more GitHub API calls, the summary comment rewritten per batch,
review comments arriving in waves, and the dedupe-against-earlier-comments logic
would run per batch. Heavier than the problem warrants.

## Trade-off Analysis

Option B is a bounded change that reuses the existing incomplete-run handling.
Option C would be the next step only if hard kills remain common after B, which
should be rare because the deadline is below the job timeout by design.

## Consequences

- Easier: runs are bounded; partial reviews are visible with a reason.
- Harder: two limits (tokens and seconds) to keep consistent with the workflow's
  `timeout-minutes`.
- Revisit: the 900 second default if typical runs on large repos approach it;
  whether the verify pass should be skipped first when time is short.

## Action Items

1. [x] Implement the deadline in reviewer, `TrackedLLM`, embedders and `postJson` with tests.
1. [x] Carry unreviewed paths in the state comment and schedule them first.
2. [x] Document `max_run_seconds` and set `timeout-minutes` in the example workflow.
3. [ ] Watch the "run deadline reached" note on real PRs and adjust the default.
