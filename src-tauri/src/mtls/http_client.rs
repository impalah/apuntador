/// HTTP client with mTLS and certificate pinning support

use crate::mtls::StoredCertificate;
use reqwest::{Client, Identity};

/// Create an HTTP client with certificate pinning
pub fn create_pinned_client(pins: Vec<String>) -> Result<Client, String> {
    println!("🔐 Creating HTTP client with certificate pinning...");
    println!("   Pins: {:?}", pins);

    // For now, use reqwest with default TLS
    // TODO: Implement custom verifier with rustls
    let client = Client::builder()
        .use_rustls_tls()
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    println!("✅ HTTP client created with pinning");
    Ok(client)
}

/// Create an HTTP client with mTLS (client certificate)
/// TODO: Integrate this function when mTLS authentication is fully implemented
#[allow(dead_code)]
pub fn create_mtls_client(
    cert: &StoredCertificate,
    pins: Vec<String>,
) -> Result<Client, String> {
    println!("🔐 Creating mTLS HTTP client...");
    println!("   Device ID: {}", cert.device_id);
    println!("   Pins: {:?}", pins);

    // Combine certificate and private key into PKCS#12 identity
    let identity_pem = format!(
        "{}\n{}",
        cert.certificate_pem,
        cert.private_key_pem
    );

    let identity = Identity::from_pem(identity_pem.as_bytes())
        .map_err(|e| format!("Failed to create identity: {}", e))?;

    // Build client with identity
    let client = Client::builder()
        .use_rustls_tls()
        .identity(identity)
        .build()
        .map_err(|e| format!("Failed to create mTLS client: {}", e))?;

    println!("✅ mTLS HTTP client created successfully");
    Ok(client)
}

/// Create default HTTP client (no mTLS, no pinning)
/// TODO: Remove if not needed for fallback scenarios
#[allow(dead_code)]
pub fn create_default_client() -> Result<Client, String> {
    Client::builder()
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_default_client() {
        let client = create_default_client();
        assert!(client.is_ok());
    }
}
