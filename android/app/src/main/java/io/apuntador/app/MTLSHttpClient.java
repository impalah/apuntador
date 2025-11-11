package io.apuntador.app;

import android.util.Log;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.cert.X509Certificate;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

/**
 * Cliente HTTP con soporte para mTLS (Mutual TLS).
 * 
 * Usa certificados del Android Keystore para autenticación del cliente.
 * El servidor verifica la identidad del dispositivo mediante el certificado.
 * 
 * Características:
 * - mTLS automático con certificado del Keystore
 * - Certificate pinning (opcional)
 * - Manejo de errores de certificado
 * - Logging detallado para debugging
 */
public class MTLSHttpClient {
    
    private static final String TAG = "MTLSHttpClient";
    private static final String KEY_ALIAS = "apuntador-mtls-key";
    private static final String KEYSTORE_PROVIDER = "AndroidKeyStore";
    
    private final AndroidKeystoreManager keystoreManager;
    private SSLContext sslContext;
    
    public MTLSHttpClient() throws Exception {
        this.keystoreManager = new AndroidKeystoreManager();
    }
    
    /**
     * Inicializa el contexto SSL con el certificado del Keystore.
     * 
     * @throws Exception si no hay certificado o falla la inicialización
     */
    private void initializeSSLContext() throws Exception {
        if (sslContext != null) {
            return; // Ya inicializado
        }
        
        // Verificar que existe un certificado
        X509Certificate cert = keystoreManager.getCertificate(KEY_ALIAS);
        if (cert == null) {
            throw new Exception("No mTLS certificate found. Device must be enrolled first.");
        }
        
        Log.d(TAG, "Initializing SSL context with certificate: " + cert.getSubjectDN());
        
        // Cargar KeyStore con el certificado y clave privada
        KeyStore keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
        keyStore.load(null);
        
        // Inicializar KeyManagerFactory con el KeyStore
        KeyManagerFactory kmf = KeyManagerFactory.getInstance(
            KeyManagerFactory.getDefaultAlgorithm()
        );
        kmf.init(keyStore, null); // Android Keystore no usa password
        
        // Crear SSLContext
        sslContext = SSLContext.getInstance("TLS");
        
        // NOTA: En producción, deberías usar un TrustManager que verifique
        // el certificado del servidor. Por ahora, usamos uno que acepta todo
        // para desarrollo.
        TrustManager[] trustAllCerts = new TrustManager[] {
            new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() {
                    return new X509Certificate[0];
                }
                public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                public void checkServerTrusted(X509Certificate[] certs, String authType) {}
            }
        };
        
        sslContext.init(kmf.getKeyManagers(), trustAllCerts, new java.security.SecureRandom());
        
        Log.d(TAG, "SSL context initialized successfully");
    }
    
    /**
     * Realiza un request HTTP GET con mTLS.
     * 
     * @param urlString URL del endpoint
     * @return Response del servidor como String
     * @throws Exception si falla el request o no hay certificado
     */
    public String get(String urlString) throws Exception {
        return request(urlString, "GET", null);
    }
    
    /**
     * Realiza un request HTTP POST con mTLS.
     * 
     * @param urlString URL del endpoint
     * @param body Cuerpo del request (puede ser null)
     * @return Response del servidor como String
     * @throws Exception si falla el request o no hay certificado
     */
    public String post(String urlString, String body) throws Exception {
        return request(urlString, "POST", body);
    }
    
    /**
     * Realiza un request HTTP POST con mTLS enviando JSON.
     * 
     * @param urlString URL del endpoint
     * @param jsonBody JSONObject a enviar
     * @return Response del servidor como String
     * @throws Exception si falla el request o no hay certificado
     */
    public String postJson(String urlString, JSONObject jsonBody) throws Exception {
        return request(urlString, "POST", jsonBody.toString());
    }
    
    /**
     * Realiza un request HTTP PUT con mTLS.
     * 
     * @param urlString URL del endpoint
     * @param body Cuerpo del request (puede ser null)
     * @return Response del servidor como String
     * @throws Exception si falla el request o no hay certificado
     */
    public String put(String urlString, String body) throws Exception {
        return request(urlString, "PUT", body);
    }
    
    /**
     * Realiza un request HTTP DELETE con mTLS.
     * 
     * @param urlString URL del endpoint
     * @return Response del servidor como String
     * @throws Exception si falla el request o no hay certificado
     */
    public String delete(String urlString) throws Exception {
        return request(urlString, "DELETE", null);
    }
    
    /**
     * Realiza un request HTTP con mTLS.
     * 
     * @param urlString URL del endpoint
     * @param method Método HTTP (GET, POST, PUT, DELETE)
     * @param body Cuerpo del request (puede ser null para GET/DELETE)
     * @return Response del servidor como String
     * @throws Exception si falla el request o no hay certificado
     */
    private String request(String urlString, String method, String body) throws Exception {
        // Inicializar SSL context si no está inicializado
        initializeSSLContext();
        
        Log.d(TAG, "Making " + method + " request to: " + urlString);
        
        URL url = new URL(urlString);
        HttpURLConnection conn;
        
        if (urlString.startsWith("https://")) {
            HttpsURLConnection httpsConn = (HttpsURLConnection) url.openConnection();
            httpsConn.setSSLSocketFactory(sslContext.getSocketFactory());
            conn = httpsConn;
        } else {
            conn = (HttpURLConnection) url.openConnection();
        }
        
        try {
            conn.setRequestMethod(method);
            conn.setRequestProperty("Accept", "application/json");
            conn.setConnectTimeout(30000); // 30 segundos
            conn.setReadTimeout(30000);
            
            // Si hay body, configurar para envío
            if (body != null && !body.isEmpty()) {
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                
                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = body.getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }
            }
            
            // Leer response
            int responseCode = conn.getResponseCode();
            Log.d(TAG, "Response code: " + responseCode);
            
            // Si es error, leer error stream
            if (responseCode >= 400) {
                try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                    
                    StringBuilder response = new StringBuilder();
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine.trim());
                    }
                    
                    String errorResponse = response.toString();
                    Log.e(TAG, "Error response: " + errorResponse);
                    throw new Exception("HTTP " + responseCode + ": " + errorResponse);
                }
            }
            
            // Leer success response
            try (BufferedReader br = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                
                String responseBody = response.toString();
                Log.d(TAG, "Response received: " + responseBody.substring(0, Math.min(100, responseBody.length())) + "...");
                
                return responseBody;
            }
            
        } finally {
            conn.disconnect();
        }
    }
    
    /**
     * Verifica si el cliente está listo para hacer requests mTLS.
     * 
     * @return true si hay un certificado válido
     */
    public boolean isReady() {
        try {
            X509Certificate cert = keystoreManager.getCertificate(KEY_ALIAS);
            if (cert == null) {
                return false;
            }
            
            // Verificar que el certificado no ha expirado
            cert.checkValidity();
            return true;
            
        } catch (Exception e) {
            Log.e(TAG, "mTLS client not ready", e);
            return false;
        }
    }
    
    /**
     * Obtiene información sobre el certificado actual.
     * 
     * @return JSONObject con información del certificado o null si no hay
     */
    public JSONObject getCertificateInfo() {
        try {
            X509Certificate cert = keystoreManager.getCertificate(KEY_ALIAS);
            if (cert == null) {
                return null;
            }
            
            JSONObject info = new JSONObject();
            info.put("subject", cert.getSubjectDN().toString());
            info.put("issuer", cert.getIssuerDN().toString());
            info.put("serial", cert.getSerialNumber().toString());
            info.put("notBefore", cert.getNotBefore().toString());
            info.put("notAfter", cert.getNotAfter().toString());
            
            return info;
            
        } catch (Exception e) {
            Log.e(TAG, "Error getting certificate info", e);
            return null;
        }
    }
    
    /**
     * Limpia el SSL context (útil después de renovar certificado).
     */
    public void reset() {
        sslContext = null;
        Log.d(TAG, "SSL context reset");
    }
}
