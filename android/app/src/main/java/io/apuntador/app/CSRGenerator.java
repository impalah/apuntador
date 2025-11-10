package io.apuntador.app;

import android.util.Base64;
import android.util.Log;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x509.SubjectPublicKeyInfo;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.pkcs.PKCS10CertificationRequest;
import org.bouncycastle.pkcs.PKCS10CertificationRequestBuilder;
import java.security.KeyPair;
import java.security.PrivateKey;
import java.security.PublicKey;

/**
 * Generador de Certificate Signing Request (CSR) para device enrollment
 * 
 * El CSR contiene:
 * - Clave pública del dispositivo
 * - Información del dispositivo (CN, O, OU)
 * - Firma con la clave privada del HSM
 * 
 * Este CSR se envía al backend CA para obtener un certificado firmado
 */
public class CSRGenerator {
    private static final String TAG = "CSRGenerator";
    private static final String SIGNATURE_ALGORITHM = "SHA256withRSA";
    
    /**
     * Genera un CSR (Certificate Signing Request) para device enrollment
     * 
     * @param keyPair Par de claves del HSM
     * @param deviceId ID único del dispositivo
     * @param manufacturer Fabricante del dispositivo
     * @param model Modelo del dispositivo
     * @return CSR en formato PEM (Base64)
     */
    public static String generateCSR(
        KeyPair keyPair,
        String deviceId,
        String manufacturer,
        String model
    ) throws Exception {
        
        Log.d(TAG, "📝 Generating CSR...");
        Log.d(TAG, "   Device ID: " + deviceId);
        Log.d(TAG, "   Manufacturer: " + manufacturer);
        Log.d(TAG, "   Model: " + model);
        
        // Construir el subject del certificado
        // CN = Common Name (Device ID)
        // O = Organization (Apuntador)
        // OU = Organizational Unit (Manufacturer + Model)
        String subject = String.format(
            "CN=%s, O=Apuntador, OU=%s %s",
            deviceId,
            manufacturer,
            model
        );
        
        X500Name subjectDN = new X500Name(subject);
        
        Log.d(TAG, "   Subject: " + subject);
        
        // Extraer clave pública
        PublicKey publicKey = keyPair.getPublic();
        SubjectPublicKeyInfo subjectPublicKeyInfo = SubjectPublicKeyInfo.getInstance(
            publicKey.getEncoded()
        );
        
        // Crear builder del CSR
        PKCS10CertificationRequestBuilder csrBuilder = 
            new PKCS10CertificationRequestBuilder(subjectDN, subjectPublicKeyInfo);
        
        // Firmar el CSR con la clave privada
        // IMPORTANTE: Esta firma se hace EN EL HSM, la clave privada nunca sale
        PrivateKey privateKey = keyPair.getPrivate();
        ContentSigner signer = new JcaContentSignerBuilder(SIGNATURE_ALGORITHM)
            .build(privateKey);
        
        PKCS10CertificationRequest csr = csrBuilder.build(signer);
        
        // Convertir a PEM (Base64)
        byte[] csrBytes = csr.getEncoded();
        String csrPem = "-----BEGIN CERTIFICATE REQUEST-----\n" +
                       Base64.encodeToString(csrBytes, Base64.NO_WRAP) +
                       "\n-----END CERTIFICATE REQUEST-----";
        
        Log.d(TAG, "✅ CSR generated successfully");
        Log.d(TAG, "   Length: " + csrPem.length() + " chars");
        
        return csrPem;
    }
    
    /**
     * Verifica que un CSR es válido
     */
    public static boolean verifyCSR(String csrPem) {
        try {
            // Remover headers PEM
            String csrBase64 = csrPem
                .replace("-----BEGIN CERTIFICATE REQUEST-----", "")
                .replace("-----END CERTIFICATE REQUEST-----", "")
                .replaceAll("\\s", "");
            
            // Decodificar Base64
            byte[] csrBytes = Base64.decode(csrBase64, Base64.DEFAULT);
            
            // Parsear CSR
            PKCS10CertificationRequest csr = new PKCS10CertificationRequest(csrBytes);
            
            // Verificar firma
            boolean valid = csr.isSignatureValid(
                new org.bouncycastle.operator.jcajce.JcaContentVerifierProviderBuilder()
                    .build(csr.getSubjectPublicKeyInfo())
            );
            
            Log.d(TAG, "✅ CSR verification: " + (valid ? "VALID" : "INVALID"));
            return valid;
            
        } catch (Exception e) {
            Log.e(TAG, "❌ CSR verification failed: " + e.getMessage());
            return false;
        }
    }
}
