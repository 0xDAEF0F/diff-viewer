import type { FileStatus } from "../types/git";
import { FileItem } from "./FileItem";

interface FileListProps {
  files: FileStatus[];
  selectedFile: FileStatus | null;
  onFileSelect: (file: FileStatus) => void;
}

export function FileList({ files, selectedFile, onFileSelect }: FileListProps) {
  const stagedFiles = files.filter((f) => f.staged);
  const unstagedFiles = files.filter((f) => !f.staged && f.status !== "untracked");
  const untrackedFiles = files.filter((f) => f.status === "untracked");

  const renderSection = (title: string, sectionFiles: FileStatus[]) => {
    if (sectionFiles.length === 0) return null;

    return (
      <div className="file-section">
        <div className="section-header">
          {title} ({sectionFiles.length})
        </div>
        {sectionFiles.map((file) => (
          <FileItem
            key={`${file.path}-${file.staged}`}
            file={file}
            isSelected={
              selectedFile?.path === file.path &&
              selectedFile?.staged === file.staged
            }
            onClick={() => onFileSelect(file)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="file-list">
      {renderSection("Staged Changes", stagedFiles)}
      {renderSection("Changes", unstagedFiles)}
      {renderSection("Untracked Files", untrackedFiles)}
    </div>
  );
}
