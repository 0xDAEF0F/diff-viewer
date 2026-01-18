use git2::{Delta, DiffOptions, Repository, StatusOptions};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileStatus {
    pub path: String,
    pub status: String,
    pub staged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStatus {
    pub is_repo: bool,
    pub branch: Option<String>,
    pub files: Vec<FileStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileDiff {
    pub path: String,
    pub diff: String,
    pub is_new: bool,
    pub is_deleted: bool,
    pub old_content: Option<String>,
    pub new_content: Option<String>,
}

pub fn get_repository_status(path: &str) -> Result<GitStatus, String> {
    let repo = match Repository::open(path) {
        Ok(r) => r,
        Err(_) => {
            return Ok(GitStatus {
                is_repo: false,
                branch: None,
                files: vec![],
            });
        }
    };

    let branch = repo
        .head()
        .ok()
        .and_then(|h| h.shorthand().map(|s| s.to_string()));

    let mut opts = StatusOptions::new();
    opts.include_untracked(true)
        .recurse_untracked_dirs(true)
        .include_ignored(false);

    let statuses = repo.statuses(Some(&mut opts)).map_err(|e| e.to_string())?;

    let mut files = Vec::new();

    for entry in statuses.iter() {
        let path = entry.path().unwrap_or("").to_string();
        let status = entry.status();

        // Check for staged changes
        if status.is_index_new() {
            files.push(FileStatus {
                path: path.clone(),
                status: "added".to_string(),
                staged: true,
            });
        } else if status.is_index_modified() {
            files.push(FileStatus {
                path: path.clone(),
                status: "modified".to_string(),
                staged: true,
            });
        } else if status.is_index_deleted() {
            files.push(FileStatus {
                path: path.clone(),
                status: "deleted".to_string(),
                staged: true,
            });
        } else if status.is_index_renamed() {
            files.push(FileStatus {
                path: path.clone(),
                status: "renamed".to_string(),
                staged: true,
            });
        }

        // Check for unstaged changes (working tree)
        if status.is_wt_modified() {
            files.push(FileStatus {
                path: path.clone(),
                status: "modified".to_string(),
                staged: false,
            });
        } else if status.is_wt_deleted() {
            files.push(FileStatus {
                path: path.clone(),
                status: "deleted".to_string(),
                staged: false,
            });
        } else if status.is_wt_renamed() {
            files.push(FileStatus {
                path: path.clone(),
                status: "renamed".to_string(),
                staged: false,
            });
        } else if status.is_wt_new() {
            files.push(FileStatus {
                path: path.clone(),
                status: "untracked".to_string(),
                staged: false,
            });
        }
    }

    Ok(GitStatus {
        is_repo: true,
        branch,
        files,
    })
}

fn get_blob_content_from_head(repo: &Repository, file_path: &str) -> Option<String> {
    let head = repo.head().ok()?;
    let tree = head.peel_to_tree().ok()?;
    let entry = tree.get_path(std::path::Path::new(file_path)).ok()?;
    let blob = entry.to_object(repo).ok()?.peel_to_blob().ok()?;
    std::str::from_utf8(blob.content()).ok().map(|s| s.to_string())
}

fn get_blob_content_from_index(repo: &Repository, file_path: &str) -> Option<String> {
    let index = repo.index().ok()?;
    let entry = index.get_path(std::path::Path::new(file_path), 0)?;
    let blob = repo.find_blob(entry.id).ok()?;
    std::str::from_utf8(blob.content()).ok().map(|s| s.to_string())
}

fn get_file_content_from_workdir(repo_path: &str, file_path: &str) -> Option<String> {
    let full_path = std::path::Path::new(repo_path).join(file_path);
    std::fs::read_to_string(full_path).ok()
}

pub fn get_file_diff(repo_path: &str, file_path: &str, staged: bool) -> Result<FileDiff, String> {
    let repo = Repository::open(repo_path).map_err(|e| e.to_string())?;

    let mut diff_opts = DiffOptions::new();
    diff_opts.pathspec(file_path);

    let diff = if staged {
        // Staged: diff between HEAD and index
        let head_tree = repo
            .head()
            .ok()
            .and_then(|h| h.peel_to_tree().ok());

        repo.diff_tree_to_index(head_tree.as_ref(), None, Some(&mut diff_opts))
            .map_err(|e| e.to_string())?
    } else {
        // Unstaged: diff between index and working directory
        repo.diff_index_to_workdir(None, Some(&mut diff_opts))
            .map_err(|e| e.to_string())?
    };

    let mut diff_text = String::new();
    let mut is_new = false;
    let mut is_deleted = false;

    diff.print(git2::DiffFormat::Patch, |delta, _hunk, line| {
        match delta.status() {
            Delta::Added => is_new = true,
            Delta::Deleted => is_deleted = true,
            _ => {}
        }

        // Include line origin character for content lines
        let origin = line.origin();
        match origin {
            '+' | '-' | ' ' => {
                diff_text.push(origin);
            }
            // File headers and hunk headers - include content as-is
            'F' | 'H' => {}
            // Binary file marker
            'B' => {}
            // Context line end (no newline at EOF marker)
            '>' | '<' | '=' => {
                diff_text.push_str("\\ ");
            }
            _ => {}
        }

        if let Ok(content) = std::str::from_utf8(line.content()) {
            diff_text.push_str(content);
        }

        true
    })
    .map_err(|e| e.to_string())?;

    // For untracked files, read the file content and create a pseudo-diff
    if diff_text.is_empty() {
        let full_path = std::path::Path::new(repo_path).join(file_path);
        if full_path.exists() {
            if let Ok(content) = std::fs::read_to_string(&full_path) {
                diff_text = content
                    .lines()
                    .map(|l| format!("+{}\n", l))
                    .collect();
                is_new = true;
            }
        }
    }

    // Get file contents for full-file syntax highlighting
    let (old_content, new_content) = if staged {
        // Staged changes: old=HEAD, new=index
        let old = get_blob_content_from_head(&repo, file_path);
        let new = get_blob_content_from_index(&repo, file_path);
        (old, new)
    } else {
        // Unstaged changes: old=index (or HEAD if not in index), new=workdir
        let old = get_blob_content_from_index(&repo, file_path)
            .or_else(|| get_blob_content_from_head(&repo, file_path));
        let new = get_file_content_from_workdir(repo_path, file_path);
        (old, new)
    };

    // Handle special cases
    let (old_content, new_content) = if is_new {
        // New file: no old content
        (None, new_content.or_else(|| get_file_content_from_workdir(repo_path, file_path)))
    } else if is_deleted {
        // Deleted file: no new content
        (old_content, None)
    } else {
        (old_content, new_content)
    };

    Ok(FileDiff {
        path: file_path.to_string(),
        diff: diff_text,
        is_new,
        is_deleted,
        old_content,
        new_content,
    })
}
