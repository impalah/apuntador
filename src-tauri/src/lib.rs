mod diagnostics;
mod dropbox;
mod mtls;
mod oauth;
mod window;

use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_opener::init())
    .manage(oauth::OAuthState::new())
    .manage(window::TheaterModeState::new())
    .invoke_handler(tauri::generate_handler![
      window::toggle_theater_mode,
      window::is_theater_mode,
      window::close_window,
      window::minimize_window,
      window::maximize_window,
      oauth::open_url,
      oauth::start_oauth_callback_server,
      oauth::backend_oauth_authorize,
      oauth::backend_oauth_token_exchange,
      oauth::start_dropbox_oauth,
      oauth::exchange_oauth_code,
      dropbox::list_dropbox_files,
      dropbox::download_dropbox_file,
      dropbox::upload_dropbox_file,
      diagnostics::test_event_emit,
      // mTLS commands
      mtls::check_enrollment_status,
      mtls::enroll_desktop_device,
      mtls::unenroll_desktop_device,
      mtls::get_desktop_device_info
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
    .on_window_event(|window, event| {
      #[cfg(debug_assertions)]
      if let tauri::WindowEvent::CloseRequested { .. } = event {
        println!("🔴 Close requested for window: {}", window.label());
        println!("Debug mode: Destroying window");
        // In debug mode, destroy the window immediately
        let _ = window.destroy();
        return;
      }

      #[cfg(not(debug_assertions))]
      if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        println!("🔴 Close requested for window: {}", window.label());
        println!("🏁 Production mode: Exiting application");
        // En producción, prevenir cierre y salir de toda la aplicación
        api.prevent_close();
        std::process::exit(0);
      }

      match event {
        tauri::WindowEvent::Destroyed => {
          println!(" Window destroyed: {}", window.label());
        }
        tauri::WindowEvent::ThemeChanged(_) => {
          // Detectar cambios de fullscreen a través de cambios en decoraciones
          #[cfg(target_os = "macos")]
          {
            if let Ok(has_decorations) = window.is_decorated() {
              // Emitir evento cuando cambia el estado de decoraciones (theater mode)
              let _ = window.emit("theater-mode-changed", !has_decorations);
            }
          }
        }
        _ => {}
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
