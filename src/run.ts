import type { Config } from "./config.js";
import { Git } from "./git/git.js";
import { addedLines, parseUnifiedDiff, type FileDiff } from "./git/diff.js";
import { openWorkspace, type Workspace } from "./graph/workspace.js";
import type { Embedder, LLM } from "./llm/types.js";
import { log } from "./util/log.js";
import { reviewPullRequest, type ReviewOutput } from "./review/reviewer.js";

export interface ReviewRunInput {
  root: string;
  cfg: Config;
  llm: LLM;
  embedder: Embedder | null;
  baseSha: string;
  headSha: string;
  title: string;
  body: string;
  /** Review only changes since this commit (still anchored to the full PR diff). */
  incrementalFrom?: string;
  previousFileSummaries?: Record<string, string>;
  workspace?: Workspace;
  /** Epoch ms after which no new LLM batch is started (partial results are still returned). */
  deadline?: number;
  /** Files the previous run left unreviewed; scheduled first. */
  priorityPaths?: string[];
}

export interface ReviewRunResult {
  out: ReviewOutput;
  allFiles: FileDiff[];
  reviewFiles: FileDiff[];
  mergeBase: string;
  incrementalFrom?: string;
  workspace: Workspace;
}

export async function runReview(input: ReviewRunInput): Promise<ReviewRunResult> {
  const git = new Git(input.root);
  const { cfg } = input;
  const mergeBase = git.mergeBase(input.baseSha, input.headSha) ?? input.baseSha;
  const allFiles = parseUnifiedDiff(git.diff(mergeBase, input.headSha));
  log.info(`PR diff ${mergeBase.slice(0, 7)}..${input.headSha.slice(0, 7)}: ${allFiles.length} file(s)`);

  let reviewFiles = allFiles;
  let incrementalFrom = input.incrementalFrom;
  if (incrementalFrom) {
    const prByPath = new Map(allFiles.map((f) => [f.path, f]));
    // Keep only delta hunks that touch lines this PR changes. After "merge main into
    // the branch", the delta also contains main's commits, which aren't ours to review.
    const delta = parseUnifiedDiff(git.diff(incrementalFrom, input.headSha))
      .filter((f) => prByPath.has(f.path))
      .map((f) => {
        const prAdded = new Set(addedLines(prByPath.get(f.path)!));
        const hunks = f.hunks.filter((h) => h.lines.some((l) => l.type === "add" && prAdded.has(l.newNo!)));
        return {
          ...f,
          hunks,
          additions: hunks.reduce((n, h) => n + h.lines.filter((l) => l.type === "add").length, 0),
          deletions: hunks.reduce((n, h) => n + h.lines.filter((l) => l.type === "del").length, 0),
        };
      })
      .filter((f) => f.hunks.length);
    if (delta.length) {
      reviewFiles = delta;
      log.info(`Incremental review of ${delta.length} file(s) changed since ${incrementalFrom.slice(0, 7)}`);
    } else {
      log.info("No PR files changed since the last review");
      reviewFiles = [];
    }
  }

  const workspace =
    input.workspace ?? (await log.group("Indexing repository", () => openWorkspace(input.root, cfg, input.embedder, { commit: input.headSha })));

  const commits = git.log(mergeBase, input.headSha);
  const out = await log.group("Reviewing", () =>
    reviewPullRequest({
      files: reviewFiles,
      allFiles,
      anchorFiles: allFiles,
      previousFileSummaries: input.previousFileSummaries,
      pr: {
        title: input.title,
        body: input.body,
        changedFiles: allFiles.map((f) => ({ path: f.path, status: f.status, additions: f.additions, deletions: f.deletions })),
      },
      graph: workspace.graph,
      searcher: workspace.searcher,
      llm: input.llm,
      cfg,
      commits,
      verify: cfg.review.verify,
      deadline: input.deadline,
      priorityPaths: input.priorityPaths,
    }),
  );
  if (!input.workspace) out.timings.index = workspace.stats.ms;
  return { out, allFiles, reviewFiles, mergeBase, incrementalFrom, workspace };
}
