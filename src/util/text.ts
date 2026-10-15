import { createHash } from "node:crypto";

export function sha1(s: string): string {
  return createHash("sha1").update(s).digest("hex");
}

export function shortHash(s: string, n = 12): string {
  return sha1(s).slice(0, n);
}

/** Rough chars-per-token ratio for code. The single source for every token estimate in the pipeline. */
export const CHARS_PER_TOKEN = 4;

/** Rough token estimate. Good enough for budgeting. */
export function estimateTokens(s: string): number {
  return Math.ceil(s.length / CHARS_PER_TOKEN);
}

/** Truncate a string to roughly `maxTokens`, keeping head and tail. */
export function truncateTokens(s: string, maxTokens: number): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (s.length <= maxChars) return s;
  const head = Math.floor(maxChars * 0.7);
  const tail = maxChars - head;
  return `${s.slice(0, head)}\n… [truncated ${s.length - maxChars} chars] …\n${s.slice(s.length - tail)}`;
}

/** Split identifiers into lowercase search terms: getUserById -> get user by id getuserbyid */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  const words = text.match(/[A-Za-z_][A-Za-z0-9_]*|\d+/g) ?? [];
  for (const w of words) {
    const lower = w.toLowerCase();
    if (lower.length < 2 || STOP.has(lower)) continue;
    out.push(lower);
    const parts = w
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
      .split(/[\s_]+/)
      .map((p) => p.toLowerCase())
      .filter((p) => p.length >= 2 && !STOP.has(p));
    if (parts.length > 1) out.push(...parts);
  }
  return out;
}

const STOP = new Set([
  "the", "and", "for", "with", "this", "that", "from", "return", "const", "let", "var",
  "if", "else", "in", "of", "to", "is", "be", "it", "as", "at", "on", "or", "an", "def",
  "function", "import", "export", "new", "self", "true", "false", "null", "none", "nil",
  "public", "private", "static", "void", "int", "string", "async", "await", "fn", "func",
]);

/** Prefix each line with its line number, starting at `start`. */
export function numberLines(content: string, start = 1): string {
  return content
    .split("\n")
    .map((l, i) => `${String(start + i).padStart(5)} | ${l}`)
    .join("\n");
}

export function lineSlice(content: string, startLine: number, endLine: number): string {
  const lines = content.split("\n");
  return lines.slice(Math.max(0, startLine - 1), Math.min(lines.length, endLine)).join("\n");
}

export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
