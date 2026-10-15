import type { Config, ProviderName } from "../config.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { log } from "../util/log.js";
import { estimateTokens } from "../util/text.js";
import { AnthropicChat, GeminiChat, GeminiEmbedder, OpenAIChat, OpenAIEmbedder } from "./providers.js";
import { MockChat, MockEmbedder } from "./mock.js";
import { BudgetExceededError, DeadlineExceededError, type ChatRequest, type ChatResult, type Embedder, type LLM, type Usage } from "./types.js";

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

/**
 * How long a call that started before the deadline may keep running past it.
 * Aborting an in-flight review call wastes the input tokens the provider has
 * already billed, so only the *start* of a call is strict.
 */
export const CALL_GRACE_MS = 90_000;

/** Tracks token usage across all calls and enforces the per-run budget and deadline. */
export class TrackedLLM implements LLM {
  readonly usage: Usage = { calls: 0, inputTokens: 0, outputTokens: 0, embeddingTexts: 0 };
  /** Estimated input tokens of calls in flight, so concurrent calls cannot all pass the budget check. */
  private reserved = 0;
  constructor(
    private inner: LLM,
    private maxTotalInputTokens: number,
    /** Epoch ms; calls that have not started by then are refused. */
    readonly deadline?: number,
  ) {}
  get provider() {
    return this.inner.provider;
  }
  get model() {
    return this.inner.model;
  }
  async chat(req: ChatRequest): Promise<ChatResult> {
    const approx = estimateTokens(req.system) + estimateTokens(req.user);
    const deadline = req.deadline ?? this.deadline;
    if (deadline && Date.now() >= deadline) {
      throw new DeadlineExceededError("Run deadline reached (limits.max_run_seconds); skipping remaining LLM calls");
    }
    if (this.usage.inputTokens + this.reserved + approx > this.maxTotalInputTokens) {
      throw new BudgetExceededError(
        `Token budget reached (${this.usage.inputTokens.toLocaleString()} / ${this.maxTotalInputTokens.toLocaleString()} input tokens). ` +
          "Raise limits.max_total_input_tokens to review more.",
      );
    }
    this.reserved += approx;
    const t0 = Date.now();
    let res: ChatResult;
    try {
      res = await this.inner.chat({ ...req, deadline: deadline ? deadline + CALL_GRACE_MS : undefined });
    } finally {
      this.reserved -= approx;
    }
    const dump = process.env.AMCHI_DUMP_PROMPTS;
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

export function createLLM(cfg: Config, keys: Keys, opts: { deadline?: number } = {}): TrackedLLM {
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
  log.info(`LLM: ${provider} / ${model}${cfg.verify_model ? ` (verify: ${cfg.verify_model})` : ""}`);
  return new TrackedLLM(inner, cfg.limits.max_total_input_tokens, opts.deadline);
}

/**
 * Embeddings are optional: without them retrieval falls back to BM25 + graph edges.
 * `auto` only uses the review provider's own embedding API, so repository code is
 * never sent to a second vendor unless `embeddings` names one explicitly.
 */
export function createEmbedder(cfg: Config, keys: Keys, opts: { deadline?: number } = {}): Embedder | null {
  const emb = pickEmbedder(cfg, keys);
  if (emb && opts.deadline) emb.deadline = opts.deadline + CALL_GRACE_MS;
  return emb;
}

function pickEmbedder(cfg: Config, keys: Keys): Embedder | null {
  let choice = cfg.embeddings;
  if (choice === "off") return null;
  if (cfg.provider === "mock") return new MockEmbedder();
  if (choice === "auto") {
    let provider: ProviderName | null = null;
    try {
      provider = resolveProvider(cfg, keys);
    } catch {
      /* no key at all: handled below */
    }
    if (provider === "openai" && keys.openai && !cfg.base_url) choice = "openai";
    else if (provider === "gemini" && keys.gemini) choice = "gemini";
    else {
      // With a custom base_url the OpenAI key belongs to that endpoint, so OpenAI embeddings are not an option.
      const vendor = keys.openai && !cfg.base_url ? "openai" : keys.gemini ? "gemini" : null;
      const hint = vendor ? ` Set embeddings: ${vendor} to send code chunks to that vendor for semantic search.` : "";
      log.info(`Embeddings: off (auto only uses the review provider's own embeddings).${hint} Using keyword + graph retrieval.`);
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
