# iOS Debug Setup Guide

Guía completa para configurar depuración remota de apps Capacitor en iOS (iPad/iPhone) desde macOS.

## 📱 Opciones de Depuración iOS

### Opción 1: Safari Web Inspector (⭐ RECOMENDADA)

La forma estándar y más potente para depurar apps Capacitor en iOS.

#### Requisitos:
- ✅ Mac con macOS
- ✅ iPad/iPhone con cable USB-C o Lightning
- ✅ Safari en el Mac
- ✅ Xcode instalado en el Mac

#### Configuración:

**1. En el iPad/iPhone:**
   - Ve a **Ajustes** → **Safari** → **Avanzado**
   - Activa **Inspector web**

**2. En tu Mac:**
   - Abre **Safari**
   - Ve a **Safari** → **Configuración** → **Avanzado**
   - Marca **"Mostrar menú Desarrollar en la barra de menús"**

**3. Conecta el dispositivo iOS al Mac con cable**

**4. Compila y ejecuta tu app en el dispositivo:**
   ```bash
   cd /Users/linus/projects/press-any-key/apuntador
   npx cap sync ios
   npx cap open ios
   ```

**5. En Xcode:**
   - Selecciona tu iPad/iPhone como destino
   - Ejecuta la app (⌘R)

**6. En Safari (en el Mac):**
   - Ve al menú **Desarrollar** → **[Nombre de tu dispositivo]** → **[tu app]**
   - Se abrirá el **Web Inspector** con:
     - **Console**: logs en tiempo real
     - **Network**: peticiones HTTP/HTTPS
     - **Resources**: archivos cargados
     - **Debugger**: breakpoints en JavaScript
     - **Storage**: localStorage, IndexedDB, cookies

#### Ventajas:
- ✅ Inspector completo como Chrome DevTools
- ✅ Console en tiempo real con autocompletado
- ✅ Network inspector para ver headers, body, timing
- ✅ Breakpoints y debugging paso a paso
- ✅ Ver y modificar storage en vivo
- ✅ Inspeccionar elementos HTML/CSS

---

### Opción 2: Logs de Xcode Console

Similar a `adb logcat` en Android.

**Uso:**

1. En Xcode, con la app ejecutándose en el dispositivo
2. Ve a **View** → **Debug Area** → **Activate Console** (o ⌘⇧Y)
3. Verás todos los logs:
   - `console.log()`, `console.error()`, etc.
   - Errores de red
   - Warnings de Capacitor
   - Logs nativos de iOS

**Filtrar logs en Xcode Console:**

```
# En el campo de búsqueda, puedes filtrar por:
Capacitor    # Ver solo logs de Capacitor
[error]      # Solo errores
mTLS         # Buscar keywords específicas
HTTP         # Peticiones de red
```

**Niveles de log:**
- 🟢 `console.log()` → Default
- 🟡 `console.warn()` → Warning
- 🔴 `console.error()` → Error

---

### Opción 3: Remote Debug con Flipper (avanzado)

Para debugging avanzado de native modules:

- [Flipper](https://fbflipper.com/) con plugin de Capacitor
- Más complejo de configurar
- Útil para inspeccionar plugins nativos y bases de datos

---

## 🔧 Setup Inicial para iOS

### 1. Instalar dependencias

```bash
# Instalar herramientas de línea de comandos de Xcode
xcode-select --install

# Instalar CocoaPods (gestor de dependencias de iOS)
sudo gem install cocoapods

# Verificar versiones
xcode-select -p
pod --version
```

**Nota**: Si no tienes Xcode instalado:
- Descárgalo de **App Store** (es grande, ~15GB)
- O descarga de [developer.apple.com](https://developer.apple.com/xcode/)

### 2. Configurar el proyecto iOS

```bash
cd /Users/linus/projects/press-any-key/apuntador

# Añadir plataforma iOS (si no está añadida)
npx cap add ios

# Sincronizar cambios de web a iOS
npx cap sync ios

# Abrir proyecto en Xcode
npx cap open ios
```

### 3. Configurar firma de código en Xcode

1. En Xcode, selecciona el proyecto **App** en el navegador lateral
2. Ve a la pestaña **Signing & Capabilities**
3. Marca **"Automatically manage signing"**
4. Selecciona tu **Team**:
   - Si no tienes Team: añade tu Apple ID en **Xcode** → **Settings** → **Accounts**
   - Xcode generará automáticamente un certificado de desarrollo

### 4. Conectar y confiar en el dispositivo

**Primera vez:**

1. Conecta el iPad/iPhone con cable
2. En el dispositivo: **Ajustes** → **General** → **VPN y gestión de dispositivos**
3. Verás tu perfil de desarrollo → **Confiar en [tu nombre]**
4. En Xcode, selecciona tu dispositivo como destino (arriba a la izquierda)
5. Ejecuta (⌘R)

**Si aparece error "Could not launch":**
- Ve a **Ajustes** → **Pantalla principal y Dock** → **Multitarea y gestos**
- Desactiva y vuelve a activar **"Permitir múltiples apps"**
- Vuelve a ejecutar desde Xcode

---

## 🆚 Comparación: Android vs iOS

| Característica | Android (ADB) | iOS (Safari + Xcode) |
|----------------|---------------|----------------------|
| **Logs en tiempo real** | `adb logcat` | Xcode Console |
| **Web Inspector** | Chrome DevTools | Safari Web Inspector |
| **Port forwarding** | `adb reverse tcp:PORT tcp:PORT` | No necesario (red local funciona) |
| **Instalar app** | `adb install app.apk` | Xcode Build & Run |
| **Wireless debugging** | `adb tcpip 5555` + IP | Solo en misma red WiFi (iOS 16+) |
| **Requisitos** | Android Studio (opcional) | **Xcode (obligatorio)** |
| **Cable necesario** | USB o WiFi | USB o WiFi (solo iOS 16+) |
| **Hot reload** | ✅ Funciona bien | ⚠️ A veces necesita rebuild |

---

## 🌐 Acceso al Backend desde iOS

A diferencia de Android, iOS **NO necesita port forwarding** como `adb reverse`.

### Desarrollo Local:

**Opción 1: Usar tu IP local (RECOMENDADA)**

```bash
# Obtén tu IP local
ifconfig | grep "inet " | grep -v 127.0.0.1

# Ejemplo: 192.168.1.78
```

En tu app, usa:
```typescript
const BACKEND_URL = import.meta.env.DEV 
  ? 'http://192.168.1.78:8000'  // Tu IP local
  : 'https://api.apuntador.io'
```

**Opción 2: Usar localhost con ngrok**

```bash
# Instalar ngrok
brew install ngrok

# Exponer puerto 8000
ngrok http 8000

# Usar la URL generada en tu app
# Ejemplo: https://abc123.ngrok.io
```

---

## 📋 Checklist Pre-Desarrollo

Antes de implementar features (como mTLS), verifica:

- [ ] **Xcode instalado** (versión 15+ para iOS 17+)
- [ ] **CocoaPods instalado** (`pod --version`)
- [ ] **Dispositivo iOS conectado** y confiando en el Mac
- [ ] **Safari Web Inspector activado** en el dispositivo
- [ ] **App Capacitor se ejecuta** en el dispositivo sin errores
- [ ] **Puedes ver logs** en Safari Web Inspector
- [ ] **Backend accesible** desde el dispositivo (prueba `/health`)
- [ ] **Certificado de desarrollo** configurado en Xcode

---

## 🔍 Debugging Tips

### Ver peticiones HTTP en Safari Web Inspector:

1. Abre **Network tab** en Web Inspector
2. Recarga la app o realiza una acción
3. Verás todas las peticiones:
   - Headers (request + response)
   - Body (JSON, form data, etc.)
   - Timing (cuánto tardó cada petición)
   - Errors (4xx, 5xx)

### Debugging de errores de red:

```typescript
// Añade logs detallados en tu código
console.log('🔗 Requesting:', url)
console.log('📤 Request body:', body)

try {
  const response = await fetch(url, options)
  console.log('📥 Response status:', response.status)
  console.log('📥 Response headers:', response.headers)
} catch (error) {
  console.error('❌ Network error:', error)
}
```

### Ver storage (localStorage, etc.):

1. En Safari Web Inspector → **Storage tab**
2. Expande **Local Storage** → tu dominio
3. Puedes ver, editar y eliminar keys en vivo

---

## 🚨 Problemas Comunes

### "Could not launch app"
- **Solución**: Desconecta y reconecta el cable, o reinicia Xcode

### "Code signing error"
- **Solución**: Asegúrate de tener un Team seleccionado en Signing & Capabilities

### "The operation couldn't be completed"
- **Solución**: Ve a Ajustes → confiar en el certificado de desarrollo

### Safari no muestra el dispositivo en menú Desarrollar
- **Solución 1**: Desconecta y reconecta el cable
- **Solución 2**: Reinicia Safari
- **Solución 3**: Verifica que "Inspector web" está activado en el dispositivo

### App se cierra inmediatamente al abrir
- **Solución**: Revisa Xcode Console para ver el crash log
- Común: error de firma, permisos faltantes en Info.plist

---

## 📚 Recursos Adicionales

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Safari Web Inspector Guide](https://webkit.org/web-inspector/)
- [Apple Developer - Debugging](https://developer.apple.com/documentation/xcode/debugging)
- [Xcode Instruments](https://developer.apple.com/xcode/features/) (para profiling avanzado)

---

## 🚀 Siguiente Paso

Una vez verificado que el debugging funciona:

1. Ejecuta la app en tu dispositivo iOS
2. Abre Safari Web Inspector
3. Verifica que ves logs en Console
4. Prueba que el backend es accesible desde el dispositivo
5. **Estás listo para implementar mTLS con Secure Enclave** 🎉

---

**Última actualización**: 28 de octubre de 2025
