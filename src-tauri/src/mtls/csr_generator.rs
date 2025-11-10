/// CSR (Certificate Signing Request) generator for Desktop
/// 
/// Generates a private key and CSR for device enrollment.

use rcgen::{Certificate, CertificateParams, DnType, KeyPair};
use std::error::Error;

/// Generate a CSR with device information
pub fn generate_csr(device_id: &str, platform: &str) -> Result<(String, String), Box<dyn Error>> {
    println!("🔑 Generating CSR for device: {}", device_id);

    // Generate key pair
    let key_pair = KeyPair::generate(&rcgen::PKCS_ECDSA_P256_SHA256)?;
    let private_key_pem = key_pair.serialize_pem();

    // Create certificate parameters
    let mut params = CertificateParams::new(vec![
        format!("{}.apuntador.io", device_id),
    ]);

    // Set subject
    params.distinguished_name.push(
        DnType::CommonName,
        format!("Apuntador Desktop {}", device_id),
    );
    params.distinguished_name.push(
        DnType::OrganizationName,
        "Apuntador",
    );
    params.distinguished_name.push(
        DnType::OrganizationalUnitName,
        format!("Desktop-{}", platform),
    );

    // Add custom attributes for device info
    params.custom_extensions = vec![];

    // Generate CSR
    let cert = Certificate::from_params(params)?;
    let csr_pem = cert.serialize_request_pem()?;

    println!("✅ CSR generated successfully");
    println!("   Device ID: {}", device_id);
    println!("   Platform: {}", platform);
    println!("   CSR length: {} bytes", csr_pem.len());
    println!("   Key length: {} bytes", private_key_pem.len());

    Ok((csr_pem, private_key_pem))
}

/// Get unique device ID for the current machine
pub fn get_device_id() -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        get_device_id_macos()
    }

    #[cfg(target_os = "windows")]
    {
        get_device_id_windows()
    }

    #[cfg(target_os = "linux")]
    {
        get_device_id_linux()
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        Err("Unsupported platform".to_string())
    }
}

#[cfg(target_os = "macos")]
fn get_device_id_macos() -> Result<String, String> {
    use std::process::Command;

    println!("🔍 Getting macOS device ID (IOPlatformUUID)...");

    let output = Command::new("ioreg")
        .args(&["-rd1", "-c", "IOPlatformExpertDevice"])
        .output()
        .map_err(|e| format!("Failed to run ioreg: {}", e))?;

    let output_str = String::from_utf8_lossy(&output.stdout);

    // Parse IOPlatformUUID from output
    // Format: "IOPlatformUUID" = "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
    for line in output_str.lines() {
        if line.contains("IOPlatformUUID") {
            // Find the UUID between the last pair of quotes
            let parts: Vec<&str> = line.split('"').collect();
            // The UUID should be in the last quoted section
            if let Some(uuid) = parts.iter().rev().find(|s| s.contains('-') && s.len() == 36) {
                let uuid = uuid.trim();
                println!("✅ macOS Device ID: {}", uuid);
                return Ok(uuid.to_string());
            }
        }
    }

    Err("Failed to parse IOPlatformUUID from ioreg output".to_string())
}

#[cfg(target_os = "windows")]
fn get_device_id_windows() -> Result<String, String> {
    // TODO: Implement Windows Machine GUID
    // HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Cryptography\MachineGuid
    println!("⚠️  Windows device ID not yet implemented");
    Ok(uuid::Uuid::new_v4().to_string())
}

#[cfg(target_os = "linux")]
fn get_device_id_linux() -> Result<String, String> {
    // Read /etc/machine-id or /var/lib/dbus/machine-id
    println!("🔍 Getting Linux device ID (machine-id)...");

    std::fs::read_to_string("/etc/machine-id")
        .or_else(|_| std::fs::read_to_string("/var/lib/dbus/machine-id"))
        .map(|s| {
            let id = s.trim().to_string();
            println!("✅ Linux Device ID: {}", id);
            id
        })
        .map_err(|e| format!("Failed to read machine-id: {}", e))
}

/// Get platform name
/// Returns "desktop" for all desktop platforms (backend expects this value)
pub fn get_platform() -> String {
    // Backend expects "desktop" for all desktop platforms (macos, windows, linux)
    "desktop".to_string()
}

/// Get OS version
pub fn get_os_version() -> String {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        if let Ok(output) = Command::new("sw_vers")
            .arg("-productVersion")
            .output()
        {
            if let Ok(version) = String::from_utf8(output.stdout) {
                return version.trim().to_string();
            }
        }
        "unknown".to_string()
    }

    #[cfg(not(target_os = "macos"))]
    {
        "unknown".to_string()
    }
}

/// Get device model
pub fn get_device_model() -> String {
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        if let Ok(output) = Command::new("sysctl")
            .arg("-n")
            .arg("hw.model")
            .output()
        {
            if let Ok(model) = String::from_utf8(output.stdout) {
                return model.trim().to_string();
            }
        }
        "Mac".to_string()
    }

    #[cfg(not(target_os = "macos"))]
    {
        "Desktop".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_csr() {
        let (csr, private_key) = generate_csr("test-device", "desktop").unwrap();
        
        assert!(csr.contains("BEGIN CERTIFICATE REQUEST"));
        assert!(csr.contains("END CERTIFICATE REQUEST"));
        assert!(private_key.contains("BEGIN PRIVATE KEY"));
        assert!(private_key.contains("END PRIVATE KEY"));
    }

    #[test]
    #[cfg(target_os = "macos")]
    fn test_get_device_id_macos() {
        let device_id = get_device_id().unwrap();
        assert!(!device_id.is_empty());
        assert!(device_id.contains('-')); // UUID format
    }

    #[test]
    fn test_get_platform() {
        let platform = get_platform();
        assert!(!platform.is_empty());
        // Backend expects "desktop" for all desktop platforms
        assert_eq!(platform, "desktop");
    }
}
