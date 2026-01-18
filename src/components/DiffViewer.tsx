import type { FileDiff } from "../types/git";

interface DiffViewerProps {
  diff: FileDiff | null;
  loading: boolean;
}

export function DiffViewer({ diff, loading }: DiffViewerProps) {
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

  return (
    <div className="diff-viewer">
      <pre className="whitespace-pre-wrap break-words font-mono text-sm p-4">
        {diff.diff}
      </pre>
    </div>
  );
}
