import type { Config, ProviderName } from "../config.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { log } from "../util/log.js";
import { AnthropicChat, GeminiChat, GeminiEmbedder, OpenAIChat, OpenAIEmbedder } from "./providers.js";
import { MockChat, MockEmbedder } from "./mock.js";
import { BudgetExceededError, type ChatRequest, type ChatResult, type Embedder, type LLM, type Usage } from "./types.js";

export * from "./types.js";

export const DEFAULT_MODELS: Record<ProviderName, string> = {
  openai: "gpt-5.5",
  anthropic: "claude-sonnet-5-5",
  gemini: "gemini-3.8-flash",
  mock: "mock",
};

export const DEFAULT_EMBEDDING_MODELS = {
  openai: "text-embedding-3-small",
  gemini: "gemini-embedding-2",
};

export interface Keys {
  openai?: string;
  anthropic?: string;
  gemini?: string;
}

export function keysFromEnv(env = process.env): Keys {
  return {
    openai: env.OPENAI_API_KEY || undefined,
    anthropic: env.ANTHROPIC_API_KEY || undefined,
    gemini: env.GEMINI_API_KEY || env.GOOGLE_API_KEY || undefined,
  };
}

export function resolveProvider(cfg: Config, keys: Keys): ProviderName {
  if (cfg.provider !== "auto") return cfg.provider;
  // A custom base_url is an OpenAI-compatible endpoint; never send other providers' keys there.
  if (cfg.base_url) {
    if (keys.openai) return "openai";
    throw new Error("base_url is set but OPENAI_API_KEY (the key for that endpoint) is not");
  }
  if (keys.anthropic) return "anthropic";
  if (keys.openai) return "openai";
  if (keys.gemini) return "gemini";
  throw new Error(
    "No LLM API key found. Set one of OPENAI_API_KEY, ANTHROPIC_API_KEY or GEMINI_API_KEY " +
      "(or the matching action input).",
  );
}

/** Tracks token usage across all calls and enforces the per-run budget. */
export class TrackedLLM implements LLM {
  readonly usage: Usage = { calls: 0, inputTokens: 0, outputTokens: 0, embeddingTexts: 0 };
  constructor(
    private inner: LLM,
    private maxTotalInputTokens: number,
  ) {}
  get provider() {
    return this.inner.provider;
  }
  get model() {
    return this.inner.model;
  }
  async chat(req: ChatRequest): Promise<ChatResult> {
    const approx = Math.ceil((req.system.length + req.user.length) / 4);
    if (this.usage.inputTokens + approx > this.maxTotalInputTokens) {
      throw new BudgetExceededError(
        `Token budget reached (${this.usage.inputTokens.toLocaleString()} / ${this.maxTotalInputTokens.toLocaleString()} input tokens). ` +
          "Raise limits.max_total_input_tokens to review more.",
      );
    }
    const t0 = Date.now();
    const res = await this.inner.chat(req);
    const dump = process.env.TAKCHE_DUMP_PROMPTS;
    if (dump) {
      // Debug aid: write every prompt/response pair to a folder.
      mkdirSync(dump, { recursive: true });
      const name = `${String(this.usage.calls + 1).padStart(3, "0")}-${(req.label ?? "call").replace(/[^\w.-]+/g, "_").slice(0, 80)}.md`;
      writeFileSync(join(dump, name), `# SYSTEM\n${req.system}\n\n# USER\n${req.user}\n\n# RESPONSE\n${res.text}\n`);
    }
    this.usage.calls++;
    this.usage.inputTokens += res.inputTokens || approx;
    this.usage.outputTokens += res.outputTokens;
    log.debug(
      `[llm] ${req.label ?? "call"} in=${res.inputTokens} out=${res.outputTokens} ${Date.now() - t0}ms`,
    );
    return res;
  }
}

export function createLLM(cfg: Config, keys: Keys): TrackedLLM {
  const provider = resolveProvider(cfg, keys);
  const model = cfg.model || DEFAULT_MODELS[provider];
  let inner: LLM;
  switch (provider) {
    case "openai":
      if (!keys.openai) throw new Error("provider is openai but OPENAI_API_KEY is not set");
      inner = new OpenAIChat(keys.openai, model, cfg.base_url || undefined);
      break;
    case "anthropic":
      if (!keys.anthropic) throw new Error("provider is anthropic but ANTHROPIC_API_KEY is not set");
      if (cfg.base_url) log.warn("base_url only applies to the openai provider; ignoring it for anthropic");
      inner = new AnthropicChat(keys.anthropic, model);
      break;
    case "gemini":
      if (!keys.gemini) throw new Error("provider is gemini but GEMINI_API_KEY is not set");
      inner = new GeminiChat(keys.gemini, model);
      break;
    case "mock":
      inner = new MockChat();
      break;
  }
  log.info(`LLM: ${provider} / ${model}`);
  return new TrackedLLM(inner, cfg.limits.max_total_input_tokens);
}

/** Embeddings are optional: without them retrieval falls back to BM25 + graph edges. */
export function createEmbedder(cfg: Config, keys: Keys): Embedder | null {
  let choice = cfg.embeddings;
  if (choice === "off") return null;
  if (cfg.provider === "mock") return new MockEmbedder();
  if (choice === "auto") {
    if (keys.openai && !(cfg.provider === "openai" && cfg.base_url)) choice = "openai";
    else if (keys.gemini) choice = "gemini";
    else {
      log.info("Embeddings: off (no OpenAI or Gemini key) — using keyword + graph retrieval");
      return null;
    }
  }
  if (choice === "openai") {
    if (!keys.openai) return null;
    const model = cfg.embedding_model || DEFAULT_EMBEDDING_MODELS.openai;
    log.info(`Embeddings: openai / ${model}`);
    return new OpenAIEmbedder(keys.openai, model);
  }
  if (choice === "gemini") {
    if (!keys.gemini) return null;
    const model = cfg.embedding_model || DEFAULT_EMBEDDING_MODELS.gemini;
    log.info(`Embeddings: gemini / ${model}`);
    return new GeminiEmbedder(keys.gemini, model);
  }
  return null;
}
