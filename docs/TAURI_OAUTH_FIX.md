# Configuración de Dropbox OAuth para Desktop (Tauri)

## Problema identificado

La aplicación desktop de Tauri usa un **servidor HTTP local** en `localhost:8080` para recibir los callbacks de OAuth, pero esta URL no estaba configurada correctamente.

## Cambios realizados

### 1. Nueva variable de entorno

Se agregó `VITE_OAUTH_REDIRECT_URI_TAURI` específicamente para desktop:

```bash
# En .env
VITE_OAUTH_REDIRECT_URI_TAURI=http://localhost:8080/oauth/callback
```

### 2. Actualizado build.rs

El script de build de Rust ahora usa esta variable específica:

```rust
// Antes (incorrecto)
std::env::var("VITE_OAUTH_REDIRECT_URI_NATIVE")  // Era para móvil!

// Después (correcto)
std::env::var("VITE_OAUTH_REDIRECT_URI_TAURI")   // Específico para desktop
  .unwrap_or_else(|_| "http://localhost:8080/oauth/callback".to_string());
```

### 3. Ajustes en SettingsDialog

- Aumentado el ancho del diálogo de 600px a 700px
- Agregado `show-arrows` y `density="compact"` a las tabs para que todas sean visibles
- Ahora se muestran todas las 6 pestañas: Appearance, Behavior, Controls, Cloud, Data, About

## Configuración requerida en Dropbox

Para que el OAuth funcione en desktop, debes registrar la URL de redirect en Dropbox:

1. Ve a [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Selecciona tu app (la que tiene App key: `qej36t232go21e8`)
3. En la sección **OAuth 2**:
   - Click en "Add" en "Redirect URIs"
   - Agrega: `http://localhost:8080/oauth/callback`
   - Guarda los cambios

### URLs registradas en Dropbox (deben estar todas):

- ✅ `http://localhost:3000/oauth-callback` - Para desarrollo web
- ✅ `https://app.apuntador.io/oauth-callback` - Para producción web
- ✅ `http://localhost:8080/oauth/callback` - **Para desktop (Tauri)** ⬅️ NUEVA
- ✅ `apuntador://oauth-callback` - Para móvil (Android/iOS)

## Flujo de OAuth en Tauri

```
1. Usuario click "Connect Dropbox" en desktop
   ↓
2. Frontend llama dropboxStore.connect()
   ↓
3. Se detecta que es Tauri (isTauri = true)
   ↓
4. tauriService.listenForOAuthCallback() configura listener
   ↓
5. tauriService.startDropboxOAuth() inicia servidor local en :8080
   ↓
6. Se abre navegador con URL de autorización Dropbox
   ↓
7. Usuario autoriza en Dropbox
   ↓
8. Dropbox redirige a http://localhost:8080/oauth/callback?code=XXX
   ↓
9. Servidor Rust captura el callback
   ↓
10. Rust emite evento 'oauth-callback' con {code, state}
   ↓
11. Frontend recibe evento y exchange code por access_token
   ↓
12. Token guardado y conexión completada
```

## Testing

### Antes de recompilar

1. Asegúrate de que `.env` tiene la nueva variable:
   ```bash
   grep TAURI .env
   # Debe mostrar: VITE_OAUTH_REDIRECT_URI_TAURI=http://localhost:8080/oauth/callback
   ```

2. Limpia el build anterior:
   ```bash
   cd src-tauri
   cargo clean
   cd ..
   ```

### Recompilar y probar

```bash
# Desarrollo (modo debug con console logs)
npm run tauri:dev

# O producción
npm run tauri:build:mac  # En macOS
```

### Verificar en consola

Cuando hagas OAuth, deberías ver estos logs:

```
🖥️ Using Tauri OAuth flow
👂 Setting up OAuth listener...
✅ OAuth listener configured
🚀 Starting OAuth flow...
🔗 Auth URL generated: https://www.dropbox.com/oauth2/authorize?...
⏳ Waiting for OAuth callback...
[Browser se abre automáticamente]
[Usuario autoriza en Dropbox]
📞 OAuth callback received: { code: "...", state: "..." }
🔄 Starting code-to-token exchange...
✅ Access token extracted successfully
```

### Si no funciona

1. **Verifica que la URL está registrada en Dropbox**
   - Console: https://www.dropbox.com/developers/apps
   - Redirect URIs debe incluir `http://localhost:8080/oauth/callback`

2. **Verifica que el puerto 8080 está libre**
   ```bash
   lsof -i :8080
   # Si hay algo usando el puerto, mátalo o usa otro puerto
   ```

3. **Revisa los logs de Rust** (en la terminal donde ejecutas tauri:dev)
   - Busca mensajes como "OAuth server listening on 127.0.0.1:8080"

4. **Revisa los logs del navegador** (DevTools de la app Tauri)
   - Abre DevTools: Click derecho → Inspect
   - Console tab → busca logs con emojis 🖥️ 👂 🚀 etc.

## Diferencias entre plataformas

| Plataforma | Redirect URI | Servidor | Variable |
|------------|--------------|----------|----------|
| **Web (dev)** | `localhost:3000/oauth-callback` | Vite dev server | `VITE_OAUTH_REDIRECT_URI_DEV` |
| **Web (prod)** | `app.apuntador.io/oauth-callback` | Hosting (Vercel/Netlify) | `VITE_OAUTH_REDIRECT_URI_PROD` |
| **Desktop** | `localhost:8080/oauth/callback` | Rust HTTP server | `VITE_OAUTH_REDIRECT_URI_TAURI` |
| **Móvil** | `apuntador://oauth-callback` | Deep link handler | `VITE_OAUTH_REDIRECT_URI_NATIVE` |

## Solución al problema de pestañas

Las tabs estaban colapsando por falta de espacio. Cambios:

1. Ancho del diálogo: `600px` → `700px`
2. Tabs con flechas: `show-arrows` (permite scroll horizontal si es necesario)
3. Densidad compacta: `density="compact"` (tabs más pequeñas)

Ahora todas las 6 pestañas deben ser visibles, incluyendo **Data** y **About**.

## Próximos pasos

1. ✅ Registrar `http://localhost:8080/oauth/callback` en Dropbox App Console
2. ✅ Recompilar con `cargo clean && npm run tauri:dev`
3. ✅ Probar OAuth en desktop
4. ✅ Verificar que se ven todas las pestañas en Settings

Si sigue sin funcionar, comparte:
- Los logs de la consola de Rust (terminal)
- Los logs del DevTools (navegador integrado de Tauri)
- Screenshot del diálogo de Settings mostrando cuántas tabs ves
