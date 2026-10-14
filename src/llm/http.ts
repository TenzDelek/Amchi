import { log } from "../util/log.js";
import { sleep } from "../util/text.js";

export class HttpError extends Error {
  constructor(
    public status: number,
    public body: string,
    url: string,
  ) {
    super(`HTTP ${status} from ${redact(url)}: ${body.slice(0, 500)}`);
    this.name = "HttpError";
  }
}

function redact(url: string): string {
  return url.replace(/([?&]key=)[^&]+/, "$1***");
}

const RETRYABLE = new Set([408, 409, 425, 429, 500, 502, 503, 504, 529]);

/**
 * POST JSON with retries on rate limits / transient errors.
 * Honours Retry-After when present.
 */
export async function postJson<T = unknown>(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  opts: { attempts?: number; timeoutMs?: number } = {},
): Promise<T> {
  const attempts = opts.attempts ?? 6;
  const timeoutMs = opts.timeoutMs ?? 240_000;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const text = await res.text();
      if (res.ok) return JSON.parse(text) as T;
      const err = new HttpError(res.status, text, url);
      if (!RETRYABLE.has(res.status) || attempt === attempts) throw err;
      lastErr = err;
      const retryAfter = Number(res.headers.get("retry-after"));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 60_000)
        : backoff(attempt);
      log.warn(`LLM request got ${res.status}; retrying in ${Math.round(wait / 1000)}s (attempt ${attempt}/${attempts})`);
      await sleep(wait);
    } catch (e) {
      if (e instanceof HttpError && !RETRYABLE.has(e.status)) throw e;
      if (attempt === attempts) throw e;
      lastErr = e;
      const wait = backoff(attempt);
      log.warn(`LLM request failed (${(e as Error).message}); retrying in ${Math.round(wait / 1000)}s`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

function backoff(attempt: number): number {
  return Math.min(60_000, 1000 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 500);
}
