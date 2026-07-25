/// Certificate Pinning implementation for Desktop
///
/// Validates server certificates against a set of known SHA-256 pins
/// to prevent MITM attacks.

use sha2::{Digest, Sha256};
use rustls::client::danger::{HandshakeSignatureValid, ServerCertVerified, ServerCertVerifier};
use rustls::pki_types::{CertificateDer, ServerName, UnixTime};
use rustls::{DigitallySignedStruct, Error as TlsError, RootCertStore, SignatureScheme};
use std::sync::Arc;

/// Certificate pinner that validates against known SHA-256 hashes
/// TODO: Integrate with HTTP client when certificate pinning is fully implemented
#[allow(dead_code)]
#[derive(Debug)]
pub struct CertificatePinner {
    /// Known certificate pins (SHA-256 hashes in hex format)
    pins: Vec<String>,
    /// Whether to also validate using system roots (defense in depth)
    use_system_roots: bool,
}

#[allow(dead_code)]
impl CertificatePinner {
    /// Create a new certificate pinner with the given pins
    pub fn new(pins: Vec<String>) -> Self {
        Self {
            pins,
            use_system_roots: true,
        }
    }

    /// Create from base64-encoded pins
    pub fn from_base64(base64_pins: Vec<String>) -> Result<Self, String> {
        use base64::{Engine as _, engine::general_purpose::STANDARD};

        let mut hex_pins = Vec::new();

        for b64_pin in base64_pins {
            let decoded = STANDARD.decode(&b64_pin)
                .map_err(|e| format!("Invalid base64 pin: {}", e))?;
            let hex = hex::encode(&decoded);
            hex_pins.push(hex);
        }

        Ok(Self::new(hex_pins))
    }

    /// Calculate SHA-256 fingerprint of a certificate
    fn calculate_fingerprint(cert: &CertificateDer<'_>) -> String {
        let mut hasher = Sha256::new();
        hasher.update(cert.as_ref());
        hex::encode(hasher.finalize())
    }

    /// Verify if any certificate in the chain matches our pins
    pub fn verify_chain(&self, certs: &[CertificateDer<'_>]) -> Result<(), String> {
        if self.pins.is_empty() {
            return Err("No pins configured".to_string());
        }

        // Calculate fingerprints for all certs in chain
        let fingerprints: Vec<String> = certs
            .iter()
            .map(Self::calculate_fingerprint)
            .collect();

        println!("Certificate Pinning Verification:");
        println!("   Expected pins: {:?}", self.pins);
        println!("   Received fingerprints: {:?}", fingerprints);

        // Check if any cert in chain matches any of our pins
        for fingerprint in &fingerprints {
            if self.pins.contains(fingerprint) {
                println!("Certificate pinning: MATCH found");
                return Ok(());
            }
        }

        Err(format!(
            "Certificate pinning failed: none of the certificates match expected pins. Expected: {:?}, Got: {:?}",
            self.pins, fingerprints
        ))
    }
}

/// Custom ServerCertVerifier that implements certificate pinning
/// TODO: Integrate with rustls ClientConfig when certificate pinning is fully implemented
#[allow(dead_code)]
#[derive(Debug)]
pub struct PinningVerifier {
    pinner: Arc<CertificatePinner>,
    webpki_verifier: Arc<dyn ServerCertVerifier>,
}

#[allow(dead_code)]
impl PinningVerifier {
    pub fn new(pinner: CertificatePinner) -> Result<Self, TlsError> {
        let webpki_verifier = rustls::client::WebPkiServerVerifier::builder(Arc::new(
            RootCertStore::empty(),
        ))
        .build()
        .map_err(|e| TlsError::General(e.to_string()))?;

        Ok(Self {
            pinner: Arc::new(pinner),
            webpki_verifier,
        })
    }
}

impl ServerCertVerifier for PinningVerifier {
    fn verify_server_cert(
        &self,
        end_entity: &CertificateDer<'_>,
        intermediates: &[CertificateDer<'_>],
        server_name: &ServerName<'_>,
        ocsp_response: &[u8],
        now: UnixTime,
    ) -> Result<ServerCertVerified, TlsError> {
        // Build full chain
        let mut chain = vec![end_entity.clone()];
        chain.extend(intermediates.iter().cloned());

        // Verify pins
        self.pinner
            .verify_chain(&chain)
            .map_err(TlsError::General)?;

        // Also verify using WebPKI for defense in depth
        // (This validates the chain is properly signed)
        self.webpki_verifier.verify_server_cert(
            end_entity,
            intermediates,
            server_name,
            ocsp_response,
            now,
        )
    }

    fn verify_tls12_signature(
        &self,
        message: &[u8],
        cert: &CertificateDer<'_>,
        dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, TlsError> {
        self.webpki_verifier.verify_tls12_signature(message, cert, dss)
    }

    fn verify_tls13_signature(
        &self,
        message: &[u8],
        cert: &CertificateDer<'_>,
        dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, TlsError> {
        self.webpki_verifier.verify_tls13_signature(message, cert, dss)
    }

    fn supported_verify_schemes(&self) -> Vec<SignatureScheme> {
        self.webpki_verifier.supported_verify_schemes()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fingerprint_calculation() {
        let test_cert = CertificateDer::from(vec![1, 2, 3, 4, 5]);
        let fingerprint = CertificatePinner::calculate_fingerprint(&test_cert);
        assert_eq!(fingerprint.len(), 64); // SHA-256 = 32 bytes = 64 hex chars
    }

    #[test]
    fn test_verify_chain_with_matching_pin() {
        let cert = CertificateDer::from(vec![1, 2, 3, 4, 5]);
        let fingerprint = CertificatePinner::calculate_fingerprint(&cert);

        let pinner = CertificatePinner::new(vec![fingerprint]);
        assert!(pinner.verify_chain(&[cert]).is_ok());
    }

    #[test]
    fn test_verify_chain_with_no_match() {
        let cert = CertificateDer::from(vec![1, 2, 3, 4, 5]);
        let pinner = CertificatePinner::new(vec!["wrong_pin".to_string()]);
        assert!(pinner.verify_chain(&[cert]).is_err());
    }
}
