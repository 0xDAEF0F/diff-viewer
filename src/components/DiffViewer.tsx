import { useState, useEffect, useMemo } from "react";
import type { FileDiff } from "../types/git";
import type { DiffLine } from "../types/diff";
import { parseDiff } from "../utils/parseDiff";
import { getLanguageFromPath } from "../utils/languageMap";
import { highlightLines, initHighlighter } from "../utils/highlighter";
import { UnifiedView } from "./UnifiedView";
import { SideBySideView } from "./SideBySideView";

interface DiffViewerProps {
  diff: FileDiff | null;
}

export function DiffViewer({ diff }: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified");
  const [highlightedLines, setHighlightedLines] = useState<DiffLine[]>([]);
  const [isHighlighting, setIsHighlighting] = useState(false);

  const parsedLines = useMemo(() => {
    if (!diff?.diff) return [];
    return parseDiff(diff.diff);
  }, [diff?.diff]);

  const language = useMemo(() => {
    if (!diff?.path) return null;
    return getLanguageFromPath(diff.path);
  }, [diff?.path]);

  useEffect(() => {
    let cancelled = false;

    async function applyHighlighting() {
      if (parsedLines.length === 0 || !language) {
        setHighlightedLines(parsedLines);
        return;
      }

      setIsHighlighting(true);
      try {
        await initHighlighter();
        const highlighted = await highlightLines(parsedLines, language);
        if (!cancelled) {
          setHighlightedLines(highlighted);
        }
      } catch (error) {
        console.error("Highlighting error:", error);
        if (!cancelled) {
          setHighlightedLines(parsedLines);
        }
      } finally {
        if (!cancelled) {
          setIsHighlighting(false);
        }
      }
    }

    applyHighlighting();

    return () => {
      cancelled = true;
    };
  }, [parsedLines, language]);

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

  const linesToRender = isHighlighting ? parsedLines : highlightedLines;

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
          <UnifiedView lines={linesToRender} />
        ) : (
          <SideBySideView lines={linesToRender} />
        )}
      </div>
    </div>
  );
}
