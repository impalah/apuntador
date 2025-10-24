# Configuración Rápida: Google Drive con Cliente Android (Sin Client Secret)

## 🎯 Objetivo

Configurar Google Drive OAuth usando **UN SOLO cliente Android** que funcione en:
- ✅ Web (SPA)
- ✅ Móvil (Capacitor Android/iOS)
- ✅ Desktop (Tauri)

**SIN necesidad de `client_secret`** en ninguna plataforma.

## ⚡ Guía Rápida (5 Pasos)

### Paso 1: Obtener SHA-1 Fingerprint

Ejecuta el script según tu sistema operativo:

**macOS/Linux:**
```bash
chmod +x scripts/get-android-sha1.sh
./scripts/get-android-sha1.sh
```

**Windows (PowerShell):**
```powershell
.\scripts\get-android-sha1.ps1
```

Selecciona opción `1` (Debug) para desarrollo.

📋 **Copia el SHA-1** que aparece en pantalla (algo como `AA:BB:CC:...`).

---

### Paso 2: Verificar Package Name

Abre `capacitor.config.ts` y confirma el `appId`:

```typescript
const config: CapacitorConfig = {
  appId: 'io.apuntador.app', // 👈 Este es tu package name
  // ...
}
```

---

### Paso 3: Crear Cliente Android en Google Cloud Console

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Selecciona tu proyecto **Apuntador**
3. Click en **"+ Crear credenciales"** → **"ID de cliente de OAuth"**
4. **Tipo de aplicación**: Selecciona **"Android"**
5. **Nombre**: `Apuntador Android Client`
6. **Package name**: `io.apuntador.app` (el de tu `capacitor.config.ts`)
7. **SHA-1 certificate fingerprint**: Pega el SHA-1 del Paso 1
8. Click en **"Crear"**

📋 **Copia el Client ID** generado (termina en `.apps.googleusercontent.com`).

---

### Paso 4: Configurar Variables de Entorno

Crea o edita tu archivo `.env` (copia de `.env.example`):

```bash
# Google Drive Configuration
VITE_GOOGLE_DRIVE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
VITE_GOOGLE_OAUTH_CLIENT_TYPE=android

# NO agregues VITE_GOOGLE_DRIVE_CLIENT_SECRET
```

---

### Paso 5: Probar la Integración

**Para Web:**
```bash
npm run dev
```

Abre http://localhost:3000, ve a Settings → Cloud y prueba conectar con Google Drive.

**Para Móvil:**
```bash
npm run build
npx cap sync android
npx cap open android
```

Compila y ejecuta en Android Studio.

**Para Desktop:**
```bash
npm run tauri dev
```

---

## ✅ Verificación

Si todo funciona correctamente:

- ✅ Al hacer click en "Conectar con Google Drive" se abre la ventana de Google
- ✅ Puedes autorizar la aplicación sin errores
- ✅ Puedes ver tus archivos de Google Drive
- ✅ NO hay errores en la consola sobre `client_secret`

---

## 🔧 Solución de Problemas Comunes

### Error: "Invalid client"

**Causa**: Package name no coincide.

**Solución**: Verifica que el package name en Google Cloud Console sea exactamente `io.apuntador.app` (el mismo que en `capacitor.config.ts`).

---

### Error: "Unauthorized client"

**Causa**: SHA-1 fingerprint incorrecto.

**Solución**:
1. Ejecuta de nuevo el script `get-android-sha1.sh/ps1`
2. Copia el SHA-1 completo (con los dos puntos `:`)
3. Edita el cliente en Google Cloud Console
4. Reemplaza el SHA-1 con el correcto

---

### Error: "redirect_uri_mismatch" (Solo en Web/Desktop)

**Causa**: Normal si usas cliente Android en web.

**Solución**: Google permite esto. Si el error persiste:
1. Verifica que `VITE_GOOGLE_OAUTH_CLIENT_TYPE=android` en tu `.env`
2. Reinicia el dev server: `npm run dev`

---

### No veo archivos de Google Drive

**Causa**: Scope incorrecto o permiso no otorgado.

**Solución**:
1. Desconecta de Google Drive en Apuntador
2. Reconecta y **acepta todos los permisos** que pide Google
3. Verifica que el scope incluye `https://www.googleapis.com/auth/drive`

---

## 📚 Documentación Completa

Para más detalles, consulta:
- **Guía completa**: [GOOGLE_DRIVE_ANDROID_CLIENT.md](../docs/GOOGLE_DRIVE_ANDROID_CLIENT.md)
- **Configuración alternativa**: [GOOGLE_DRIVE_APP_SETUP.md](../docs/GOOGLE_DRIVE_APP_SETUP.md)
- **Análisis de seguridad**: [src/services/googledrive/SECURITY.md](../src/services/googledrive/SECURITY.md)

---

## 🆘 Soporte

Si sigues teniendo problemas:

1. Revisa logs en DevTools (F12 → Console)
2. Verifica que Google Drive API esté habilitada en tu proyecto
3. Confirma que la pantalla de consentimiento OAuth esté configurada
4. Abre un issue en GitHub con los detalles del error

---

**¿Todo funcionando?** ¡Perfecto! Ya tienes Google Drive integrado de forma segura en las 3 plataformas. 🎉
