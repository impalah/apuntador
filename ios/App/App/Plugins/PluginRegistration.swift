/**
 * NOTA IMPORTANTE: Este archivo debe estar incluido en el target de Xcode
 * 
 * En Xcode:
 * 1. Click en el archivo PluginRegistration.swift en el navegador
 * 2. En el panel derecho, busca "Target Membership"
 * 3. Asegúrate que "App" esté marcado
 * 
 * Los plugins se registran automáticamente gracias a la macro @objc
 * definida en cada clase del plugin.
 */

// Este archivo simplemente asegura que los plugins Swift se compilan
// Los plugins se registran automáticamente con Capacitor usando @objc

// SecureEnclavePlugin ya está registrado en SecureEnclavePlugin.swift con:
// @objc(SecureEnclavePlugin)
// public class SecureEnclavePlugin: CAPPlugin { ... }

// AutoEnrollmentPlugin ya está registrado en AutoEnrollmentPlugin.swift con:
// @objc(AutoEnrollmentPlugin)
// public class AutoEnrollmentPlugin: CAPPlugin { ... }

