interface HeaderProps {
  repoPath: string | null;
  branch: string | null;
  onSelectDirectory: () => void;
  onRefresh: () => void;
  autoRefresh: boolean;
  onAutoRefreshToggle: (enabled: boolean) => void;
}

export function Header({
  repoPath,
  branch,
  onSelectDirectory,
  onRefresh,
  autoRefresh,
  onAutoRefreshToggle,
}: HeaderProps) {
  return (
    <header className="flex items-center gap-4 px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] h-14 shrink-0">
      <button
        className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        onClick={onSelectDirectory}
      >
        Open Repository
      </button>
      {repoPath && (
        <>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span
              className="font-semibold text-[var(--text-primary)] overflow-hidden text-ellipsis whitespace-nowrap"
              title={repoPath}
            >
              {repoPath.split("/").pop() || repoPath}
            </span>
            {branch && (
              <span className="px-2.5 py-1 bg-[var(--bg-tertiary)] rounded-full text-xs text-[var(--text-secondary)]">
                {branch}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-3.5 h-3.5 cursor-pointer accent-[var(--accent-color)]"
                checked={autoRefresh}
                onChange={(e) => onAutoRefreshToggle(e.target.checked)}
              />
              Auto-refresh
            </label>
            <button
              className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              onClick={onRefresh}
            >
              Refresh
            </button>
          </div>
        </>
      )}
    </header>
  );
}
