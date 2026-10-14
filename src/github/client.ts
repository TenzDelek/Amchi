import { getOctokit } from "@actions/github";
import type { Finding } from "../review/reviewer.js";
import { FP_RE, renderInlineComment, SUMMARY_MARKER } from "../review/render.js";
import { log } from "../util/log.js";

type Octokit = ReturnType<typeof getOctokit>;

export interface PullInfo {
  number: number;
  title: string;
  body: string;
  draft: boolean;
  author: string;
  labels: string[];
  baseSha: string;
  headSha: string;
  baseRef: string;
  headRef: string;
  state: string;
}

export interface PostedComment {
  id: number;
  url: string;
  path: string;
  line: number;
  title: string;
  fingerprint?: string;
}

export class GitHubClient {
  readonly octokit: Octokit;
  private login: string | null = null;
  constructor(
    token: string,
    readonly owner: string,
    readonly repo: string,
  ) {
    this.octokit = getOctokit(token);
  }

  /**
   * The account this token posts as. GITHUB_TOKEN can't call GET /user, in
   * which case it is the github-actions bot.
   */
  async botLogin(): Promise<string> {
    if (this.login) return this.login;
    try {
      const { data } = await this.octokit.rest.users.getAuthenticated();
      this.login = data.login;
    } catch {
      this.login = "github-actions[bot]";
    }
    return this.login;
  }

  async isOwnComment(user: { login?: string } | null | undefined): Promise<boolean> {
    return !!user?.login && user.login === (await this.botLogin());
  }

  async getPull(number: number): Promise<PullInfo> {
    const { data } = await this.octokit.rest.pulls.get({ owner: this.owner, repo: this.repo, pull_number: number });
    return {
      number,
      title: data.title,
      body: data.body ?? "",
      draft: !!data.draft,
      author: data.user?.login ?? "",
      labels: data.labels.map((l) => l.name ?? "").filter(Boolean),
      baseSha: data.base.sha,
      headSha: data.head.sha,
      baseRef: data.base.ref,
      headRef: data.head.ref,
      state: data.state,
    };
  }

  /** Findings this bot already posted on the PR (by any run, resolved or not). */
  async existingComments(number: number): Promise<PostedComment[]> {
    const comments = await this.octokit.paginate(this.octokit.rest.pulls.listReviewComments, {
      owner: this.owner,
      repo: this.repo,
      pull_number: number,
      per_page: 100,
    });
    const me = await this.botLogin();
    const out: PostedComment[] = [];
    for (const c of comments) {
      if (c.user?.login !== me) continue; // only trust our own comments
      const body = c.body ?? "";
      const fp = body.match(FP_RE)?.[1];
      if (!fp) continue;
      const title = body.match(/\*\*(.+?)\*\*/)?.[1] ?? "";
      out.push({ id: c.id, url: c.html_url, path: c.path, line: c.line ?? c.original_line ?? 0, title, fingerprint: fp });
    }
    return out;
  }

  async findSummaryComment(number: number): Promise<{ id: number; body: string } | null> {
    const comments = await this.octokit.paginate(this.octokit.rest.issues.listComments, {
      owner: this.owner,
      repo: this.repo,
      issue_number: number,
      per_page: 100,
    });
    const me = await this.botLogin();
    // Only our own summary: anyone can paste the marker into a comment.
    const c = comments.find((x) => x.user?.login === me && x.body?.includes(SUMMARY_MARKER));
    return c ? { id: c.id, body: c.body ?? "" } : null;
  }

  async upsertSummary(number: number, body: string, existingId?: number): Promise<void> {
    if (existingId) {
      await this.octokit.rest.issues.updateComment({ owner: this.owner, repo: this.repo, comment_id: existingId, body });
    } else {
      await this.octokit.rest.issues.createComment({ owner: this.owner, repo: this.repo, issue_number: number, body });
    }
  }

  /**
   * Post findings as one review. If GitHub rejects the batch (422 – usually a
   * line outside the diff), fall back to posting comments one by one and
   * return the ones that could not be placed.
   */
  async postReview(
    number: number,
    commitId: string,
    findings: Finding[],
    event: "COMMENT" | "REQUEST_CHANGES",
    body: string,
  ): Promise<Finding[]> {
    if (!findings.length && event === "COMMENT") return [];
    const comments = findings.map((f) => toComment(f));
    try {
      await this.octokit.rest.pulls.createReview({
        owner: this.owner,
        repo: this.repo,
        pull_number: number,
        commit_id: commitId,
        event,
        body,
        comments,
      });
      return [];
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status !== 422) throw e;
      log.warn(`Batch review rejected (${(e as Error).message}); posting comments individually`);
    }
    const failed: Finding[] = [];
    for (const f of findings) {
      try {
        await this.octokit.rest.pulls.createReviewComment({
          owner: this.owner,
          repo: this.repo,
          pull_number: number,
          commit_id: commitId,
          ...toComment(f),
        });
      } catch (e) {
        log.warn(`Could not place comment at ${f.path}:${f.line}: ${(e as Error).message}`);
        failed.push(f);
      }
    }
    if (event === "REQUEST_CHANGES") {
      try {
        await this.octokit.rest.pulls.createReview({ owner: this.owner, repo: this.repo, pull_number: number, commit_id: commitId, event, body });
      } catch (e) {
        log.warn(`Could not submit REQUEST_CHANGES review: ${(e as Error).message}`);
      }
    }
    return failed;
  }

  async replyToIssueComment(number: number, body: string) {
    await this.octokit.rest.issues.createComment({ owner: this.owner, repo: this.repo, issue_number: number, body });
  }

  async replyInThread(number: number, rootCommentId: number, body: string) {
    await this.octokit.rest.pulls.createReplyForReviewComment({
      owner: this.owner,
      repo: this.repo,
      pull_number: number,
      comment_id: rootCommentId,
      body,
    });
  }

  async threadHistory(number: number, rootId: number): Promise<string[]> {
    const comments = await this.octokit.paginate(this.octokit.rest.pulls.listReviewComments, {
      owner: this.owner,
      repo: this.repo,
      pull_number: number,
      per_page: 100,
    });
    return comments
      .filter((c) => c.id === rootId || c.in_reply_to_id === rootId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((c) => `**${c.user?.login ?? "?"}**: ${(c.body ?? "").replace(FP_RE, "").trim()}`);
  }

  async react(kind: "issue" | "review", commentId: number, content: "eyes" | "rocket" | "confused") {
    try {
      if (kind === "issue") {
        await this.octokit.rest.reactions.createForIssueComment({ owner: this.owner, repo: this.repo, comment_id: commentId, content });
      } else {
        await this.octokit.rest.reactions.createForPullRequestReviewComment({ owner: this.owner, repo: this.repo, comment_id: commentId, content });
      }
    } catch {
      /* reactions are best-effort */
    }
  }
}

function toComment(f: Finding) {
  const c: { path: string; line: number; side: "RIGHT"; body: string; start_line?: number; start_side?: "RIGHT" } = {
    path: f.path,
    line: f.endLine ?? f.line,
    side: "RIGHT",
    body: renderInlineComment(f),
  };
  if (f.endLine && f.endLine > f.line) {
    c.start_line = f.line;
    c.start_side = "RIGHT";
  }
  return c;
}
