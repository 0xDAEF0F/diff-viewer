import { useState } from "react";
import type { FileDiff } from "../types/git";
import { parseDiff } from "../utils/parseDiff";
import { UnifiedView } from "./UnifiedView";
import { SideBySideView } from "./SideBySideView";

interface DiffViewerProps {
  diff: FileDiff | null;
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
