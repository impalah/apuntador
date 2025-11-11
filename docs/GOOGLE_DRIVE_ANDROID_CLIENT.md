# Configuración de Cliente Android para Google Drive (Sin Client Secret)

## ¿Por Qué Cliente Android?

Un cliente tipo **Android** en Google Cloud Console permite:

- ✅ **NO requiere `client_secret`** (más seguro para apps distribuidas)
- ✅ Funciona para **Web**, **Móvil (Capacitor)** y **Desktop (Tauri)**
- ✅ Mismo `client_id` para las tres plataformas
- ✅ Autenticación mediante PKCE sin secrets expuestos

## Requisitos Previos

1. Proyecto creado en Google Cloud Console
2. Google Drive API habilitada
3. Pantalla de consentimiento OAuth configurada
4. **Certificado de firma** de tu app Android (keystore)

> 📖 Si no tienes los pasos 1-3, sigue primero [GOOGLE_DRIVE_APP_SETUP.md](./GOOGLE_DRIVE_APP_SETUP.md)

## Paso 1: Obtener SHA-1 Fingerprint del Certificado

### Para Debug (Desarrollo Local)

El keystore de debug de Android se genera automáticamente en:
- **Ubicación**: `~/.android/debug.keystore`
- **Password**: `android`
- **Alias**: `androiddebugkey`

#### En macOS/Linux:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

#### En Windows (PowerShell):

```powershell
keytool -list -v -keystore "$env:USERPROFILE\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android
```

Busca la línea que dice:
```
SHA1: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
```

**Copia ese valor SHA1** - lo necesitarás en el siguiente paso.

### Para Release (Producción)

Si ya tienes un keystore de release (para publicar en Google Play):

```bash
keytool -list -v -keystore /ruta/a/tu/release.keystore -alias tu-alias
```

Te pedirá la contraseña del keystore. Copia el SHA1 que aparece.

> ⚠️ **Importante**: Necesitas agregar AMBOS fingerprints (debug y release) en Google Cloud Console si quieres que funcione en desarrollo y producción.

## Paso 2: Crear Cliente Android en Google Cloud Console

### 2.1 Acceder a Credenciales

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto **Apuntador**
3. Menú lateral → **APIs y servicios** → **Credenciales**

### 2.2 Crear Nuevo Cliente OAuth

1. Click en **"+ Crear credenciales"**
2. Selecciona **"ID de cliente de OAuth"**

### 2.3 Configurar Cliente Android

1. **Tipo de aplicación**: Selecciona **"Android"**

2. **Nombre**: `Apuntador Android Client` (o el nombre que prefieras)

3. **Package name**: 
   - Debe coincidir con el `appId` en tu `capacitor.config.ts`
   - Formato: `io.apuntador.app` (por ejemplo)
   - Verifica en `/android/app/build.gradle`: `applicationId`

4. **SHA-1 certificate fingerprint**:
   - Pega el SHA1 que copiaste en el Paso 1
   - Ejemplo: `AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD`

5. Click en **"Crear"**

### 2.4 Copiar Client ID

Aparecerá un diálogo con:
- **ID de cliente**: `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`
- **NO habrá "Client secret"** - ¡Esto es correcto! ✅

**Copia el Client ID** - lo usarás en tu `.env`

## Paso 3: Agregar Fingerprint de Release (Opcional)

Si ya tienes tu keystore de producción, agrega también ese SHA1:

1. En **Credenciales**, click en el cliente Android que creaste
2. Click en **"Agregar huella digital"**
3. Pega el SHA1 de tu keystore de release
4. Click en **"Guardar"**

Ahora tu app funcionará tanto en debug como en release.

## Paso 4: Verificar Package Name

### En `capacitor.config.ts`:

```typescript
const config: CapacitorConfig = {
  appId: 'io.apuntador.app', // Debe coincidir con Package name en Google Cloud
  appName: 'Apuntador',
  // ...
}
```

### En `/android/app/build.gradle`:

```gradle
android {
    namespace "io.apuntador.app"
    defaultConfig {
        applicationId "io.apuntador.app" // Debe coincidir
        // ...
    }
}
```

## Paso 5: Configurar URIs de Redirección Adicionales

Los clientes Android no requieren configurar URIs explícitamente, pero si quieres que funcione también en **web** y **Tauri desktop**, necesitas crear URIs adicionales:

### Opción A: Crear Cliente Web Adicional (Más Limpio)

1. Crea otro cliente tipo **"Aplicación web"**
2. Configura URIs:
   ```
   http://localhost:3000/oauth-callback
   https://app.apuntador.io/oauth-callback
   ```
3. Usa el `client_id` del cliente Android para móvil
4. Usa el `client_id` del cliente web para web/desktop

### Opción B: Usar Solo Cliente Android (Más Simple)

El cliente Android funcionará para web y desktop si:
- Usas el mismo `client_id` en todas las plataformas
- Configuras `redirect_uri` dinámicamente según la plataforma

**Esta es la opción que usa Apuntador** - Un solo cliente Android para todo.

## Paso 6: Configurar Variables de Entorno

Edita tu archivo `.env` (copia de `.env.example` si no existe):

```bash
# Google Drive API Configuration
VITE_GOOGLE_DRIVE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com

# Tipo de cliente: 'android' (sin client_secret)
VITE_GOOGLE_OAUTH_CLIENT_TYPE=android

# NO incluyas VITE_GOOGLE_DRIVE_CLIENT_SECRET (no es necesario)
```

## Paso 7: Probar la Integración

### 7.1 Desarrollo Web (localhost)

```bash
npm run dev
```

1. Abre http://localhost:3000
2. Ve a Settings → Cloud Storage
3. Click en "Conectar con Google Drive"
4. Autoriza la aplicación
5. Verifica que puedes ver tus archivos

### 7.2 Mobile (Capacitor)

```bash
npm run build
npx cap sync android
npx cap open android
```

1. Compila y ejecuta en Android Studio o dispositivo
2. Conecta con Google Drive
3. Verifica autenticación y acceso a archivos

### 7.3 Desktop (Tauri)

```bash
npm run tauri dev
```

1. La app desktop se abrirá
2. Conecta con Google Drive
3. Verifica funcionamiento

## Solución de Problemas

### Error: "Invalid client"

**Causa**: Package name no coincide.

**Solución**:
1. Verifica que `appId` en `capacitor.config.ts` coincida con Package name en Google Cloud Console
2. Verifica que `applicationId` en `/android/app/build.gradle` coincida también

### Error: "Unauthorized client"

**Causa**: SHA-1 fingerprint incorrecto o faltante.

**Solución**:
1. Verifica que copiaste el SHA1 completo (sin espacios extra)
2. Asegúrate de usar el keystore correcto (debug vs release)
3. Si cambiaste de keystore, agrega el nuevo SHA1 en Google Cloud Console

### Error: "redirect_uri_mismatch" (Web/Desktop)

**Causa**: La URI de redirección no está autorizada para este cliente.

**Solución**:
- Opción A: Crea un cliente "Aplicación web" adicional para web/desktop
- Opción B: Los clientes Android normalmente permiten cualquier URI, pero verifica que el `redirect_uri` en el código coincida con lo esperado

### Error: "Access blocked: This app's request is invalid"

**Causa**: Pantalla de consentimiento OAuth no configurada o incompleta.

**Solución**:
1. Ve a **APIs y servicios** → **Pantalla de consentimiento de OAuth**
2. Completa todos los campos requeridos
3. Agrega scope de Google Drive: `https://www.googleapis.com/auth/drive`
4. Guarda y vuelve a probar

### No puedo obtener SHA-1 (no encuentro debug.keystore)

**Solución**:
El keystore de debug se crea automáticamente la primera vez que compilas una app Android.

```bash
# Compila la app una vez para generar el keystore
cd android
./gradlew assembleDebug
cd ..

# Ahora intenta de nuevo obtener el SHA1
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## Comparación: Android vs Desktop Client

| Característica | Cliente Android | Cliente "Aplicación de escritorio" |
|----------------|-----------------|-------------------------------------|
| **client_secret** | ❌ NO requerido | ✅ Requerido |
| **Seguridad** | ✅ Alta (sin secrets) | ⚠️ Media (secret expuesto) |
| **Plataformas** | Web, Móvil, Desktop | Web, Móvil, Desktop |
| **Configuración** | Package name + SHA1 | Solo client_id + secret |
| **Complejidad** | Media | Baja |
| **Recomendado** | ✅ Producción | ⚠️ Solo desarrollo |

## Seguridad Adicional

### Verificación de Package Name

Google valida que las requests vengan de apps con el package name correcto mediante:

1. **Android**: Firma digital de la app (SHA1)
2. **Web/Desktop**: Confianza en PKCE (sin validación de package name estricta)

Esto significa que para web y desktop, aunque uses un cliente Android, la seguridad depende de PKCE, no del package name.

### Rotación de Keystores

Si cambias tu keystore de firma (para producción o por seguridad):

1. Genera el nuevo SHA1 del nuevo keystore
2. Agrégalo en Google Cloud Console (no elimines el antiguo hasta que todos los usuarios actualicen)
3. Las apps firmadas con el nuevo keystore funcionarán automáticamente

### Monitoring

Monitorea el uso de tu cliente en:
- [Google Cloud Console](https://console.cloud.google.com/)
- **APIs y servicios** → **Panel de control**
- Revisa requests, errores y cuotas

## Preguntas Frecuentes

### ¿Puedo usar el mismo cliente Android para múltiples apps?

No, el package name es único por app. Si tienes múltiples versiones (ej: free/pro), cada una necesita su propio cliente Android.

### ¿Funciona para iOS también?

Sí, puedes crear un cliente tipo **iOS** en lugar de Android. La lógica es la misma:
- Bundle ID en lugar de Package name
- Mismo proceso sin `client_secret`

O puedes usar el cliente Android para todas las plataformas (incluyendo iOS) - Google lo permite.

### ¿Es realmente seguro sin client_secret?

**Sí**, porque:
1. OAuth 2.0 + PKCE protege contra intercepción de códigos
2. Package name + SHA1 valida la autenticidad de la app Android
3. Para web/desktop, PKCE es suficiente (no hay forma de proteger secrets en código cliente de todos modos)
4. Google diseñó este flujo específicamente para apps móviles/públicas

### ¿Qué pasa con apps iOS (Capacitor)?

El cliente Android funcionará para iOS también. Capacitor usa el mismo `appId` para ambas plataformas. Alternativamente, puedes crear un cliente iOS específico con el Bundle ID.

## Recursos

- [OAuth 2.0 for Android Apps - Google](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Obtaining OAuth 2.0 Client IDs](https://developers.google.com/identity/sign-in/android/start-integrating)
- [Package Name Validation](https://developer.android.com/studio/build/configure-app-module)
- [Keytool Documentation](https://docs.oracle.com/javase/8/docs/technotes/tools/unix/keytool.html)

## Conclusión

Usar un **cliente Android** es la forma **más segura** de implementar Google OAuth en Apuntador porque:

✅ No expone `client_secret` en el código
✅ Funciona en web, móvil y desktop
✅ Sigue las best practices de Google para apps públicas
✅ Simplifica la gestión (un solo cliente para todo)

Solo requiere un paso adicional de configuración (SHA1 fingerprint) pero vale la pena por la mejora en seguridad.

---

**Última actualización**: Octubre 2025  
**Versión de Apuntador**: 1.1.11+
