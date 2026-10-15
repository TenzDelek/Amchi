import { isReviewable, rulesForPath, severityRank, SEVERITY_ORDER, type Config, type Rule, type Severity } from "../config.js";
import type { CodeGraph } from "../graph/indexer.js";
import type { Searcher } from "../graph/search.js";
import { changedRanges, commentableLines, renderDiffForModel, type FileDiff } from "../git/diff.js";
import { parseModelJson } from "../llm/json.js";
import { BudgetExceededError, DeadlineExceededError, type LLM } from "../llm/types.js";
import { log } from "../util/log.js";
import { estimateTokens, mapLimit, shortHash, truncateTokens } from "../util/text.js";
import { buildFileContext, COMMON_NAMES } from "./context.js";
import { renderPrHeader, renderRules, REVIEW_SYSTEM, SUMMARY_SYSTEM, VERIFY_SYSTEM, type PrMeta } from "./prompts.js";

export interface Finding {
  path: string;
  line: number;
  endLine?: number;
  severity: Severity;
  category: string;
  title: string;
  body: string;
  suggestion?: string;
  confidence: number;
  fingerprint: string;
}

export interface SummaryJson {
  overview: string;
  key_changes: string[];
  confidence: number;
  confidence_reason: string;
  diagram: string | null;
}

/** How many findings survived each stage, so it is visible where they are lost. */
export interface Funnel {
  /** Findings returned by the model (after basic normalisation). */
  raw: number;
  /** Left after the optional verification pass. */
  verified: number;
  /** Snapped to a line GitHub accepts (the rest move to the summary). */
  anchored: number;
  /** Deduplicated and above the severity / confidence thresholds. */
  passing: number;
  /** Kept under `review.max_comments`. */
  capped: number;
  /** Actually posted as new inline comments (set by the action after deduping against earlier runs). */
  posted?: number;
}

/** Milliseconds per stage. */
export interface Timings {
  index?: number;
  /** Summed over files (they run concurrently), so it can exceed `review`. */
  context: number;
  /** Wall time of the review calls, context retrieval included. */
  review: number;
  verify: number;
  summary: number;
}

export interface ReviewOutput {
  /** Findings that can be posted as inline review comments. */
  inline: Finding[];
  /** Findings that could not be anchored to a diff line. */
  outside: Finding[];
  /** Findings that passed validation but were cut by max_comments or thresholds. */
  dropped: number;
  fileSummaries: Record<string, string>;
  summary: SummaryJson | null;
  reviewed: FileDiff[];
  skipped: { path: string; reason: string }[];
  failed: string[];
  budgetHit: boolean;
  /** `limits.max_run_seconds` ran out before every batch was reviewed. */
  deadlineHit: boolean;
  /** Findings posted without the verify pass because the deadline or budget cut it short. */
  unverified: number;
  funnel: Funnel;
  timings: Timings;
}

export interface ReviewInput {
  files: FileDiff[];
  pr: PrMeta;
  graph: CodeGraph;
  searcher: Searcher;
  llm: LLM;
  cfg: Config;
  commits?: { sha: string; subject: string }[];
  /** Full PR diff (for the summary) when `files` is only an incremental delta. */
  allFiles?: FileDiff[];
  /** Diff used to validate comment anchors (the full PR diff in incremental mode). */
  anchorFiles?: FileDiff[];
  /** File summaries from earlier runs, merged into the summary table. */
  previousFileSummaries?: Record<string, string>;
  /** Verify findings with a second pass (fewer false positives, ~2x cost). */
  verify?: boolean;
  /** Epoch ms after which no new review batch is started. */
  deadline?: number;
  /** Files a previous run could not review; their groups are scheduled first. */
  priorityPaths?: string[];
}

interface RawFinding {
  path?: string;
  line?: number;
  end_line?: number | null;
  severity?: string;
  category?: string;
  title?: string;
  body?: string;
  suggestion?: string | null;
  confidence?: number;
}

interface RawReview {
  files?: { path?: string; summary?: string }[];
  findings?: RawFinding[];
}

export function fingerprint(path: string, title: string): string {
  return shortHash(`${path}|${title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}`);
}

export interface Batch {
  files: FileDiff[];
  diffs: Map<string, string>;
  diffTokens: number;
}

/** Changed files that depend on each other: imports between them, or one calls a symbol the other changes. */
export function relatedGroups(candidates: FileDiff[], graph: CodeGraph): FileDiff[][] {
  return affinity(candidates, graph).groups;
}

/** Connected components of the changed files plus each file's number of links inside the PR. */
function affinity(candidates: FileDiff[], graph: CodeGraph): { groups: FileDiff[][]; degree: Map<string, number> } {
  const paths = new Set(candidates.map((f) => f.path));
  const degree = new Map(candidates.map((f) => [f.path, 0]));
  const edges = new Set<string>();
  const parent = new Map(candidates.map((f) => [f.path, f.path]));
  const find = (p: string): string => {
    while (parent.get(p) !== p) {
      parent.set(p, parent.get(parent.get(p)!)!);
      p = parent.get(p)!;
    }
    return p;
  };
  const union = (a: string, b: string) => {
    parent.set(find(a), find(b));
    const key = a < b ? `${a}\0${b}` : `${b}\0${a}`;
    if (!edges.has(key)) {
      edges.add(key);
      degree.set(a, degree.get(a)! + 1);
      degree.set(b, degree.get(b)! + 1);
    }
  };
  for (const f of candidates) {
    for (const r of graph.file(f.path)?.resolved ?? []) if (paths.has(r)) union(f.path, r);
    for (const i of graph.importersOf(f.path)) if (paths.has(i)) union(f.path, i);
    const seen = new Set<string>();
    for (const [s, e] of changedRanges(f)) {
      for (const sym of graph.symbolsOverlapping(f.path, s, e)) {
        if (seen.has(sym.name) || COMMON_NAMES.has(sym.name)) continue;
        seen.add(sym.name);
        // Same precision rule as the context builder: trust a name match only when it is unique or imported.
        const unique = (graph.defsByName.get(sym.name)?.length ?? 0) <= 1;
        for (const c of graph.callersOf(sym.name)) {
          if (c.path !== f.path && paths.has(c.path) && (unique || graph.dependsOn(c.path, f.path))) union(f.path, c.path);
        }
      }
    }
  }
  const groups = new Map<string, FileDiff[]>();
  for (const f of candidates) (groups.get(find(f.path)) ?? groups.set(find(f.path), []).get(find(f.path))!).push(f);
  return { groups: [...groups.values()], degree };
}

/**
 * Pack files into LLM calls. Files that depend on each other go into the same
 * call where they fit, so a signature change and its updated callers are
 * reviewed together; groups are then filled greedily by diff size. Groups that
 * contain `priority` paths (left over from an earlier run) go first. Inside a
 * group the most-connected files come first, so when a group has to be split the
 * hub lands in the first batch with its closest callers.
 */
export function planBatches(
  candidates: FileDiff[],
  graph: CodeGraph,
  maxDiffPerBatch: number,
  maxFiles = 5,
  priority: Set<string> = new Set(),
): Batch[] {
  const size = (f: FileDiff) => f.additions + f.deletions;
  const render = (f: FileDiff) => {
    let d = renderDiffForModel(f);
    let t = estimateTokens(d);
    if (t > maxDiffPerBatch) {
      d = truncateTokens(d, maxDiffPerBatch);
      t = maxDiffPerBatch;
      log.warn(`Diff for ${f.path} is very large; reviewing a truncated version`);
    }
    return { f, d, t };
  };
  const { groups: raw, degree } = affinity(candidates, graph);
  const groups = raw
    .map((g) => {
      const files = g.sort((a, b) => degree.get(b.path)! - degree.get(a.path)! || size(b) - size(a)).map(render);
      const urgent = g.filter((f) => priority.has(f.path)).length;
      return { files, urgent, tokens: files.reduce((n, x) => n + x.t, 0) };
    })
    .sort((a, b) => b.urgent - a.urgent || b.tokens - a.tokens || b.files.length - a.files.length);

  const batches: Batch[] = [];
  let cur: Batch = { files: [], diffs: new Map(), diffTokens: 0 };
  const flush = () => {
    if (cur.files.length) batches.push(cur);
    cur = { files: [], diffs: new Map(), diffTokens: 0 };
  };
  for (const g of groups) {
    // A group that would not fit entirely in the current batch starts a fresh one, so it stays together.
    const fits = cur.files.length + g.files.length <= maxFiles && cur.diffTokens + g.tokens <= maxDiffPerBatch;
    if (cur.files.length && !fits) flush();
    for (const { f, d, t } of g.files) {
      if (cur.files.length && (cur.diffTokens + t > maxDiffPerBatch || cur.files.length >= maxFiles)) flush();
      cur.files.push(f);
      cur.diffs.set(f.path, d);
      cur.diffTokens += t;
    }
  }
  flush();
  return batches;
}

export async function reviewPullRequest(input: ReviewInput): Promise<ReviewOutput> {
  const { cfg, graph, searcher, llm, pr } = input;
  const skipped: { path: string; reason: string }[] = [];
  const failed: string[] = [];
  let budgetHit = false;
  let deadlineHit = false;
  const timings: Timings = { context: 0, review: 0, verify: 0, summary: 0 };
  const prPaths = new Set(input.files.map((f) => f.path));
  const pastDeadline = () => !!input.deadline && Date.now() >= input.deadline;

  // ---- 1. choose files -----------------------------------------------------
  let candidates: FileDiff[] = [];
  for (const f of input.files) {
    if (f.binary) skipped.push({ path: f.path, reason: "binary" });
    else if (f.status === "deleted") skipped.push({ path: f.path, reason: "deleted" });
    else if (!isReviewable(f.path, cfg)) skipped.push({ path: f.path, reason: "ignored by config" });
    else if (!f.hunks.some((h) => h.lines.some((l) => l.type !== "ctx"))) skipped.push({ path: f.path, reason: "no content changes" });
    else candidates.push(f);
  }
  candidates.sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions));
  if (candidates.length > cfg.review.max_files) {
    for (const f of candidates.slice(cfg.review.max_files)) skipped.push({ path: f.path, reason: "max_files limit" });
    candidates = candidates.slice(0, cfg.review.max_files);
  }

  // Deterministic check: deleted files that are still imported.
  const outside: Finding[] = [];
  const goneFiles = (input.allFiles ?? input.files)
    .filter((x) => x.status === "deleted" || (x.status === "renamed" && x.oldPath))
    .map((f) => ({ f, gone: f.status === "deleted" ? f.path : f.oldPath! }))
    .filter(({ gone }) => !graph.file(gone)); // still exists
  const importersByGone = graph.importersOfMissingMany(goneFiles.map((g) => g.gone));
  for (const { f, gone } of goneFiles) {
    const importers = importersByGone.get(gone) ?? [];
    if (importers.length) {
      const title = `\`${gone}\` was ${f.status === "deleted" ? "deleted" : "moved"} but is still imported`;
      outside.push({
        path: importers[0],
        line: 1,
        severity: "high",
        category: "breaking-change",
        title,
        body: `Still imported by: ${importers.slice(0, 8).map((p) => `\`${p}\``).join(", ")}`,
        confidence: 0.9,
        fingerprint: fingerprint(gone, title),
      });
    }
  }

  // ---- 2. batch files by diff size ----------------------------------------
  const perCall = cfg.limits.max_input_tokens_per_call;
  const header = renderPrHeader(pr);
  const headerTokens = estimateTokens(header) + 2500; // + system prompt
  const maxDiffPerBatch = Math.floor((perCall - headerTokens) * 0.45);
  const priority = new Set(input.priorityPaths ?? []);
  const batches = planBatches(candidates, graph, maxDiffPerBatch, 5, priority);
  const carried = candidates.filter((f) => priority.has(f.path)).length;
  log.info(`Reviewing ${candidates.length} file(s) in ${batches.length} LLM call(s)${carried ? ` (${carried} left over from the previous run go first)` : ""}`);

  // ---- 3. review each batch -------------------------------------------------
  const fileSummaries: Record<string, string> = { ...(input.previousFileSummaries ?? {}) };
  const raw: { finding: Finding; batch: number }[] = [];
  const batchPrompts: string[] = [];

  const t0 = Date.now();
  await mapLimit(batches, cfg.limits.concurrency, async (batch, bi) => {
    if (pastDeadline()) {
      deadlineHit = true;
      for (const f of batch.files) skipped.push({ path: f.path, reason: "run deadline reached" });
      return;
    }
    const ctxBudget = Math.max(
      1500,
      Math.floor((perCall - headerTokens - batch.diffTokens) * 0.9 / batch.files.length),
    );
    const parts: string[] = [header];
    const rules = new Map<string, Rule>();
    for (const f of batch.files) for (const r of rulesForPath(f.path, cfg)) rules.set(r.rule, r);
    const rulesText = renderRules([...rules.values()]);
    if (rulesText) parts.push(rulesText);

    for (const f of batch.files) {
      let ctx = "";
      const tc = Date.now();
      try {
        ctx = await buildFileContext(f, graph, searcher, ctxBudget, prPaths);
      } catch (e) {
        log.warn(`Context retrieval failed for ${f.path}: ${(e as Error).message}`);
      }
      timings.context += Date.now() - tc;
      parts.push(
        `\n==================== FILE: ${f.path} (${f.status}${f.oldPath && f.oldPath !== f.path ? ` from ${f.oldPath}` : ""}) ====================\n` +
          `## Diff\n\`\`\`diff\n${batch.diffs.get(f.path)}\n\`\`\`\n` +
          (ctx ? `\n## Repository context for ${f.path}\n${ctx}\n` : ""),
      );
    }
    parts.push(
      `\nReview the ${batch.files.length === 1 ? "file" : `${batch.files.length} files`} above. ` +
        `Return a "files" entry for each of: ${batch.files.map((f) => f.path).join(", ")}.`,
    );
    const user = parts.join("\n");
    batchPrompts[bi] = user;

    try {
      const res = await llm.chat({
        system: REVIEW_SYSTEM(cfg),
        user,
        json: true,
        maxTokens: cfg.limits.max_output_tokens,
        label: `review:${batch.files.map((f) => f.path).join(",")}`,
      });
      const parsed = parseModelJson<RawReview>(res.text);
      for (const s of parsed.files ?? []) if (s.path && s.summary) fileSummaries[s.path] = s.summary;
      for (const rf of parsed.findings ?? []) {
        const f = normalizeFinding(rf, batch.files);
        if (f) raw.push({ finding: f, batch: bi });
      }
    } catch (e) {
      if (e instanceof BudgetExceededError) {
        budgetHit = true;
        for (const f of batch.files) skipped.push({ path: f.path, reason: "token budget reached" });
        log.warn(e.message);
      } else if (e instanceof DeadlineExceededError) {
        deadlineHit = true;
        for (const f of batch.files) skipped.push({ path: f.path, reason: "run deadline reached" });
        log.warn(e.message);
      } else {
        failed.push(...batch.files.map((f) => f.path));
        log.warn(`Review call failed for ${batch.files.map((f) => f.path).join(", ")}: ${(e as Error).message}`);
      }
    }
  });
  timings.review = Date.now() - t0; // wall time of the review calls, context retrieval included

  // ---- 4. optional verification pass ----------------------------------------
  let findings = raw;
  let unverified = 0;
  if (input.verify && raw.length) {
    const tv = Date.now();
    ({ kept: findings, unverified } = await verifyFindings(llm, cfg, raw, batchPrompts));
    timings.verify = Date.now() - tv;
  }

  // ---- 5. anchor, filter, dedupe, cap ---------------------------------------
  const byPath = new Map(candidates.map((f) => [f.path, f]));
  const anchorByPath = new Map((input.anchorFiles ?? []).map((f) => [f.path, f]));
  const inlineAll: Finding[] = [];
  for (const { finding } of findings) {
    const fd = anchorByPath.get(finding.path) ?? byPath.get(finding.path);
    if (!fd) continue;
    const anchored = anchor(finding, fd, cfg);
    if (anchored) inlineAll.push(anchored);
    else outside.push(finding);
  }
  const minSev = severityRank(cfg.review.min_severity);
  const passing = dedupe(inlineAll).filter(
    (f) => severityRank(f.severity) >= minSev && f.confidence >= cfg.review.min_confidence,
  );
  passing.sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.confidence - a.confidence);
  const inline = passing.slice(0, cfg.review.max_comments);
  const dropped = inlineAll.length - inline.length;
  const outsideKept = dedupe(outside).filter((f) => severityRank(f.severity) >= minSev && f.confidence >= cfg.review.min_confidence);

  // ---- 6. summary -----------------------------------------------------------
  let summary: SummaryJson | null = null;
  if (cfg.summary.enabled) {
    const ts = Date.now();
    try {
      // The summary is one small call; give it a short grace period past the deadline so a partial run still gets a score.
      const deadline = input.deadline ? Math.max(input.deadline, Date.now()) + 90_000 : undefined;
      summary = await summarize(llm, cfg, pr, input.allFiles ?? input.files, fileSummaries, inline.concat(outsideKept), input.commits ?? [], deadline);
    } catch (e) {
      if (e instanceof BudgetExceededError) budgetHit = true;
      log.warn(`Summary generation failed: ${(e as Error).message}`);
    }
    timings.summary = Date.now() - ts;
  }

  const funnel: Funnel = {
    raw: raw.length,
    verified: findings.length,
    anchored: inlineAll.length,
    passing: passing.length,
    capped: inline.length,
  };
  log.info(`Findings funnel: ${renderFunnel(funnel)} · timings: ${renderTimings(timings)}`);

  return {
    inline,
    outside: outsideKept,
    dropped: Math.max(0, dropped),
    fileSummaries,
    summary,
    reviewed: candidates.filter((f) => !failed.includes(f.path) && !skipped.some((s) => s.path === f.path)),
    skipped,
    failed,
    budgetHit,
    deadlineHit,
    unverified,
    funnel,
    timings,
  };
}

export function renderFunnel(f: Funnel): string {
  const parts = [`${f.raw} raw`, `${f.verified} verified`, `${f.anchored} anchored`, `${f.passing} passing`, `${f.capped} capped`];
  if (f.posted !== undefined) parts.push(`${f.posted} posted`);
  return parts.join(" → ");
}

export function renderTimings(t: Timings): string {
  const s = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
  const parts = [];
  if (t.index !== undefined) parts.push(`index ${s(t.index)}`);
  parts.push(`context ${s(t.context)}`, `review ${s(t.review)}`);
  if (t.verify) parts.push(`verify ${s(t.verify)}`);
  if (t.summary) parts.push(`summary ${s(t.summary)}`);
  return parts.join(" · ");
}

function normalizeFinding(rf: RawFinding, files: FileDiff[]): Finding | null {
  if (!rf || typeof rf.line !== "number" || !rf.title) return null;
  let path = rf.path;
  if (!path || !files.some((f) => f.path === path)) {
    if (files.length === 1) path = files[0].path;
    else {
      const m = files.find((f) => path && (f.path.endsWith(path) || path.endsWith(f.path)));
      if (!m) return null;
      path = m.path;
    }
  }
  const severity = (SEVERITY_ORDER as string[]).includes(String(rf.severity)) ? (rf.severity as Severity) : "medium";
  const title = String(rf.title).replace(/\s+/g, " ").trim().slice(0, 120);
  return {
    path,
    line: Math.round(rf.line),
    endLine: typeof rf.end_line === "number" && rf.end_line > rf.line ? Math.round(rf.end_line) : undefined,
    severity,
    category: String(rf.category ?? "bug"),
    title,
    body: String(rf.body ?? "").trim(),
    suggestion: typeof rf.suggestion === "string" && rf.suggestion.trim() ? rf.suggestion.replace(/\n+$/, "") : undefined,
    confidence: typeof rf.confidence === "number" ? Math.max(0, Math.min(1, rf.confidence)) : 0.7,
    fingerprint: fingerprint(path, title),
  };
}

/** Snap a finding to a line GitHub will accept; validate multi-line ranges and suggestions. */
function anchor(f: Finding, fd: FileDiff, cfg: Config): Finding | null {
  const lines = commentableLines(fd);
  let line = f.line;
  if (!lines.has(line)) {
    let best: number | null = null;
    for (const n of lines.keys()) {
      if (Math.abs(n - line) <= 3 && (best === null || Math.abs(n - line) < Math.abs(best - line))) best = n;
    }
    if (best === null) return null;
    line = best;
  }
  const hunk = lines.get(line)!;
  let endLine = f.endLine;
  let suggestion = cfg.review.suggestions ? f.suggestion : undefined;
  if (endLine !== undefined) {
    let ok = endLine > line && endLine - line <= 40;
    for (let n = line; ok && n <= endLine; n++) if (lines.get(n) !== hunk) ok = false;
    if (!ok) {
      endLine = undefined;
      suggestion = undefined; // range no longer matches what the suggestion replaces
    }
  }
  if (line !== f.line) suggestion = undefined;
  return { ...f, line, endLine, suggestion };
}

function dedupe(list: Finding[]): Finding[] {
  const out: Finding[] = [];
  for (const f of list) {
    const dup = out.findIndex(
      (o) =>
        o.path === f.path &&
        (o.fingerprint === f.fingerprint ||
          (Math.abs(o.line - f.line) <= 2 && similar(o.title, f.title))),
    );
    if (dup < 0) out.push(f);
    else if (severityRank(f.severity) > severityRank(out[dup].severity)) out[dup] = f;
  }
  return out;
}

export function similar(a: string, b: string): boolean {
  const ta = new Set(a.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const tb = new Set(b.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  if (!ta.size || !tb.size) return false;
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter++;
  return inter / Math.min(ta.size, tb.size) >= 0.6;
}

async function verifyFindings(
  llm: LLM,
  cfg: Config,
  raw: { finding: Finding; batch: number }[],
  prompts: string[],
): Promise<{ kept: { finding: Finding; batch: number }[]; unverified: number }> {
  const byBatch = new Map<number, { finding: Finding; batch: number; id: number }[]>();
  raw.forEach((r, id) => (byBatch.get(r.batch) ?? byBatch.set(r.batch, []).get(r.batch)!).push({ ...r, id }));
  const kept: { finding: Finding; batch: number }[] = [];
  let unverified = 0;
  let stopped: string | null = null; // deadline or budget: skip the remaining verify calls, keep findings as they are
  await mapLimit([...byBatch.entries()], cfg.limits.concurrency, async ([bi, items]) => {
    if (stopped) {
      unverified += items.length;
      kept.push(...items);
      return;
    }
    const list = items
      .map((r) => `${r.id}. [${r.finding.severity}] ${r.finding.path}:${r.finding.line} — ${r.finding.title}\n   ${r.finding.body.replace(/\n/g, "\n   ")}`)
      .join("\n");
    try {
      const res = await llm.chat({
        system: VERIFY_SYSTEM,
        user: `${prompts[bi]}\n\n## Findings to verify\n${list}`,
        json: true,
        maxTokens: 2000,
        label: `verify:${bi}`,
        model: cfg.verify_model,
      });
      const parsed = parseModelJson<{ keep?: { id: number; confidence?: number }[] }>(res.text);
      const keep = new Map((parsed.keep ?? []).map((k) => [k.id, k.confidence]));
      for (const r of items) {
        if (!keep.has(r.id)) continue;
        const c = keep.get(r.id);
        kept.push({ batch: r.batch, finding: { ...r.finding, confidence: typeof c === "number" ? c : r.finding.confidence } });
      }
    } catch (e) {
      if (e instanceof DeadlineExceededError || e instanceof BudgetExceededError) {
        stopped = e.message;
        unverified += items.length;
      }
      log.warn(`Verification failed for batch ${bi}, keeping its findings: ${(e as Error).message}`);
      kept.push(...items);
    }
  });
  if (stopped) log.warn(`Verification stopped early (${stopped}); ${unverified} finding(s) are posted unverified`);
  log.info(`Verification kept ${kept.length}/${raw.length} findings`);
  return { kept, unverified };
}

async function summarize(
  llm: LLM,
  cfg: Config,
  pr: PrMeta,
  files: FileDiff[],
  fileSummaries: Record<string, string>,
  findings: Finding[],
  commits: { sha: string; subject: string }[],
  deadline?: number,
): Promise<SummaryJson> {
  const fileLines = files
    .slice(0, 150)
    .map((f) => `- ${f.path} (${f.status}, +${f.additions}/-${f.deletions})${fileSummaries[f.path] ? `: ${fileSummaries[f.path]}` : ""}`)
    .join("\n");
  const findingLines = findings.length
    ? findings.map((f) => `- [${f.severity}] ${f.path}:${f.line} ${f.title}`).join("\n")
    : "(no issues found)";
  const user = `# ${pr.title}
${pr.body ? `\n## Description\n${pr.body.slice(0, 3000)}\n` : ""}
## Commits
${commits.slice(0, 40).map((c) => `- ${c.subject}`).join("\n") || "(n/a)"}

## Files
${fileLines}

## Issues found by the review
${findingLines}`;
  const res = await llm.chat({
    system: SUMMARY_SYSTEM(cfg),
    user: truncateTokens(user, 30_000),
    json: true,
    maxTokens: 3000,
    label: "summary",
    deadline,
  });
  const s = parseModelJson<Partial<SummaryJson>>(res.text);
  return {
    overview: String(s.overview ?? "").trim(),
    key_changes: Array.isArray(s.key_changes) ? s.key_changes.map(String).slice(0, 8) : [],
    confidence: Math.max(1, Math.min(5, Math.round(Number(s.confidence) || 3))),
    confidence_reason: String(s.confidence_reason ?? "").trim(),
    diagram: cfg.summary.diagram && typeof s.diagram === "string" && s.diagram.trim() ? s.diagram.trim().replace(/^```(?:mermaid)?\s*|```$/g, "").trim() : null,
  };
}
