import type { Severity } from "../config.js";
import type { FileDiff } from "../git/diff.js";
import type { Usage } from "../llm/types.js";
import type { Finding, ReviewOutput } from "./reviewer.js";

export const SUMMARY_MARKER = "<!-- takche:summary -->";
export const FP_MARKER = (fp: string) => `<!-- takche:fp=${fp} -->`;
export const FP_RE = /<!-- takche:fp=([a-f0-9]+) -->/;
const STATE_RE = /<!-- takche:state (.*?) -->/gs;

export interface ReviewState {
  lastSha?: string;
  files?: Record<string, string>;
  /** fingerprint -> severity for every issue reported on this PR so far */
  issues?: Record<string, Severity>;
  /** How many review runs have been posted on this PR. */
  reviews?: number;
}

/**
 * How severity badges are drawn. "image" uses a small colored badge (what GitHub
 * renders), "text" is a plain `[P1]` label for terminals and air-gapped setups.
 */
export type BadgeStyle = "image" | "text";

export interface RenderOptions {
  badges?: BadgeStyle;
}

let defaultBadges: BadgeStyle = "image";
/** Badge style used when a render call does not pass one (set from `review.badges`). */
export function setBadgeStyle(style: BadgeStyle) {
  defaultBadges = style;
}

/** Priority label per severity, Greptile-style: P0 is the most urgent. */
export const PRIORITY: Record<Severity, string> = {
  critical: "P0",
  high: "P1",
  medium: "P2",
  low: "P3",
  info: "P4",
};

const PRIORITY_COLOR: Record<Severity, string> = {
  critical: "d73a49",
  high: "e36209",
  medium: "dbab09",
  low: "0969da",
  info: "6e7781",
};

export function badge(sev: Severity, style: BadgeStyle = defaultBadges): string {
  const p = PRIORITY[sev];
  if (style === "text") return `**[${p}]**`;
  return `<img src="https://img.shields.io/badge/${p}-${PRIORITY_COLOR[sev]}?style=flat-square" alt="${p}" title="${p} · ${sev}" valign="middle">`;
}

const FIX_INSTRUCTION = "For each issue above, determine whether it is valid and should be fixed. If so, fix it directly.";

export function location(f: Pick<Finding, "path" | "line" | "endLine">): string {
  if (f.line <= 1 && !f.endLine) return f.path;
  return f.endLine && f.endLine > f.line ? `${f.path}:${f.line}-${f.endLine}` : `${f.path}:${f.line}`;
}

/** Wrap text in a code fence that is longer than any backtick run inside it. */
export function fence(text: string, lang = ""): string {
  const longest = Math.max(2, ...[...text.matchAll(/`+/g)].map((m) => m[0].length));
  const f = "`".repeat(longest + 1);
  return `${f}${lang}\n${text}\n${f}`;
}

/** The prompt a developer pastes into an AI agent to fix one inline comment. */
export function fixPrompt(f: Finding): string {
  const lines = [
    "This is a comment left during a code review.",
    `Path: ${f.path}`,
    `Line: ${f.endLine && f.endLine > f.line ? `${f.line}-${f.endLine}` : f.line}`,
    "",
    "Comment:",
    `**${escapeInline(f.title)}**`,
    "",
    f.body.trim(),
  ];
  if (f.suggestion !== undefined) lines.push("", "Suggested replacement for the lines above:", f.suggestion);
  lines.push("", "---", "", FIX_INSTRUCTION);
  return lines.join("\n");
}

/** One prompt covering every finding of a run, for the summary comment. */
export function fixAllPrompt(findings: Finding[]): string {
  const parts: string[] = [];
  findings.forEach((f, i) => {
    parts.push(`### Issue ${i + 1}`, location(f), `**${escapeInline(f.title)}**`, "", f.body.trim());
    if (f.suggestion !== undefined) parts.push("", "Suggested replacement:", f.suggestion);
    parts.push("");
  });
  parts.push("---", "", FIX_INSTRUCTION);
  return parts.join("\n");
}

export function renderInlineComment(f: Finding, opts: RenderOptions = {}): string {
  const parts = [`${badge(f.severity, opts.badges)} **${escapeInline(f.title)}**`, "", f.body.trim()];
  if (f.suggestion !== undefined) {
    parts.push("", "```suggestion", f.suggestion, "```");
  }
  parts.push("", "<details>", "<summary>Prompt To Fix With AI</summary>", "", fence(fixPrompt(f)), "", "</details>");
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
  /** Subject line of the head commit, shown in the footer. */
  headSubject?: string;
  incrementalFrom?: string;
  provider: string;
  model: string;
  usage: Usage;
  trigger: string;
  allFiles: FileDiff[];
  /** fingerprint -> URL of the inline comment, so the findings list can link to it. */
  commentUrls?: Record<string, string>;
  /** Name shown in the footer ("Reviewed by …"). */
  botName?: string;
  serverUrl?: string;
  repo?: string;
}

export function riskLabel(confidence: number): string {
  if (confidence >= 5) return "Low risk";
  if (confidence === 4) return "Low risk";
  if (confidence === 3) return "Medium risk";
  if (confidence === 2) return "High risk";
  return "Very high risk";
}

export function renderSummary(out: ReviewOutput, meta: SummaryMeta, state: ReviewState, opts: RenderOptions = {}): string {
  const L: string[] = [SUMMARY_MARKER];
  const s = out.summary;

  // ---- header: confidence + risk --------------------------------------------
  if (s) {
    L.push(`## Confidence Score: ${s.confidence}/5`, "");
    const overview = s.overview.trim();
    L.push(`**[${riskLabel(s.confidence)}]** ${overview}`, "");
    if (s.confidence_reason) L.push(s.confidence_reason.trim(), "");
    if (s.key_changes.length) {
      L.push("<details>", "<summary>Key changes</summary>", "");
      for (const k of s.key_changes) L.push(`- ${k}`);
      L.push("", "</details>", "");
    }
  } else {
    L.push("## Code review", "");
  }

  // ---- findings (this run) + cumulative counts ---------------------------------
  const issues: Record<string, Severity> = { ...(state.issues ?? {}) };
  const current = [...out.inline, ...out.outside].sort((a, b) => rank(b.severity) - rank(a.severity));
  const newCount = current.filter((f) => !issues[f.fingerprint]).length;
  for (const f of current) issues[f.fingerprint] = f.severity;

  L.push("## Findings", "");
  if (current.length) {
    current.forEach((f, i) => {
      const url = meta.commentUrls?.[f.fingerprint];
      const where = url ? ` [▶](${url})` : ` <sub>\`${location(f)}\`</sub>`;
      L.push(`${i + 1}. ${badge(f.severity, opts.badges)} **${escapeInline(f.title)}**${where}`);
    });
    L.push("");
    const counts = new Map<Severity, number>();
    for (const sev of Object.values(issues)) counts.set(sev, (counts.get(sev) ?? 0) + 1);
    const countText = (["critical", "high", "medium", "low", "info"] as Severity[])
      .filter((k) => counts.get(k))
      .map((k) => `${counts.get(k)} ${PRIORITY[k]}`)
      .join(" · ");
    const total = Object.keys(issues).length;
    if (meta.incrementalFrom && total > current.length) {
      L.push(`<sub>${newCount} new in this update · ${total} total on this PR (${countText})</sub>`, "");
    }
    L.push("<details>", "<summary>Fix with agent prompt</summary>", "", fence(fixAllPrompt(current), "markdown"), "", "</details>", "");
  } else {
    L.push("No issues found. 🎉", "");
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

  // ---- footer -------------------------------------------------------------
  const reviews = (state.reviews ?? 0) + 1;
  const range = meta.incrementalFrom
    ? `${meta.incrementalFrom.slice(0, 7)}…${meta.headSha.slice(0, 7)} (incremental)`
    : `${meta.baseSha.slice(0, 7)}…${meta.headSha.slice(0, 7)}`;
  const commit = meta.headSubject ? `"${truncate(escapeInline(meta.headSubject), 60)}"` : meta.headSha.slice(0, 7);
  const u = meta.usage;
  L.push(
    `<sub>Reviews (${reviews}) · Last reviewed commit: ${commit} · Reviewed by ${meta.botName ?? "Takche"}</sub>`,
    `<sub>${range} · ${meta.provider}/${meta.model} · ${u.calls} LLM call(s), ${fmtK(u.inputTokens)} in / ${fmtK(u.outputTokens)} out tokens · ` +
      `Ask a question with \`${meta.trigger} <question>\`, re-run with \`${meta.trigger} review\`.</sub>`,
  );
  // If anything wasn't reviewed, keep the old lastSha so the next run covers it again.
  const complete = !out.failed.length && !out.budgetHit;
  const lastSha = complete ? meta.headSha : state.lastSha;
  L.push(`<!-- takche:state ${encodeState({ lastSha, files: fileSummaries, issues, reviews })} -->`);
  return L.join("\n");
}

function rank(s: Severity): number {
  return ["info", "low", "medium", "high", "critical"].indexOf(s);
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function fmtK(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n);
}

/** Plain markdown report for local CLI runs. */
export function renderLocalReport(out: ReviewOutput, meta: SummaryMeta): string {
  const opts: RenderOptions = { badges: "text" };
  const summary = renderSummary(out, meta, {}, opts)
    .split("\n")
    .filter((l) => !l.startsWith("<!--"))
    .join("\n");
  const L = [summary, "", "---", "", `## Inline comments (${out.inline.length})`, ""];
  for (const f of out.inline) {
    L.push(`### ${location(f)}`, renderInlineComment(f, opts).replace(FP_RE, "").trim(), "");
  }
  return L.join("\n");
}
