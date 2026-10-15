# ADR-003: Embeddings default to the review provider's own vendor

**Status:** Accepted
**Date:** 2026-10-15
**Deciders:** TenzDelek (maintainer)

## Context

Semantic search over the code graph needs an embedding API. Anthropic does not
offer one, so with `embeddings: auto` the action used any OpenAI or Gemini key it
could find, in that order. The example workflow passes all three keys. A team
that chose Claude for reviews, possibly for data-handling reasons, therefore had
every code chunk in the repository sent to OpenAI's embeddings endpoint on the
first run, with no setting that said so.

Embeddings improve the "similar code elsewhere" context section but are not
required: retrieval falls back to BM25 over identifiers plus graph edges.

## Decision

`embeddings: auto` only uses the embedding API of the provider doing the review:
OpenAI when reviewing with OpenAI (and no custom `base_url`), Gemini when
reviewing with Gemini, otherwise off. Sending code to a second vendor requires
naming it explicitly with `embeddings: openai` or `embeddings: gemini`. The log
says when auto turned embeddings off and which setting enables them.

## Options Considered

### Option A: Use any available embedding key (previous behaviour)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low |
| Cost | Small embedding spend, cached by content hash |
| Scalability | Fine |
| Team familiarity | High |

**Pros:** best retrieval out of the box for everyone with an OpenAI or Gemini key.
**Cons:** repository code goes to a vendor the user did not pick for reviews;
not discoverable without reading the source.

### Option B: Same vendor only, opt in for others (chosen)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low |
| Cost | Unchanged for OpenAI and Gemini users; zero for Claude users by default |
| Scalability | Fine |
| Team familiarity | High |

**Pros:** no surprising data flow; one explicit setting restores the old behaviour.
**Cons:** Claude users lose semantic search until they opt in; a behaviour change
for existing installs.

### Option C: Embeddings off by default for everyone

**Pros:** simplest rule.
**Cons:** penalises OpenAI and Gemini users whose code already goes to that vendor
for the review itself.

## Trade-off Analysis

The privacy expectation is stronger than the retrieval gain. Option B keeps the
gain wherever it costs nothing in data exposure and makes the rest an explicit
choice. The log hint limits the chance that Claude users silently lose quality
without knowing why.

## Consequences

- Easier: explaining where repository code is sent.
- Harder: Claude users must add one line of config to get semantic search.
- Revisit: if Anthropic ships an embeddings API, auto should use it; if a local
  embedding option is added (an OpenAI-compatible `base_url`), auto could prefer
  that.

## Action Items

1. [x] Change `createEmbedder` and its test; document in README and example config.
2. [ ] Mention the change in the next release notes, since existing Claude installs
   will see "Embeddings: off" on their next run.
