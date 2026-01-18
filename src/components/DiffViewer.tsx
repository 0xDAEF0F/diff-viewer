import { useState } from "react";
import type { FileDiff } from "../types/git";

interface DiffViewerProps {
  diff: FileDiff | null;
}

type LineType = "added" | "deleted" | "context" | "meta";

interface DiffLine {
  type: LineType;
  content: string;
  oldLine?: number;
  newLine?: number;
}

function parseDiff(diffText: string): DiffLine[] {
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

function UnifiedView({ lines }: { lines: DiffLine[] }) {
  return (
    <table className="w-full font-mono text-sm border-collapse">
      <tbody>
        {lines.map((line, idx) => (
          <tr
            key={idx}
            className={
              line.type === "added"
                ? "bg-green-500/20"
                : line.type === "deleted"
                  ? "bg-red-500/20"
                  : line.type === "meta"
                    ? "bg-[var(--bg-tertiary)]"
                    : ""
            }
          >
            <td className="w-12 text-right pr-2 select-none text-[var(--text-secondary)] border-r border-[var(--border-color)]">
              {line.oldLine ?? ""}
            </td>
            <td className="w-12 text-right pr-2 select-none text-[var(--text-secondary)] border-r border-[var(--border-color)]">
              {line.newLine ?? ""}
            </td>
            <td className="w-6 text-center select-none text-[var(--text-secondary)]">
              {line.type === "added"
                ? "+"
                : line.type === "deleted"
                  ? "-"
                  : " "}
            </td>
            <td
              className={`pl-2 whitespace-pre ${
                line.type === "added"
                  ? "text-green-400"
                  : line.type === "deleted"
                    ? "text-red-400"
                    : line.type === "meta"
                      ? "text-[var(--text-secondary)] italic"
                      : "text-[var(--text-primary)]"
              }`}
            >
              {line.content}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface SideBySideLine {
  left?: DiffLine;
  right?: DiffLine;
}

function buildSideBySideLines(lines: DiffLine[]): SideBySideLine[] {
  const result: SideBySideLine[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.type === "meta") {
      result.push({ left: line, right: line });
      i++;
    } else if (line.type === "context") {
      result.push({ left: line, right: line });
      i++;
    } else if (line.type === "deleted") {
      // Collect consecutive deletions and additions
      const deletions: DiffLine[] = [];
      const additions: DiffLine[] = [];

      while (i < lines.length && lines[i].type === "deleted") {
        deletions.push(lines[i]);
        i++;
      }
      while (i < lines.length && lines[i].type === "added") {
        additions.push(lines[i]);
        i++;
      }

      // Pair deletions with additions
      const maxLen = Math.max(deletions.length, additions.length);
      for (let j = 0; j < maxLen; j++) {
        result.push({
          left: deletions[j],
          right: additions[j],
        });
      }
    } else if (line.type === "added") {
      result.push({ right: line });
      i++;
    } else {
      i++;
    }
  }

  return result;
}

function SideBySideView({ lines }: { lines: DiffLine[] }) {
  const sideBySideLines = buildSideBySideLines(lines);

  const renderCell = (line?: DiffLine, isLeft?: boolean) => {
    if (!line) {
      return (
        <>
          <td className="w-12 text-right pr-2 select-none text-[var(--text-secondary)] border-r border-[var(--border-color)] bg-[var(--bg-tertiary)]">
            {""}
          </td>
          <td className="pl-2 whitespace-pre bg-[var(--bg-tertiary)]">{""}</td>
        </>
      );
    }

    const lineNum = isLeft ? line.oldLine : line.newLine;
    const bgClass =
      line.type === "added"
        ? "bg-green-500/20"
        : line.type === "deleted"
          ? "bg-red-500/20"
          : line.type === "meta"
            ? "bg-[var(--bg-tertiary)]"
            : "";
    const textClass =
      line.type === "added"
        ? "text-green-400"
        : line.type === "deleted"
          ? "text-red-400"
          : line.type === "meta"
            ? "text-[var(--text-secondary)] italic"
            : "text-[var(--text-primary)]";

    return (
      <>
        <td
          className={`w-12 text-right pr-2 select-none text-[var(--text-secondary)] border-r border-[var(--border-color)] ${bgClass}`}
        >
          {lineNum ?? ""}
        </td>
        <td className={`pl-2 whitespace-pre ${bgClass} ${textClass}`}>
          {line.content}
        </td>
      </>
    );
  };

  return (
    <table className="w-full font-mono text-sm border-collapse">
      <tbody>
        {sideBySideLines.map((row, idx) => (
          <tr key={idx}>
            {renderCell(row.left, true)}
            <td className="w-px bg-[var(--border-color)]" />
            {renderCell(row.right, false)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DiffViewer({ diff }: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified");

  if (!diff) {
    return (
      <div className="diff-viewer diff-empty">
        <p>Select a file to view its diff</p>
      </div>
    );
  }

  if (!diff.diff) {
    return (
      <div className="diff-viewer diff-empty">
        <p>No changes in this file</p>
      </div>
    );
  }

  const lines = parseDiff(diff.diff);

  return (
    <div className="diff-viewer flex flex-col h-full">
      <div className="flex justify-end p-2 border-b border-[var(--border-color)]">
        <div className="flex rounded overflow-hidden border border-[var(--border-color)]">
          <button
            onClick={() => setViewMode("unified")}
            className={`px-3 py-1 text-sm ${
              viewMode === "unified"
                ? "bg-[var(--accent-color)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            }`}
          >
            Unified
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={`px-3 py-1 text-sm ${
              viewMode === "split"
                ? "bg-[var(--accent-color)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            }`}
          >
            Split
          </button>
        </div>
      </div>
      <div className="overflow-auto flex-1 p-2">
        {viewMode === "unified" ? (
          <UnifiedView lines={lines} />
        ) : (
          <SideBySideView lines={lines} />
        )}
      </div>
    </div>
  );
}
