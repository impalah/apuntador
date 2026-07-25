/// Window controls and theater mode.
///
/// Theater mode removes window decorations, maximizes and pins the window
/// always-on-top; the geometry it had before entering is saved so it can be
/// restored on exit.
use std::collections::HashMap;
use std::sync::Mutex;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct WindowState {
  width: f64,
  height: f64,
  x: f64,
  y: f64,
}

pub struct TheaterModeState {
  saved_states: Mutex<HashMap<String, WindowState>>, // window_label -> saved state
}

impl TheaterModeState {
  pub fn new() -> Self {
    Self {
      saved_states: Mutex::new(HashMap::new()),
    }
  }
}

// Commands to control theater mode
#[tauri::command]
pub fn toggle_theater_mode(window: tauri::WebviewWindow, theater_state: State<TheaterModeState>) -> Result<bool, String> {
  #[cfg(target_os = "macos")]
  {
    use tauri::{LogicalPosition, LogicalSize, PhysicalPosition, PhysicalSize};

    let window_label = window.label().to_string();

    // Check current state
    let has_decorations = window.is_decorated().map_err(|e| e.to_string())?;
    let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
    let is_in_theater = !has_decorations || is_fullscreen;

    if is_in_theater {
      // Exit theater mode

      // If in macOS native fullscreen, exit it first
      if is_fullscreen {
        window.set_fullscreen(false).map_err(|e| e.to_string())?;
      }

      // Restore decorations and always-on-top
      window.set_always_on_top(false).map_err(|e| e.to_string())?;
      window.set_decorations(true).map_err(|e| e.to_string())?;

      // Restore saved size and position
      let saved_states = theater_state.saved_states.lock().unwrap();
      if let Some(saved_state) = saved_states.get(&window_label) {
        let size = PhysicalSize::new(saved_state.width as u32, saved_state.height as u32);
        let position = PhysicalPosition::new(saved_state.x as i32, saved_state.y as i32);

        window.set_size(size).map_err(|e| e.to_string())?;
        window.set_position(position).map_err(|e| e.to_string())?;
      } else {
        // Fallback: center with default size
        if let Ok(monitor) = window.current_monitor() {
          if let Some(monitor) = monitor {
            let scale_factor = monitor.scale_factor();
            let size = LogicalSize::new(1200.0 / scale_factor, 800.0 / scale_factor);
            window.set_size(size).map_err(|e| e.to_string())?;
            window.center().map_err(|e| e.to_string())?;
          }
        }
      }

      return Ok(false);
    } else {
      // Save current window state before entering theater mode
      let current_size = window.outer_size().map_err(|e| e.to_string())?;
      let current_position = window.outer_position().map_err(|e| e.to_string())?;

      let window_state = WindowState {
        width: current_size.width as f64,
        height: current_size.height as f64,
        x: current_position.x as f64,
        y: current_position.y as f64,
      };

      let mut saved_states = theater_state.saved_states.lock().unwrap();
      saved_states.insert(window_label.clone(), window_state);
      drop(saved_states);

      // Enter theater mode: remove decorations, maximize, and always-on-top
      window.set_decorations(false).map_err(|e| e.to_string())?;

      if let Ok(monitor) = window.current_monitor() {
        if let Some(monitor) = monitor {
          let monitor_size = monitor.size();
          let scale_factor = monitor.scale_factor();
          let logical_size = LogicalSize::new(
            monitor_size.width as f64 / scale_factor,
            monitor_size.height as f64 / scale_factor,
          );

          window.set_size(logical_size).map_err(|e| e.to_string())?;
          window.set_position(LogicalPosition::new(0.0, 0.0)).map_err(|e| e.to_string())?;
          window.set_always_on_top(true).map_err(|e| e.to_string())?;
        }
      }

      return Ok(true);
    }
  }

  #[cfg(not(target_os = "macos"))]
  {
    println!("[THEATER] [toggle_theater_mode] Non-macOS platform");
    let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
    window.set_fullscreen(!is_fullscreen).map_err(|e| e.to_string())?;
    Ok(!is_fullscreen)
  }
}

#[tauri::command]
pub fn is_theater_mode(window: tauri::WebviewWindow) -> Result<bool, String> {
  // Theater mode is indicated by no decorations OR fullscreen on macOS
  #[cfg(target_os = "macos")]
  {
    let has_decorations = window.is_decorated().map_err(|e| e.to_string())?;
    let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;

    // Theater mode is active if EITHER:
    // 1. We explicitly removed decorations (our theater mode)
    // 2. macOS native fullscreen is active
    let result = !has_decorations || is_fullscreen;
    Ok(result)
  }

  #[cfg(not(target_os = "macos"))]
  {
    let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
    Ok(is_fullscreen)
  }
}

// Window control commands
#[tauri::command]
pub fn close_window(window: tauri::WebviewWindow) -> Result<(), String> {
  println!("🔴 Closing window via command: {}", window.label());
  window.close().map_err(|e| format!("Failed to close window: {}", e))
}

#[tauri::command]
pub fn minimize_window(window: tauri::WebviewWindow) -> Result<(), String> {
  println!("🔽 Minimizing window: {}", window.label());
  window.minimize().map_err(|e| format!("Failed to minimize window: {}", e))
}

#[tauri::command]
pub fn maximize_window(window: tauri::WebviewWindow) -> Result<(), String> {
  println!("🔼 Toggling maximize window: {}", window.label());

  let is_maximized = window.is_maximized().map_err(|e| e.to_string())?;

  if is_maximized {
    window.unmaximize().map_err(|e| format!("Failed to unmaximize window: {}", e))
  } else {
    window.maximize().map_err(|e| format!("Failed to maximize window: {}", e))
  }
}
