package io.apuntador.app;

import android.content.Intent;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

/**
 * Plugin de Capacitor para cliente HTTP con mTLS.
 * 
 * Proporciona métodos para hacer requests HTTP autenticados con certificados mTLS
 * y gestionar el servicio de renovación automática.
 */
@CapacitorPlugin(name = "MTLSClient")
public class MTLSClientPlugin extends Plugin {
    
    private static final String TAG = "MTLSClient";
    private MTLSHttpClient mtlsClient;
    
    @Override
    public void load() {
        super.load();
        try {
            mtlsClient = new MTLSHttpClient();
            Log.d(TAG, "MTLSClientPlugin loaded");
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize MTLSHttpClient", e);
        }
    }
    
    /**
     * Verifica si el cliente mTLS está listo (tiene certificado válido).
     * 
     * @param call Llamada desde JavaScript
     * @return {isReady: boolean, certificateInfo: object}
     */
    @PluginMethod
    public void isReady(PluginCall call) {
        try {
            boolean ready = mtlsClient.isReady();
            JSONObject certInfo = mtlsClient.getCertificateInfo();
            
            JSObject result = new JSObject();
            result.put("isReady", ready);
            
            if (certInfo != null) {
                result.put("certificateInfo", JSObject.fromJSONObject(certInfo));
            }
            
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error checking if ready", e);
            call.reject("Error checking mTLS readiness: " + e.getMessage(), e);
        }
    }
    
    /**
     * Realiza un request HTTP GET con mTLS.
     * 
     * @param call Llamada desde JavaScript con {url: string}
     * @return {data: string, statusCode: number}
     */
    @PluginMethod
    public void get(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("URL is required");
            return;
        }
        
        try {
            String response = mtlsClient.get(url);
            
            JSObject result = new JSObject();
            result.put("data", response);
            result.put("statusCode", 200);
            
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error in GET request", e);
            call.reject("GET request failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Realiza un request HTTP POST con mTLS.
     * 
     * @param call Llamada desde JavaScript con {url: string, body: string|object}
     * @return {data: string, statusCode: number}
     */
    @PluginMethod
    public void post(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("URL is required");
            return;
        }
        
        try {
            String body = null;
            
            // Intentar obtener body como objeto JSON
            JSObject bodyObj = call.getObject("body");
            if (bodyObj != null) {
                body = bodyObj.toString();
            } else {
                // Si no es objeto, intentar como string
                body = call.getString("body");
            }
            
            String response = mtlsClient.post(url, body);
            
            JSObject result = new JSObject();
            result.put("data", response);
            result.put("statusCode", 200);
            
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error in POST request", e);
            call.reject("POST request failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Realiza un request HTTP PUT con mTLS.
     * 
     * @param call Llamada desde JavaScript con {url: string, body: string|object}
     * @return {data: string, statusCode: number}
     */
    @PluginMethod
    public void put(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("URL is required");
            return;
        }
        
        try {
            String body = null;
            
            JSObject bodyObj = call.getObject("body");
            if (bodyObj != null) {
                body = bodyObj.toString();
            } else {
                body = call.getString("body");
            }
            
            String response = mtlsClient.put(url, body);
            
            JSObject result = new JSObject();
            result.put("data", response);
            result.put("statusCode", 200);
            
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error in PUT request", e);
            call.reject("PUT request failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Realiza un request HTTP DELETE con mTLS.
     * 
     * @param call Llamada desde JavaScript con {url: string}
     * @return {data: string, statusCode: number}
     */
    @PluginMethod
    public void delete(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("URL is required");
            return;
        }
        
        try {
            String response = mtlsClient.delete(url);
            
            JSObject result = new JSObject();
            result.put("data", response);
            result.put("statusCode", 200);
            
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error in DELETE request", e);
            call.reject("DELETE request failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Inicia el servicio de renovación automática de certificados.
     * 
     * @param call Llamada desde JavaScript con {backendUrl: string}
     * @return {success: boolean}
     */
    @PluginMethod
    public void startRenewalService(PluginCall call) {
        try {
            String backendUrl = call.getString("backendUrl", "https://apuntador.ngrok.app");
            
            Intent intent = new Intent(getContext(), CertificateRenewalService.class);
            intent.putExtra("backendUrl", backendUrl);
            getContext().startService(intent);
            
            Log.i(TAG, "Certificate renewal service started");
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error starting renewal service", e);
            call.reject("Failed to start renewal service: " + e.getMessage(), e);
        }
    }
    
    /**
     * Detiene el servicio de renovación automática de certificados.
     * 
     * @param call Llamada desde JavaScript
     * @return {success: boolean}
     */
    @PluginMethod
    public void stopRenewalService(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), CertificateRenewalService.class);
            getContext().stopService(intent);
            
            Log.i(TAG, "Certificate renewal service stopped");
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error stopping renewal service", e);
            call.reject("Failed to stop renewal service: " + e.getMessage(), e);
        }
    }
    
    /**
     * Resetea el cliente mTLS (útil después de renovar certificado).
     * 
     * @param call Llamada desde JavaScript
     * @return {success: boolean}
     */
    @PluginMethod
    public void reset(PluginCall call) {
        try {
            mtlsClient.reset();
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error resetting client", e);
            call.reject("Failed to reset client: " + e.getMessage(), e);
        }
    }
}
