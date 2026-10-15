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
 * timeout and the retry waits are capped so the call never outlives the run,
 * and anything cut short by the deadline is reported as DeadlineExceededError.
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
  const deadlineError = (cause: unknown, when: string) =>
    new DeadlineExceededError(`Run deadline reached ${when}${cause ? `: ${(cause as Error).message}` : ""}`, { cause });
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (remaining() <= 0) throw deadlineError(lastErr, lastErr ? "while retrying" : "before the request could start");
    // When the deadline is closer than the normal timeout, a timeout means the deadline, not the provider.
    const budget = Math.max(1000, Math.min(timeoutMs, remaining()));
    const cappedByDeadline = budget < timeoutMs;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(budget),
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
      if (wait > remaining()) throw deadlineError(err, "while retrying");
      log.warn(`LLM request got ${res.status}; retrying in ${Math.round(wait / 1000)}s (attempt ${attempt}/${attempts})`);
      await sleep(wait);
    } catch (e) {
      if (e instanceof DeadlineExceededError) throw e;
      if (e instanceof HttpError && !RETRYABLE.has(e.status)) throw e;
      if (remaining() <= 0 || (cappedByDeadline && (e as Error).name === "TimeoutError")) throw deadlineError(e, "during the request");
      if (attempt === attempts) throw e;
      lastErr = e;
      const wait = backoff(attempt);
      if (wait > remaining()) throw deadlineError(e, "while retrying");
      log.warn(`LLM request failed (${(e as Error).message}); retrying in ${Math.round(wait / 1000)}s`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

function backoff(attempt: number): number {
  return Math.min(60_000, 1000 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 500);
}
