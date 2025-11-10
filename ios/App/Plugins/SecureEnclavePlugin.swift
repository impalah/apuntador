import Foundation
import Capacitor
import Security
import UIKit

/**
 * Plugin de Capacitor para gestión de certificados mTLS usando Secure Enclave
 * 
 * Secure Enclave es el hardware security module (HSM) de iOS que almacena
 * claves privadas de forma segura. Las claves nunca salen del Secure Enclave.
 */
@objc(ApuntadorSecureEnclavePlugin)
public class ApuntadorSecureEnclavePlugin: CAPPlugin, CAPBridgedPlugin {
    
    public let identifier = "ApuntadorSecureEnclavePlugin"
    public let jsName = "SecureEnclave"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isSecureEnclaveAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "generateKeyPair", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "generateCSR", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "storeCertificate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCertificate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "deleteCertificate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkEnrollmentStatus", returnType: CAPPluginReturnPromise)
    ]
    
    private let keyLabel = "io.apuntador.mtls.privatekey"
    private let certificateLabel = "io.apuntador.mtls.certificate"
    
    /**
     * Verifica si el dispositivo tiene Secure Enclave disponible
     */
    @objc func isSecureEnclaveAvailable(_ call: CAPPluginCall) {
        // Verificar disponibilidad intentando obtener parámetros del Secure Enclave
        // Si tiene Secure Enclave, esta operación tendrá éxito
        let attributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave
        ]
        
        let available = SecKeyCreateRandomKey(attributes as CFDictionary, nil) != nil
        
        call.resolve([
            "available": available,
            "deviceModel": UIDevice.current.model,
            "osVersion": UIDevice.current.systemVersion
        ])
    }
    
    /**
     * Genera un par de claves EC (P-256) en Secure Enclave
     * La clave privada NUNCA sale del Secure Enclave
     */
    @objc func generateKeyPair(_ call: CAPPluginCall) {
        do {
            // Eliminar clave anterior si existe
            try deleteKeyPair()
            
            // Generar nueva clave en Secure Enclave
            let privateKey = try SecureEnclaveManager.generateKeyPair(label: keyLabel)
            
            // Obtener clave pública
            guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
                throw NSError(domain: "SecureEnclave", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to extract public key"])
            }
            
            // Exportar clave pública en formato DER
            guard let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, nil) as Data? else {
                throw NSError(domain: "SecureEnclave", code: -2, userInfo: [NSLocalizedDescriptionKey: "Failed to export public key"])
            }
            
            let publicKeyBase64 = publicKeyData.base64EncodedString()
            
            CAPLog.print("✅ Key pair generated in Secure Enclave")
            CAPLog.print("   - Private key stored securely (never exported)")
            CAPLog.print("   - Public key size: \(publicKeyData.count) bytes")
            
            call.resolve([
                "success": true,
                "publicKey": publicKeyBase64,
                "keySize": publicKeyData.count,
                "algorithm": "EC-P256",
                "secureEnclave": true
            ])
            
        } catch {
            CAPLog.print("❌ Failed to generate key pair: \(error.localizedDescription)")
            call.reject("Failed to generate key pair", error.localizedDescription)
        }
    }
    
    /**
     * Genera un Certificate Signing Request (CSR) usando la clave privada del Secure Enclave
     */
    @objc func generateCSR(_ call: CAPPluginCall) {
        guard let commonName = call.getString("commonName") else {
            call.reject("Missing commonName parameter")
            return
        }
        
        do {
            // Obtener clave privada del Secure Enclave
            guard let privateKey = try getPrivateKey() else {
                throw NSError(domain: "SecureEnclave", code: -3, userInfo: [NSLocalizedDescriptionKey: "Private key not found"])
            }
            
            // Obtener clave pública
            guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
                throw NSError(domain: "SecureEnclave", code: -4, userInfo: [NSLocalizedDescriptionKey: "Failed to extract public key"])
            }
            
            // Generar CSR
            let csr = try CSRGenerator.generateCSR(
                publicKey: publicKey,
                privateKey: privateKey,
                commonName: commonName,
                organization: call.getString("organization") ?? "Apuntador",
                country: call.getString("country") ?? "ES"
            )
            
            let csrBase64 = csr.base64EncodedString()
            
            CAPLog.print("✅ CSR generated successfully")
            CAPLog.print("   - CN: \(commonName)")
            CAPLog.print("   - CSR size: \(csr.count) bytes")
            
            call.resolve([
                "success": true,
                "csr": csrBase64,
                "csrSize": csr.count
            ])
            
        } catch {
            CAPLog.print("❌ Failed to generate CSR: \(error.localizedDescription)")
            call.reject("Failed to generate CSR", error.localizedDescription)
        }
    }
    
    /**
     * Almacena el certificado firmado recibido del backend
     */
    @objc func storeCertificate(_ call: CAPPluginCall) {
        guard let certificateBase64 = call.getString("certificate") else {
            call.reject("Missing certificate parameter")
            return
        }
        
        guard let certificateData = Data(base64Encoded: certificateBase64) else {
            call.reject("Invalid certificate format")
            return
        }
        
        do {
            // Eliminar certificado anterior si existe
            try deleteCertificate()
            
            // Guardar nuevo certificado en Keychain
            try saveCertificate(certificateData)
            
            CAPLog.print("✅ Certificate stored in Keychain")
            CAPLog.print("   - Size: \(certificateData.count) bytes")
            
            call.resolve([
                "success": true,
                "size": certificateData.count
            ])
            
        } catch {
            CAPLog.print("❌ Failed to store certificate: \(error.localizedDescription)")
            call.reject("Failed to store certificate", error.localizedDescription)
        }
    }
    
    /**
     * Obtiene el certificado almacenado (si existe)
     */
    @objc func getCertificate(_ call: CAPPluginCall) {
        do {
            if let certificateData = try loadCertificate() {
                let certificateBase64 = certificateData.base64EncodedString()
                
                call.resolve([
                    "success": true,
                    "certificate": certificateBase64,
                    "size": certificateData.count
                ])
            } else {
                call.resolve([
                    "success": false,
                    "message": "No certificate found"
                ])
            }
        } catch {
            call.reject("Failed to load certificate", error.localizedDescription)
        }
    }
    
    /**
     * Verifica si existe un certificado válido
     */
    @objc func hasCertificate(_ call: CAPPluginCall) {
        do {
            let hasCert = try loadCertificate() != nil
            call.resolve([
                "hasCertificate": hasCert
            ])
        } catch {
            call.resolve([
                "hasCertificate": false
            ])
        }
    }
    
    /**
     * Elimina el certificado y las claves (para testing o re-enrollment)
     */
    @objc func deleteAll(_ call: CAPPluginCall) {
        do {
            try deleteKeyPair()
            try deleteCertificate()
            
            CAPLog.print("✅ All keys and certificates deleted")
            call.resolve(["success": true])
        } catch {
            CAPLog.print("❌ Failed to delete: \(error.localizedDescription)")
            call.reject("Failed to delete", error.localizedDescription)
        }
    }
    
    // MARK: - Private Helper Methods
    
    private func getPrivateKey() throws -> SecKey? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrApplicationLabel as String: keyLabel,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
            kSecReturnRef as String: true
        ]
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        
        guard status == errSecSuccess else {
            return nil
        }
        
        return (item as! SecKey)
    }
    
    private func deleteKeyPair() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationLabel as String: keyLabel
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        if status != errSecSuccess && status != errSecItemNotFound {
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(status))
        }
    }
    
    private func saveCertificate(_ data: Data) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassCertificate,
            kSecAttrLabel as String: certificateLabel,
            kSecValueData as String: data
        ]
        
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(status))
        }
    }
    
    private func loadCertificate() throws -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassCertificate,
            kSecAttrLabel as String: certificateLabel,
            kSecReturnData as String: true
        ]
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        
        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                return nil
            }
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(status))
        }
        
        return (item as! Data)
    }
    
    private func deleteCertificate() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassCertificate,
            kSecAttrLabel as String: certificateLabel
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        if status != errSecSuccess && status != errSecItemNotFound {
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(status))
        }
    }
}
