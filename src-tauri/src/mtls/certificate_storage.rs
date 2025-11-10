/// Secure certificate storage for Desktop platforms
/// 
/// - macOS: Uses Keychain (hardware-bound)
/// - Windows: Uses Certificate Store + DPAPI
/// - Linux: Uses encrypted file with AES-256-GCM

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredCertificate {
    /// Device ID (unique identifier)
    pub device_id: String,
    /// Certificate in PEM format
    pub certificate_pem: String,
    /// Private key in PEM format (encrypted)
    pub private_key_pem: String,
    /// Certificate serial number
    pub serial_number: String,
    /// Expiration date (ISO 8601)
    pub expires_at: String,
    /// Platform where certificate was generated
    pub platform: String,
}

pub struct CertificateStore;

impl CertificateStore {
    const SERVICE_NAME: &'static str = "io.apuntador.app";
    const ACCOUNT_NAME: &'static str = "mtls-certificate";

    /// Store certificate securely (platform-specific)
    pub fn store(cert: &StoredCertificate) -> Result<(), String> {
        #[cfg(target_os = "macos")]
        return Self::store_macos(cert);

        #[cfg(target_os = "windows")]
        return Self::store_windows(cert);

        #[cfg(target_os = "linux")]
        return Self::store_linux(cert);

        #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
        Err("Unsupported platform".to_string())
    }

    /// Retrieve certificate from secure storage
    pub fn retrieve() -> Result<StoredCertificate, String> {
        #[cfg(target_os = "macos")]
        return Self::retrieve_macos();

        #[cfg(target_os = "windows")]
        return Self::retrieve_windows();

        #[cfg(target_os = "linux")]
        return Self::retrieve_linux();

        #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
        Err("Unsupported platform".to_string())
    }

    /// Delete certificate from storage
    pub fn delete() -> Result<(), String> {
        #[cfg(target_os = "macos")]
        return Self::delete_macos();

        #[cfg(target_os = "windows")]
        return Self::delete_windows();

        #[cfg(target_os = "linux")]
        return Self::delete_linux();

        #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
        Err("Unsupported platform".to_string())
    }

    /// Check if certificate exists
    pub fn exists() -> bool {
        Self::retrieve().is_ok()
    }

    // ==================== macOS Implementation ====================
    
    #[cfg(target_os = "macos")]
    fn store_macos(cert: &StoredCertificate) -> Result<(), String> {
        use security_framework::passwords::{set_generic_password};

        println!("🔐 Storing certificate in macOS Keychain...");

        // Serialize certificate to JSON
        let cert_json = serde_json::to_string(cert)
            .map_err(|e| format!("Failed to serialize certificate: {}", e))?;

        // Store in Keychain
        // macOS automatically encrypts keychain items with:
        // - User's login password
        // - Hardware UID (on Apple Silicon/T2)
        
        // Delete existing entry if any
        let _ = Self::delete_macos();

        // Add new entry
        set_generic_password(
            Self::SERVICE_NAME,
            Self::ACCOUNT_NAME,
            cert_json.as_bytes(),
        )
        .map_err(|e| format!("Failed to store in Keychain: {}", e))?;

        println!("✅ Certificate stored successfully in macOS Keychain");
        Ok(())
    }

    #[cfg(target_os = "macos")]
    fn retrieve_macos() -> Result<StoredCertificate, String> {
        use security_framework::passwords::get_generic_password;

        println!("🔍 Retrieving certificate from macOS Keychain...");

        let password = get_generic_password(Self::SERVICE_NAME, Self::ACCOUNT_NAME)
            .map_err(|e| format!("Certificate not found in Keychain: {}", e))?;

        let cert_json = String::from_utf8(password.to_vec())
            .map_err(|e| format!("Invalid UTF-8 in stored certificate: {}", e))?;

        let cert: StoredCertificate = serde_json::from_str(&cert_json)
            .map_err(|e| format!("Failed to deserialize certificate: {}", e))?;

        println!("✅ Certificate retrieved from Keychain");
        Ok(cert)
    }

    #[cfg(target_os = "macos")]
    fn delete_macos() -> Result<(), String> {
        use security_framework::passwords::delete_generic_password;

        println!("🗑️  Deleting certificate from macOS Keychain...");

        delete_generic_password(Self::SERVICE_NAME, Self::ACCOUNT_NAME)
            .map_err(|e| format!("Failed to delete from Keychain: {}", e))?;

        println!("✅ Certificate deleted from Keychain");
        Ok(())
    }

    // ==================== Windows Implementation ====================
    
    #[cfg(target_os = "windows")]
    fn store_windows(cert: &StoredCertificate) -> Result<(), String> {
        // TODO: Implement Windows Certificate Store + DPAPI
        println!("⚠️  Windows certificate storage not yet implemented");
        Err("Windows storage not implemented".to_string())
    }

    #[cfg(target_os = "windows")]
    fn retrieve_windows() -> Result<StoredCertificate, String> {
        Err("Windows storage not implemented".to_string())
    }

    #[cfg(target_os = "windows")]
    fn delete_windows() -> Result<(), String> {
        Err("Windows storage not implemented".to_string())
    }

    // ==================== Linux Implementation ====================
    
    #[cfg(target_os = "linux")]
    fn store_linux(cert: &StoredCertificate) -> Result<(), String> {
        // TODO: Implement AES-256-GCM encrypted file storage
        println!("⚠️  Linux certificate storage not yet implemented");
        Err("Linux storage not implemented".to_string())
    }

    #[cfg(target_os = "linux")]
    fn retrieve_linux() -> Result<StoredCertificate, String> {
        Err("Linux storage not implemented".to_string())
    }

    #[cfg(target_os = "linux")]
    fn delete_linux() -> Result<(), String> {
        Err("Linux storage not implemented".to_string())
    }

    // ==================== Helper Functions ====================

    /// Get platform-specific storage path (for file-based storage)
    #[allow(dead_code)]
    fn get_storage_path() -> Result<PathBuf, String> {
        let mut path = dirs::data_dir()
            .ok_or_else(|| "Failed to get data directory".to_string())?;
        
        path.push("io.apuntador.app");
        std::fs::create_dir_all(&path)
            .map_err(|e| format!("Failed to create storage directory: {}", e))?;
        
        path.push("mtls-certificate.enc");
        Ok(path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_certificate() -> StoredCertificate {
        StoredCertificate {
            device_id: "test-device-123".to_string(),
            certificate_pem: "-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----".to_string(),
            private_key_pem: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----".to_string(),
            serial_number: "123456".to_string(),
            expires_at: "2025-12-31T23:59:59Z".to_string(),
            platform: "macos".to_string(),
        }
    }

    #[test]
    #[cfg(target_os = "macos")]
    fn test_store_and_retrieve_macos() {
        let cert = create_test_certificate();
        
        // Clean up first
        let _ = CertificateStore::delete();
        
        // Store
        assert!(CertificateStore::store(&cert).is_ok());
        
        // Retrieve
        let retrieved = CertificateStore::retrieve().unwrap();
        assert_eq!(retrieved.device_id, cert.device_id);
        
        // Clean up
        assert!(CertificateStore::delete().is_ok());
    }
}
