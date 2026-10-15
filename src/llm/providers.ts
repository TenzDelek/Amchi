import type { ChatRequest, ChatResult, Embedder, LLM } from "./types.js";
import { HttpError, postJson } from "./http.js";

// ---------------------------------------------------------------------------
// OpenAI (and any OpenAI-compatible endpoint: Azure, OpenRouter, Groq,
// DeepSeek, Together, vLLM, Ollama, LM Studio …)
// ---------------------------------------------------------------------------

export class OpenAIChat implements LLM {
  readonly provider = "openai";
  /** Learned at runtime: some compatible servers (Azure reasoning deployments) need max_completion_tokens. */
  private useCompletionTokens: boolean | null = null;
  constructor(
    private apiKey: string,
    readonly model: string,
    private baseUrl = "https://api.openai.com/v1",
  ) {}

  private get isOfficial() {
    return /api\.openai\.com/.test(this.baseUrl);
  }

  async chat(req: ChatRequest): Promise<ChatResult> {
    const maxTokens = req.maxTokens ?? 8000;
    const body: Record<string, unknown> = {
      model: req.model ?? this.model,
      messages: [
        { role: "system", content: req.system },
        { role: "user", content: req.user },
      ],
    };
    // Official OpenAI reasoning models use max_completion_tokens (which also
    // covers hidden reasoning tokens), most compatible servers use max_tokens.
    const completionTokens = this.useCompletionTokens ?? this.isOfficial;
    if (completionTokens) body.max_completion_tokens = maxTokens * 3;
    else body.max_tokens = maxTokens;
    if (req.json) body.response_format = { type: "json_object" };

    type Resp = {
      choices: { message: { content: string | null }; finish_reason: string }[];
      usage?: { prompt_tokens: number; completion_tokens: number };
    };
    const url = `${this.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const headers: Record<string, string> = { authorization: `Bearer ${this.apiKey}` };
    if (/\.azure\.com/.test(this.baseUrl)) headers["api-key"] = this.apiKey;
    let res: Resp;
    try {
      res = await postJson<Resp>(url, body, headers, { deadline: req.deadline });
    } catch (e) {
      // Retry once with the other token parameter if the server rejects ours.
      if (e instanceof HttpError && e.status === 400 && /max_(completion_)?tokens/.test(e.body)) {
        this.useCompletionTokens = !completionTokens;
        delete body.max_tokens;
        delete body.max_completion_tokens;
        if (this.useCompletionTokens) body.max_completion_tokens = maxTokens * 3;
        else body.max_tokens = maxTokens;
        res = await postJson<Resp>(url, body, headers, { deadline: req.deadline });
      } else throw e;
    }
    const text = res.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) {
      throw new Error(`OpenAI returned an empty response (finish_reason=${res.choices?.[0]?.finish_reason})`);
    }
    return {
      text,
      inputTokens: res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0,
    };
  }
}

export class OpenAIEmbedder implements Embedder {
  readonly provider = "openai";
  readonly batchSize = 128;
  constructor(
    private apiKey: string,
    readonly model: string,
    private baseUrl = "https://api.openai.com/v1",
    private dimensions = 512,
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    const body: Record<string, unknown> = {
      model: this.model,
      input: texts.map((t) => t.slice(0, 8_000)),
    };
    if (/text-embedding-3/.test(this.model)) body.dimensions = this.dimensions;
    type Resp = { data: { index: number; embedding: number[] }[] };
    const res = await postJson<Resp>(`${this.baseUrl.replace(/\/$/, "")}/embeddings`, body, {
      authorization: `Bearer ${this.apiKey}`,
    });
    return [...res.data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }
}

// ---------------------------------------------------------------------------
// Anthropic (Claude)
// ---------------------------------------------------------------------------

export class AnthropicChat implements LLM {
  readonly provider = "anthropic";
  constructor(
    private apiKey: string,
    readonly model: string,
    private baseUrl = "https://api.anthropic.com/v1",
  ) {}

  async chat(req: ChatRequest): Promise<ChatResult> {
    const system = req.json
      ? `${req.system}\n\nRespond with a single valid JSON object and nothing else.`
      : req.system;
    type Resp = {
      content: { type: string; text?: string }[];
      stop_reason: string;
      usage?: { input_tokens: number; output_tokens: number };
    };
    const res = await postJson<Resp>(
      `${this.baseUrl.replace(/\/$/, "")}/messages`,
      {
        model: req.model ?? this.model,
        max_tokens: req.maxTokens ?? 8000,
        system,
        messages: [{ role: "user", content: req.user }],
      },
      { "x-api-key": this.apiKey, "anthropic-version": "2023-06-01" },
      { deadline: req.deadline },
    );
    const text = res.content
      .filter((c) => c.type === "text")
      .map((c) => c.text ?? "")
      .join("");
    if (!text.trim()) throw new Error(`Claude returned an empty response (stop_reason=${res.stop_reason})`);
    return {
      text,
      inputTokens: res.usage?.input_tokens ?? 0,
      outputTokens: res.usage?.output_tokens ?? 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Google Gemini
// ---------------------------------------------------------------------------

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export class GeminiChat implements LLM {
  readonly provider = "gemini";
  constructor(
    private apiKey: string,
    readonly model: string,
  ) {}

  async chat(req: ChatRequest): Promise<ChatResult> {
    const generationConfig: Record<string, unknown> = { maxOutputTokens: (req.maxTokens ?? 8000) * 3 };
    if (req.json) generationConfig.responseMimeType = "application/json";
    type Resp = {
      candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      promptFeedback?: { blockReason?: string };
    };
    const res = await postJson<Resp>(
      `${GEMINI_BASE}/models/${encodeURIComponent(req.model ?? this.model)}:generateContent`,
      {
        systemInstruction: { parts: [{ text: req.system }] },
        contents: [{ role: "user", parts: [{ text: req.user }] }],
        generationConfig,
      },
      { "x-goog-api-key": this.apiKey },
      { deadline: req.deadline },
    );
    const cand = res.candidates?.[0];
    const text = (cand?.content?.parts ?? [])
      .filter((p) => !p.thought)
      .map((p) => p.text ?? "")
      .join("");
    if (!text.trim()) {
      throw new Error(
        `Gemini returned an empty response (finishReason=${cand?.finishReason}, block=${res.promptFeedback?.blockReason})`,
      );
    }
    return {
      text,
      inputTokens: res.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: res.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }
}

export class GeminiEmbedder implements Embedder {
  readonly provider = "gemini";
  readonly batchSize = 100;
  constructor(
    private apiKey: string,
    readonly model: string,
    private dimensions = 768,
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    const name = this.model.startsWith("models/") ? this.model : `models/${this.model}`;
    type Resp = { embeddings: { values: number[] }[] };
    const res = await postJson<Resp>(
      `${GEMINI_BASE}/${name}:batchEmbedContents`,
      {
        requests: texts.map((t) => ({
          model: name,
          content: { parts: [{ text: t.slice(0, 8_000) }] },
          outputDimensionality: this.dimensions,
        })),
      },
      { "x-goog-api-key": this.apiKey },
    );
    return res.embeddings.map((e) => e.values);
  }
}
