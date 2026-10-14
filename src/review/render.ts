import type { Severity } from "../config.js";
import type { FileDiff } from "../git/diff.js";
import type { Usage } from "../llm/types.js";
import type { Finding, ReviewOutput } from "./reviewer.js";

export const SUMMARY_MARKER = "<!-- codegraph:summary -->";
export const FP_MARKER = (fp: string) => `<!-- codegraph:fp=${fp} -->`;
export const FP_RE = /<!-- codegraph:fp=([a-f0-9]+) -->/;
const STATE_RE = /<!-- codegraph:state (.*?) -->/gs;

export interface ReviewState {
  lastSha?: string;
  files?: Record<string, string>;
  /** fingerprint -> severity for every issue reported on this PR so far */
  issues?: Record<string, Severity>;
}

const SEV_ICON: Record<Severity, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🔵",
  info: "⚪",
};

export function renderInlineComment(f: Finding): string {
  const parts = [`${SEV_ICON[f.severity]} **${escapeInline(f.title)}** · \`${f.severity}\` · ${f.category}`, "", f.body.trim()];
  if (f.suggestion !== undefined) {
    parts.push("", "```suggestion", f.suggestion, "```");
  }
  parts.push("", FP_MARKER(f.fingerprint));
  return parts.join("\n");
}

export function parseState(body: string): ReviewState {
  // The state block is always last; earlier matches could come from model text.
  const all = [...body.matchAll(STATE_RE)];
  const m = all[all.length - 1];
  if (!m) return {};
  try {
    return JSON.parse(m[1].replace(/&#45;&#45;/g, "--")) as ReviewState;
  } catch {
    return {};
  }
}

function encodeState(s: ReviewState): string {
  // Cap size: GitHub comments max out at 65,536 chars.
  const files: Record<string, string> = {};
  let size = 0;
  for (const [k, v] of Object.entries(s.files ?? {})) {
    const add = k.length + v.length + 8;
    if (size + add > 20_000) break;
    files[k] = v.slice(0, 300);
    size += add;
  }
  const issues = Object.fromEntries(Object.entries(s.issues ?? {}).slice(-500));
  return JSON.stringify({ ...s, files, issues }).replace(/--/g, "&#45;&#45;");
}

function escapeInline(s: string) {
  return s.replace(/\r?\n/g, " ");
}

function cell(s: string) {
  return s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export interface SummaryMeta {
  baseSha: string;
  headSha: string;
  incrementalFrom?: string;
  provider: string;
  model: string;
  usage: Usage;
  trigger: string;
  allFiles: FileDiff[];
  serverUrl?: string;
  repo?: string;
}

export function renderSummary(out: ReviewOutput, meta: SummaryMeta, state: ReviewState): string {
  const L: string[] = [SUMMARY_MARKER, "## 🔍 Code review summary", ""];
  const s = out.summary;
  if (s) {
    if (s.overview) L.push(s.overview, "");
    if (s.key_changes.length) {
      L.push("**Key changes**");
      for (const k of s.key_changes) L.push(`- ${k}`);
      L.push("");
    }
  }

  // Confidence + counts (cumulative across incremental runs)
  const issues: Record<string, Severity> = { ...(state.issues ?? {}) };
  const current = [...out.inline, ...out.outside];
  const newCount = current.filter((f) => !issues[f.fingerprint]).length;
  for (const f of current) issues[f.fingerprint] = f.severity;
  const counts = new Map<Severity, number>();
  for (const sev of Object.values(issues)) counts.set(sev, (counts.get(sev) ?? 0) + 1);
  const countText = (["critical", "high", "medium", "low", "info"] as Severity[])
    .filter((k) => counts.get(k))
    .map((k) => `${SEV_ICON[k]} ${counts.get(k)} ${k}`)
    .join(" · ");
  if (s) {
    const bar = "●".repeat(s.confidence) + "○".repeat(5 - s.confidence);
    L.push(`**Confidence score: ${s.confidence}/5** \`${bar}\`${s.confidence_reason ? ` — ${s.confidence_reason}` : ""}`, "");
  }
  const total = Object.keys(issues).length;
  L.push(
    total
      ? `**Issues found:** ${countText}${meta.incrementalFrom ? ` (${newCount} new in this update)` : out.inline.length ? ` (${out.inline.length} posted inline)` : ""}`
      : "**Issues found:** none 🎉",
    "",
  );

  if (out.outside.length) {
    L.push("### Notes outside the diff");
    for (const f of out.outside) {
      L.push(`- ${SEV_ICON[f.severity]} **${escapeInline(f.title)}** (\`${f.path}${f.line > 1 ? `:${f.line}` : ""}\`) — ${f.body.split("\n")[0]}`);
    }
    L.push("");
  }

  if (s?.diagram) {
    L.push("<details><summary>📊 Sequence diagram</summary>", "", "```mermaid", s.diagram, "```", "", "</details>", "");
  }

  const fileSummaries = { ...(state.files ?? {}), ...out.fileSummaries };
  const files = meta.allFiles;
  if (files.length) {
    L.push(`<details><summary>📂 Files changed (${files.length})</summary>`, "", "| File | Changes | Summary |", "| --- | --- | --- |");
    for (const f of files.slice(0, 120)) {
      const skip = out.skipped.find((x) => x.path === f.path);
      const sum = fileSummaries[f.path] ?? (skip ? `_skipped: ${skip.reason}_` : f.status === "deleted" ? "_deleted_" : "");
      L.push(`| \`${cell(f.path)}\` | +${f.additions} / -${f.deletions} | ${cell(sum)} |`);
    }
    if (files.length > 120) L.push(`| … | | ${files.length - 120} more files |`);
    L.push("", "</details>", "");
  }

  const notes: string[] = [];
  if (out.failed.length) notes.push(`⚠️ Review failed for ${out.failed.length} file(s): ${out.failed.map((p) => `\`${p}\``).join(", ")}`);
  if (out.budgetHit) notes.push("⚠️ Token budget reached — some files were not reviewed (raise `limits.max_total_input_tokens`).");
  const limitSkipped = out.skipped.filter((x) => x.reason === "max_files limit");
  if (limitSkipped.length) notes.push(`ℹ️ ${limitSkipped.length} file(s) skipped by \`review.max_files\`.`);
  if (out.dropped > 0) notes.push(`ℹ️ ${out.dropped} lower-priority finding(s) not posted (thresholds / \`max_comments\`).`);
  if (notes.length) L.push(...notes.map((n) => `${n}  `), "");

  const range = meta.incrementalFrom
    ? `${meta.incrementalFrom.slice(0, 7)}…${meta.headSha.slice(0, 7)} (incremental)`
    : `${meta.baseSha.slice(0, 7)}…${meta.headSha.slice(0, 7)}`;
  const u = meta.usage;
  L.push(
    `<sub>Reviewed ${range} · ${meta.provider}/${meta.model} · ${u.calls} LLM call(s), ${fmtK(u.inputTokens)} in / ${fmtK(u.outputTokens)} out tokens · ` +
      `Ask a question with \`${meta.trigger} <question>\`, re-run with \`${meta.trigger} review\`.</sub>`,
  );
  // If anything wasn't reviewed, keep the old lastSha so the next run covers it again.
  const complete = !out.failed.length && !out.budgetHit;
  const lastSha = complete ? meta.headSha : state.lastSha;
  L.push(`<!-- codegraph:state ${encodeState({ lastSha, files: fileSummaries, issues })} -->`);
  return L.join("\n");
}

function fmtK(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n);
}

/** Plain markdown report for local CLI runs. */
export function renderLocalReport(out: ReviewOutput, meta: SummaryMeta): string {
  const summary = renderSummary(out, meta, {})
    .split("\n")
    .filter((l) => !l.startsWith("<!--"))
    .join("\n");
  const L = [summary, "", "---", "", `## Inline comments (${out.inline.length})`, ""];
  for (const f of out.inline) {
    const loc = f.endLine ? `${f.path}:${f.line}-${f.endLine}` : `${f.path}:${f.line}`;
    L.push(`### ${loc}`, renderInlineComment(f).replace(FP_RE, "").trim(), "");
  }
  return L.join("\n");
}
