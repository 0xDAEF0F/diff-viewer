interface EmptyStateProps {
  type: "no-repo" | "no-changes";
  onSelectDirectory?: () => void;
}

export function EmptyState({ type, onSelectDirectory }: EmptyStateProps) {
  if (type === "no-repo") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-secondary)] text-center p-10">
        <h2 className="text-[var(--text-primary)] font-semibold text-xl">
          Git Diff Viewer
        </h2>
        <p className="max-w-md">Open a Git repository to view changes</p>
        {onSelectDirectory && (
          <button
            className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-md font-medium hover:opacity-90 transition-opacity"
            onClick={onSelectDirectory}
          >
            Open Repository
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-secondary)] text-center p-10">
      <h2 className="text-[var(--text-primary)] font-semibold text-xl">
        No Changes
      </h2>
      <p className="max-w-md">This repository has no uncommitted changes</p>
    </div>
  );
}
