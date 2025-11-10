import Foundation
import Security
import UIKit

/**
 * Manager para operaciones del Secure Enclave
 * 
 * El Secure Enclave es un coprocesador de seguridad aislado incluido en:
 * - iPhone 5s y posteriores
 * - iPad Air, iPad Pro y posteriores
 * - Apple Watch Serie 1 y posteriores
 * 
 * Las claves privadas generadas en el Secure Enclave NUNCA pueden ser exportadas.
 */
class SecureEnclaveManager {
    
    /**
     * Genera un par de claves EC (P-256) en el Secure Enclave
     * 
     * - Parameter label: Identificador único para la clave
     * - Returns: SecKey (private key) - la clave pública se puede derivar de esta
     * - Throws: Error si el dispositivo no tiene Secure Enclave o falla la generación
     */
    static func generateKeyPair(label: String) throws -> SecKey {
        // Configuración para generar clave en Secure Enclave
        let access = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            [.privateKeyUsage],  // Solo usar la clave privada, no exportar
            nil
        )!
        
        let attributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256,  // P-256
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,  // ⭐️ CRÍTICO: almacenar en Secure Enclave
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String: true,
                kSecAttrApplicationLabel as String: label,
                kSecAttrAccessControl as String: access
            ]
        ]
        
        var error: Unmanaged<CFError>?
        guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
            throw error!.takeRetainedValue() as Error
        }
        
        return privateKey
    }
    
    /**
     * Obtiene los parámetros de configuración para claves públicas
     * (usado para verificar disponibilidad del Secure Enclave)
     */
    static func getPublicKeyParameters() -> SecKey? {
        let attributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256
        ]
        
        var error: Unmanaged<CFError>?
        let key = SecKeyCreateRandomKey(attributes as CFDictionary, &error)
        return key
    }
    
    /**
     * Firma datos usando la clave privada del Secure Enclave
     * 
     * - Parameters:
     *   - data: Datos a firmar
     *   - privateKey: Clave privada del Secure Enclave
     * - Returns: Firma en formato DER
     */
    static func signData(_ data: Data, with privateKey: SecKey) throws -> Data {
        var error: Unmanaged<CFError>?
        
        guard let signature = SecKeyCreateSignature(
            privateKey,
            .ecdsaSignatureMessageX962SHA256,  // ECDSA con SHA256
            data as CFData,
            &error
        ) as Data? else {
            throw error!.takeRetainedValue() as Error
        }
        
        return signature
    }
    
    /**
     * Verifica si un dispositivo tiene Secure Enclave disponible
     * 
     * - Returns: true si el Secure Enclave está disponible
     */
    static func isAvailable() -> Bool {
        // Intentar crear una clave temporal en el Secure Enclave
        let access = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            [.privateKeyUsage],
            nil
        )
        
        guard let _ = access else {
            return false
        }
        
        let attributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave
        ]
        
        var error: Unmanaged<CFError>?
        if let key = SecKeyCreateRandomKey(attributes as CFDictionary, &error) {
            // Eliminar la clave temporal
            let deleteQuery: [String: Any] = [
                kSecValueRef as String: key
            ]
            SecItemDelete(deleteQuery as CFDictionary)
            return true
        }
        
        return false
    }
    
    /**
     * Obtiene información del dispositivo y Secure Enclave
     */
    static func getDeviceInfo() -> [String: Any] {
        return [
            "hasSecureEnclave": isAvailable(),
            "deviceModel": UIDevice.current.model,
            "systemVersion": UIDevice.current.systemVersion,
            "deviceName": UIDevice.current.name
        ]
    }
}
