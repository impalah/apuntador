// Comandos para controlar el modo theater
#[tauri::command]
fn toggle_theater_mode(window: tauri::WebviewWindow) -> Result<bool, String> {
  #[cfg(target_os = "macos")]
  {
    use tauri::{LogicalPosition, LogicalSize};
    
    let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
    
    if is_fullscreen {
      // Salir del modo theater
      window.set_fullscreen(false).map_err(|e| e.to_string())?;
      window.set_decorations(true).map_err(|e| e.to_string())?;
      
      // Restaurar tamaño normal
      if let Ok(monitor) = window.current_monitor() {
        if let Some(monitor) = monitor {
          let scale_factor = monitor.scale_factor();
          let size = LogicalSize::new(1200.0 / scale_factor, 800.0 / scale_factor);
          window.set_size(size).map_err(|e| e.to_string())?;
          window.center().map_err(|e| e.to_string())?;
        }
      }
      
      Ok(false)
    } else {
      // Entrar en modo theater (fullscreen sin decoraciones ni menubar)
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
      
      Ok(true)
    }
  }
  
  #[cfg(not(target_os = "macos"))]
  {
    let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
    window.set_fullscreen(!is_fullscreen).map_err(|e| e.to_string())?;
    Ok(!is_fullscreen)
  }
}

#[tauri::command]
fn is_theater_mode(window: tauri::WebviewWindow) -> Result<bool, String> {
  let is_fullscreen = window.is_fullscreen().map_err(|e| e.to_string())?;
  let has_decorations = window.is_decorated().map_err(|e| e.to_string())?;
  
  // En modo theater: fullscreen o sin decoraciones
  Ok(is_fullscreen || !has_decorations)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      toggle_theater_mode,
      is_theater_mode
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Configurar fullscreen para macOS
      #[cfg(target_os = "macos")]
      {
        use tauri::Manager;
        if let Some(_window) = app.get_webview_window("main") {
          // En Tauri 2.x, el fullscreen se maneja de forma diferente
          // La configuración en tauri.conf.json debería ser suficiente
          println!("Configuración de ventana aplicada para macOS");
        }
      }
      
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
