package io.apuntador.app;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import android.util.Log;

import java.security.cert.X509Certificate;
import java.util.Date;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Servicio de renovación automática de certificados mTLS.
 * 
 * - Verifica cada 24 horas si el certificado necesita renovación
 * - Renueva automáticamente si faltan < 5 días para expirar
 * - Se ejecuta en background
 */
public class CertificateRenewalService extends Service {
    
    private static final String TAG = "CertRenewalService";
    private static final String KEY_ALIAS = "apuntador-mtls-key";
    private static final long CHECK_INTERVAL_HOURS = 24;
    private static final int RENEWAL_THRESHOLD_DAYS = 5;
    
    private ScheduledExecutorService scheduler;
    private AndroidKeystoreManager keystoreManager;
    private String backendUrl;
    
    @Override
    public void onCreate() {
        super.onCreate();
        
        try {
            keystoreManager = new AndroidKeystoreManager();
            Log.i(TAG, "Certificate renewal service created");
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize keystore manager", e);
        }
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            backendUrl = intent.getStringExtra("backendUrl");
            if (backendUrl == null) {
                backendUrl = "https://apuntador.ngrok.app"; // Default para desarrollo
            }
        }
        
        Log.i(TAG, "Starting certificate renewal service with backend: " + backendUrl);
        
        // Iniciar scheduler para verificar cada 24 horas
        scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleAtFixedRate(
            this::checkAndRenewCertificate,
            0, // Verificar inmediatamente al iniciar
            CHECK_INTERVAL_HOURS,
            TimeUnit.HOURS
        );
        
        // Reiniciar servicio si es terminado por el sistema
        return START_STICKY;
    }
    
    /**
     * Verifica si el certificado necesita renovación y lo renueva si es necesario.
     */
    private void checkAndRenewCertificate() {
        try {
            Log.d(TAG, "Checking certificate status...");
            
            // Verificar si existe un certificado
            X509Certificate cert = keystoreManager.getCertificate(KEY_ALIAS);
            if (cert == null) {
                Log.i(TAG, "No certificate found, device needs enrollment");
                return;
            }
            
            // Calcular días restantes hasta expiración
            Date expiry = cert.getNotAfter();
            Date now = new Date();
            long millisRemaining = expiry.getTime() - now.getTime();
            long daysRemaining = millisRemaining / (1000 * 60 * 60 * 24);
            
            Log.d(TAG, "Certificate expires in " + daysRemaining + " days");
            
            // Si faltan más de 5 días, no hacer nada
            if (daysRemaining > RENEWAL_THRESHOLD_DAYS) {
                Log.d(TAG, "Certificate is valid, no renewal needed");
                return;
            }
            
            // Necesita renovación
            Log.i(TAG, "Certificate expires in " + daysRemaining + " days, renewing...");
            renewCertificate();
            
        } catch (Exception e) {
            Log.e(TAG, "Error checking certificate", e);
        }
    }
    
    /**
     * Renueva el certificado llamando al proceso de enrollment.
     */
    private void renewCertificate() {
        try {
            Log.i(TAG, "Starting certificate renewal process...");
            
            // Obtener información del dispositivo
            String deviceId = android.provider.Settings.Secure.getString(
                getContentResolver(),
                android.provider.Settings.Secure.ANDROID_ID
            );
            String manufacturer = android.os.Build.MANUFACTURER;
            String model = android.os.Build.MODEL;
            
            // Generar nuevo par de claves
            Log.d(TAG, "Generating new key pair...");
            keystoreManager.deleteKey(KEY_ALIAS); // Eliminar clave antigua
            
            AndroidKeystoreManager.SecurityCapabilities capabilities = 
                keystoreManager.getSecurityCapabilities();
            
            boolean useStrongBox = capabilities.hasStrongBox;
            java.security.KeyPair keyPair = keystoreManager.generateKeyPair(KEY_ALIAS, useStrongBox);
            
            // Generar CSR
            Log.d(TAG, "Generating CSR...");
            String csrPem = CSRGenerator.generateCSR(
                keyPair,
                deviceId,
                manufacturer,
                model
            );
            
            // Enviar al backend (implementación simplificada)
            Log.d(TAG, "Sending renewal request to backend...");
            
            org.json.JSONObject enrollRequest = new org.json.JSONObject();
            enrollRequest.put("csr", csrPem);
            enrollRequest.put("device_id", deviceId);
            enrollRequest.put("platform", "android");
            enrollRequest.put("manufacturer", manufacturer);
            enrollRequest.put("model", model);
            enrollRequest.put("android_version", android.os.Build.VERSION.RELEASE);
            enrollRequest.put("api_level", android.os.Build.VERSION.SDK_INT);
            enrollRequest.put("has_strongbox", capabilities.hasStrongBox);
            enrollRequest.put("has_tee", capabilities.hasTEE);
            
            // TODO: Usar MTLSHttpClient para enviar el request
            // Por ahora, usamos HTTP regular para la renovación
            String certificatePem = sendRenewalRequest(backendUrl, enrollRequest);
            
            if (certificatePem == null || certificatePem.isEmpty()) {
                throw new Exception("Backend returned empty certificate");
            }
            
            // Almacenar nuevo certificado
            Log.d(TAG, "Storing renewed certificate...");
            java.security.cert.CertificateFactory cf = 
                java.security.cert.CertificateFactory.getInstance("X.509");
            java.io.ByteArrayInputStream certStream = new java.io.ByteArrayInputStream(
                certificatePem.getBytes(java.nio.charset.StandardCharsets.UTF_8)
            );
            java.security.cert.Certificate certificate = cf.generateCertificate(certStream);
            
            java.security.cert.Certificate[] certChain = new java.security.cert.Certificate[]{certificate};
            keystoreManager.storeCertificate(KEY_ALIAS, certChain);
            
            Log.i(TAG, "Certificate renewed successfully!");
            
            // Notificar al usuario (opcional)
            // sendRenewalNotification();
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to renew certificate", e);
        }
    }
    
    /**
     * Envía el request de renovación al backend.
     */
    private String sendRenewalRequest(String baseUrl, org.json.JSONObject request) {
        try {
            java.net.URL url = new java.net.URL(baseUrl + "/device/enroll");
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(30000);
            
            // Enviar request
            try (java.io.OutputStream os = conn.getOutputStream()) {
                byte[] input = request.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
            
            // Leer response
            int responseCode = conn.getResponseCode();
            Log.d(TAG, "Renewal response code: " + responseCode);
            
            if (responseCode == 201 || responseCode == 200) {
                try (java.io.BufferedReader br = new java.io.BufferedReader(
                    new java.io.InputStreamReader(conn.getInputStream(), 
                    java.nio.charset.StandardCharsets.UTF_8))) {
                    
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) {
                        response.append(line.trim());
                    }
                    
                    org.json.JSONObject jsonResponse = new org.json.JSONObject(response.toString());
                    return jsonResponse.getString("certificate");
                }
            } else {
                throw new Exception("Renewal failed with code: " + responseCode);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending renewal request", e);
            return null;
        }
    }
    
    @Override
    public void onDestroy() {
        super.onDestroy();
        
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdown();
            Log.i(TAG, "Certificate renewal service stopped");
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null; // Servicio no vinculable
    }
}
