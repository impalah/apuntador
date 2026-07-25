/// Development helper to verify that Tauri event emission (Rust -> frontend)
/// works end to end; invoked from tauriService.ts's diagnostics.
use tauri::Emitter;

#[tauri::command]
pub fn test_event_emit(app_handle: tauri::AppHandle) -> Result<String, String> {
  println!("[TEST] Test: Emitting test event...");

  let result = app_handle.emit("test-event", serde_json::json!({
    "message": "test successful",
    "timestamp": std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs()
  }));

  match result {
    Ok(_) => {
      println!("Test: Event emitted correctly");
      Ok("Event emitted successfully".to_string())
    },
    Err(e) => {
      println!("[ERROR] Test: Error emitiendo evento: {}", e);
      Err(format!("Failed to emit event: {}", e))
    }
  }
}
