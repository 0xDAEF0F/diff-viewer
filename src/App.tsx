import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import type { FileStatus, GitStatus, FileDiff } from "./types/git";
import { Header } from "./components/Header";
import { FileList } from "./components/FileList";
import { DiffViewer } from "./components/DiffViewer";
import { EmptyState } from "./components/EmptyState";

function App() {
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(
    null,
  );
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileStatus | null>(null);
  const [currentDiff, setCurrentDiff] = useState<FileDiff | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Refs for accessing current state in event handlers
  const selectedDirectoryRef = useRef(selectedDirectory);
  const selectedFileRef = useRef(selectedFile);
  const autoRefreshRef = useRef(autoRefresh);

  // Keep refs in sync with state
  useEffect(() => {
    selectedDirectoryRef.current = selectedDirectory;
  }, [selectedDirectory]);

  useEffect(() => {
    selectedFileRef.current = selectedFile;
  }, [selectedFile]);

  useEffect(() => {
    autoRefreshRef.current = autoRefresh;
  }, [autoRefresh]);

  // Listen for file changes from the backend
  useEffect(() => {
    const unlisten = listen("file-changed", async () => {
      if (!autoRefreshRef.current || !selectedDirectoryRef.current) return;

      try {
        const status = await invoke<GitStatus>("get_git_status", {
          path: selectedDirectoryRef.current,
        });
        setGitStatus(status);

        // Re-fetch diff if a file is selected
        if (selectedFileRef.current) {
          const diff = await invoke<FileDiff>("get_file_diff", {
            repoPath: selectedDirectoryRef.current,
            filePath: selectedFileRef.current.path,
            staged: selectedFileRef.current.staged,
          });
          setCurrentDiff(diff);
        }
      } catch (error) {
        console.error("Error refreshing on file change:", error);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleAutoRefreshToggle = useCallback(async (enabled: boolean) => {
    setAutoRefresh(enabled);
    try {
      await invoke("set_auto_refresh", { enabled });
    } catch (error) {
      console.error("Error setting auto refresh:", error);
    }
  }, []);

  const handleSelectDirectory = useCallback(async () => {
    try {
      const path = await invoke<string | null>("select_directory");
      if (path) {
        setSelectedDirectory(path);
        setSelectedFile(null);
        setCurrentDiff(null);
        const status = await invoke<GitStatus>("get_git_status", { path });
        setGitStatus(status);
        localStorage.setItem("lastDirectory", path);
      }
    } catch (error) {
      console.error("Error selecting directory:", error);
    }
  }, []);

  // Restore last directory on mount
  useEffect(() => {
    const restore = async () => {
      const savedPath = localStorage.getItem("lastDirectory");
      if (!savedPath) return;

      try {
        await invoke("start_file_watcher", { path: savedPath });
        setSelectedDirectory(savedPath);
        const status = await invoke<GitStatus>("get_git_status", {
          path: savedPath,
        });
        setGitStatus(status);
      } catch (error) {
        localStorage.removeItem("lastDirectory");
        console.error("Error restoring directory:", error);
      }
    };
    restore();
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!selectedDirectory) return;
    try {
      const status = await invoke<GitStatus>("get_git_status", {
        path: selectedDirectory,
      });
      setGitStatus(status);
      // Re-fetch diff if a file is selected
      if (selectedFile) {
        try {
          const diff = await invoke<FileDiff>("get_file_diff", {
            repoPath: selectedDirectory,
            filePath: selectedFile.path,
            staged: selectedFile.staged,
          });
          setCurrentDiff(diff);
        } catch (err) {
          console.error("Error fetching diff:", err);
          setCurrentDiff(null);
        }
      }
    } catch (error) {
      console.error("Error refreshing status:", error);
    }
  }, [selectedDirectory, selectedFile]);

  const handleFileSelect = useCallback(
    async (file: FileStatus) => {
      setSelectedFile(file);
      if (!selectedDirectory) return;

      try {
        const diff = await invoke<FileDiff>("get_file_diff", {
          repoPath: selectedDirectory,
          filePath: file.path,
          staged: file.staged,
        });
        setCurrentDiff(diff);
      } catch (error) {
        console.error("Error fetching diff:", error);
        setCurrentDiff(null);
      }
    },
    [selectedDirectory],
  );

  // No directory selected yet
  if (!selectedDirectory || !gitStatus) {
    return (
      <div className="app">
        <EmptyState type="no-repo" onSelectDirectory={handleSelectDirectory} />
      </div>
    );
  }

  // Not a git repository
  if (!gitStatus.is_repo) {
    return (
      <div className="app">
        <Header
          repoPath={selectedDirectory}
          branch={null}
          onSelectDirectory={handleSelectDirectory}
          onRefresh={handleRefresh}
          autoRefresh={autoRefresh}
          onAutoRefreshToggle={handleAutoRefreshToggle}
        />
        <div className="empty-state">
          <h2>Not a Git Repository</h2>
          <p>The selected directory is not a Git repository</p>
        </div>
      </div>
    );
  }

  // No changes
  if (gitStatus.files.length === 0) {
    return (
      <div className="app">
        <Header
          repoPath={selectedDirectory}
          branch={gitStatus.branch}
          onSelectDirectory={handleSelectDirectory}
          onRefresh={handleRefresh}
          autoRefresh={autoRefresh}
          onAutoRefreshToggle={handleAutoRefreshToggle}
        />
        <EmptyState type="no-changes" />
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        repoPath={selectedDirectory}
        branch={gitStatus.branch}
        onSelectDirectory={handleSelectDirectory}
        onRefresh={handleRefresh}
        autoRefresh={autoRefresh}
        onAutoRefreshToggle={handleAutoRefreshToggle}
      />
      <div className="main-content">
        <FileList
          files={gitStatus.files}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
        />
        <DiffViewer diff={currentDiff} />
      </div>
    </div>
  );
}

export default App;
