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
