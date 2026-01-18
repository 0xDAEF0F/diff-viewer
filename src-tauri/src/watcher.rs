use notify_debouncer_mini::notify::{Error as NotifyError, RecommendedWatcher, RecursiveMode};
use notify_debouncer_mini::{new_debouncer, DebouncedEvent, Debouncer};
use std::path::Path;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

type WatcherType = Debouncer<RecommendedWatcher>;
type DebounceResult = Result<Vec<DebouncedEvent>, NotifyError>;

#[derive(Default)]
pub struct WatcherState {
    watcher: Mutex<Option<WatcherType>>,
}

fn should_emit_event(path: &Path) -> bool {
    let path_str = path.to_string_lossy();

    // Filter out most .git internal changes, but allow .git/index for staging changes
    if path_str.contains("/.git/") {
        return path_str.ends_with("/.git/index");
    }

    true
}

fn should_refresh(events: &[DebouncedEvent]) -> bool {
    events.iter().any(|e| should_emit_event(&e.path))
}

pub fn start_watching(app: &AppHandle, path: &str, state: &WatcherState) -> Result<(), String> {
    // Stop any existing watcher first
    stop_watching(state);

    let app_handle = app.clone();

    let mut debouncer = new_debouncer(Duration::from_millis(300), move |result: DebounceResult| {
        if let Ok(events) = result {
            if should_refresh(&events) {
                let _ = app_handle.emit("file-changed", ());
            }
        }
    })
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    debouncer
        .watcher()
        .watch(Path::new(path), RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch path: {}", e))?;

    let mut guard = state.watcher.lock().map_err(|e| e.to_string())?;
    *guard = Some(debouncer);

    Ok(())
}

pub fn stop_watching(state: &WatcherState) {
    if let Ok(mut guard) = state.watcher.lock() {
        *guard = None;
    }
}
