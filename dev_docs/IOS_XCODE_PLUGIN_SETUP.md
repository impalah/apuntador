# Configuración de Plugins iOS en Xcode

## ⚠️ **IMPORTANTE: Configurar Target Membership**

Los archivos Swift de los plugins **DEBEN** estar incluidos en el target de compilación de Xcode. Sigue estos pasos:

## 📋 **Pasos para configurar en Xcode**

### **1. Abrir el proyecto en Xcode**

```bash
cd /Users/linus/projects/press-any-key/apuntador
npx cap open ios
```

### **2. Verificar Target Membership de los archivos del plugin**

En Xcode, para **CADA** uno de estos archivos:

- `ios/App/App/Plugins/SecureEnclavePlugin.swift`
- `ios/App/App/Plugins/SecureEnclaveManager.swift`
- `ios/App/App/Plugins/CSRGenerator.swift`
- `ios/App/App/Plugins/MTLSHTTPClient.swift`
- `ios/App/App/Plugins/AutoEnrollmentPlugin.swift`
- `ios/App/App/Plugins/PluginRegistration.swift`

**Hacer:**

1. Click en el archivo en el navegador de proyecto (panel izquierdo)
2. En el panel derecho (File Inspector), busca la sección **"Target Membership"**
3. **Asegúrate que la casilla "App" esté MARCADA** ✅
4. Si no lo está, márcala

### **3. Verificar que no hay errores de compilación**

1. En Xcode, presiona `⌘B` (Command + B) para compilar
2. Verifica que no haya errores en el panel de navegación (Issues Navigator)
3. Si hay errores, revisa:
   - Que todos los archivos tengan Target Membership en "App"
   - Que no falten imports

### **4. Limpiar y recompilar (si es necesario)**

Si los plugins no se cargan:

1. En Xcode: **Product > Clean Build Folder** (⇧⌘K)
2. Cerrar Xcode
3. Eliminar carpeta de build:
   ```bash
   rm -rf ios/App/build
   rm -rf ios/App/DerivedData
   ```
4. Sincronizar Capacitor:
   ```bash
   npx cap sync ios
   ```
5. Volver a abrir Xcode:
   ```bash
   npx cap open ios
   ```
6. Build & Run (⌘R)

## 🔍 **Verificar que los plugins están registrados**

### **Opción 1: Ver logs de Capacitor al iniciar la app**

En Xcode Console, al iniciar la app deberías ver:

```
⚡️  [capacitor] Loading Capacitor plugins...
⚡️  [capacitor] Loaded plugin: SecureEnclave
⚡️  [capacitor] Loaded plugin: AutoEnrollment
```

### **Opción 2: Probar desde Safari Web Inspector**

1. Conectar iPad y ejecutar la app
2. Safari > Develop > [iPad] > [Apuntador]
3. En la consola de JavaScript, ejecutar:

```javascript
// Verificar que los plugins existen
console.log(window.Capacitor.Plugins.SecureEnclave)
console.log(window.Capacitor.Plugins.AutoEnrollment)

// Probar una función
const result = await window.Capacitor.Plugins.SecureEnclave.isSecureEnclaveAvailable()
console.log('Secure Enclave available:', result)
```

Si aparece `undefined`, significa que los plugins **NO** están registrados.

## 🐛 **Troubleshooting**

### **Error: "Plugin not implemented on ios"**

**Causa:** Los archivos Swift no están incluidos en el target de compilación.

**Solución:**
1. Verificar Target Membership (paso 2 arriba)
2. Limpiar build folder (paso 4 arriba)
3. Recompilar

### **Error: "Module not found" o errores de compilación**

**Causa:** Falta importar algún módulo o hay errores de sintaxis Swift.

**Solución:**
1. Revisar el Issues Navigator en Xcode (⌘5)
2. Click en el error para ver detalles
3. Asegurarse que todos los archivos tengan estos imports:
   ```swift
   import Foundation
   import Capacitor
   import Security
   ```

### **Error: "Use of undeclared type 'SecKey'" o similar**

**Causa:** Falta el import de `Security` framework.

**Solución:**
Añadir al inicio del archivo:
```swift
import Security
```

### **Los plugins no aparecen en Capacitor.Plugins**

**Causa:** Los plugins no están compilándose o no tienen la anotación @objc correcta.

**Solución:**
1. Verificar que cada clase del plugin tenga la anotación `@objc`:
   ```swift
   @objc(SecureEnclavePlugin)
   public class SecureEnclavePlugin: CAPPlugin {
   ```
2. Verificar que cada método tenga `@objc`:
   ```swift
   @objc func generateKeyPair(_ call: CAPPluginCall) {
   ```

## 📝 **Checklist de Configuración**

Marca cada paso cuando lo completes:

- [ ] Todos los archivos .swift están en `ios/App/App/Plugins/`
- [ ] Todos los archivos tienen Target Membership en "App"
- [ ] Xcode compila sin errores (⌘B)
- [ ] Los plugins aparecen en logs de Capacitor al iniciar
- [ ] Los plugins son accesibles desde Safari Web Inspector
- [ ] Las funciones del plugin funcionan correctamente

## 🎯 **Siguiente paso**

Una vez que los plugins estén correctamente registrados y compilando, puedes probar el enrollment:

```typescript
import { unifiedMTLSService } from '@/services/unifiedMTLSService'

const result = await unifiedMTLSService.ensureEnrolled()
console.log('Enrollment result:', result)
```

---

**Si después de seguir todos estos pasos los plugins siguen sin funcionar**, por favor proporciona:
1. Screenshots de los errores de Xcode (si los hay)
2. Logs completos de Xcode Console
3. Output de Safari Web Inspector al llamar a los plugins
