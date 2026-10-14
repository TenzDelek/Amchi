import { describe, expect, it } from "vitest";
import { addedLines, changedRanges, commentableLines, parseUnifiedDiff, renderDiffForModel } from "../src/git/diff.js";
import { parseModelJson } from "../src/llm/json.js";

const DIFF = `diff --git a/src/a.ts b/src/a.ts
index 111..222 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,4 +1,5 @@ export function a() {
 const x = 1;
-const y = 2;
+const y = 3;
+const z = 4;
 const w = 5;
 const v = 6;
@@ -20,2 +21,2 @@
 keep();
-gone();
+here();
diff --git a/new.py b/new.py
new file mode 100644
index 000..333
--- /dev/null
+++ b/new.py
@@ -0,0 +1,2 @@
+def f():
+    return 1
diff --git a/old.go b/old.go
deleted file mode 100644
index 444..000
--- a/old.go
+++ /dev/null
@@ -1 +0,0 @@
-package old
diff --git a/from.ts b/to.ts
similarity index 90%
rename from from.ts
rename to to.ts
index 555..666 100644
--- a/from.ts
+++ b/to.ts
@@ -1 +1 @@
-export const a = 1;
+export const a = 2;
diff --git a/img.png b/img.png
index 777..888 100644
Binary files a/img.png and b/img.png differ
`;

describe("parseUnifiedDiff", () => {
  const files = parseUnifiedDiff(DIFF);

  it("parses statuses and paths", () => {
    expect(files.map((f) => [f.path, f.status, f.binary])).toEqual([
      ["src/a.ts", "modified", false],
      ["new.py", "added", false],
      ["old.go", "deleted", false],
      ["to.ts", "renamed", false],
      ["img.png", "modified", true],
    ]);
    expect(files[3].oldPath).toBe("from.ts");
  });

  it("tracks line numbers", () => {
    const a = files[0];
    expect(a.hunks).toHaveLength(2);
    expect(a.additions).toBe(3);
    expect(a.deletions).toBe(2);
    expect(addedLines(a)).toEqual([2, 3, 22]);
    const lines = commentableLines(a);
    expect([...lines.keys()]).toEqual([1, 2, 3, 4, 5, 21, 22]);
    expect(lines.get(22)).toBe(1);
    expect(changedRanges(a)).toEqual([
      [2, 3],
      [22, 22],
    ]);
  });

  it("renders new-file line numbers for the model", () => {
    const r = renderDiffForModel(files[0]);
    expect(r).toContain("L2 + const y = 3;");
    expect(r).toContain("     - const y = 2;");
    expect(r).toContain("L1   const x = 1;");
  });
});

describe("parseModelJson", () => {
  it("handles fences, prose and trailing commas", () => {
    expect(parseModelJson('Sure!\n```json\n{"a": [1, 2,],}\n```')).toEqual({ a: [1, 2] });
    expect(parseModelJson('Here: {"x": "a } b", "y": {"z": 1}} trailing')).toEqual({ x: "a } b", y: { z: 1 } });
    expect(() => parseModelJson("no json here")).toThrow();
  });
});
