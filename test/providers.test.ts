import { afterEach, describe, expect, it, vi } from "vitest";
import { AnthropicChat, GeminiChat, GeminiEmbedder, OpenAIChat, OpenAIEmbedder } from "../src/llm/providers.js";
import { createLLM, createEmbedder } from "../src/llm/index.js";
import { loadConfig } from "../src/config.js";

type Call = { url: string; headers: Record<string, string>; body: any };

function mockFetch(responses: { status?: number; json: unknown; headers?: Record<string, string> }[]) {
  const calls: Call[] = [];
  let i = 0;
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    calls.push({ url, headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
    const r = responses[Math.min(i++, responses.length - 1)];
    return new Response(JSON.stringify(r.json), { status: r.status ?? 200, headers: r.headers });
  });
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe("providers", () => {
  it("OpenAI chat: request shape and usage", async () => {
    const calls = mockFetch([
      { json: { choices: [{ message: { content: '{"ok":true}' }, finish_reason: "stop" }], usage: { prompt_tokens: 11, completion_tokens: 3 } } },
    ]);
    const r = await new OpenAIChat("sk-x", "gpt-5.5").chat({ system: "S", user: "U", json: true, maxTokens: 100 });
    expect(r).toEqual({ text: '{"ok":true}', inputTokens: 11, outputTokens: 3 });
    expect(calls[0].url).toBe("https://api.openai.com/v1/chat/completions");
    expect(calls[0].headers.authorization).toBe("Bearer sk-x");
    expect(calls[0].body).toMatchObject({
      model: "gpt-5.5",
      messages: [{ role: "system", content: "S" }, { role: "user", content: "U" }],
      response_format: { type: "json_object" },
      max_completion_tokens: 300,
    });
  });

  it("OpenAI-compatible endpoints use max_tokens", async () => {
    const calls = mockFetch([{ json: { choices: [{ message: { content: "hi" } }] } }]);
    await new OpenAIChat("k", "llama3", "http://localhost:11434/v1/").chat({ system: "S", user: "U", maxTokens: 50 });
    expect(calls[0].url).toBe("http://localhost:11434/v1/chat/completions");
    expect(calls[0].body.max_tokens).toBe(50);
    expect(calls[0].body.max_completion_tokens).toBeUndefined();
  });

  it("Anthropic chat: headers, system, text blocks", async () => {
    const calls = mockFetch([
      { json: { content: [{ type: "thinking", thinking: "…" }, { type: "text", text: '{"a":1}' }], stop_reason: "end_turn", usage: { input_tokens: 20, output_tokens: 4 } } },
    ]);
    const r = await new AnthropicChat("ak", "claude-sonnet-5-5").chat({ system: "S", user: "U", json: true, maxTokens: 64 });
    expect(r.text).toBe('{"a":1}');
    expect(r.inputTokens).toBe(20);
    expect(calls[0].url).toBe("https://api.anthropic.com/v1/messages");
    expect(calls[0].headers["x-api-key"]).toBe("ak");
    expect(calls[0].headers["anthropic-version"]).toBe("2023-06-01");
    expect(calls[0].body).toMatchObject({ model: "claude-sonnet-5-5", max_tokens: 64, messages: [{ role: "user", content: "U" }] });
    expect(calls[0].body.system).toContain("valid JSON");
  });

  it("Gemini chat: skips thought parts, uses header key", async () => {
    const calls = mockFetch([
      {
        json: {
          candidates: [{ content: { parts: [{ text: "thinking", thought: true }, { text: '{"b":2}' }] }, finishReason: "STOP" }],
          usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 2 },
        },
      },
    ]);
    const r = await new GeminiChat("gk", "gemini-3.8-flash").chat({ system: "S", user: "U", json: true });
    expect(r).toEqual({ text: '{"b":2}', inputTokens: 7, outputTokens: 2 });
    expect(calls[0].url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent");
    expect(calls[0].headers["x-goog-api-key"]).toBe("gk");
    expect(calls[0].body.systemInstruction).toEqual({ parts: [{ text: "S" }] });
    expect(calls[0].body.generationConfig.responseMimeType).toBe("application/json");
  });

  it("embeddings: OpenAI sorts by index, Gemini batches", async () => {
    mockFetch([{ json: { data: [{ index: 1, embedding: [0, 1] }, { index: 0, embedding: [1, 0] }] } }]);
    expect(await new OpenAIEmbedder("k", "text-embedding-3-small").embed(["a", "b"])).toEqual([[1, 0], [0, 1]]);
    const calls = mockFetch([{ json: { embeddings: [{ values: [1] }, { values: [2] }] } }]);
    expect(await new GeminiEmbedder("k", "gemini-embedding-2").embed(["a", "b"])).toEqual([[1], [2]]);
    expect(calls[0].url).toContain("models/gemini-embedding-2:batchEmbedContents");
    expect(calls[0].body.requests[0]).toMatchObject({ model: "models/gemini-embedding-2", content: { parts: [{ text: "a" }] } });
  });

  it("retries on 429 and fails fast on 401", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const calls = mockFetch([
      { status: 429, json: { error: "slow down" }, headers: { "retry-after": "1" } },
      { json: { choices: [{ message: { content: "ok" } }] } },
    ]);
    const p = new OpenAIChat("k", "m").chat({ system: "s", user: "u" });
    await vi.advanceTimersByTimeAsync(1500);
    expect((await p).text).toBe("ok");
    expect(calls).toHaveLength(2);
    vi.useRealTimers();

    const calls2 = mockFetch([{ status: 401, json: { error: "bad key" } }]);
    await expect(new OpenAIChat("k", "m").chat({ system: "s", user: "u" })).rejects.toThrow(/HTTP 401/);
    expect(calls2).toHaveLength(1);
  });

  it("picks providers from available keys", () => {
    const cfg = loadConfig("/nonexistent");
    expect(createLLM(cfg, { gemini: "g" }).provider).toBe("gemini");
    expect(createLLM(cfg, { openai: "o", gemini: "g" }).provider).toBe("openai");
    expect(createLLM(cfg, { anthropic: "a", openai: "o" }).provider).toBe("anthropic");
    expect(() => createLLM(cfg, {})).toThrow(/No LLM API key/);
    expect(createEmbedder(cfg, { anthropic: "a" })).toBeNull();
    // auto never sends code to a vendor other than the review provider.
    expect(createEmbedder(cfg, { anthropic: "a", gemini: "g" })).toBeNull();
    expect(createEmbedder(cfg, { anthropic: "a", openai: "o" })).toBeNull();
    expect(createEmbedder(cfg, { gemini: "g" })?.provider).toBe("gemini");
    expect(createEmbedder(cfg, { openai: "o", gemini: "g" })?.provider).toBe("openai");
    expect(createEmbedder(loadConfig("/nonexistent", undefined, { embeddings: "gemini" }), { anthropic: "a", gemini: "g" })?.provider).toBe("gemini");
  });
});
