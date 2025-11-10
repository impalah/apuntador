import Foundation
import Capacitor
import UIKit

/**
 * Servicio de auto-enrollment para iOS
 * 
 * Gestiona el proceso de enrollment automático cuando el dispositivo
 * no tiene certificado válido:
 * 
 * 1. Verifica si existe certificado
 * 2. Si no existe:
 *    a. Genera par de claves en Secure Enclave
 *    b. Genera CSR
 *    c. Envía CSR al backend
 *    d. Recibe certificado firmado
 *    e. Almacena certificado en Keychain
 * 3. Configura cliente mTLS
 */
@objc(ApuntadorAutoEnrollmentPlugin)
public class ApuntadorAutoEnrollmentPlugin: CAPPlugin, CAPBridgedPlugin {
    
    public let identifier = "ApuntadorAutoEnrollmentPlugin"
    public let jsName = "AutoEnrollment"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "autoEnroll", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkEnrollmentStatus", returnType: CAPPluginReturnPromise)
    ]
    
    private let secureEnclavePlugin = ApuntadorSecureEnclavePlugin()
    
    /**
     * Verifica el estado del enrollment
     */
    @objc func checkEnrollmentStatus(_ call: CAPPluginCall) {
        let hasCertificate = hasCertificateStored()
        
        call.resolve([
            "enrolled": hasCertificate,
            "deviceId": getDeviceId(),
            "deviceModel": UIDevice.current.model,
            "osVersion": UIDevice.current.systemVersion
        ])
    }
    
    /**
     * Realiza el enrollment automático
     */
    @objc func autoEnroll(_ call: CAPPluginCall) {
        guard let backendUrl = call.getString("backendUrl") else {
            call.reject("Missing backendUrl parameter")
            return
        }
        
        Task {
            do {
                CAPLog.print("🔐 [Auto-Enrollment] Starting enrollment process...")
                
                // 1. Verificar si ya está enrolled
                if hasCertificateStored() {
                    CAPLog.print("✅ [Auto-Enrollment] Already enrolled")
                    call.resolve([
                        "success": true,
                        "alreadyEnrolled": true,
                        "message": "Device already enrolled"
                    ])
                    return
                }
                
                // 2. Generar par de claves en Secure Enclave
                CAPLog.print("🔑 [Auto-Enrollment] Generating key pair in Secure Enclave...")
                let privateKey = try SecureEnclaveManager.generateKeyPair(label: "io.apuntador.mtls.privatekey")
                
                guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
                    throw EnrollmentError.failedToExtractPublicKey
                }
                
                // 3. Generar CSR
                CAPLog.print("📝 [Auto-Enrollment] Generating CSR...")
                let deviceId = getDeviceId()
                let csr = try CSRGenerator.generateCSR(
                    publicKey: publicKey,
                    privateKey: privateKey,
                    commonName: deviceId,
                    organization: "Apuntador",
                    country: "ES"
                )
                
                let csrBase64 = csr.base64EncodedString()
                CAPLog.print("📤 [Auto-Enrollment] Sending CSR to backend...")
                CAPLog.print("   - Device ID: \(deviceId)")
                CAPLog.print("   - CSR size: \(csr.count) bytes")
                
                // 4. Enviar CSR al backend
                let enrollmentData: [String: Any] = [
                    "csr": csrBase64,
                    "device_id": deviceId,
                    "platform": "ios",
                    "device_model": UIDevice.current.model,
                    "os_version": UIDevice.current.systemVersion
                ]
                
                let enrollmentUrl = "\(backendUrl)/device/enroll"
                
                // Usar URLSession estándar (sin mTLS) para enrollment
                let (responseData, httpResponse) = try await sendEnrollmentRequest(
                    url: enrollmentUrl,
                    data: enrollmentData
                )
                
                guard httpResponse.statusCode == 200 else {
                    let errorMessage = String(data: responseData, encoding: .utf8) ?? "Unknown error"
                    CAPLog.print("❌ [Auto-Enrollment] Backend error: \(errorMessage)")
                    throw EnrollmentError.backendError(errorMessage)
                }
                
                // 5. Parsear respuesta
                guard let json = try JSONSerialization.jsonObject(with: responseData) as? [String: Any],
                      let certificateBase64 = json["certificate"] as? String else {
                    throw EnrollmentError.invalidResponse
                }
                
                CAPLog.print("📥 [Auto-Enrollment] Received certificate from backend")
                
                // 6. Decodificar y almacenar certificado
                guard let certificateData = Data(base64Encoded: certificateBase64) else {
                    throw EnrollmentError.invalidCertificateFormat
                }
                
                try storeCertificate(certificateData)
                
                CAPLog.print("✅ [Auto-Enrollment] Enrollment completed successfully!")
                CAPLog.print("   - Certificate stored in Keychain")
                CAPLog.print("   - Private key secured in Secure Enclave")
                
                call.resolve([
                    "success": true,
                    "enrolled": true,
                    "deviceId": deviceId,
                    "certificateSize": certificateData.count
                ])
                
            } catch {
                CAPLog.print("❌ [Auto-Enrollment] Failed: \(error.localizedDescription)")
                call.reject("Enrollment failed", error.localizedDescription)
            }
        }
    }
    
    /**
     * Re-enrollment (para renovar certificado expirado)
     */
    @objc func reEnroll(_ call: CAPPluginCall) {
        // Eliminar certificado y claves antiguas
        do {
            try deleteAllCredentials()
            
            CAPLog.print("🔄 [Auto-Enrollment] Old credentials deleted, starting re-enrollment...")
            
            // Llamar a autoEnroll
            autoEnroll(call)
            
        } catch {
            call.reject("Failed to delete old credentials", error.localizedDescription)
        }
    }
    
    // MARK: - Private Helper Methods
    
    private func hasCertificateStored() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassCertificate,
            kSecAttrLabel as String: "io.apuntador.mtls.certificate",
            kSecReturnRef as String: true
        ]
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        
        return status == errSecSuccess
    }
    
    private func getDeviceId() -> String {
        // Usar el UUID del dispositivo como device ID
        // En producción, puedes usar el identifierForVendor
        if let uuid = UIDevice.current.identifierForVendor?.uuidString {
            return "ios-\(uuid)"
        } else {
            // Fallback: generar UUID aleatorio y guardarlo
            let uuid = UUID().uuidString
            return "ios-\(uuid)"
        }
    }
    
    private func sendEnrollmentRequest(url: String, data: [String: Any]) async throws -> (Data, HTTPURLResponse) {
        guard let requestURL = URL(string: url) else {
            throw EnrollmentError.invalidURL
        }
        
        var request = URLRequest(url: requestURL)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: data)
        
        let (responseData, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw EnrollmentError.invalidResponse
        }
        
        return (responseData, httpResponse)
    }
    
    private func storeCertificate(_ data: Data) throws {
        // Eliminar certificado anterior si existe
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassCertificate,
            kSecAttrLabel as String: "io.apuntador.mtls.certificate"
        ]
        SecItemDelete(deleteQuery as CFDictionary)
        
        // Guardar nuevo certificado
        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassCertificate,
            kSecAttrLabel as String: "io.apuntador.mtls.certificate",
            kSecValueData as String: data
        ]
        
        let status = SecItemAdd(addQuery as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(status))
        }
    }
    
    private func deleteAllCredentials() throws {
        // Eliminar certificado
        let certQuery: [String: Any] = [
            kSecClass as String: kSecClassCertificate,
            kSecAttrLabel as String: "io.apuntador.mtls.certificate"
        ]
        SecItemDelete(certQuery as CFDictionary)
        
        // Eliminar clave privada
        let keyQuery: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationLabel as String: "io.apuntador.mtls.privatekey"
        ]
        SecItemDelete(keyQuery as CFDictionary)
    }
}

// MARK: - Error Types

enum EnrollmentError: Error {
    case failedToExtractPublicKey
    case invalidURL
    case invalidResponse
    case invalidCertificateFormat
    case backendError(String)
    
    var localizedDescription: String {
        switch self {
        case .failedToExtractPublicKey:
            return "Failed to extract public key from Secure Enclave"
        case .invalidURL:
            return "Invalid enrollment URL"
        case .invalidResponse:
            return "Invalid response from backend"
        case .invalidCertificateFormat:
            return "Invalid certificate format received"
        case .backendError(let message):
            return "Backend error: \(message)"
        }
    }
}
