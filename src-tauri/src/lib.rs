mod git;
mod watcher;

use git::{FileDiff, GitStatus};
use tauri_plugin_dialog::DialogExt;
use tokio::sync::oneshot;
use watcher::WatcherState;

#[tauri::command]
async fn select_directory(
    app: tauri::AppHandle,
    state: tauri::State<'_, WatcherState>,
) -> Result<Option<String>, String> {
    let (tx, rx) = oneshot::channel();

    app.dialog()
        .file()
        .pick_folder(move |folder_path| {
            let _ = tx.send(folder_path.map(|p| p.to_string()));
        });

    let path = rx.await.ok().flatten();

    if let Some(ref p) = path {
        watcher::start_watching(&app, p, &state)?;
    }

    Ok(path)
}

#[tauri::command]
fn get_git_status(path: String) -> Result<GitStatus, String> {
    git::get_repository_status(&path)
}

#[tauri::command]
fn get_file_diff(repo_path: String, file_path: String, staged: bool) -> Result<FileDiff, String> {
    git::get_file_diff(&repo_path, &file_path, staged)
}

#[tauri::command]
fn start_file_watcher(
    app: tauri::AppHandle,
    state: tauri::State<'_, WatcherState>,
    path: String,
) -> Result<(), String> {
    watcher::start_watching(&app, &path, &state)
}

#[tauri::command]
fn stop_file_watcher(state: tauri::State<'_, WatcherState>) {
    watcher::stop_watching(&state);
}

#[tauri::command]
fn set_auto_refresh(state: tauri::State<'_, WatcherState>, enabled: bool) {
    state.set_enabled(enabled);
}

#[tauri::command]
fn get_auto_refresh_enabled(state: tauri::State<'_, WatcherState>) -> bool {
    state.is_enabled()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(WatcherState::default())
        .invoke_handler(tauri::generate_handler![
            select_directory,
            get_git_status,
            get_file_diff,
            start_file_watcher,
            stop_file_watcher,
            set_auto_refresh,
            get_auto_refresh_enabled
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
