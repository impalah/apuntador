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
        let organization = options["organization"] as? String
        let country = options["country"] as? String
        
        do {
            let privateKey = try SecureEnclaveManager.getPrivateKey(label: keyLabel)
            let csr = try CSRGenerator.generateCSR(
                privateKey: privateKey,
                commonName: commonName,
                organization: organization,
                country: country
            )
            
            let result: [String: Any] = [
                "success": true,
                "csr": csr.base64EncodedString(),
                "csrSize": csr.count
            ]
            
            sendSuccess(to: webView, callId: callId, result: result)
        } catch {
            sendError(to: webView, callId: callId, error: error.localizedDescription)
        }
    }
    
    private func handleStoreCertificate(webView: WKWebView?, callId: String, options: [String: Any]) {
        guard let certificateBase64 = options["certificate"] as? String,
              let certificateData = Data(base64Encoded: certificateBase64) else {
            sendError(to: webView, callId: callId, error: "Invalid certificate data")
            return
        }
        
        guard let certificate = SecCertificateCreateWithData(nil, certificateData as CFData) else {
            sendError(to: webView, callId: callId, error: "Failed to parse certificate")
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
        // Delete private key
        let keyQuery: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrLabel as String: keyLabel
        ]
        SecItemDelete(keyQuery as CFDictionary)
        
        // Delete certificate
        let certQuery: [String: Any] = [
            kSecClass as String: kSecClassCertificate,
            kSecAttrLabel as String: certificateLabel
        ]
        SecItemDelete(certQuery as CFDictionary)
        
        let result: [String: Any] = ["success": true]
        sendSuccess(to: webView, callId: callId, result: result)
    }
    
    // MARK: - Helper Methods
    
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
