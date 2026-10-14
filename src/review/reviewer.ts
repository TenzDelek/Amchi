import { isReviewable, rulesForPath, severityRank, SEVERITY_ORDER, type Config, type Rule, type Severity } from "../config.js";
import type { CodeGraph } from "../graph/indexer.js";
import type { Searcher } from "../graph/search.js";
import { commentableLines, renderDiffForModel, type FileDiff } from "../git/diff.js";
import { parseModelJson } from "../llm/json.js";
import { BudgetExceededError, type LLM } from "../llm/types.js";
import { log } from "../util/log.js";
import { estimateTokens, mapLimit, shortHash, truncateTokens } from "../util/text.js";
import { buildFileContext } from "./context.js";
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

interface Batch {
  files: FileDiff[];
  diffs: Map<string, string>;
  diffTokens: number;
}

export async function reviewPullRequest(input: ReviewInput): Promise<ReviewOutput> {
  const { cfg, graph, searcher, llm, pr } = input;
  const skipped: { path: string; reason: string }[] = [];
  const failed: string[] = [];
  let budgetHit = false;
  const prPaths = new Set(input.files.map((f) => f.path));

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
  for (const f of (input.allFiles ?? input.files).filter((x) => x.status === "deleted" || (x.status === "renamed" && x.oldPath))) {
    const gone = f.status === "deleted" ? f.path : f.oldPath!;
    if (graph.file(gone)) continue; // still exists
    const importers = graph.importersOfMissing(gone);
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
  const batches: Batch[] = [];
  let cur: Batch = { files: [], diffs: new Map(), diffTokens: 0 };
  for (const f of candidates) {
    let d = renderDiffForModel(f);
    let t = estimateTokens(d);
    if (t > maxDiffPerBatch) {
      d = truncateTokens(d, maxDiffPerBatch);
      t = maxDiffPerBatch;
      log.warn(`Diff for ${f.path} is very large; reviewing a truncated version`);
    }
    if (cur.files.length && (cur.diffTokens + t > maxDiffPerBatch || cur.files.length >= 5)) {
      batches.push(cur);
      cur = { files: [], diffs: new Map(), diffTokens: 0 };
    }
    cur.files.push(f);
    cur.diffs.set(f.path, d);
    cur.diffTokens += t;
  }
  if (cur.files.length) batches.push(cur);
  log.info(`Reviewing ${candidates.length} file(s) in ${batches.length} LLM call(s)`);

  // ---- 3. review each batch -------------------------------------------------
  const fileSummaries: Record<string, string> = { ...(input.previousFileSummaries ?? {}) };
  const raw: { finding: Finding; batch: number }[] = [];
  const batchPrompts: string[] = [];

  await mapLimit(batches, cfg.limits.concurrency, async (batch, bi) => {
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
      try {
        ctx = await buildFileContext(f, graph, searcher, ctxBudget, prPaths);
      } catch (e) {
        log.warn(`Context retrieval failed for ${f.path}: ${(e as Error).message}`);
      }
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
      } else {
        failed.push(...batch.files.map((f) => f.path));
        log.warn(`Review call failed for ${batch.files.map((f) => f.path).join(", ")}: ${(e as Error).message}`);
      }
    }
  });

  // ---- 4. optional verification pass ----------------------------------------
  let findings = raw;
  if (input.verify && raw.length) {
    findings = await verifyFindings(llm, cfg, raw, batchPrompts);
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
    try {
      summary = await summarize(llm, cfg, pr, input.allFiles ?? input.files, fileSummaries, inline.concat(outsideKept), input.commits ?? []);
    } catch (e) {
      if (e instanceof BudgetExceededError) budgetHit = true;
      log.warn(`Summary generation failed: ${(e as Error).message}`);
    }
  }

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
  };
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
): Promise<{ finding: Finding; batch: number }[]> {
  const byBatch = new Map<number, { finding: Finding; batch: number; id: number }[]>();
  raw.forEach((r, id) => (byBatch.get(r.batch) ?? byBatch.set(r.batch, []).get(r.batch)!).push({ ...r, id }));
  const kept: { finding: Finding; batch: number }[] = [];
  await mapLimit([...byBatch.entries()], cfg.limits.concurrency, async ([bi, items]) => {
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
      });
      const parsed = parseModelJson<{ keep?: { id: number; confidence?: number }[] }>(res.text);
      const keep = new Map((parsed.keep ?? []).map((k) => [k.id, k.confidence]));
      for (const r of items) {
        if (!keep.has(r.id)) continue;
        const c = keep.get(r.id);
        kept.push({ batch: r.batch, finding: { ...r.finding, confidence: typeof c === "number" ? c : r.finding.confidence } });
      }
    } catch (e) {
      log.warn(`Verification failed for batch ${bi}, keeping its findings: ${(e as Error).message}`);
      kept.push(...items);
    }
  });
  log.info(`Verification kept ${kept.length}/${raw.length} findings`);
  return kept;
}

async function summarize(
  llm: LLM,
  cfg: Config,
  pr: PrMeta,
  files: FileDiff[],
  fileSummaries: Record<string, string>,
  findings: Finding[],
  commits: { sha: string; subject: string }[],
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
