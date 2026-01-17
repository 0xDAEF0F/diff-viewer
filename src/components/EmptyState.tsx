interface EmptyStateProps {
  type: "no-repo" | "no-changes";
  onSelectDirectory?: () => void;
}

export function EmptyState({ type, onSelectDirectory }: EmptyStateProps) {
  if (type === "no-repo") {
    return (
      <div className="empty-state">
        <h2>Git Diff Viewer</h2>
        <p>Open a Git repository to view changes</p>
        {onSelectDirectory && (
          <button className="btn btn-primary" onClick={onSelectDirectory}>
            Open Repository
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="empty-state">
      <h2>No Changes</h2>
      <p>This repository has no uncommitted changes</p>
    </div>
  );
}
