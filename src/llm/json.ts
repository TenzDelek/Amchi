/**
 * Extract and parse the first JSON object/array from a model response.
 * Tolerates ```json fences, leading prose, and trailing commas.
 */
export function parseModelJson<T = unknown>(text: string): T {
  const candidates: string[] = [];
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) candidates.push(fence[1]);
  const balanced = extractBalanced(text);
  if (balanced) candidates.push(balanced);
  candidates.push(text);

  let lastErr: unknown;
  for (const c of candidates) {
    for (const variant of [c, repair(c)]) {
      try {
        return JSON.parse(variant.trim()) as T;
      } catch (e) {
        lastErr = e;
      }
    }
  }
  throw new Error(`Model did not return valid JSON: ${(lastErr as Error)?.message}. Got: ${text.slice(0, 300)}`);
}

function extractBalanced(text: string): string | null {
  const start = text.search(/[{[]/);
  if (start < 0) return null;
  const open = text[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function repair(s: string): string {
  return s.replace(/,\s*([}\]])/g, "$1");
}
