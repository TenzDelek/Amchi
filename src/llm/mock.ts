/**
 * Deterministic offline provider used by tests and `--provider mock` dry runs.
 * It "reviews" by pattern-matching added lines, which exercises the whole
 * pipeline (prompting, JSON parsing, anchoring, posting) without an API key.
 */
import type { ChatRequest, ChatResult, Embedder, LLM } from "./types.js";
import { estimateTokens, tokenize } from "../util/text.js";

const PATTERNS: { re: RegExp; severity: string; category: string; title: string; body: string; fix?: (s: string) => string }[] = [
  {
    re: /\beval\s*\(/,
    severity: "critical",
    category: "security",
    title: "eval() on dynamic input allows code injection",
    body: "Evaluating strings at runtime lets attacker-controlled input execute arbitrary code. Parse the data instead.",
  },
  {
    re: /(password|secret|api_?key)\s*[:=]\s*["'][^"']+["']/i,
    severity: "critical",
    category: "security",
    title: "Hard-coded credential",
    body: "Secrets committed to source control are exposed to anyone with repo access. Load it from the environment.",
  },
  {
    re: /[^=!]==\s*null|[^=!]!=\s*null/,
    severity: "medium",
    category: "bug",
    title: "Loose null comparison",
    body: "`== null` also matches `undefined`; use a strict comparison if that is not intended.",
    fix: (s) => s.replace(/([^=!])==(\s*null)/, "$1===$2").replace(/([^=!])!=(\s*null)/, "$1!==$2"),
  },
  {
    re: /console\.log\(/,
    severity: "low",
    category: "maintainability",
    title: "Debug logging left in code",
    body: "This `console.log` looks like leftover debugging output.",
  },
];

export class MockChat implements LLM {
  readonly provider = "mock";
  readonly model = "mock";

  async chat(req: ChatRequest): Promise<ChatResult> {
    const label = req.label ?? "";
    let text: string;
    if (label.startsWith("review:")) text = JSON.stringify(this.review(req.user));
    else if (label.startsWith("verify:")) {
      const ids = [...req.user.matchAll(/^(\d+)\. \[/gm)].map((m) => ({ id: Number(m[1]), confidence: 0.9 }));
      text = JSON.stringify({ keep: ids });
    } else if (label === "summary") {
      const files = (req.user.match(/^- .+? \(/gm) ?? []).length;
      text = JSON.stringify({
        overview: `Mock overview of a PR touching ${files} file(s).`,
        key_changes: ["Mock key change one", "Mock key change two"],
        confidence: /\[critical\]|\[high\]/.test(req.user) ? 2 : 4,
        confidence_reason: "Mock reasoning based on the issues found.",
        diagram: "sequenceDiagram\n  participant A\n  participant B\n  A->>B: call",
      });
    } else {
      const sections = (req.user.match(/^### /gm) ?? []).length;
      text = `Mock answer using ${sections} context section(s).`;
    }
    return { text, inputTokens: estimateTokens(req.system) + estimateTokens(req.user), outputTokens: estimateTokens(text) };
  }

  private review(prompt: string) {
    const files: { path: string; summary: string }[] = [];
    const findings: unknown[] = [];
    const sections = prompt.split(/^=+ FILE: /m).slice(1);
    for (const sec of sections) {
      const path = sec.slice(0, sec.indexOf(" ("));
      files.push({ path, summary: `Mock summary of changes in ${path}.` });
      const diff = sec.split("## Repository context")[0];
      for (const m of diff.matchAll(/^L(\d+) \+ (.*)$/gm)) {
        const line = Number(m[1]);
        for (const p of PATTERNS) {
          if (p.re.test(m[2])) {
            findings.push({
              path,
              line,
              end_line: null,
              severity: p.severity,
              category: p.category,
              title: p.title,
              body: p.body,
              suggestion: p.fix ? p.fix(m[2]) : null,
              confidence: 0.85,
            });
            break;
          }
        }
      }
    }
    return { files, findings };
  }
}

/** Hashing bag-of-words embedder (64 dims) — crude but deterministic. */
export class MockEmbedder implements Embedder {
  readonly provider = "mock";
  readonly model = "mock-embed";
  readonly batchSize = 256;
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((t) => {
      const v: number[] = Array.from({ length: 64 }, () => 0);
      for (const tok of tokenize(t)) {
        let h = 2166136261;
        for (let i = 0; i < tok.length; i++) h = Math.imul(h ^ tok.charCodeAt(i), 16777619);
        v[Math.abs(h) % 64] += 1;
      }
      return v;
    });
  }
}
