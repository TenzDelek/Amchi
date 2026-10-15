import { isAbsolute, join } from "node:path";
import type { Config } from "../config.js";
import type { Embedder } from "../llm/types.js";
import { log } from "../util/log.js";
import { buildIndex, CodeGraph, loadIndex, saveIndex, type IndexStats } from "./indexer.js";
import { buildChunks, EmbeddingStore, readChunkText, Searcher } from "./search.js";

export interface Workspace {
  graph: CodeGraph;
  searcher: Searcher;
  stats: IndexStats;
}

/**
 * Load the cached index (if any), incrementally update it against the
 * working tree, refresh embeddings for changed chunks, and persist.
 */
export async function openWorkspace(
  root: string,
  cfg: Config,
  embedder: Embedder | null,
  opts: { commit?: string; maxEmbedChunks?: number } = {},
): Promise<Workspace> {
  const dir = isAbsolute(cfg.index.dir) ? cfg.index.dir : join(root, cfg.index.dir);
  const prev = loadIndex(dir);
  if (prev) log.info(`Restored code graph cache (${Object.keys(prev.files).length} files, commit ${prev.commit?.slice(0, 7) ?? "?"})`);
  const { data, stats } = await buildIndex(root, cfg, prev, opts.commit);
  saveIndex(dir, data);

  const graph = new CodeGraph(root, data);
  const chunks = buildChunks(graph);
  let store: EmbeddingStore | null = null;
  if (embedder) {
    store = new EmbeddingStore(dir, `${embedder.provider}-${embedder.model}`);
    store.load();
  }
  const searcher = new Searcher(chunks, embedder, store, { textOf: (c) => readChunkText(graph, c) });
  if (embedder) {
    const added = await searcher.ensureEmbeddings(opts.maxEmbedChunks ?? 30_000);
    if (added) searcher.persistEmbeddings();
  }
  log.info(
    `Code graph: ${graph.defsByName.size.toLocaleString()} symbols, ${chunks.length.toLocaleString()} chunks` +
      (searcher.hasEmbeddings ? ", semantic search on" : ", keyword search"),
  );
  return { graph, searcher, stats };
}
