use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher, EventKind};
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

const DEBOUNCE_MS: u64 = 300;

pub struct WatcherState {
    watcher: Mutex<Option<RecommendedWatcher>>,
    enabled: AtomicBool,
}

impl Default for WatcherState {
    fn default() -> Self {
        Self {
            watcher: Mutex::new(None),
            enabled: AtomicBool::new(true),
        }
    }
}

impl WatcherState {
    pub fn is_enabled(&self) -> bool {
        self.enabled.load(Ordering::Relaxed)
    }

    pub fn set_enabled(&self, enabled: bool) {
        self.enabled.store(enabled, Ordering::Relaxed);
    }
}

fn should_emit_event(path: &Path) -> bool {
    let path_str = path.to_string_lossy();

    // Filter out most .git internal changes, but allow .git/index for staging changes
    if path_str.contains("/.git/") {
        return path_str.ends_with("/.git/index");
    }

    true
}

pub fn start_watching(app: &AppHandle, path: &str, state: &WatcherState) -> Result<(), String> {
    // Stop any existing watcher first
    stop_watching(state);

    let app_handle = app.clone();
    let enabled = Arc::new(AtomicBool::new(true));
    let enabled_clone = enabled.clone();

    // Track enabled state from WatcherState
    enabled.store(state.is_enabled(), Ordering::Relaxed);

    // Debounce tracking
    let last_emit = Arc::new(Mutex::new(Instant::now() - Duration::from_millis(DEBOUNCE_MS)));

    let mut watcher = RecommendedWatcher::new(
        move |result: Result<notify::Event, notify::Error>| {
            if !enabled_clone.load(Ordering::Relaxed) {
                return;
            }

            if let Ok(event) = result {
                // Only trigger on modify, create, remove events
                let is_relevant = matches!(
                    event.kind,
                    EventKind::Modify(_) | EventKind::Create(_) | EventKind::Remove(_)
                );

                if !is_relevant {
                    return;
                }

                // Check if any path should trigger a refresh
                let should_refresh = event.paths.iter().any(|p| should_emit_event(p));

                if should_refresh {
                    // Debounce: only emit if enough time has passed
                    let mut last = last_emit.lock().unwrap();
                    let now = Instant::now();
                    if now.duration_since(*last) >= Duration::from_millis(DEBOUNCE_MS) {
                        *last = now;
                        let _ = app_handle.emit("file-changed", ());
                    }
                }
            }
        },
        Config::default(),
    )
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    watcher
        .watch(Path::new(path), RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch path: {}", e))?;

    let mut guard = state.watcher.lock().map_err(|e| e.to_string())?;
    *guard = Some(watcher);

    Ok(())
}

pub fn stop_watching(state: &WatcherState) {
    if let Ok(mut guard) = state.watcher.lock() {
        *guard = None;
    }
}
