import { useEffect, useRef } from "react";
import { html } from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";
import type { FileDiff } from "../types/git";

interface DiffViewerProps {
  diff: FileDiff | null;
  loading: boolean;
}

export function DiffViewer({ diff, loading }: DiffViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !diff?.diff) return;

    // Create a proper unified diff format for diff2html
    const unifiedDiff = createUnifiedDiff(diff);

    const diffHtml = html(unifiedDiff, {
      drawFileList: false,
      matching: "lines",
      outputFormat: "side-by-side",
    });

    containerRef.current.innerHTML = diffHtml;
  }, [diff]);

  if (loading) {
    return (
      <div className="diff-viewer diff-loading">
        <div className="loading-spinner" />
        <span>Loading diff...</span>
      </div>
    );
  }

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

  return <div className="diff-viewer" ref={containerRef} />;
}

function createUnifiedDiff(diff: FileDiff): string {
  // If diff already has full unified diff format, use it directly
  if (diff.diff.startsWith("diff --git")) {
    return diff.diff;
  }

  // Build unified diff header (file-level headers only)
  const header = [
    `diff --git a/${diff.path} b/${diff.path}`,
    diff.is_new
      ? "new file mode 100644"
      : diff.is_deleted
        ? "deleted file mode 100644"
        : "",
    `--- ${diff.is_new ? "/dev/null" : `a/${diff.path}`}`,
    `+++ ${diff.is_deleted ? "/dev/null" : `b/${diff.path}`}`,
  ]
    .filter(Boolean)
    .join("\n");

  // If the diff already has hunk headers from git2, use them directly
  if (diff.diff.includes("@@")) {
    return `${header}\n${diff.diff}`;
  }

  // Otherwise, create a single hunk for the entire content (for untracked files)
  const lines = diff.diff.split("\n").filter((l) => l.length > 0);
  let addCount = 0;
  let removeCount = 0;

  for (const line of lines) {
    if (line.startsWith("+")) addCount++;
    else if (line.startsWith("-")) removeCount++;
  }

  const hunkHeader = `@@ -1,${removeCount} +1,${addCount} @@`;
  return `${header}\n${hunkHeader}\n${diff.diff}`;
}
