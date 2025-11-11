import Foundation
import Capacitor

/**
 * Plugin de Capacitor para peticiones HTTP con mTLS y Certificate Pinning
 *
 * Este plugin expone MTLSHTTPClient a JavaScript/TypeScript, permitiendo:
 * - Certificate pinning (validación SHA-256 del servidor)
 * - mTLS con certificado de cliente (cuando está disponible)
 * - Peticiones HTTP seguras al backend
 */
@objc(MTLSHttp)
public class MTLSHttp: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MTLSHttp"
    public let jsName = "MTLSHttp"
    
    override public func load() {
        CAPLog.print("🔐 [MTLSHttp] Plugin loaded and registered")
        CAPLog.print("🔐 [MTLSHttp] identifier=\(identifier), jsName=\(jsName)")
    }
    
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise)
    ]
    
    private var httpClient: MTLSHTTPClient?
    
    /**
     * Realiza una petición HTTP con certificate pinning y mTLS opcional
     *
     * Parámetros:
     * - url: URL completa del endpoint
     * - method: Método HTTP (GET, POST, PUT, DELETE)
     * - headers: Diccionario de headers (opcional)
     * - body: Cuerpo de la petición (opcional, como string JSON)
     * - useMTLS: Si debe usar certificado de cliente (default: false para enrollment)
     *
     * Retorna:
     * - status: Código HTTP
     * - headers: Headers de respuesta
     * - data: Cuerpo de respuesta (string)
     */
    @objc func request(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"),
              let url = URL(string: urlString) else {
            call.reject("Invalid URL")
            return
        }
        
        let method = call.getString("method") ?? "GET"
        let headers = call.getObject("headers") as? [String: String] ?? [:]
        let bodyString = call.getString("body")
        let useMTLS = call.getBool("useMTLS") ?? false
        
        CAPLog.print("🌐 [MTLSHTTPPlugin] Request: \(method) \(urlString)")
        CAPLog.print("🔐 [MTLSHTTPPlugin] Certificate Pinning: ENABLED")
        CAPLog.print("🔐 [MTLSHTTPPlugin] Client Certificate (mTLS): \(useMTLS ? "ENABLED" : "DISABLED")")
        
        // Crear cliente HTTP (con o sin certificado de cliente)
        if useMTLS {
            // Con certificado de cliente para peticiones autenticadas
            httpClient = MTLSHTTPClient()
            httpClient?.configureSession()
        } else {
            // Sin certificado de cliente para enrollment (solo certificate pinning)
            httpClient = MTLSHTTPClient()
            // Configurar session sin certificado de cliente
            let configuration = URLSessionConfiguration.default
            configuration.timeoutIntervalForRequest = 30
            let session = URLSession(
                configuration: configuration,
                delegate: httpClient,
                delegateQueue: nil
            )
            httpClient?.urlSession = session
        }
        
        guard let client = httpClient else {
            call.reject("Failed to create HTTP client")
            return
        }
        
        // Crear request
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 30
        
        // Añadir headers
        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }
        
        // Añadir body si existe
        if let bodyString = bodyString {
            request.httpBody = bodyString.data(using: .utf8)
            if request.value(forHTTPHeaderField: "Content-Type") == nil {
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            }
        }
        
        // Realizar petición
        Task {
            do {
                let (data, response) = try await client.urlSession!.data(for: request)
                
                guard let httpResponse = response as? HTTPURLResponse else {
                    call.reject("Invalid response type")
                    return
                }
                
                CAPLog.print("✅ [MTLSHTTPPlugin] Response: \(httpResponse.statusCode)")
                
                // Convertir headers a diccionario
                var responseHeaders: [String: String] = [:]
                for (key, value) in httpResponse.allHeaderFields {
                    if let keyString = key as? String, let valueString = value as? String {
                        responseHeaders[keyString] = valueString
                    }
                }
                
                // Convertir data a string
                let responseBody = String(data: data, encoding: .utf8) ?? ""
                
                call.resolve([
                    "status": httpResponse.statusCode,
                    "headers": responseHeaders,
                    "data": responseBody
                ])
            } catch {
                CAPLog.print("❌ [MTLSHTTPPlugin] Request failed: \(error.localizedDescription)")
                call.reject("Request failed: \(error.localizedDescription)")
            }
        }
    }
}
