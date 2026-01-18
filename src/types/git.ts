export interface FileStatus {
  path: string;
  status: "modified" | "added" | "deleted" | "renamed" | "untracked";
  staged: boolean;
}

export interface GitStatus {
  is_repo: boolean;
  branch: string | null;
  files: FileStatus[];
}

export interface FileDiff {
  path: string;
  diff: string;
  is_new: boolean;
  is_deleted: boolean;
  old_content: string | null;
  new_content: string | null;
}
