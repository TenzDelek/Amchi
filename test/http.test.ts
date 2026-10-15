import { afterEach, describe, expect, it, vi } from "vitest";
import { postJson } from "../src/llm/http.js";
import { DeadlineExceededError } from "../src/llm/types.js";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function hangingFetch() {
  return vi.fn(
    (_url: string, init: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init.signal!.addEventListener("abort", () => reject(init.signal!.reason));
      }),
  );
}

describe("postJson deadline", () => {
  it("aborts an in-flight request at the deadline and reports DeadlineExceededError", async () => {
    const f = hangingFetch();
    globalThis.fetch = f as unknown as typeof fetch;
    const t0 = Date.now();
    await expect(postJson("http://x", {}, {}, { deadline: Date.now() + 1200 })).rejects.toBeInstanceOf(DeadlineExceededError);
    expect(Date.now() - t0).toBeLessThan(3000);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("reports a deadline-truncated timeout on the last attempt as DeadlineExceededError too", async () => {
    const f = hangingFetch();
    globalThis.fetch = f as unknown as typeof fetch;
    const err = await postJson("http://x", {}, {}, { deadline: Date.now() + 1200, attempts: 1 }).catch((e) => e);
    expect(err).toBeInstanceOf(DeadlineExceededError);
    expect((err as Error).cause).toBeDefined();
  });

  it("keeps a provider timeout as a plain error when the deadline is far away", async () => {
    const f = hangingFetch();
    globalThis.fetch = f as unknown as typeof fetch;
    const err = await postJson("http://x", {}, {}, { deadline: Date.now() + 60_000, timeoutMs: 1000, attempts: 1 }).catch((e) => e);
    expect(err).not.toBeInstanceOf(DeadlineExceededError);
    expect((err as Error).name).toBe("TimeoutError");
  });

  it("retryable 429 then deadline: throws DeadlineExceededError when the wait exceeds remaining", async () => {
    const f = vi.fn(async () => new Response("rate limited", { status: 429, headers: { "retry-after": "5" } }));
    globalThis.fetch = f as unknown as typeof fetch;
    await expect(postJson("http://x", {}, {}, { deadline: Date.now() + 2000 })).rejects.toBeInstanceOf(DeadlineExceededError);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("retryable 429 whose wait lands exactly on the deadline still reports the deadline, with the 429 as cause", async () => {
    const f = vi.fn(async () => new Response("rate limited", { status: 429, headers: { "retry-after": "1" } }));
    globalThis.fetch = f as unknown as typeof fetch;
    const err = await postJson("http://x", {}, {}, { deadline: Date.now() + 1001 }).catch((e) => e);
    expect(err).toBeInstanceOf(DeadlineExceededError);
    expect(((err as Error).cause as Error).name).toBe("HttpError");
  });

  it("without a deadline a 429 is retried", async () => {
    let n = 0;
    const f = vi.fn(async () => (n++ === 0 ? new Response("slow down", { status: 429, headers: { "retry-after": "1" } }) : new Response('{"ok":1}', { status: 200 })));
    globalThis.fetch = f as unknown as typeof fetch;
    await expect(postJson("http://x", {}, {})).resolves.toEqual({ ok: 1 });
    expect(f).toHaveBeenCalledTimes(2);
  });
});
