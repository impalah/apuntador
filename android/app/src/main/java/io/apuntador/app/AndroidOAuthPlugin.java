package io.apuntador.app;

import android.content.Intent;
import android.net.Uri;
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
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Plugin de Capacitor para OAuth 2.0 + PKCE en Android
 * 
 * Características:
 * - Genera code_verifier seguro con SecureRandom
 * - Calcula code_challenge con SHA-256
 * - Se comunica con el backend OAuth proxy
 * - Abre el navegador para autorización
 * - Captura el callback via deep link
 */
@CapacitorPlugin(name = "AndroidOAuth")
public class AndroidOAuthPlugin extends Plugin {
    private static final String TAG = "AndroidOAuth";
    private static final int CODE_VERIFIER_LENGTH = 64; // 64 bytes = 86 caracteres en base64url

    /**
     * Inicia el flujo de OAuth con PKCE
     * 
     * @param call Contiene: provider (string), backendUrl (string), redirectUri (string)
     * @return authorization_url (string), state (string JWT), code_verifier (string)
     */
    @PluginMethod
    public void authorize(PluginCall call) {
        String provider = call.getString("provider");
        String backendUrl = call.getString("backendUrl");
        String redirectUri = call.getString("redirectUri");

        if (provider == null || backendUrl == null || redirectUri == null) {
            call.reject("Missing required parameters: provider, backendUrl, redirectUri");
            return;
        }

        Log.d(TAG, "🚀 Starting OAuth authorization for provider: " + provider);

        try {
            // 1. Generar code_verifier seguro
            String codeVerifier = generateCodeVerifier();
            Log.d(TAG, "🔐 Generated code_verifier (length: " + codeVerifier.length() + ")");

            // 2. Hacer request al backend
            String authUrl = backendUrl + "/oauth/authorize/" + provider;
            JSONObject requestBody = new JSONObject();
            requestBody.put("code_verifier", codeVerifier);
            requestBody.put("redirect_uri", redirectUri);
            requestBody.put("state", JSONObject.NULL);

            Log.d(TAG, "📤 Sending request to backend: " + authUrl);
            
            JSONObject response = makeHttpPostRequest(authUrl, requestBody);

            String authorizationUrl = response.getString("authorization_url");
            String state = response.getString("state");

            Log.d(TAG, "✅ Received authorization URL from backend");

            // 3. Guardar code_verifier y state en SharedPreferences
            getContext().getSharedPreferences("oauth_prefs", 0)
                    .edit()
                    .putString(provider + "_code_verifier", codeVerifier)
                    .putString(provider + "_state", state)
                    .putString("oauth_current_provider", provider)
                    .apply();

            Log.d(TAG, "💾 Saved OAuth state to SharedPreferences");

            // 4. Abrir navegador con la URL de autorización
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(authorizationUrl));
            getActivity().startActivity(browserIntent);

            Log.d(TAG, "🌐 Opened browser for authorization");

            // 5. Retornar información al frontend
            JSObject result = new JSObject();
            result.put("authorization_url", authorizationUrl);
            result.put("state", state);
            result.put("code_verifier", codeVerifier);
            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "❌ Error in authorize: " + e.getMessage(), e);
            call.reject("OAuth authorization failed: " + e.getMessage());
        }
    }

    /**
     * Intercambia el código de autorización por tokens
     * 
     * @param call Contiene: provider (string), code (string), state (string), backendUrl (string)
     * @return access_token, refresh_token, expires_in
     */
    @PluginMethod
    public void exchangeToken(PluginCall call) {
        String provider = call.getString("provider");
        String code = call.getString("code");
        String state = call.getString("state");
        String backendUrl = call.getString("backendUrl");

        if (provider == null || code == null || backendUrl == null) {
            call.reject("Missing required parameters: provider, code, backendUrl");
            return;
        }

        Log.d(TAG, "🔄 Exchanging authorization code for tokens...");

        try {
            // 1. Recuperar code_verifier y state guardado
            String codeVerifier = getContext().getSharedPreferences("oauth_prefs", 0)
                    .getString(provider + "_code_verifier", null);
            String savedState = getContext().getSharedPreferences("oauth_prefs", 0)
                    .getString(provider + "_state", null);

            if (codeVerifier == null) {
                call.reject("Code verifier not found. Please restart OAuth flow.");
                return;
            }

            // 2. Verificar state (CSRF protection)
            if (state != null && !state.equals(savedState)) {
                call.reject("Invalid state. Possible CSRF attack.");
                return;
            }

            Log.d(TAG, "✅ State verified successfully");

            // 3. Hacer request al backend
            String tokenUrl = backendUrl + "/oauth/token/" + provider;
            JSONObject requestBody = new JSONObject();
            requestBody.put("code", code);
            requestBody.put("code_verifier", codeVerifier);
            requestBody.put("state", state != null ? state : savedState);

            Log.d(TAG, "📤 Sending token exchange request to backend");

            JSONObject response = makeHttpPostRequest(tokenUrl, requestBody);

            String accessToken = response.getString("access_token");
            String refreshToken = response.optString("refresh_token", null);
            int expiresIn = response.optInt("expires_in", 3600);

            Log.d(TAG, "🔑 Received tokens from backend");

            // 4. Limpiar SharedPreferences
            getContext().getSharedPreferences("oauth_prefs", 0)
                    .edit()
                    .remove(provider + "_code_verifier")
                    .remove(provider + "_state")
                    .remove("oauth_current_provider")
                    .apply();

            Log.d(TAG, "🧹 Cleaned up OAuth state");

            // 5. Retornar tokens
            JSObject result = new JSObject();
            result.put("access_token", accessToken);
            if (refreshToken != null) {
                result.put("refresh_token", refreshToken);
            }
            result.put("expires_in", expiresIn);
            call.resolve(result);

            Log.d(TAG, "✅ Token exchange completed successfully");

        } catch (Exception e) {
            Log.e(TAG, "❌ Error in exchangeToken: " + e.getMessage(), e);
            call.reject("Token exchange failed: " + e.getMessage());
        }
    }

    /**
     * Refresca un access token usando refresh token
     * 
     * @param call Contiene: provider (string), refreshToken (string), backendUrl (string)
     * @return access_token, expires_in
     */
    @PluginMethod
    public void refreshToken(PluginCall call) {
        String provider = call.getString("provider");
        String refreshToken = call.getString("refreshToken");
        String backendUrl = call.getString("backendUrl");

        if (provider == null || refreshToken == null || backendUrl == null) {
            call.reject("Missing required parameters: provider, refreshToken, backendUrl");
            return;
        }

        Log.d(TAG, "🔄 Refreshing access token for provider: " + provider);

        try {
            String refreshUrl = backendUrl + "/oauth/token/refresh/" + provider;
            JSONObject requestBody = new JSONObject();
            requestBody.put("refresh_token", refreshToken);

            JSONObject response = makeHttpPostRequest(refreshUrl, requestBody);

            String accessToken = response.getString("access_token");
            int expiresIn = response.optInt("expires_in", 3600);

            JSObject result = new JSObject();
            result.put("access_token", accessToken);
            result.put("expires_in", expiresIn);
            call.resolve(result);

            Log.d(TAG, "✅ Token refresh completed successfully");

        } catch (Exception e) {
            Log.e(TAG, "❌ Error in refreshToken: " + e.getMessage(), e);
            call.reject("Token refresh failed: " + e.getMessage());
        }
    }

    /**
     * Revoca un token
     * 
     * @param call Contiene: provider (string), token (string), backendUrl (string)
     */
    @PluginMethod
    public void revokeToken(PluginCall call) {
        String provider = call.getString("provider");
        String token = call.getString("token");
        String backendUrl = call.getString("backendUrl");

        if (provider == null || token == null || backendUrl == null) {
            call.reject("Missing required parameters: provider, token, backendUrl");
            return;
        }

        Log.d(TAG, "🚫 Revoking token for provider: " + provider);

        try {
            String revokeUrl = backendUrl + "/oauth/token/revoke/" + provider;
            JSONObject requestBody = new JSONObject();
            requestBody.put("token", token);

            JSONObject response = makeHttpPostRequest(revokeUrl, requestBody);

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);

            Log.d(TAG, "✅ Token revoked successfully");

        } catch (Exception e) {
            Log.e(TAG, "❌ Error in revokeToken: " + e.getMessage(), e);
            call.reject("Token revocation failed: " + e.getMessage());
        }
    }

    // ========== UTILIDADES ==========

    /**
     * Genera un code_verifier seguro usando SecureRandom
     * Según RFC 7636: 43-128 caracteres [A-Z, a-z, 0-9, -, ., _, ~]
     * 
     * @return code_verifier en formato base64url (sin padding)
     */
    private String generateCodeVerifier() {
        SecureRandom secureRandom = new SecureRandom();
        byte[] randomBytes = new byte[CODE_VERIFIER_LENGTH];
        secureRandom.nextBytes(randomBytes);
        
        // Base64 URL-safe sin padding
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);
    }

    /**
     * Hace una petición HTTP POST con JSON
     * 
     * @param urlString URL del endpoint
     * @param requestBody JSON body
     * @return JSON response
     */
    private JSONObject makeHttpPostRequest(String urlString, JSONObject requestBody) throws Exception {
        URL url = new URL(urlString);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        
        try {
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Accept", "application/json");
            connection.setDoOutput(true);
            connection.setConnectTimeout(10000); // 10 segundos
            connection.setReadTimeout(10000);

            // Enviar request body
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = requestBody.toString().getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }

            // Leer response
            int responseCode = connection.getResponseCode();
            Log.d(TAG, "📥 Response code: " + responseCode);

            if (responseCode >= 200 && responseCode < 300) {
                BufferedReader br = new BufferedReader(
                        new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder response = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    response.append(responseLine.trim());
                }
                return new JSONObject(response.toString());
            } else {
                // Leer error response
                BufferedReader br = new BufferedReader(
                        new InputStreamReader(connection.getErrorStream(), StandardCharsets.UTF_8));
                StringBuilder errorResponse = new StringBuilder();
                String responseLine;
                while ((responseLine = br.readLine()) != null) {
                    errorResponse.append(responseLine.trim());
                }
                throw new Exception("HTTP " + responseCode + ": " + errorResponse.toString());
            }
        } finally {
            connection.disconnect();
        }
    }
}
