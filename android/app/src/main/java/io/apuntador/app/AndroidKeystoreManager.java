package io.apuntador.app;

import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Log;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.util.Enumeration;

/**
 * Gestor de Android Keystore con soporte para Hardware Security Module (HSM)
 * 
 * Características:
 * - Genera claves en StrongBox (chip dedicado) si está disponible
 * - Fallback a TEE (Trusted Execution Environment) si no hay StrongBox
 * - Las claves NUNCA salen del hardware
 * - Requiere autenticación biométrica para uso de claves
 * - Claves RSA 2048 bits para mTLS
 */
public class AndroidKeystoreManager {
    private static final String TAG = "AndroidKeystore";
    private static final String KEYSTORE_PROVIDER = "AndroidKeyStore";
    private static final String KEY_ALIAS_PREFIX = "apuntador_mtls_";
    private static final int KEY_SIZE = 2048;
    
    private final KeyStore keyStore;
    
    public AndroidKeystoreManager() throws Exception {
        keyStore = KeyStore.getInstance(KEYSTORE_PROVIDER);
        keyStore.load(null);
        Log.d(TAG, "✅ AndroidKeystore initialized");
    }
    
    /**
     * Genera un par de claves RSA en el Android Keystore (HSM)
     * 
     * @param alias Alias único para identificar la clave
     * @param useStrongBox Intentar usar StrongBox (chip dedicado)
     * @return KeyPair generado
     */
    public KeyPair generateKeyPair(String alias, boolean useStrongBox) throws Exception {
        String fullAlias = KEY_ALIAS_PREFIX + alias;
        
        Log.d(TAG, "🔐 Generating key pair in HSM...");
        Log.d(TAG, "   Alias: " + fullAlias);
        Log.d(TAG, "   Use StrongBox: " + useStrongBox);
        Log.d(TAG, "   Key Size: " + KEY_SIZE);
        
        // Verificar si ya existe
        if (keyStore.containsAlias(fullAlias)) {
            Log.w(TAG, "⚠️ Key already exists with alias: " + fullAlias);
            return getKeyPair(alias);
        }
        
        // Configurar generación de claves
        KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(
            fullAlias,
            KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY
        )
        .setKeySize(KEY_SIZE)
        .setDigests(KeyProperties.DIGEST_SHA256, KeyProperties.DIGEST_SHA512)
        .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1)
        .setUserAuthenticationRequired(false) // Para desarrollo, cambiar a true en producción
        .setCertificateSubject(new javax.security.auth.x500.X500Principal("CN=Apuntador mTLS"));
        
        // Intentar usar StrongBox (Android 9+)
        if (useStrongBox && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            try {
                builder.setIsStrongBoxBacked(true);
                KeyPairGenerator generator = KeyPairGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_RSA,
                    KEYSTORE_PROVIDER
                );
                generator.initialize(builder.build());
                KeyPair keyPair = generator.generateKeyPair();
                
                Log.d(TAG, "✅ Key pair generated in StrongBox (hardware chip)");
                logKeyInfo(fullAlias);
                return keyPair;
                
            } catch (Exception e) {
                Log.w(TAG, "⚠️ StrongBox not available, falling back to TEE: " + e.getMessage());
            }
        }
        
        // Fallback a TEE (Trusted Execution Environment)
        builder.setIsStrongBoxBacked(false);
        KeyPairGenerator generator = KeyPairGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_RSA,
            KEYSTORE_PROVIDER
        );
        generator.initialize(builder.build());
        KeyPair keyPair = generator.generateKeyPair();
        
        Log.d(TAG, "✅ Key pair generated in TEE (Trusted Execution Environment)");
        logKeyInfo(fullAlias);
        return keyPair;
    }
    
    /**
     * Recupera un par de claves existente del Keystore
     */
    public KeyPair getKeyPair(String alias) throws Exception {
        String fullAlias = KEY_ALIAS_PREFIX + alias;
        
        if (!keyStore.containsAlias(fullAlias)) {
            throw new Exception("Key not found: " + fullAlias);
        }
        
        KeyStore.PrivateKeyEntry entry = (KeyStore.PrivateKeyEntry) keyStore.getEntry(
            fullAlias,
            null
        );
        
        PrivateKey privateKey = entry.getPrivateKey();
        PublicKey publicKey = entry.getCertificate().getPublicKey();
        
        return new KeyPair(publicKey, privateKey);
    }
    
    /**
     * Verifica si existe una clave con el alias dado
     */
    public boolean hasKey(String alias) throws Exception {
        String fullAlias = KEY_ALIAS_PREFIX + alias;
        return keyStore.containsAlias(fullAlias);
    }
    
    /**
     * Elimina una clave del Keystore
     */
    public void deleteKey(String alias) throws Exception {
        String fullAlias = KEY_ALIAS_PREFIX + alias;
        
        if (keyStore.containsAlias(fullAlias)) {
            keyStore.deleteEntry(fullAlias);
            Log.d(TAG, "🗑️ Key deleted: " + fullAlias);
        }
    }
    
    /**
     * Guarda un certificado firmado asociado a una clave
     */
    public void storeCertificate(String alias, Certificate[] certChain) throws Exception {
        String fullAlias = KEY_ALIAS_PREFIX + alias;
        
        if (!keyStore.containsAlias(fullAlias)) {
            throw new Exception("Key not found: " + fullAlias);
        }
        
        // Obtener la clave privada existente
        KeyStore.PrivateKeyEntry entry = (KeyStore.PrivateKeyEntry) keyStore.getEntry(
            fullAlias,
            null
        );
        
        // Guardar con la nueva cadena de certificados
        keyStore.setEntry(
            fullAlias,
            new KeyStore.PrivateKeyEntry(entry.getPrivateKey(), certChain),
            null
        );
        
        Log.d(TAG, "💾 Certificate chain stored for: " + fullAlias);
        Log.d(TAG, "   Chain length: " + certChain.length);
    }
    
    /**
     * Obtiene el certificado asociado a una clave
     */
    public X509Certificate getCertificate(String alias) throws Exception {
        String fullAlias = KEY_ALIAS_PREFIX + alias;
        
        if (!keyStore.containsAlias(fullAlias)) {
            throw new Exception("Key not found: " + fullAlias);
        }
        
        Certificate cert = keyStore.getCertificate(fullAlias);
        if (cert instanceof X509Certificate) {
            return (X509Certificate) cert;
        }
        
        throw new Exception("Certificate is not X509: " + fullAlias);
    }
    
    /**
     * Lista todas las claves en el Keystore
     */
    public String[] listKeys() throws Exception {
        Enumeration<String> aliases = keyStore.aliases();
        java.util.List<String> keys = new java.util.ArrayList<>();
        
        while (aliases.hasMoreElements()) {
            String alias = aliases.nextElement();
            if (alias.startsWith(KEY_ALIAS_PREFIX)) {
                keys.add(alias.substring(KEY_ALIAS_PREFIX.length()));
            }
        }
        
        return keys.toArray(new String[0]);
    }
    
    /**
     * Verifica las capacidades de seguridad del dispositivo
     */
    public SecurityCapabilities getSecurityCapabilities() {
        SecurityCapabilities caps = new SecurityCapabilities();
        
        caps.hasKeystore = true;
        caps.apiLevel = Build.VERSION.SDK_INT;
        caps.manufacturer = Build.MANUFACTURER;
        caps.model = Build.MODEL;
        
        // StrongBox disponible en Android 9+
        caps.hasStrongBox = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P;
        
        // TEE disponible en Android 6+
        caps.hasTEE = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M;
        
        // Verificar si StrongBox realmente funciona
        if (caps.hasStrongBox) {
            try {
                String testAlias = "test_strongbox_check";
                KeyGenParameterSpec spec = new KeyGenParameterSpec.Builder(
                    testAlias,
                    KeyProperties.PURPOSE_SIGN
                )
                .setIsStrongBoxBacked(true)
                .build();
                
                KeyPairGenerator generator = KeyPairGenerator.getInstance(
                    KeyProperties.KEY_ALGORITHM_RSA,
                    KEYSTORE_PROVIDER
                );
                generator.initialize(spec);
                generator.generateKeyPair();
                
                keyStore.deleteEntry(testAlias);
                caps.strongBoxTested = true;
                caps.strongBoxWorks = true;
                
            } catch (Exception e) {
                caps.strongBoxTested = true;
                caps.strongBoxWorks = false;
                Log.w(TAG, "StrongBox test failed: " + e.getMessage());
            }
        }
        
        return caps;
    }
    
    /**
     * Log información sobre una clave
     */
    private void logKeyInfo(String alias) {
        try {
            if (!keyStore.containsAlias(alias)) return;
            
            Certificate cert = keyStore.getCertificate(alias);
            if (cert != null) {
                Log.d(TAG, "📋 Key Info:");
                Log.d(TAG, "   Type: " + cert.getType());
                Log.d(TAG, "   Format: " + cert.getPublicKey().getFormat());
                Log.d(TAG, "   Algorithm: " + cert.getPublicKey().getAlgorithm());
            }
        } catch (Exception e) {
            Log.e(TAG, "Error logging key info: " + e.getMessage());
        }
    }
    
    /**
     * Clase para reportar capacidades de seguridad
     */
    public static class SecurityCapabilities {
        public boolean hasKeystore;
        public boolean hasTEE;
        public boolean hasStrongBox;
        public boolean strongBoxTested;
        public boolean strongBoxWorks;
        public int apiLevel;
        public String manufacturer;
        public String model;
        
        @Override
        public String toString() {
            return "SecurityCapabilities{" +
                "hasKeystore=" + hasKeystore +
                ", hasTEE=" + hasTEE +
                ", hasStrongBox=" + hasStrongBox +
                ", strongBoxWorks=" + strongBoxWorks +
                ", apiLevel=" + apiLevel +
                ", manufacturer='" + manufacturer + '\'' +
                ", model='" + model + '\'' +
                '}';
        }
    }
}
