export interface DiffLine {
  type: "add" | "del" | "ctx";
  oldNo?: number;
  newNo?: number;
  text: string;
}

export interface Hunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: DiffLine[];
}

export interface FileDiff {
  path: string;
  oldPath?: string;
  status: "added" | "modified" | "deleted" | "renamed";
  binary: boolean;
  hunks: Hunk[];
  additions: number;
  deletions: number;
}

function unquote(p: string): string {
  if (p.startsWith('"') && p.endsWith('"')) {
    try {
      return JSON.parse(p);
    } catch {
      return p.slice(1, -1);
    }
  }
  return p;
}

function stripPrefix(p: string): string {
  return unquote(p.trim()).replace(/^[ab]\//, "");
}

export function parseUnifiedDiff(text: string): FileDiff[] {
  const files: FileDiff[] = [];
  let cur: FileDiff | null = null;
  let hunk: Hunk | null = null;
  let oldNo = 0;
  let newNo = 0;

  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("diff --git ")) {
      const m = line.match(/^diff --git (?:"?a\/(.+?)"?) (?:"?b\/(.+?)"?)$/);
      cur = {
        path: m ? m[2] : line.slice(11),
        oldPath: m ? m[1] : undefined,
        status: "modified",
        binary: false,
        hunks: [],
        additions: 0,
        deletions: 0,
      };
      files.push(cur);
      hunk = null;
      continue;
    }
    if (!cur) continue;

    if (!hunk) {
      if (line.startsWith("new file mode")) cur.status = "added";
      else if (line.startsWith("deleted file mode")) cur.status = "deleted";
      else if (line.startsWith("rename from ")) {
        cur.oldPath = unquote(line.slice(12));
        cur.status = "renamed";
      } else if (line.startsWith("rename to ")) {
        cur.path = unquote(line.slice(10));
        cur.status = "renamed";
      } else if (line.startsWith("Binary files") || line.startsWith("GIT binary patch")) cur.binary = true;
      else if (line.startsWith("--- ")) {
        const p = line.slice(4);
        if (p.trim() === "/dev/null") cur.status = "added";
        else cur.oldPath = stripPrefix(p);
        continue;
      } else if (line.startsWith("+++ ")) {
        const p = line.slice(4);
        if (p.trim() === "/dev/null") cur.status = "deleted";
        else cur.path = stripPrefix(p);
        continue;
      }
    }

    const hm = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/);
    if (hm) {
      hunk = {
        oldStart: +hm[1],
        oldLines: hm[2] === undefined ? 1 : +hm[2],
        newStart: +hm[3],
        newLines: hm[4] === undefined ? 1 : +hm[4],
        header: hm[5].trim(),
        lines: [],
      };
      oldNo = hunk.oldStart;
      newNo = hunk.newStart;
      cur.hunks.push(hunk);
      continue;
    }
    if (!hunk) continue;
    if (line.startsWith("+")) {
      hunk.lines.push({ type: "add", newNo: newNo++, text: line.slice(1) });
      cur.additions++;
    } else if (line.startsWith("-")) {
      hunk.lines.push({ type: "del", oldNo: oldNo++, text: line.slice(1) });
      cur.deletions++;
    } else if (line.startsWith(" ")) {
      hunk.lines.push({ type: "ctx", oldNo: oldNo++, newNo: newNo++, text: line.slice(1) });
    } else if (line === "" && i === lines.length - 1) {
      // trailing newline at end of diff
    } else if (line.startsWith("\\")) {
      // "\ No newline at end of file"
    } else if (line === "") {
      // Some tools emit empty context lines without the leading space.
      hunk.lines.push({ type: "ctx", oldNo: oldNo++, newNo: newNo++, text: "" });
    }
  }
  return files;
}

/** Lines in the new file that GitHub allows review comments on (RIGHT side). */
export function commentableLines(fd: FileDiff): Map<number, number> {
  const m = new Map<number, number>(); // newNo -> hunk index
  fd.hunks.forEach((h, hi) => {
    for (const l of h.lines) if (l.newNo !== undefined) m.set(l.newNo, hi);
  });
  return m;
}

export function addedLines(fd: FileDiff): number[] {
  return fd.hunks.flatMap((h) => h.lines.filter((l) => l.type === "add").map((l) => l.newNo!));
}

/** Ranges in the new file touched by the diff (for symbol lookup). Deletions map to the nearest new line. */
export function changedRanges(fd: FileDiff): [number, number][] {
  const out: [number, number][] = [];
  for (const h of fd.hunks) {
    let start = -1;
    let end = -1;
    const lastNewLine = h.newStart + Math.max(0, h.newLines - 1);
    let pos = h.newStart; // the new-file line that currently occupies this position
    for (const l of h.lines) {
      if (l.type === "ctx") {
        pos = l.newNo! + 1;
        continue;
      }
      const n = l.type === "add" ? l.newNo! : Math.max(1, Math.min(pos, lastNewLine));
      if (l.type === "add") pos = l.newNo! + 1;
      if (start < 0) start = n;
      end = Math.max(end, n);
    }
    if (start >= 0) out.push([start, end]);
  }
  return out;
}

/**
 * Render a file diff for the model. New-file line numbers are shown as `L<n>`
 * so the model can cite exact lines; deleted lines have no number because
 * they cannot be commented on.
 */
export function renderDiffForModel(fd: FileDiff): string {
  const out: string[] = [];
  for (const h of fd.hunks) {
    out.push(`@@ ${h.header ? `${h.header} ` : ""}(new lines ${h.newStart}-${h.newStart + Math.max(0, h.newLines - 1)})`);
    for (const l of h.lines) {
      if (l.type === "add") out.push(`L${l.newNo} + ${l.text}`);
      else if (l.type === "ctx") out.push(`L${l.newNo}   ${l.text}`);
      else out.push(`     - ${l.text}`);
    }
  }
  return out.join("\n");
}
