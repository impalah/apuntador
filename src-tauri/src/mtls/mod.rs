/// mTLS module for Desktop platforms
/// 
/// Provides certificate pinning, client certificate management,
/// and secure storage for mTLS authentication.

pub mod certificate_pinning;
pub mod certificate_storage;
pub mod csr_generator;
pub mod enrollment;
pub mod http_client;

pub use certificate_pinning::CertificatePinner;
pub use certificate_storage::{CertificateStore, StoredCertificate};
pub use csr_generator::generate_csr;
pub use enrollment::{enroll_device, check_enrollment_status, EnrollmentResult};
pub use http_client::create_mtls_client;
