import Foundation
import Security
import UIKit
import CommonCrypto

/**
 * Cliente HTTP con soporte para mTLS (Mutual TLS)
 * 
 * Este cliente configura URLSession para usar certificados de cliente
 * almacenados en el Keychain junto con la clave privada del Secure Enclave.
 */
class MTLSHTTPClient: NSObject {
    
    private let certificateLabel = "io.apuntador.mtls.certificate"
    private let keyLabel = "io.apuntador.mtls.privatekey"
    
    // URLSession público para que plugins puedan usarlo
    var urlSession: URLSession?
    
    /**
     * Inicializa el cliente mTLS
     */
    override init() {
        super.init()
        setupURLSession()
    }
    
    /**
     * Configura URLSession con el delegado para mTLS
     */
    private func setupURLSession() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        
        urlSession = URLSession(
            configuration: config,
            delegate: self,
            delegateQueue: nil
        )
    }
    
    /**
     * Configura URLSession con certificado de cliente para mTLS
     * Llamar después de enrollment cuando el certificado esté disponible
     */
    func configureSession() {
        setupURLSession()
    }
    
    /**
     * Realiza una petición HTTP con mTLS
     * 
     * - Parameters:
     *   - url: URL del endpoint
     *   - method: Método HTTP (GET, POST, etc.)
     *   - body: Cuerpo de la petición (opcional)
     *   - headers: Headers adicionales (opcional)
     * - Returns: Respuesta HTTP con datos
     */
    func request(
        url: String,
        method: String = "GET",
        body: Data? = nil,
        headers: [String: String]? = nil
    ) async throws -> (data: Data, response: HTTPURLResponse) {
        
        guard let requestURL = URL(string: url) else {
            throw MTLSError.invalidURL
        }
        
        var request = URLRequest(url: requestURL)
        request.httpMethod = method
        request.httpBody = body
        
        // Añadir headers
        if let headers = headers {
            for (key, value) in headers {
                request.setValue(value, forHTTPHeaderField: key)
            }
        }
        
        // Realizar la petición
        guard let session = urlSession else {
            throw MTLSError.sessionNotConfigured
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw MTLSError.invalidResponse
        }
        
        return (data, httpResponse)
    }
    
    /**
     * POST con JSON
     */
    func postJSON(
        url: String,
        json: [String: Any],
        headers: [String: String]? = nil
    ) async throws -> (data: Data, response: HTTPURLResponse) {
        
        let jsonData = try JSONSerialization.data(withJSONObject: json)
        
        var allHeaders = headers ?? [:]
        allHeaders["Content-Type"] = "application/json"
        
        return try await request(
            url: url,
            method: "POST",
            body: jsonData,
            headers: allHeaders
        )
    }
    
    /**
     * GET con mTLS
     */
    func get(
        url: String,
        headers: [String: String]? = nil
    ) async throws -> (data: Data, response: HTTPURLResponse) {
        
        return try await request(
            url: url,
            method: "GET",
            headers: headers
        )
    }
    
    /**
     * Obtiene el certificado del Keychain
     */
    private func loadCertificate() -> SecCertificate? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassCertificate,
            kSecAttrLabel as String: certificateLabel,
            kSecReturnRef as String: true
        ]
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        
        guard status == errSecSuccess else {
            return nil
        }
        
        return (item as! SecCertificate)
    }
    
    /**
     * Obtiene la clave privada del Secure Enclave
     */
    private func loadPrivateKey() -> SecKey? {
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
    
    /**
     * Crea un SecIdentity desde el certificado y la clave privada
     * 
     * En iOS, un SecIdentity es una referencia que combina un certificado
     * con su clave privada correspondiente. Para mTLS, buscamos el identity
     * existente en el Keychain que ya asocia el certificado con la clave.
     */
    private func createIdentity() -> SecIdentity? {
        // En iOS, el identity debe estar almacenado en el Keychain
        // Buscar identity que coincida con nuestro certificado
        let query: [String: Any] = [
            kSecClass as String: kSecClassIdentity,
            kSecReturnRef as String: true,
            kSecMatchLimit as String: kSecMatchLimitAll
        ]
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        
        guard status == errSecSuccess,
              let identities = item as? [SecIdentity] else {
            print("⚠️  [mTLS] No identities found in Keychain")
            return nil
        }
        
        // Buscar el identity que corresponde a nuestro certificado
        guard let targetCertificate = loadCertificate() else {
            return nil
        }
        
        for identity in identities {
            var cert: SecCertificate?
            SecIdentityCopyCertificate(identity, &cert)
            
            if let cert = cert, CFEqual(cert, targetCertificate) {
                print("✅ [mTLS] Found matching identity")
                return identity
            }
        }
        
        print("⚠️  [mTLS] No matching identity found for certificate")
        return nil
    }
}

// MARK: - URLSessionDelegate para mTLS

extension MTLSHTTPClient: URLSessionDelegate {
    
    /**
     * Manejador de desafíos de autenticación
     * 
     * Este método se llama cuando el servidor solicita autenticación del cliente (mTLS)
     */
    func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        
        // Verificar que es un desafío de autenticación de cliente
        guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodClientCertificate else {
            // Si no es mTLS, usar manejo por defecto
            completionHandler(.performDefaultHandling, nil)
            return
        }
        
        // Intentar crear el identity con certificado + clave privada
        guard let identity = createIdentity() else {
            print("❌ [mTLS] No se pudo crear identity (certificado o clave privada no encontrados)")
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        
        // Crear credencial con el identity
        let credential = URLCredential(
            identity: identity,
            certificates: nil,
            persistence: .forSession
        )
        
        print("✅ [mTLS] Autenticación de cliente con certificado")
        completionHandler(.useCredential, credential)
    }
    
    /**
     * Validación de certificados del servidor (opcional)
     * 
     * Aquí se puede implementar certificate pinning si es necesario
     */
    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        
        // Verificar que es validación de certificado del servidor
        guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust else {
            completionHandler(.performDefaultHandling, nil)
            return
        }
        
        // CERTIFICATE PINNING IMPLEMENTATION
        // Verificar que el certificado del servidor coincide con el pin SHA-256 esperado
        
        guard let serverTrust = challenge.protectionSpace.serverTrust else {
            print("[MTLSHTTPClient] ⚠️ No server trust available")
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        
        // Obtener el certificado del servidor
        guard let serverCertificate = SecTrustGetCertificateAtIndex(serverTrust, 0) else {
            print("[MTLSHTTPClient] ⚠️ Could not get server certificate")
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        
        // Extraer la clave pública del certificado
        let serverPublicKey = SecCertificateCopyKey(serverCertificate)
        guard let publicKey = serverPublicKey else {
            print("[MTLSHTTPClient] ⚠️ Could not extract public key from certificate")
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        
        // Obtener la representación de la clave pública
        guard let publicKeyData = SecKeyCopyExternalRepresentation(publicKey, nil) as Data? else {
            print("[MTLSHTTPClient] ⚠️ Could not get public key data")
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        
        // Calcular SHA-256 hash de la clave pública
        let sha256Hash = sha256(data: publicKeyData)
        let sha256Base64 = sha256Hash.base64EncodedString()
        
        // Determinar los pins esperados según el host
        let host = challenge.protectionSpace.host
        
        let expectedPins: Set<String> = {
            if host.contains("ngrok.app") {
                // Pins para ngrok (desarrollo)
                // Para obtener: echo | openssl s_client -servername apuntador.ngrok.app -connect apuntador.ngrok.app:443 2>/dev/null | openssl x509 -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256 -binary | base64
                return [
                    "wexXiEAY/v67Xokb8oZpilJNMfon0OnTAB6vGdI94Mw=",
                    "YOUR_NGROK_BACKUP_PIN_HERE"
                ]
            } else if host.contains("apuntador.io") {
                // Pins para producción (API Gateway con custom domain o servidor directo)
                // Para obtener: echo | openssl s_client -servername api.apuntador.io -connect api.apuntador.io:443 2>/dev/null | openssl x509 -pubkey -noout | openssl pkey -pubin -outform DER | openssl dgst -sha256 -binary | base64
                return [
                    "YOUR_PRODUCTION_CERT_SHA256_PIN_HERE",
                    "YOUR_PRODUCTION_BACKUP_PIN_HERE"
                ]
            } else {
                // Host desconocido, no hay pins configurados
                print("[MTLSHTTPClient] ⚠️ Unknown host: \(host), no pins configured")
                return []
            }
        }()
        
        // Si no hay pins configurados para este host, rechazar
        if expectedPins.isEmpty {
            print("[MTLSHTTPClient] ❌ No certificate pins configured for host: \(host)")
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        
        // Verificar si el hash coincide con alguno de los pins esperados
        if expectedPins.contains(sha256Base64) {
            print("[MTLSHTTPClient] ✅ Certificate pin validated successfully for host: \(host)")
            let credential = URLCredential(trust: serverTrust)
            completionHandler(.useCredential, credential)
        } else {
            print("[MTLSHTTPClient] ❌ Certificate pin validation FAILED for host: \(host)")
            print("[MTLSHTTPClient] Expected one of: \(expectedPins)")
            print("[MTLSHTTPClient] Got: \(sha256Base64)")
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }
    
    /// Calcula el hash SHA-256 de los datos
    private func sha256(data: Data) -> Data {
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes {
            _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
        }
        return Data(hash)
    }
}

// MARK: - Error Types

enum MTLSError: Error {
    case invalidURL
    case sessionNotConfigured
    case invalidResponse
    case noCertificate
    case noPrivateKey
    case failedToCreateIdentity
    
    var localizedDescription: String {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .sessionNotConfigured:
            return "URLSession not configured"
        case .invalidResponse:
            return "Invalid HTTP response"
        case .noCertificate:
            return "No certificate found in Keychain"
        case .noPrivateKey:
            return "No private key found in Secure Enclave"
        case .failedToCreateIdentity:
            return "Failed to create SecIdentity"
        }
    }
}
