interface HeaderProps {
  repoPath: string | null;
  branch: string | null;
  onSelectDirectory: () => void;
  onRefresh: () => void;
}

export function Header({ repoPath, branch, onSelectDirectory, onRefresh }: HeaderProps) {
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
          <button className="btn btn-secondary" onClick={onRefresh}>
            Refresh
          </button>
        </>
      )}
    </header>
  );
}
