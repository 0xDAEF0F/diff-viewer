import type { FileStatus } from "../types/git";

interface FileItemProps {
  file: FileStatus;
  isSelected: boolean;
  onClick: () => void;
}

const statusIcons: Record<string, string> = {
  modified: "M",
  added: "A",
  deleted: "D",
  renamed: "R",
  untracked: "?",
};

export function FileItem({ file, isSelected, onClick }: FileItemProps) {
  return (
    <div
      className={`file-item ${isSelected ? "selected" : ""}`}
      onClick={onClick}
    >
      <span className={`status-icon status-${file.status}`}>
        {statusIcons[file.status] || "?"}
      </span>
      <span className="file-path" title={file.path}>
        {file.path}
      </span>
    </div>
  );
}
