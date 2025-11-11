import Foundation
import Security
import UIKit

/**
 * Cliente HTTP con soporte para mTLS (Mutual TLS)
 * 
 * Este cliente configura URLSession para usar certificados de cliente
 * almacenados en el Keychain junto con la clave privada del Secure Enclave.
 */
class MTLSHTTPClient: NSObject {
    
    private let certificateLabel = "io.apuntador.mtls.certificate"
    private let keyLabel = "io.apuntador.mtls.privatekey"
    
    private var urlSession: URLSession?
    
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
        
        // Por ahora, confiar en el certificado del servidor
        // TODO: Implementar certificate pinning para mayor seguridad
        if let serverTrust = challenge.protectionSpace.serverTrust {
            let credential = URLCredential(trust: serverTrust)
            completionHandler(.useCredential, credential)
        } else {
            completionHandler(.performDefaultHandling, nil)
        }
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
