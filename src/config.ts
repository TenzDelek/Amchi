import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { parse as parseYaml } from "yaml";
import { minimatch } from "minimatch";
import { log } from "./util/log.js";

export type Severity = "info" | "low" | "medium" | "high" | "critical";
export const SEVERITY_ORDER: Severity[] = ["info", "low", "medium", "high", "critical"];
export function severityRank(s: Severity): number {
  const i = SEVERITY_ORDER.indexOf(s);
  return i < 0 ? 1 : i;
}

export type ProviderName = "openai" | "anthropic" | "gemini" | "mock";

export interface Rule {
  name?: string;
  rule: string;
  paths?: string[];
  severity?: Severity;
}

export interface Config {
  provider: "auto" | ProviderName;
  model?: string;
  /** Model for the verification pass (same provider). A smaller model keeps `review.verify` cheap. */
  verify_model?: string;
  base_url?: string;
  embeddings: "auto" | "openai" | "gemini" | "off";
  embedding_model?: string;
  instructions?: string;
  rules: Rule[];
  review: {
    enabled: boolean;
    /** Second LLM pass that removes false positives (~2x cost). */
    verify: boolean;
    /** Fail the check when a finding at or above this severity is posted. */
    fail_on: "none" | Severity;
    skip_drafts: boolean;
    skip_authors: string[];
    skip_labels: string[];
    skip_title_patterns: string[];
    ignore: string[];
    include: string[];
    max_files: number;
    max_comments: number;
    min_severity: Severity;
    min_confidence: number;
    incremental: boolean;
    suggestions: boolean;
    focus: string[];
    request_changes_on: "none" | Severity;
    /** Severity badges in comments: colored image badges (P0–P4) or plain text labels. */
    badges: "image" | "text";
  };
  summary: {
    enabled: boolean;
    diagram: boolean;
    file_table: boolean;
    confidence_score: boolean;
  };
  chat: {
    enabled: boolean;
    trigger: string;
    /** Only respond to commenters with these author associations (protects your API budget on public repos). */
    allowed_associations: string[];
  };
  index: {
    dir: string;
    max_file_kb: number;
    max_files: number;
    ignore: string[];
  };
  limits: {
    max_input_tokens_per_call: number;
    max_output_tokens: number;
    max_total_input_tokens: number;
    concurrency: number;
    /**
     * Wall-clock budget for the run, counted from the start of indexing. Files not
     * reviewed by then are reported as skipped and scheduled first on the next run;
     * 0 disables. Keep it below the workflow's timeout-minutes so partial results
     * still get posted.
     */
    max_run_seconds: number;
  };
}

export const DEFAULT_IGNORE = [
  "**/package-lock.json", "**/yarn.lock", "**/pnpm-lock.yaml", "**/bun.lockb", "**/bun.lock",
  "**/Cargo.lock", "**/poetry.lock", "**/Pipfile.lock", "**/go.sum", "**/composer.lock", "**/Gemfile.lock",
  "**/*.min.js", "**/*.min.css", "**/*.map", "**/*.snap", "**/*.lock",
  "**/dist/**", "**/build/**", "**/out/**", "**/.next/**", "**/node_modules/**", "**/vendor/**",
  "**/*.pb.go", "**/*_pb2.py", "**/*.generated.*", "**/__generated__/**",
  "**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.gif", "**/*.webp", "**/*.ico", "**/*.svg", "**/*.pdf",
  "**/*.woff", "**/*.woff2", "**/*.ttf", "**/*.otf", "**/*.mp4", "**/*.mp3", "**/*.zip", "**/*.gz",
  "**/*.wasm", "**/*.so", "**/*.dll", "**/*.exe", "**/*.bin",
];

export const DEFAULT_CONFIG: Config = {
  provider: "auto",
  embeddings: "auto",
  rules: [],
  review: {
    enabled: true,
    verify: false,
    fail_on: "none",
    skip_drafts: true,
    skip_authors: ["dependabot[bot]", "renovate[bot]", "github-actions[bot]"],
    skip_labels: ["no-ai-review", "skip-review"],
    skip_title_patterns: ["[skip review]", "[no review]", "[wip]"],
    ignore: [],
    include: [],
    max_files: 80,
    max_comments: 15,
    min_severity: "low",
    min_confidence: 0.6,
    incremental: true,
    suggestions: true,
    focus: ["bugs", "logic", "security", "performance", "error-handling", "maintainability"],
    request_changes_on: "none",
    badges: "image",
  },
  summary: {
    enabled: true,
    diagram: true,
    file_table: true,
    confidence_score: true,
  },
  chat: {
    enabled: true,
    trigger: "@amchi",
    allowed_associations: ["OWNER", "MEMBER", "COLLABORATOR"],
  },
  index: {
    dir: ".amchi",
    max_file_kb: 256,
    max_files: 25000,
    ignore: [],
  },
  limits: {
    max_input_tokens_per_call: 60000,
    max_output_tokens: 8000,
    max_total_input_tokens: 1_500_000,
    concurrency: 4,
    max_run_seconds: 900,
  },
};

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge<T>(base: T, over: unknown): T {
  if (!isObj(over)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined || v === null) continue;
    const b = out[k];
    out[k] = isObj(b) && isObj(v) ? deepMerge(b, v) : v;
  }
  return out as T;
}

export const CONFIG_FILENAMES = [".codereview.yml", ".codereview.yaml", ".amchi.yml", ".amchi.yaml"];

export interface LoadConfigOptions {
  /**
   * Read a config file by repo-relative name. In the action this reads from the
   * PR's *base* commit, so a pull request cannot change the rules it is reviewed by.
   */
  readFile?: (name: string) => string | null;
  /**
   * When false (the action), settings that could redirect secrets or touch the
   * filesystem (base_url, index.dir) are ignored in the file and only accepted
   * from action inputs.
   */
  trusted?: boolean;
}

export function loadConfig(
  repoRoot: string,
  explicitPath?: string,
  overrides: Partial<Config> = {},
  opts: LoadConfigOptions = {},
): Config {
  let fileCfg: Record<string, unknown> = {};
  const candidates = explicitPath ? [explicitPath] : CONFIG_FILENAMES;
  const read =
    opts.readFile ??
    ((name: string) => {
      const p = isAbsolute(name) ? name : join(repoRoot, name);
      return existsSync(p) ? readFileSync(p, "utf8") : null;
    });
  for (const name of candidates) {
    const text = read(name);
    if (text == null) continue;
    try {
      const parsed = parseYaml(text);
      fileCfg = isObj(parsed) ? parsed : {};
      log.info(`Loaded config from ${name}`);
      warnUnknownKeys(fileCfg, DEFAULT_CONFIG as unknown as Record<string, unknown>);
    } catch (e) {
      log.warn(`Could not parse ${name}: ${(e as Error).message}. Using defaults.`);
    }
    break;
  }
  if (opts.trusted === false) {
    if ("base_url" in fileCfg) log.warn("Ignoring base_url from the config file; set it as an action input instead.");
    delete fileCfg.base_url;
    if (isObj(fileCfg.index)) delete (fileCfg.index as Record<string, unknown>).dir;
  }
  const cfg = deepMerge(deepMerge(DEFAULT_CONFIG, fileCfg), overrides);
  // Normalise rules: allow plain strings.
  cfg.rules = (cfg.rules ?? []).map((r: Rule | string) => (typeof r === "string" ? { rule: r } : r));
  if (!SEVERITY_ORDER.includes(cfg.review.min_severity)) cfg.review.min_severity = "low";
  // Numeric limits: anything that is not a finite non-negative number falls back to the default
  // rather than silently disabling a guard (NaN from a bad action input would do that).
  const limits = cfg.limits as unknown as Record<string, unknown>;
  for (const [k, def] of Object.entries(DEFAULT_CONFIG.limits)) {
    const v = limits[k];
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
      if (v !== undefined) log.warn(`limits.${k} must be a non-negative number; using ${def}`);
      limits[k] = def;
    }
  }
  if (cfg.review.badges !== "text") cfg.review.badges = "image";
  return cfg;
}

/** Epoch ms at which the run must stop starting LLM calls, or undefined when `limits.max_run_seconds` is 0. */
export function runDeadline(cfg: Config, now = Date.now()): number | undefined {
  return cfg.limits.max_run_seconds > 0 ? now + cfg.limits.max_run_seconds * 1000 : undefined;
}

/** Top-level keys that are valid but absent from DEFAULT_CONFIG because they have no default. */
const OPTIONAL_KEYS = new Set(["model", "verify_model", "base_url", "embedding_model", "instructions"]);

/** Warn about keys the schema does not know, so a typo like `min_serverity` is not silently ignored. */
function warnUnknownKeys(given: Record<string, unknown>, known: Record<string, unknown>, prefix = "") {
  for (const [k, v] of Object.entries(given)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (!(k in known)) {
      if (!prefix && OPTIONAL_KEYS.has(k)) continue;
      log.warn(`Unknown config key "${path}" is ignored`);
      continue;
    }
    if (isObj(v) && isObj(known[k])) warnUnknownKeys(v, known[k] as Record<string, unknown>, path);
  }
}

export function matchesAny(path: string, globs: string[]): boolean {
  return globs.some((g) => minimatch(path, g, { dot: true, matchBase: !g.includes("/") }));
}

export function isReviewable(path: string, cfg: Config): boolean {
  if (cfg.review.include.length && !matchesAny(path, cfg.review.include)) return false;
  return !matchesAny(path, [...DEFAULT_IGNORE, ...cfg.review.ignore]);
}

export function rulesForPath(path: string, cfg: Config): Rule[] {
  return cfg.rules.filter((r) => !r.paths?.length || matchesAny(path, r.paths));
}
