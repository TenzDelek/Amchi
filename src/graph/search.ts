import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Embedder } from "../llm/types.js";
import { log } from "../util/log.js";
import { lineSlice, mapLimit, sha1, tokenize } from "../util/text.js";
import type { CodeGraph } from "./indexer.js";
import { CONTAINER_KINDS, type SymbolInfo } from "./parser.js";

/**
 * A searchable span of one file, computed when the file is parsed and stored in
 * the index, so search never has to read unchanged files again. The text itself
 * is not stored: `chunkText` regenerates it from the file on demand.
 */
export interface ChunkMeta {
  start: number;
  end: number;
  /** Symbol name when the chunk is a definition. */
  name?: string;
  kind?: string;
  /** sha1 of the chunk text; the key of the embedding cache. */
  hash: string;
  /** Number of search terms in the chunk (BM25 document length). */
  len: number;
  /** Term frequencies over path, name and text. */
  tf: Record<string, number>;
}

export interface Chunk extends ChunkMeta {
  id: string;
  path: string;
}

export interface SearchHit {
  chunk: Chunk;
  score: number;
}

const MAX_CHUNK_LINES = 120;
const WINDOW = 60;

/** The line spans a file is split into: one per definition, or line windows for files without symbols. */
export function chunkSpans(symbols: SymbolInfo[], lines: number): { start: number; end: number; name?: string; kind?: string }[] {
  const spans: { start: number; end: number; name?: string; kind?: string }[] = [];
  if (symbols.length) {
    for (const s of symbols) {
      const len = s.end - s.start + 1;
      if (CONTAINER_KINDS.has(s.kind) && len > MAX_CHUNK_LINES) {
        spans.push({ start: s.start, end: s.start + 25, name: s.name, kind: s.kind }); // header of big classes
      } else {
        spans.push({ start: s.start, end: Math.min(s.end, s.start + MAX_CHUNK_LINES - 1), name: s.name, kind: s.kind });
      }
    }
    // Module-level code before the first symbol (imports, constants, config)
    const first = Math.min(...symbols.map((s) => s.start));
    if (first > 3) spans.push({ start: 1, end: Math.min(first - 1, WINDOW) });
  } else {
    for (let start = 1, n = 0; start <= lines && n < 10; start += WINDOW, n++) {
      spans.push({ start, end: Math.min(lines, start + WINDOW - 1) });
    }
  }
  return spans;
}

/** The text that is embedded and hashed: a one-line header, then the code. */
export function chunkText(path: string, content: string, c: { start: number; end: number; name?: string; kind?: string }): string | null {
  const code = lineSlice(content, c.start, c.end);
  if (!code.trim()) return null;
  return `${path}:${c.start}-${c.end}${c.name ? ` ${c.kind} ${c.name}` : ""}\n${code}`;
}

/** Compute a file's chunks from its content, at index time. */
export function chunkFile(path: string, content: string, lines: number, symbols: SymbolInfo[]): ChunkMeta[] {
  const out: ChunkMeta[] = [];
  for (const span of chunkSpans(symbols, lines)) {
    const text = chunkText(path, content, span);
    if (text == null) continue;
    const terms = tokenize(`${path} ${span.name ?? ""} ${text}`);
    const tf: Record<string, number> = {};
    for (const t of terms) tf[t] = (tf[t] ?? 0) + 1;
    out.push({ ...span, hash: sha1(text), len: terms.length, tf });
  }
  return out;
}

/** All chunks of the repository, straight from the index (no file is read). */
export function buildChunks(graph: CodeGraph): Chunk[] {
  const chunks: Chunk[] = [];
  for (const f of Object.values(graph.data.files)) {
    for (const c of f.chunks ?? []) chunks.push({ ...c, id: `${f.path}:${c.start}-${c.end}`, path: f.path });
  }
  return chunks;
}

/** Read a chunk's text from the working tree (for embedding). */
export function readChunkText(graph: CodeGraph, c: Chunk): string | null {
  const content = graph.read(c.path);
  return content == null ? null : chunkText(c.path, content, c);
}

// ---------------------------------------------------------------------------
// Embedding cache: .amchi/emb-<model>.bin + .json (hash -> row)
// ---------------------------------------------------------------------------

export class EmbeddingStore {
  readonly vectors = new Map<string, Float32Array>();
  dims = 0;
  constructor(
    private dir: string,
    private model: string,
  ) {}

  private base() {
    return join(this.dir, `emb-${this.model.replace(/[^a-zA-Z0-9._-]/g, "_")}`);
  }

  load() {
    const meta = `${this.base()}.json`;
    const bin = `${this.base()}.bin`;
    if (!existsSync(meta) || !existsSync(bin)) return;
    try {
      const { dims, hashes } = JSON.parse(readFileSync(meta, "utf8")) as { dims: number; hashes: string[] };
      const buf = readFileSync(bin);
      const all = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
      this.dims = dims;
      hashes.forEach((h, i) => this.vectors.set(h, all.slice(i * dims, (i + 1) * dims)));
      log.info(`Loaded ${hashes.length} cached embeddings`);
    } catch (e) {
      log.warn(`Could not load embedding cache: ${(e as Error).message}`);
    }
  }

  /** Persist only vectors still referenced by current chunks (prunes stale ones). */
  save(keep: Set<string>) {
    if (!this.dims) return;
    mkdirSync(this.dir, { recursive: true });
    const hashes = [...this.vectors.keys()].filter((h) => keep.has(h));
    const all = new Float32Array(hashes.length * this.dims);
    hashes.forEach((h, i) => all.set(this.vectors.get(h)!, i * this.dims));
    writeFileSync(`${this.base()}.bin`, Buffer.from(all.buffer));
    writeFileSync(`${this.base()}.json`, JSON.stringify({ model: this.model, dims: this.dims, hashes }));
  }
}

// ---------------------------------------------------------------------------
// Hybrid search: BM25 over identifiers + cosine over embeddings, fused with RRF
// ---------------------------------------------------------------------------

export interface SearcherOptions {
  /** How to get a chunk's text when it must be embedded. Defaults to "unavailable". */
  textOf?: (c: Chunk) => string | null;
}

export class Searcher {
  private postings = new Map<string, { doc: number; tf: number }[]>();
  private docLen: number[] = [];
  private avgLen = 1;
  private textOf: (c: Chunk) => string | null;

  constructor(
    readonly chunks: Chunk[],
    private embedder: Embedder | null = null,
    private store: EmbeddingStore | null = null,
    opts: SearcherOptions = {},
  ) {
    this.textOf = opts.textOf ?? (() => null);
    chunks.forEach((c, i) => {
      this.docLen[i] = c.len;
      for (const [t, n] of Object.entries(c.tf)) (this.postings.get(t) ?? this.postings.set(t, []).get(t)!).push({ doc: i, tf: n });
    });
    this.avgLen = this.docLen.reduce((a, b) => a + b, 0) / Math.max(1, chunks.length);
  }

  get hasEmbeddings() {
    return !!(this.embedder && this.store && this.store.vectors.size);
  }

  /** Embed chunks that are not cached yet. Returns number of new embeddings. */
  async ensureEmbeddings(maxChunks: number): Promise<number> {
    if (!this.embedder || !this.store) return 0;
    const missing: { chunk: Chunk; text: string }[] = [];
    for (const c of this.chunks) {
      if (missing.length >= maxChunks) break;
      if (this.store.vectors.has(c.hash)) continue;
      const text = this.textOf(c);
      if (text != null) missing.push({ chunk: c, text });
    }
    if (!missing.length) return 0;
    log.info(`Embedding ${missing.length} new code chunks with ${this.embedder.model}…`);
    const bs = this.embedder.batchSize;
    const batches: { chunk: Chunk; text: string }[][] = [];
    for (let i = 0; i < missing.length; i += bs) batches.push(missing.slice(i, i + bs));
    let done = 0;
    try {
      await mapLimit(batches, 3, async (batch) => {
        const vecs = await this.embedder!.embed(batch.map((m) => m.text));
        vecs.forEach((v, i) => {
          this.store!.vectors.set(batch[i].chunk.hash, Float32Array.from(normalize(v)));
          this.store!.dims = v.length;
        });
        done += batch.length;
      });
    } catch (e) {
      log.warn(`Embedding failed after ${done} chunks (${(e as Error).message}); continuing with keyword search`);
    }
    return done;
  }

  persistEmbeddings() {
    this.store?.save(new Set(this.chunks.map((c) => c.hash)));
  }

  bm25(query: string, k: number, filter?: (c: Chunk) => boolean): SearchHit[] {
    const terms = [...new Set(tokenize(query))];
    const N = this.chunks.length;
    const scores = new Map<number, number>();
    const k1 = 1.2;
    const b = 0.75;
    for (const t of terms) {
      const post = this.postings.get(t);
      if (!post || post.length > N * 0.5) continue; // skip very common terms
      const idf = Math.log(1 + (N - post.length + 0.5) / (post.length + 0.5));
      for (const { doc, tf } of post) {
        const s = idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * this.docLen[doc]) / this.avgLen)));
        scores.set(doc, (scores.get(doc) ?? 0) + s);
      }
    }
    return [...scores.entries()]
      .filter(([d]) => !filter || filter(this.chunks[d]))
      .sort((x, y) => y[1] - x[1])
      .slice(0, k)
      .map(([d, s]) => ({ chunk: this.chunks[d], score: s }));
  }

  async vector(query: string, k: number, filter?: (c: Chunk) => boolean): Promise<SearchHit[]> {
    if (!this.hasEmbeddings) return [];
    let q: number[];
    try {
      q = normalize((await this.embedder!.embed([query]))[0]);
    } catch (e) {
      log.warn(`Query embedding failed: ${(e as Error).message}`);
      return [];
    }
    const hits: SearchHit[] = [];
    for (const c of this.chunks) {
      if (filter && !filter(c)) continue;
      const v = this.store!.vectors.get(c.hash);
      if (!v || v.length !== q.length) continue;
      let dot = 0;
      for (let i = 0; i < q.length; i++) dot += q[i] * v[i];
      hits.push({ chunk: c, score: dot });
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, k);
  }

  /** Hybrid search with reciprocal-rank fusion. */
  async search(query: string, k = 8, filter?: (c: Chunk) => boolean): Promise<SearchHit[]> {
    const [lex, vec] = await Promise.all([
      Promise.resolve(this.bm25(query, k * 3, filter)),
      this.vector(query, k * 3, filter),
    ]);
    const fused = new Map<string, { chunk: Chunk; score: number }>();
    const add = (list: SearchHit[], weight: number) =>
      list.forEach((h, rank) => {
        const cur = fused.get(h.chunk.id) ?? { chunk: h.chunk, score: 0 };
        cur.score += weight / (60 + rank);
        fused.set(h.chunk.id, cur);
      });
    add(lex, 1);
    add(vec, 1.2);
    return [...fused.values()].sort((a, b) => b.score - a.score).slice(0, k);
  }
}

function normalize(v: number[]): number[] {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}
