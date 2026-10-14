import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Embedder } from "../llm/types.js";
import { log } from "../util/log.js";
import { lineSlice, mapLimit, sha1, tokenize } from "../util/text.js";
import type { CodeGraph } from "./indexer.js";

export interface Chunk {
  id: string;
  path: string;
  start: number;
  end: number;
  /** Symbol name when the chunk is a definition. */
  name?: string;
  kind?: string;
  text: string;
  hash: string;
}

export interface SearchHit {
  chunk: Chunk;
  score: number;
}

const MAX_CHUNK_LINES = 120;
const WINDOW = 60;
const CONTAINERS = new Set(["class", "interface", "struct", "impl", "trait", "module", "object", "namespace", "protocol"]);

/** Split the repo into searchable chunks: one per definition, or line windows for files without symbols. */
export function buildChunks(graph: CodeGraph): Chunk[] {
  const chunks: Chunk[] = [];
  for (const f of Object.values(graph.data.files)) {
    const content = graph.read(f.path);
    if (content == null) continue;
    const add = (start: number, end: number, name?: string, kind?: string) => {
      const code = lineSlice(content, start, end);
      if (!code.trim()) return;
      const header = `${f.path}:${start}-${end}${name ? ` ${kind} ${name}` : ""}`;
      const text = `${header}\n${code}`;
      chunks.push({ id: `${f.path}:${start}-${end}`, path: f.path, start, end, name, kind, text, hash: sha1(text) });
    };
    if (f.symbols.length) {
      for (const s of f.symbols) {
        const len = s.end - s.start + 1;
        if (CONTAINERS.has(s.kind) && len > MAX_CHUNK_LINES) {
          add(s.start, s.start + 25, s.name, s.kind); // header of big classes
        } else {
          add(s.start, Math.min(s.end, s.start + MAX_CHUNK_LINES - 1), s.name, s.kind);
        }
      }
      // Module-level code before the first symbol (imports, constants, config)
      const first = Math.min(...f.symbols.map((s) => s.start));
      if (first > 3) add(1, Math.min(first - 1, WINDOW));
    } else {
      for (let start = 1, n = 0; start <= f.lines && n < 10; start += WINDOW, n++) {
        add(start, Math.min(f.lines, start + WINDOW - 1));
      }
    }
  }
  return chunks;
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

export class Searcher {
  private postings = new Map<string, { doc: number; tf: number }[]>();
  private docLen: number[] = [];
  private avgLen = 1;

  constructor(
    readonly chunks: Chunk[],
    private embedder: Embedder | null = null,
    private store: EmbeddingStore | null = null,
  ) {
    chunks.forEach((c, i) => {
      const terms = tokenize(`${c.path} ${c.name ?? ""} ${c.text}`);
      this.docLen[i] = terms.length;
      const tf = new Map<string, number>();
      for (const t of terms) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const [t, n] of tf) (this.postings.get(t) ?? this.postings.set(t, []).get(t)!).push({ doc: i, tf: n });
    });
    this.avgLen = this.docLen.reduce((a, b) => a + b, 0) / Math.max(1, chunks.length);
  }

  get hasEmbeddings() {
    return !!(this.embedder && this.store && this.store.vectors.size);
  }

  /** Embed chunks that are not cached yet. Returns number of new embeddings. */
  async ensureEmbeddings(maxChunks: number): Promise<number> {
    if (!this.embedder || !this.store) return 0;
    const missing = this.chunks.filter((c) => !this.store!.vectors.has(c.hash)).slice(0, maxChunks);
    if (!missing.length) return 0;
    log.info(`Embedding ${missing.length} new code chunks with ${this.embedder.model}…`);
    const bs = this.embedder.batchSize;
    const batches: Chunk[][] = [];
    for (let i = 0; i < missing.length; i += bs) batches.push(missing.slice(i, i + bs));
    let done = 0;
    try {
      await mapLimit(batches, 3, async (batch) => {
        const vecs = await this.embedder!.embed(batch.map((c) => c.text));
        vecs.forEach((v, i) => {
          this.store!.vectors.set(batch[i].hash, Float32Array.from(normalize(v)));
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
      .sort((a, b) => b[1] - a[1])
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
