package io.apuntador.app;

import android.content.Context;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.io.ByteArrayInputStream;
import java.util.Date;

/**
 * Plugin de Capacitor para enrollment de dispositivos con mTLS y HSM.
 * 
 * Flujo:
 * 1. Genera par de claves en HSM (StrongBox/TEE)
 * 2. Crea Certificate Signing Request (CSR)
 * 3. Envía CSR al backend CA
 * 4. Recibe certificado firmado
 * 5. Almacena certificado en Keystore
 * 
 * Las claves privadas NUNCA salen del hardware.
 */
@CapacitorPlugin(name = "DeviceEnrollment")
public class DeviceEnrollmentPlugin extends Plugin {
    
    private static final String TAG = "DeviceEnrollment";
    private static final String KEY_ALIAS = "apuntador-mtls-key";
    
    private AndroidKeystoreManager keystoreManager;
    
    @Override
    public void load() {
        super.load();
        try {
            keystoreManager = new AndroidKeystoreManager();
            Log.d(TAG, "DeviceEnrollmentPlugin loaded");
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize AndroidKeystoreManager", e);
        }
    }
    
    /**
     * Obtiene información del dispositivo y capacidades de seguridad.
     * 
     * @param call Llamada desde JavaScript
     * @return JSObject con:
     *   - deviceId: Android ID único
     *   - manufacturer: Fabricante (Samsung, Google, etc.)
     *   - model: Modelo del dispositivo
     *   - androidVersion: Versión de Android
     *   - apiLevel: Nivel de API
     *   - hasStrongBox: true si tiene chip StrongBox
     *   - hasTEE: true si tiene Trusted Execution Environment
     *   - hasKeystore: true si tiene Android Keystore
     */
    @PluginMethod
    public void getDeviceInfo(PluginCall call) {
        try {
            Context context = getContext();
            
            // Obtener Device ID (Android ID único por dispositivo)
            String deviceId = Settings.Secure.getString(
                context.getContentResolver(),
                Settings.Secure.ANDROID_ID
            );
            
            // Información del dispositivo
            String manufacturer = Build.MANUFACTURER;
            String model = Build.MODEL;
            int apiLevel = Build.VERSION.SDK_INT;
            String androidVersion = Build.VERSION.RELEASE;
            
            // Capacidades de seguridad
            AndroidKeystoreManager.SecurityCapabilities capabilities = 
                keystoreManager.getSecurityCapabilities();
            
            JSObject result = new JSObject();
            result.put("deviceId", deviceId);
            result.put("manufacturer", manufacturer);
            result.put("model", model);
            result.put("androidVersion", androidVersion);
            result.put("apiLevel", apiLevel);
            result.put("hasStrongBox", capabilities.hasStrongBox);
            result.put("hasTEE", capabilities.hasTEE);
            result.put("hasKeystore", capabilities.hasKeystore);
            
            Log.i(TAG, "Device info: " + manufacturer + " " + model + 
                  ", StrongBox: " + capabilities.hasStrongBox + 
                  ", TEE: " + capabilities.hasTEE);
            
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error getting device info", e);
            call.reject("Error getting device info: " + e.getMessage(), e);
        }
    }
    
    /**
     * Enrolla el dispositivo en el backend con mTLS.
     * 
     * Flujo completo:
     * 1. Genera par de claves en HSM
     * 2. Crea CSR con información del dispositivo
     * 3. Envía CSR al backend para firma
     * 4. Recibe certificado firmado por CA
     * 5. Almacena certificado en Keystore
     * 
     * @param call Llamada desde JavaScript con:
     *   - backendUrl: URL del backend (ej: https://api.apuntador.io)
     *   - useStrongBox: (opcional) forzar uso de StrongBox, default: true
     */
    @PluginMethod
    public void enrollDevice(PluginCall call) {
        try {
            String backendUrl = call.getString("backendUrl");
            Boolean useStrongBox = call.getBoolean("useStrongBox", true);
            
            if (backendUrl == null || backendUrl.isEmpty()) {
                call.reject("backendUrl is required");
                return;
            }
            
            // Normalizar URL (quitar trailing slash)
            backendUrl = backendUrl.replaceAll("/$", "");
            
            Log.i(TAG, "Starting device enrollment...");
            Log.d(TAG, "Backend URL: " + backendUrl);
            Log.d(TAG, "Use StrongBox: " + useStrongBox);
            
            Context context = getContext();
            String deviceId = Settings.Secure.getString(
                context.getContentResolver(),
                Settings.Secure.ANDROID_ID
            );
            
            // Paso 1: Verificar si ya existe un certificado válido
            X509Certificate existingCert = null;
            try {
                existingCert = keystoreManager.getCertificate(KEY_ALIAS);
            } catch (Exception e) {
                Log.d(TAG, "No existing certificate found (this is OK for first enrollment)");
            }
            
            if (existingCert != null) {
                Date expiry = existingCert.getNotAfter();
                Date now = new Date();
                
                // Si el certificado es válido por más de 5 días, no re-enrollar
                long daysRemaining = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                if (daysRemaining > 5) {
                    Log.i(TAG, "Valid certificate already exists (expires in " + daysRemaining + " days)");
                    
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("alreadyEnrolled", true);
                    result.put("deviceId", deviceId);
                    result.put("certificateExpiry", expiry.toString());
                    result.put("daysRemaining", daysRemaining);
                    
                    call.resolve(result);
                    return;
                }
                
                Log.i(TAG, "Certificate expires soon (" + daysRemaining + " days), re-enrolling...");
                // Eliminar certificado antiguo
                keystoreManager.deleteKey(KEY_ALIAS);
            }
            
            // Paso 2: Generar par de claves en HSM
            Log.i(TAG, "Generating key pair in HSM...");
            KeyPair keyPair = keystoreManager.generateKeyPair(KEY_ALIAS, useStrongBox);
            if (keyPair == null) {
                call.reject("Failed to generate key pair in HSM");
                return;
            }
            Log.d(TAG, "Key pair generated successfully");
            
            // Paso 3: Crear CSR
            Log.i(TAG, "Generating CSR...");
            String manufacturer = Build.MANUFACTURER;
            String model = Build.MODEL;
            
            String csrPem = CSRGenerator.generateCSR(
                keyPair,
                deviceId,
                manufacturer,
                model
            );
            
            if (csrPem == null || csrPem.isEmpty()) {
                keystoreManager.deleteKey(KEY_ALIAS);
                call.reject("Failed to generate CSR");
                return;
            }
            Log.d(TAG, "CSR generated successfully");
            
            // Verificar CSR antes de enviar
            if (!CSRGenerator.verifyCSR(csrPem)) {
                keystoreManager.deleteKey(KEY_ALIAS);
                call.reject("CSR verification failed");
                return;
            }
            
            // Paso 4: Enviar CSR al backend
            Log.i(TAG, "Sending CSR to backend: " + backendUrl + "/device/enroll");
            
            JSONObject enrollRequest = new JSONObject();
            enrollRequest.put("csr", csrPem);
            enrollRequest.put("device_id", deviceId);
            enrollRequest.put("platform", "android");  // Campo requerido por el backend
            enrollRequest.put("manufacturer", manufacturer);
            enrollRequest.put("model", model);
            enrollRequest.put("android_version", Build.VERSION.RELEASE);
            enrollRequest.put("api_level", Build.VERSION.SDK_INT);
            
            // Obtener capacidades de seguridad
            AndroidKeystoreManager.SecurityCapabilities capabilities = 
                keystoreManager.getSecurityCapabilities();
            enrollRequest.put("has_strongbox", capabilities.hasStrongBox);
            enrollRequest.put("has_tee", capabilities.hasTEE);
            
            String certificatePem = sendEnrollmentRequest(backendUrl, enrollRequest);
            
            if (certificatePem == null || certificatePem.isEmpty()) {
                keystoreManager.deleteKey(KEY_ALIAS);
                call.reject("Backend returned empty certificate");
                return;
            }
            
            // Paso 5: Parsear y almacenar certificado
            Log.i(TAG, "Storing certificate in Keystore...");
            
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            ByteArrayInputStream certStream = new ByteArrayInputStream(
                certificatePem.getBytes(StandardCharsets.UTF_8)
            );
            Certificate certificate = cf.generateCertificate(certStream);
            
            if (!(certificate instanceof X509Certificate)) {
                keystoreManager.deleteKey(KEY_ALIAS);
                call.reject("Invalid certificate format");
                return;
            }
            
            X509Certificate x509Cert = (X509Certificate) certificate;
            
            // Almacenar certificado con la clave
            Certificate[] certChain = new Certificate[] { certificate };
            keystoreManager.storeCertificate(KEY_ALIAS, certChain);
            
            Log.i(TAG, "Device enrolled successfully!");
            Log.d(TAG, "Certificate valid until: " + x509Cert.getNotAfter());
            
            // Retornar resultado
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("alreadyEnrolled", false);
            result.put("deviceId", deviceId);
            result.put("certificateExpiry", x509Cert.getNotAfter().toString());
            result.put("certificateSubject", x509Cert.getSubjectDN().toString());
            result.put("certificateSerial", x509Cert.getSerialNumber().toString());
            
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error during enrollment", e);
            
            // Limpiar en caso de error
            try {
                keystoreManager.deleteKey(KEY_ALIAS);
            } catch (Exception cleanupError) {
                Log.e(TAG, "Error cleaning up after failed enrollment", cleanupError);
            }
            
            call.reject("Enrollment failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Verifica si el dispositivo está enrollado y el certificado es válido.
     * 
     * @param call Llamada desde JavaScript
     * @return JSObject con:
     *   - isEnrolled: true si hay certificado válido
     *   - certificateExpiry: fecha de expiración
     *   - daysRemaining: días hasta expiración
     *   - needsRenewal: true si faltan < 5 días
     */
    @PluginMethod
    public void checkEnrollmentStatus(PluginCall call) {
        try {
            X509Certificate cert = null;
            try {
                cert = keystoreManager.getCertificate(KEY_ALIAS);
            } catch (Exception e) {
                // No certificate found - device is not enrolled
                Log.d(TAG, "No certificate found - device not enrolled");
            }
            
            if (cert == null) {
                JSObject result = new JSObject();
                result.put("isEnrolled", false);
                result.put("needsRenewal", true);
                call.resolve(result);
                return;
            }
            
            Date expiry = cert.getNotAfter();
            Date now = new Date();
            long daysRemaining = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            
            JSObject result = new JSObject();
            result.put("isEnrolled", true);
            result.put("certificateExpiry", expiry.toString());
            result.put("daysRemaining", daysRemaining);
            result.put("needsRenewal", daysRemaining <= 5);
            result.put("certificateSubject", cert.getSubjectDN().toString());
            result.put("certificateSerial", cert.getSerialNumber().toString());
            
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error checking enrollment status", e);
            call.reject("Error checking enrollment status: " + e.getMessage(), e);
        }
    }
    
    /**
     * Elimina el enrollment del dispositivo (revoca certificado).
     * 
     * @param call Llamada desde JavaScript con:
     *   - backendUrl: (opcional) URL del backend para revocar en servidor
     */
    @PluginMethod
    public void unenrollDevice(PluginCall call) {
        try {
            String backendUrl = call.getString("backendUrl");
            
            // Si se proporciona backend URL, intentar revocar en servidor
            if (backendUrl != null && !backendUrl.isEmpty()) {
                try {
                    X509Certificate cert = keystoreManager.getCertificate(KEY_ALIAS);
                    if (cert != null) {
                        String serial = cert.getSerialNumber().toString();
                        revokeOnBackend(backendUrl, serial);
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Failed to revoke on backend (continuing with local deletion)", e);
                }
            }
            
            // Eliminar localmente
            keystoreManager.deleteKey(KEY_ALIAS);
            
            Log.i(TAG, "Device unenrolled successfully");
            
            JSObject result = new JSObject();
            result.put("success", true);
            
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error unenrolling device", e);
            call.reject("Error unenrolling device: " + e.getMessage(), e);
        }
    }
    
    /**
     * Envía el CSR al backend y recibe el certificado firmado.
     */
    private String sendEnrollmentRequest(String backendUrl, JSONObject requestBody) throws Exception {
        URL url = new URL(backendUrl + "/device/enroll");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        
        try {
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(30000); // 30 segundos
            conn.setReadTimeout(30000);
            
            // Enviar request
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = requestBody.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            // Leer response
            int responseCode = conn.getResponseCode();
            Log.d(TAG, "Backend response code: " + responseCode);
            
            if (responseCode != HttpURLConnection.HTTP_OK && 
                responseCode != HttpURLConnection.HTTP_CREATED) {
                
                // Leer error response
                try (BufferedReader br = new BufferedReader(
                    new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8))) {
                    
                    StringBuilder response = new StringBuilder();
                    String responseLine;
                    while ((responseLine = br.readLine()) != null) {
                        response.append(responseLine.trim());
                    }
                    
                    Log.e(TAG, "Backend error: " + response.toString());
                    throw new Exception("Backend enrollment failed: " + response.toString());
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
                
                JSONObject jsonResponse = new JSONObject(response.toString());
                String certificate = jsonResponse.getString("certificate");
                
                Log.d(TAG, "Received certificate from backend");
                return certificate;
            }
            
        } finally {
            conn.disconnect();
        }
    }
    
    /**
     * Revoca el certificado en el backend.
     */
    private void revokeOnBackend(String backendUrl, String serial) throws Exception {
        URL url = new URL(backendUrl + "/device/revoke");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        
        try {
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            
            JSONObject requestBody = new JSONObject();
            requestBody.put("serial", serial);
            
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = requestBody.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            int responseCode = conn.getResponseCode();
            Log.d(TAG, "Revoke response code: " + responseCode);
            
        } finally {
            conn.disconnect();
        }
    }
}
