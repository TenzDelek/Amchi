import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export class TempRepo {
  readonly dir: string;
  constructor() {
    this.dir = mkdtempSync(join(tmpdir(), "cg-test-"));
    this.git("init", "-q", "-b", "main");
    this.git("config", "user.email", "t@example.com");
    this.git("config", "user.name", "Test");
  }
  git(...args: string[]): string {
    return execFileSync("git", args, { cwd: this.dir }).toString().trim();
  }
  write(files: Record<string, string>) {
    for (const [p, c] of Object.entries(files)) {
      const abs = join(this.dir, p);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, c);
    }
  }
  remove(path: string) {
    rmSync(join(this.dir, path));
  }
  commit(msg: string): string {
    this.git("add", "-A");
    this.git("commit", "-q", "-m", msg);
    return this.git("rev-parse", "HEAD");
  }
  cleanup() {
    rmSync(this.dir, { recursive: true, force: true });
  }
}
