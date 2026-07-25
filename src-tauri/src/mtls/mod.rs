/// mTLS module for Desktop platforms
/// 
/// Provides certificate pinning, client certificate management,
/// and secure storage for mTLS authentication.

pub mod certificate_pinning;
pub mod certificate_storage;
pub mod csr_generator;
pub mod enrollment;
pub mod http_client;

pub use certificate_storage::{CertificateStore, StoredCertificate};
// Unused re-exports removed - these functions are not yet integrated into main flow

// ==================== mTLS Commands ====================

/// Check device enrollment status
#[tauri::command]
pub async fn check_enrollment_status() -> Result<enrollment::EnrollmentResult, String> {
  println!("[Tauri Command] check_enrollment_status called");
  enrollment::check_enrollment_status().await
}

/// Enroll device with backend
#[tauri::command]
pub async fn enroll_desktop_device(
  backend_url: String,
  certificate_pins: Vec<String>,
) -> Result<enrollment::EnrollmentResult, String> {
  println!("[Tauri Command] enroll_desktop_device called");
  println!("   Backend URL: {}", backend_url);
  println!("   Certificate Pins: {:?}", certificate_pins);

  enrollment::enroll_device(&backend_url, certificate_pins).await
}

/// Unenroll device (delete certificate)
#[tauri::command]
pub async fn unenroll_desktop_device() -> Result<(), String> {
  println!(" [Tauri Command] unenroll_desktop_device called");
  enrollment::unenroll_device().await
}

/// Get device information
#[tauri::command]
pub fn get_desktop_device_info() -> Result<serde_json::Value, String> {
  println!("[Tauri Command] get_desktop_device_info called");

  let device_id = csr_generator::get_device_id()?;
  let platform = csr_generator::get_platform();
  let device_model = csr_generator::get_device_model();
  let os_version = csr_generator::get_os_version();
  let has_certificate = CertificateStore::exists();

  Ok(serde_json::json!({
    "device_id": device_id,
    "platform": platform,
    "device_model": device_model,
    "os_version": os_version,
    "has_certificate": has_certificate,
  }))
}
