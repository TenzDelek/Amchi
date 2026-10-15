import { execFileSync } from "node:child_process";
import { log } from "../util/log.js";

export class Git {
  constructor(readonly cwd: string) {}

  run(args: string[], opts: { allowFail?: boolean } = {}): string {
    try {
      return execFileSync("git", ["-c", "core.quotepath=off", ...args], {
        cwd: this.cwd,
        maxBuffer: 512 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      }).toString("utf8");
    } catch (e) {
      if (opts.allowFail) return "";
      const err = e as { stderr?: Buffer; message: string };
      throw new Error(`git ${args.join(" ")} failed: ${err.stderr?.toString() || err.message}`, { cause: e });
    }
  }

  revParse(ref: string): string | null {
    const out = this.run(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`], { allowFail: true }).trim();
    return out || null;
  }

  hasCommit(sha: string): boolean {
    return !!this.revParse(sha);
  }

  /** Fetch a commit if it's missing (shallow clones). */
  ensureCommit(sha: string, depth = 0): boolean {
    if (this.hasCommit(sha)) return true;
    log.info(`Fetching missing commit ${sha.slice(0, 7)}…`);
    const args = ["fetch", "--no-tags", "origin", sha];
    if (depth) args.splice(1, 0, `--depth=${depth}`);
    this.run(args, { allowFail: true });
    return this.hasCommit(sha);
  }

  mergeBase(a: string, b: string): string | null {
    return this.run(["merge-base", a, b], { allowFail: true }).trim() || null;
  }

  isAncestor(ancestor: string, descendant: string): boolean {
    try {
      execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], { cwd: this.cwd, stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  diff(base: string, head: string): string {
    return this.run(["diff", "--no-color", "--no-ext-diff", "-M", "-U3", base, head]);
  }

  log(base: string, head: string): { sha: string; subject: string }[] {
    const out = this.run(["log", "--format=%H%x09%s", `${base}..${head}`], { allowFail: true });
    return out
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        const [sha, ...rest] = l.split("\t");
        return { sha, subject: rest.join("\t") };
      });
  }
}
