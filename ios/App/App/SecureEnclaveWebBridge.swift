import Foundation
import WebKit
import Security
import UIKit

/**
 * Puente directo WKWebView para Secure Enclave
 * 
 * Este NO es un plugin de Capacitor, es un script message handler directo.
 * JavaScript puede llamarlo vía: window.webkit.messageHandlers.secureEnclave.postMessage()
 */
class SecureEnclaveWebBridge: NSObject, WKScriptMessageHandler {
    
    private let keyLabel = "io.apuntador.mtls.privatekey"
    private let certificateLabel = "io.apuntador.mtls.certificate"
    
    // WKScriptMessageHandler protocol method
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let action = body["action"] as? String else {
            sendError(to: message.webView, callId: "unknown", error: "Invalid message format")
            return
        }
        
        let callId = body["callId"] as? String ?? "unknown"
        
        switch action {
        case "isSecureEnclaveAvailable":
            handleIsAvailable(webView: message.webView, callId: callId)
        case "generateKeyPair":
            handleGenerateKeyPair(webView: message.webView, callId: callId)
        case "generateCSR":
            guard let options = body["options"] as? [String: Any] else {
                sendError(to: message.webView, callId: callId, error: "Missing options")
                return
            }
            handleGenerateCSR(webView: message.webView, callId: callId, options: options)
        case "storeCertificate":
            guard let options = body["options"] as? [String: Any] else {
                sendError(to: message.webView, callId: callId, error: "Missing options")
                return
            }
            handleStoreCertificate(webView: message.webView, callId: callId, options: options)
        case "getCertificate":
            handleGetCertificate(webView: message.webView, callId: callId)
        case "deleteCertificate":
            handleDeleteCertificate(webView: message.webView, callId: callId)
        default:
            sendError(to: message.webView, callId: callId, error: "Unknown action: \(action)")
        }
    }
    
    // MARK: - Action Handlers
    
    private func handleIsAvailable(webView: WKWebView?, callId: String) {
        let attributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave
        ]
        
        var error: Unmanaged<CFError>?
        let available = SecKeyCreateRandomKey(attributes as CFDictionary, &error) != nil
        
        let device = UIDevice.current
        let result: [String: Any] = [
            "available": available,
            "deviceModel": device.model,
            "osVersion": device.systemVersion
        ]
        
        sendSuccess(to: webView, callId: callId, result: result)
    }
    
    private func handleGenerateKeyPair(webView: WKWebView?, callId: String) {
        do {
            // 🔧 IMPORTANTE: Eliminar clave existente primero (si existe)
            // Esto previene el error -25299 (errSecDuplicateItem)
            let deleteQuery: [String: Any] = [
                kSecClass as String: kSecClassKey,
                kSecAttrApplicationLabel as String: keyLabel
            ]
            SecItemDelete(deleteQuery as CFDictionary)
            // No importa si falla (puede que no exista), continuar con la generación
            
            let privateKey = try SecureEnclaveManager.generateKeyPair(label: keyLabel)
            
            guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
                sendError(to: webView, callId: callId, error: "Failed to get public key")
                return
            }
            
            var error: Unmanaged<CFError>?
            guard let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, &error) as Data? else {
                sendError(to: webView, callId: callId, error: "Failed to export public key")
                return
            }
            
            let result: [String: Any] = [
                "success": true,
                "publicKey": publicKeyData.base64EncodedString(),
                "keySize": 256,
                "algorithm": "EC P-256",
                "secureEnclave": true
            ]
            
            sendSuccess(to: webView, callId: callId, result: result)
        } catch {
            sendError(to: webView, callId: callId, error: error.localizedDescription)
        }
    }
    
    private func handleGenerateCSR(webView: WKWebView?, callId: String, options: [String: Any]) {
        let commonName = options["commonName"] as? String ?? "iOS Device"
        let organization = options["organization"] as? String ?? "Apuntador"
        let country = options["country"] as? String ?? "ES"
        
        do {
            // Buscar la clave privada existente
            let query: [String: Any] = [
                kSecClass as String: kSecClassKey,
                kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
                kSecAttrApplicationLabel as String: keyLabel,
                kSecReturnRef as String: true
            ]
            
            var item: CFTypeRef?
            let status = SecItemCopyMatching(query as CFDictionary, &item)
            
            guard status == errSecSuccess, let privateKey = item as! SecKey? else {
                sendError(to: webView, callId: callId, error: "Private key not found. Generate key pair first.")
                return
            }
            
            // Obtener clave pública
            guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
                sendError(to: webView, callId: callId, error: "Failed to get public key")
                return
            }
            
            let csr = try CSRGenerator.generateCSR(
                publicKey: publicKey,
                privateKey: privateKey,
                commonName: commonName,
                organization: organization,
                country: country
            )
            
            // Convertir DER a PEM format (el backend espera PEM)
            let csrPEM = convertDERtoPEM(derData: csr, label: "CERTIFICATE REQUEST")
            
            let result: [String: Any] = [
                "success": true,
                "csr": csrPEM,  // Enviar como string PEM, no base64
                "csrSize": csrPEM.count
            ]
            
            sendSuccess(to: webView, callId: callId, result: result)
        } catch {
            sendError(to: webView, callId: callId, error: error.localizedDescription)
        }
    }
    
    private func handleStoreCertificate(webView: WKWebView?, callId: String, options: [String: Any]) {
        guard let certificateString = options["certificate"] as? String else {
            sendError(to: webView, callId: callId, error: "Missing certificate")
            return
        }
        
        // Convertir certificado a Data (detectar si es PEM o base64 puro)
        let certificateData: Data
        if certificateString.hasPrefix("-----BEGIN CERTIFICATE-----") {
            // Es PEM, convertir a DER
            guard let derData = convertPEMtoDER(pemString: certificateString) else {
                sendError(to: webView, callId: callId, error: "Failed to convert PEM to DER")
                return
            }
            certificateData = derData
            print("📥 [SecureEnclave Bridge] Converted PEM certificate to DER (\(derData.count) bytes)")
        } else {
            // Asumir que es base64 puro (DER)
            guard let derData = Data(base64Encoded: certificateString) else {
                sendError(to: webView, callId: callId, error: "Invalid certificate data - not valid base64")
                return
            }
            certificateData = derData
            print("📥 [SecureEnclave Bridge] Using base64 certificate as DER (\(derData.count) bytes)")
        }
        
        guard let certificate = SecCertificateCreateWithData(nil, certificateData as CFData) else {
            sendError(to: webView, callId: callId, error: "Failed to parse certificate - invalid DER format")
            return
        }
        
        // Store certificate in Keychain
        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassCertificate,
            kSecAttrLabel as String: certificateLabel,
            kSecValueRef as String: certificate
        ]
        
        // Delete existing first
        SecItemDelete(addQuery as CFDictionary)
        
        let status = SecItemAdd(addQuery as CFDictionary, nil)
        
        if status == errSecSuccess {
            let result: [String: Any] = [
                "success": true,
                "size": certificateData.count
            ]
            sendSuccess(to: webView, callId: callId, result: result)
        } else {
            sendError(to: webView, callId: callId, error: "Failed to store certificate: \(status)")
        }
    }
    
    private func handleGetCertificate(webView: WKWebView?, callId: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassCertificate,
            kSecAttrLabel as String: certificateLabel,
            kSecReturnData as String: true
        ]
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        
        if status == errSecSuccess, let certificateData = item as? Data {
            let result: [String: Any] = [
                "success": true,
                "certificate": certificateData.base64EncodedString(),
                "size": certificateData.count
            ]
            sendSuccess(to: webView, callId: callId, result: result)
        } else {
            let result: [String: Any] = [
                "success": false,
                "message": "No certificate found"
            ]
            sendSuccess(to: webView, callId: callId, result: result)
        }
    }
    
    private func handleDeleteCertificate(webView: WKWebView?, callId: String) {
        // Delete private key (usa kSecAttrApplicationLabel, no kSecAttrLabel)
        let keyQuery: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationLabel as String: keyLabel
        ]
        let keyStatus = SecItemDelete(keyQuery as CFDictionary)
        print("🗑️  [SecureEnclave Bridge] Delete key status: \(keyStatus)")
        
        // Delete certificate
        let certQuery: [String: Any] = [
            kSecClass as String: kSecClassCertificate,
            kSecAttrLabel as String: certificateLabel
        ]
        let certStatus = SecItemDelete(certQuery as CFDictionary)
        print("🗑️  [SecureEnclave Bridge] Delete certificate status: \(certStatus)")
        
        let result: [String: Any] = ["success": true]
        sendSuccess(to: webView, callId: callId, result: result)
    }
    
    // MARK: - Helper Methods
    
    /**
     * Convierte datos DER (binario) a formato PEM (texto con headers)
     * 
     * Ejemplo output:
     * -----BEGIN CERTIFICATE REQUEST-----
     * MIIBATCBpwIBADBFMQwwCgYEAgUEBgwCRVMx...
     * -----END CERTIFICATE REQUEST-----
     */
    private func convertDERtoPEM(derData: Data, label: String) -> String {
        let base64 = derData.base64EncodedString(options: [.lineLength64Characters, .endLineWithLineFeed])
        return "-----BEGIN \(label)-----\n\(base64)-----END \(label)-----\n"
    }
    
    /**
     * Convierte formato PEM (texto con headers) a DER (binario)
     * 
     * Ejemplo input:
     * -----BEGIN CERTIFICATE-----
     * MIIBATCBpwIBADBFMQwwCgYEAgUEBgwCRVMx...
     * -----END CERTIFICATE-----
     * 
     * Output: Data binario (DER)
     */
    private func convertPEMtoDER(pemString: String) -> Data? {
        // Eliminar headers y footers
        var base64String = pemString
        base64String = base64String.replacingOccurrences(of: "-----BEGIN CERTIFICATE-----", with: "")
        base64String = base64String.replacingOccurrences(of: "-----END CERTIFICATE-----", with: "")
        base64String = base64String.replacingOccurrences(of: "-----BEGIN CERTIFICATE REQUEST-----", with: "")
        base64String = base64String.replacingOccurrences(of: "-----END CERTIFICATE REQUEST-----", with: "")
        base64String = base64String.replacingOccurrences(of: "\n", with: "")
        base64String = base64String.replacingOccurrences(of: "\r", with: "")
        base64String = base64String.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // Decodificar base64 a Data
        return Data(base64Encoded: base64String)
    }
    
    private func sendSuccess(to webView: WKWebView?, callId: String, result: [String: Any]) {
        guard let webView = webView else { return }
        
        let response: [String: Any] = [
            "callId": callId,
            "success": true,
            "result": result
        ]
        
        if let jsonData = try? JSONSerialization.data(withJSONObject: response),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            let js = "window._secureEnclaveCallback(\(jsonString))"
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }
    
    private func sendError(to webView: WKWebView?, callId: String, error: String) {
        guard let webView = webView else { return }
        
        let response: [String: Any] = [
            "callId": callId,
            "success": false,
            "error": error
        ]
        
        if let jsonData = try? JSONSerialization.data(withJSONObject: response),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            let js = "window._secureEnclaveCallback(\(jsonString))"
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }
}
