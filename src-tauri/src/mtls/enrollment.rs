/// Device enrollment implementation for Desktop

use crate::mtls::{
    certificate_storage::{CertificateStore, StoredCertificate},
    csr_generator::{generate_csr, get_device_id, get_device_model, get_os_version, get_platform},
    http_client::create_pinned_client,
};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnrollmentResult {
    pub success: bool,
    pub enrolled: bool,
    pub device_id: String,
    pub already_enrolled: bool,
    pub certificate_expires_at: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
struct EnrollmentRequest {
    csr: String,
    device_id: String,
    platform: String,
    device_model: String,
    os_version: String,
}

#[derive(Debug, Deserialize)]
struct EnrollmentResponse {
    certificate: String,
    serial: String,
    issued_at: String,
    expires_at: String,
    ca_certificate: Option<String>,
}

/// Check if device is already enrolled
pub async fn check_enrollment_status() -> Result<EnrollmentResult, String> {
    println!("🔍 Checking enrollment status...");

    match CertificateStore::retrieve() {
        Ok(cert) => {
            println!("✅ Device is enrolled");
            println!("   Device ID: {}", cert.device_id);
            println!("   Expires: {}", cert.expires_at);

            // Check if certificate is expired
            let is_expired = check_if_expired(&cert.expires_at)?;
            
            if is_expired {
                println!("⚠️  Certificate has expired");
                return Ok(EnrollmentResult {
                    success: false,
                    enrolled: false,
                    device_id: cert.device_id,
                    already_enrolled: false,
                    certificate_expires_at: Some(cert.expires_at),
                    error: Some("Certificate expired".to_string()),
                });
            }

            Ok(EnrollmentResult {
                success: true,
                enrolled: true,
                device_id: cert.device_id,
                already_enrolled: true,
                certificate_expires_at: Some(cert.expires_at),
                error: None,
            })
        }
        Err(_) => {
            println!("ℹ️  Device is not enrolled");
            Ok(EnrollmentResult {
                success: true,
                enrolled: false,
                device_id: get_device_id()?,
                already_enrolled: false,
                certificate_expires_at: None,
                error: None,
            })
        }
    }
}

/// Enroll device with backend
pub async fn enroll_device(backend_url: &str, certificate_pins: Vec<String>) -> Result<EnrollmentResult, String> {
    println!("🚀 Starting device enrollment...");
    println!("   Backend URL: {}", backend_url);

    // 1. Check if already enrolled
    let status = check_enrollment_status().await?;
    if status.enrolled {
        let cert_expires = status.certificate_expires_at.clone().unwrap_or_default();
        if !check_if_expired(&cert_expires)? {
            println!("✅ Device already enrolled and certificate is valid");
            return Ok(status);
        }
    }

    // 2. Get device information
    let device_id = get_device_id()?;
    let platform = get_platform();
    let device_model = get_device_model();
    let os_version = get_os_version();

    println!("📱 Device Information:");
    println!("   Device ID: {}", device_id);
    println!("   Platform: {}", platform);
    println!("   Model: {}", device_model);
    println!("   OS Version: {}", os_version);

    // 3. Generate CSR
    let (csr_pem, private_key_pem) = generate_csr(&device_id, &platform)
        .map_err(|e| format!("Failed to generate CSR: {}", e))?;

    // 4. Create enrollment request
    let request = EnrollmentRequest {
        csr: csr_pem,
        device_id: device_id.clone(),
        platform: platform.clone(),
        device_model,
        os_version,
    };

    // 5. Send enrollment request to backend
    println!("📤 Sending enrollment request to backend...");
    
    let client = create_pinned_client(certificate_pins)
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .post(format!("{}/device/enroll", backend_url))
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Failed to send enrollment request: {}", e))?;

    let status_code = response.status();
    println!("📥 Response status: {}", status_code);

    if !status_code.is_success() {
        let error_text = response
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!(
            "Enrollment failed with status {}: {}",
            status_code, error_text
        ));
    }

    let enrollment_response: EnrollmentResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse enrollment response: {}", e))?;

    println!("✅ Enrollment successful!");
    println!("   Serial: {}", enrollment_response.serial);
    println!("   Issued: {}", enrollment_response.issued_at);
    println!("   Expires: {}", enrollment_response.expires_at);

    // 6. Store certificate securely
    let stored_cert = StoredCertificate {
        device_id: device_id.clone(),
        certificate_pem: enrollment_response.certificate,
        private_key_pem,
        serial_number: enrollment_response.serial,
        expires_at: enrollment_response.expires_at.clone(),
        platform,
    };

    CertificateStore::store(&stored_cert)
        .map_err(|e| format!("Failed to store certificate: {}", e))?;

    println!("✅ Certificate stored securely");

    Ok(EnrollmentResult {
        success: true,
        enrolled: true,
        device_id: device_id,
        already_enrolled: false,
        certificate_expires_at: Some(enrollment_response.expires_at),
        error: None,
    })
}

/// Delete enrollment (for testing/debugging)
pub async fn unenroll_device() -> Result<(), String> {
    println!("🗑️  Unenrolling device...");
    CertificateStore::delete()?;
    println!("✅ Device unenrolled successfully");
    Ok(())
}

/// Check if certificate is expired
fn check_if_expired(expires_at: &str) -> Result<bool, String> {
    // Try parsing with timezone first (RFC3339)
    let expires = if let Ok(dt) = DateTime::parse_from_rfc3339(expires_at) {
        dt.with_timezone(&Utc)
    } else {
        // If no timezone, assume UTC and parse as naive datetime
        let expires_with_z = if expires_at.ends_with('Z') {
            expires_at.to_string()
        } else {
            format!("{}Z", expires_at)
        };
        
        DateTime::parse_from_rfc3339(&expires_with_z)
            .map_err(|e| format!("Invalid date format: {}", e))?
            .with_timezone(&Utc)
    };
    
    let now = Utc::now();
    Ok(expires.timestamp() < now.timestamp())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_check_if_expired() {
        // Past date
        assert!(check_if_expired("2020-01-01T00:00:00Z").unwrap());
        
        // Future date
        assert!(!check_if_expired("2030-01-01T00:00:00Z").unwrap());
    }
}
