export interface ChatRequest {
  system: string;
  user: string;
  /** Ask the provider for a JSON object response where supported. */
  json?: boolean;
  maxTokens?: number;
  /** Label for logs and usage accounting, e.g. "review:src/a.ts". */
  label?: string;
}

export interface ChatResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

export interface LLM {
  readonly provider: string;
  readonly model: string;
  chat(req: ChatRequest): Promise<ChatResult>;
}

export interface Embedder {
  readonly provider: string;
  readonly model: string;
  /** Max texts per request. */
  readonly batchSize: number;
  embed(texts: string[]): Promise<number[][]>;
}

export class BudgetExceededError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "BudgetExceededError";
  }
}

export interface Usage {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  embeddingTexts: number;
}
