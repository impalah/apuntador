import Foundation
import Security

/**
 * Generador de Certificate Signing Request (CSR) en formato PKCS#10
 * 
 * Genera un CSR usando la clave privada del Secure Enclave.
 * El CSR contiene:
 * - Información del subject (CN, O, C, etc.)
 * - Clave pública
 * - Firma realizada con la clave privada del Secure Enclave
 */
class CSRGenerator {
    
    /**
     * Genera un CSR (Certificate Signing Request) en formato DER
     * 
     * - Parameters:
     *   - publicKey: Clave pública (extraída de la private key del Secure Enclave)
     *   - privateKey: Clave privada del Secure Enclave (para firmar el CSR)
     *   - commonName: Common Name (CN) - normalmente el device ID
     *   - organization: Organización (O)
     *   - country: País (C) - código de 2 letras
     * - Returns: CSR en formato DER (ASN.1)
     */
    static func generateCSR(
        publicKey: SecKey,
        privateKey: SecKey,
        commonName: String,
        organization: String = "Apuntador",
        country: String = "ES"
    ) throws -> Data {
        
        // 1. Exportar clave pública en formato DER
        guard let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, nil) as Data? else {
            throw CSRError.failedToExportPublicKey
        }
        
        // 2. Construir Subject Name (Distinguished Name)
        let subject = buildSubjectName(commonName: commonName, organization: organization, country: country)
        
        // 3. Construir CertificationRequestInfo
        let certificationRequestInfo = buildCertificationRequestInfo(
            subject: subject,
            publicKeyData: publicKeyData
        )
        
        // 4. Firmar con la clave privada del Secure Enclave
        let signature = try SecureEnclaveManager.signData(certificationRequestInfo, with: privateKey)
        
        // 5. Construir el CSR completo (CertificationRequest)
        let csr = buildCSR(
            certificationRequestInfo: certificationRequestInfo,
            signature: signature
        )
        
        return csr
    }
    
    // MARK: - Private Helper Methods (ASN.1 DER Encoding)
    
    /**
     * Construye el Subject Name en formato ASN.1 DER
     * 
     * Subject: CN=<commonName>, O=<organization>, C=<country>
     */
    private static func buildSubjectName(commonName: String, organization: String, country: String) -> Data {
        var subject = Data()
        
        // SEQUENCE
        subject.append(0x30)
        
        var subjectContent = Data()
        
        // Country (C)
        subjectContent.append(buildAttributeTypeAndValue(oid: [2, 5, 4, 6], value: country))
        
        // Organization (O)
        subjectContent.append(buildAttributeTypeAndValue(oid: [2, 5, 4, 10], value: organization))
        
        // Common Name (CN)
        subjectContent.append(buildAttributeTypeAndValue(oid: [2, 5, 4, 3], value: commonName))
        
        subject.append(encodeLength(subjectContent.count))
        subject.append(subjectContent)
        
        return subject
    }
    
    /**
     * Construye un AttributeTypeAndValue en formato ASN.1 DER
     */
    private static func buildAttributeTypeAndValue(oid: [UInt8], value: String) -> Data {
        var atv = Data()
        
        // SET
        atv.append(0x31)
        
        var content = Data()
        
        // SEQUENCE
        content.append(0x30)
        
        var seqContent = Data()
        
        // OID
        seqContent.append(encodeOID(oid))
        
        // UTF8String
        seqContent.append(0x0C)  // UTF8String tag
        let valueData = value.data(using: .utf8)!
        seqContent.append(encodeLength(valueData.count))
        seqContent.append(valueData)
        
        content.append(encodeLength(seqContent.count))
        content.append(seqContent)
        
        atv.append(encodeLength(content.count))
        atv.append(content)
        
        return atv
    }
    
    /**
     * Construye el CertificationRequestInfo
     */
    private static func buildCertificationRequestInfo(subject: Data, publicKeyData: Data) -> Data {
        var info = Data()
        
        // SEQUENCE
        info.append(0x30)
        
        var content = Data()
        
        // Version (INTEGER 0)
        content.append(Data([0x02, 0x01, 0x00]))
        
        // Subject
        content.append(subject)
        
        // SubjectPublicKeyInfo
        content.append(buildSubjectPublicKeyInfo(publicKeyData: publicKeyData))
        
        // Attributes (CONTEXT SPECIFIC [0] - empty for now)
        content.append(Data([0xA0, 0x00]))
        
        info.append(encodeLength(content.count))
        info.append(content)
        
        return info
    }
    
    /**
     * Construye el SubjectPublicKeyInfo en formato ASN.1 DER
     */
    private static func buildSubjectPublicKeyInfo(publicKeyData: Data) -> Data {
        var spki = Data()
        
        // SEQUENCE
        spki.append(0x30)
        
        var content = Data()
        
        // AlgorithmIdentifier (EC P-256)
        content.append(buildAlgorithmIdentifier())
        
        // SubjectPublicKey (BIT STRING)
        content.append(0x03)  // BIT STRING tag
        // La clave pública de iOS ya viene en formato X9.63 (0x04 + x + y)
        // Necesitamos añadir el byte de "unused bits" al inicio
        var publicKeyBitString = Data([0x00])  // 0 unused bits
        publicKeyBitString.append(publicKeyData)
        content.append(encodeLength(publicKeyBitString.count))
        content.append(publicKeyBitString)
        
        spki.append(encodeLength(content.count))
        spki.append(content)
        
        return spki
    }
    
    /**
     * Construye el AlgorithmIdentifier para EC P-256
     */
    private static func buildAlgorithmIdentifier() -> Data {
        var algId = Data()
        
        // SEQUENCE
        algId.append(0x30)
        
        var content = Data()
        
        // OID: ecPublicKey (1.2.840.10045.2.1)
        content.append(encodeOID([0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x02, 0x01]))
        
        // OID: prime256v1 / secp256r1 (1.2.840.10045.3.1.7)
        content.append(encodeOID([0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x03, 0x01, 0x07]))
        
        algId.append(encodeLength(content.count))
        algId.append(content)
        
        return algId
    }
    
    /**
     * Construye el CSR completo (CertificationRequest)
     */
    private static func buildCSR(certificationRequestInfo: Data, signature: Data) -> Data {
        var csr = Data()
        
        // SEQUENCE
        csr.append(0x30)
        
        var content = Data()
        
        // CertificationRequestInfo
        content.append(certificationRequestInfo)
        
        // SignatureAlgorithm (ECDSA with SHA256)
        content.append(buildSignatureAlgorithm())
        
        // Signature (BIT STRING)
        content.append(0x03)  // BIT STRING tag
        var signatureBitString = Data([0x00])  // 0 unused bits
        signatureBitString.append(signature)
        content.append(encodeLength(signatureBitString.count))
        content.append(signatureBitString)
        
        csr.append(encodeLength(content.count))
        csr.append(content)
        
        return csr
    }
    
    /**
     * Construye el SignatureAlgorithm (ECDSA with SHA256)
     */
    private static func buildSignatureAlgorithm() -> Data {
        var sigAlg = Data()
        
        // SEQUENCE
        sigAlg.append(0x30)
        
        var content = Data()
        
        // OID: ecdsa-with-SHA256 (1.2.840.10045.4.3.2)
        content.append(encodeOID([0x2A, 0x86, 0x48, 0xCE, 0x3D, 0x04, 0x03, 0x02]))
        
        sigAlg.append(encodeLength(content.count))
        sigAlg.append(content)
        
        return sigAlg
    }
    
    /**
     * Codifica un OID en formato ASN.1 DER
     */
    private static func encodeOID(_ oid: [UInt8]) -> Data {
        var encoded = Data([0x06])  // OID tag
        let oidData = Data(oid)
        encoded.append(encodeLength(oidData.count))
        encoded.append(oidData)
        return encoded
    }
    
    /**
     * Codifica la longitud en formato ASN.1 DER
     */
    private static func encodeLength(_ length: Int) -> Data {
        if length < 128 {
            // Short form
            return Data([UInt8(length)])
        } else {
            // Long form
            var lengthBytes = Data()
            var len = length
            while len > 0 {
                lengthBytes.insert(UInt8(len & 0xFF), at: 0)
                len >>= 8
            }
            var encoded = Data([0x80 | UInt8(lengthBytes.count)])
            encoded.append(lengthBytes)
            return encoded
        }
    }
}

// MARK: - Error Types

enum CSRError: Error {
    case failedToExportPublicKey
    case failedToSignCSR
    case invalidKeyFormat
    
    var localizedDescription: String {
        switch self {
        case .failedToExportPublicKey:
            return "Failed to export public key"
        case .failedToSignCSR:
            return "Failed to sign CSR with private key"
        case .invalidKeyFormat:
            return "Invalid key format"
        }
    }
}
