import { log } from "../util/log.js";
import { sleep } from "../util/text.js";
import { DeadlineExceededError } from "./types.js";

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
 * Honours Retry-After when present. With `deadline` (epoch ms), the request
 * timeout and the retry waits are capped so the call never outlives the run.
 */
export async function postJson<T = unknown>(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  opts: { attempts?: number; timeoutMs?: number; deadline?: number } = {},
): Promise<T> {
  const attempts = opts.attempts ?? 6;
  const timeoutMs = opts.timeoutMs ?? 240_000;
  const remaining = () => (opts.deadline ? opts.deadline - Date.now() : Infinity);
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (remaining() <= 0) {
      throw lastErr ?? new DeadlineExceededError("Run deadline reached before the request could start");
    }
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Math.max(1000, Math.min(timeoutMs, remaining()))),
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
      if (wait > remaining()) throw new DeadlineExceededError(`Run deadline reached while retrying: ${err.message}`);
      log.warn(`LLM request got ${res.status}; retrying in ${Math.round(wait / 1000)}s (attempt ${attempt}/${attempts})`);
      await sleep(wait);
    } catch (e) {
      if (e instanceof DeadlineExceededError) throw e;
      if (e instanceof HttpError && !RETRYABLE.has(e.status)) throw e;
      if (attempt === attempts) throw e;
      lastErr = e;
      const wait = backoff(attempt);
      if (wait > remaining()) throw new DeadlineExceededError(`Run deadline reached while retrying: ${(e as Error).message}`);
      log.warn(`LLM request failed (${(e as Error).message}); retrying in ${Math.round(wait / 1000)}s`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

function backoff(attempt: number): number {
  return Math.min(60_000, 1000 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 500);
}
