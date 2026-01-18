import type { DiffLine } from "../types/diff";

export function parseDiff(diffText: string): DiffLine[] {
  const lines = diffText.split("\n");
  const result: DiffLine[] = [];
  let oldLine = 1;
  let newLine = 1;

  for (const line of lines) {
    // Skip git diff header lines
    if (
      line.startsWith("diff --git") ||
      line.startsWith("index ") ||
      line.startsWith("--- ") ||
      line.startsWith("+++ ")
    ) {
      continue;
    }

    if (line.startsWith("@@")) {
      // Parse hunk header to get starting line numbers
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
      }
      result.push({ type: "meta", content: line });
    } else if (line.startsWith("+")) {
      result.push({
        type: "added",
        content: line.slice(1),
        newLine: newLine++,
      });
    } else if (line.startsWith("-")) {
      result.push({
        type: "deleted",
        content: line.slice(1),
        oldLine: oldLine++,
      });
    } else if (line.startsWith("\\")) {
      result.push({ type: "meta", content: line });
    } else {
      // Context line (starts with space or is empty)
      const content = line.startsWith(" ") ? line.slice(1) : line;
      result.push({
        type: "context",
        content,
        oldLine: oldLine++,
        newLine: newLine++,
      });
    }
  }

  return result;
}
