mod git;

use git::{FileDiff, GitStatus};
use tauri_plugin_dialog::DialogExt;
use tokio::sync::oneshot;

#[tauri::command]
async fn select_directory(app: tauri::AppHandle) -> Option<String> {
    let (tx, rx) = oneshot::channel();

    app.dialog()
        .file()
        .pick_folder(move |folder_path| {
            let _ = tx.send(folder_path.map(|p| p.to_string()));
        });

    rx.await.ok().flatten()
}

#[tauri::command]
fn get_git_status(path: String) -> Result<GitStatus, String> {
    git::get_repository_status(&path)
}

#[tauri::command]
fn get_file_diff(repo_path: String, file_path: String, staged: bool) -> Result<FileDiff, String> {
    git::get_file_diff(&repo_path, &file_path, staged)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            select_directory,
            get_git_status,
            get_file_diff
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
