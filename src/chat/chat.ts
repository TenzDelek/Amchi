import type { CodeGraph } from "../graph/indexer.js";
import type { Searcher } from "../graph/search.js";
import { renderDiffForModel, type FileDiff } from "../git/diff.js";
import type { LLM } from "../llm/types.js";
import { CHAT_SYSTEM } from "../review/prompts.js";
import { estimateTokens, lineSlice, numberLines, truncateTokens } from "../util/text.js";

export interface ChatInput {
  question: string;
  graph: CodeGraph;
  searcher: Searcher;
  llm: LLM;
  /** PR context, when asked inside a PR. */
  pr?: { title: string; body: string; files: FileDiff[] };
  /** Inline review thread the question was asked in. */
  thread?: { path: string; line?: number; diffHunk?: string; history?: string[] };
  /** Build links to files, e.g. https://github.com/o/r/blob/<sha> */
  blobBase?: string;
  maxContextTokens?: number;
}

export async function answerQuestion(input: ChatInput): Promise<string> {
  const { graph, searcher, question } = input;
  const budget = input.maxContextTokens ?? 40_000;
  const parts: string[] = [];
  const cited: { path: string; start: number; end: number }[] = [];
  let used = 0;

  const add = (title: string, body: string) => {
    const text = `### ${title}\n${body}`;
    const t = estimateTokens(text);
    if (used + t > budget) return false;
    parts.push(text);
    used += t;
    return true;
  };
  const addCode = (title: string, path: string, start: number, end: number) => {
    const content = graph.read(path);
    if (content == null) return;
    const e = Math.min(end, start + 120);
    if (add(title, `\`${path}:${start}-${e}\`\n\`\`\`\n${numberLines(lineSlice(content, start, e), start)}\n\`\`\``)) {
      cited.push({ path, start, end: e });
    }
  };

  if (input.thread) {
    const { path, line, diffHunk, history } = input.thread;
    if (history?.length) add("Conversation so far", history.join("\n\n"));
    if (diffHunk) add(`Diff hunk the question refers to (${path})`, `\`\`\`diff\n${diffHunk}\n\`\`\``);
    if (line) {
      const syms = graph.symbolsOverlapping(path, line, line);
      const inner = syms[syms.length - 1];
      if (inner && inner.end - inner.start < 200) addCode(`Enclosing ${inner.kind} \`${inner.name}\``, path, inner.start, inner.end);
      else addCode(`Code around ${path}:${line}`, path, Math.max(1, line - 25), line + 25);
    }
  }

  // Named identifiers in the question -> exact definitions.
  const idents = new Set<string>([
    ...[...question.matchAll(/`([^`]+)`/g)].map((m) => m[1].replace(/\(.*$/, "").split(/[.:/]/).pop()!),
    ...(question.match(/\b[A-Za-z_][A-Za-z0-9_]*(?:[A-Z][a-z0-9]+|_[a-z0-9]+)+\b/g) ?? []),
  ]);
  for (const name of [...idents].slice(0, 6)) {
    const defs = graph.definitionsOf(name).slice(0, 2);
    for (const d of defs) addCode(`Definition of \`${name}\``, d.path, d.symbol.start, d.symbol.end);
    const callers = graph.callersOf(name).slice(0, 5);
    if (callers.length) {
      add(
        `Callers of \`${name}\``,
        callers.map((c) => `- \`${c.path}:${c.symbol.start}\` in \`${c.symbol.name}\``).join("\n"),
      );
    }
  }

  // Semantic / keyword search.
  const hits = await searcher.search(question, 10);
  for (const h of hits) {
    if (cited.some((c) => c.path === h.chunk.path && c.start <= h.chunk.start && c.end >= h.chunk.end)) continue;
    addCode(`Relevant code${h.chunk.name ? `: ${h.chunk.kind} \`${h.chunk.name}\`` : ""}`, h.chunk.path, h.chunk.start, h.chunk.end);
  }

  if (input.pr) {
    const diff = input.pr.files.map((f) => `--- ${f.path} (${f.status})\n${renderDiffForModel(f)}`).join("\n\n");
    const remaining = Math.max(2000, budget - used);
    parts.unshift(
      `### Pull request: ${input.pr.title}\n${input.pr.body?.slice(0, 1500) ?? ""}\n\n#### PR diff\n\`\`\`diff\n${truncateTokens(diff, Math.min(remaining, 20_000))}\n\`\`\``,
    );
  }

  const res = await input.llm.chat({
    system: CHAT_SYSTEM,
    user: `${parts.join("\n\n")}\n\n---\n\n## Question\n${question}`,
    maxTokens: 3000,
    label: "chat",
  });

  let answer = res.text.trim();
  if (cited.length) {
    const links = cited.slice(0, 8).map((c) => {
      const label = `${c.path}:${c.start}-${c.end}`;
      return input.blobBase ? `[\`${label}\`](${input.blobBase}/${encodePath(c.path)}#L${c.start}-L${c.end})` : `\`${label}\``;
    });
    answer += `\n\n<details><summary>Context used</summary>\n\n${links.map((l) => `- ${l}`).join("\n")}\n\n</details>`;
  }
  return answer;
}

function encodePath(p: string) {
  return p.split("/").map(encodeURIComponent).join("/");
}
