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
    <header className="header">
      <button className="btn btn-primary" onClick={onSelectDirectory}>
        Open Repository
      </button>
      {repoPath && (
        <>
          <div className="repo-info">
            <span className="repo-path" title={repoPath}>
              {repoPath.split("/").pop() || repoPath}
            </span>
            {branch && <span className="branch-name">{branch}</span>}
          </div>
          <div className="header-actions">
            <label className="auto-refresh-toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => onAutoRefreshToggle(e.target.checked)}
              />
              Auto-refresh
            </label>
            <button className="btn btn-secondary" onClick={onRefresh}>
              Refresh
            </button>
          </div>
        </>
      )}
    </header>
  );
}
