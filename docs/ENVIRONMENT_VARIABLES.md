# Configuración de Variables de Entorno

## Cómo funcionan las variables en Apuntador

### Durante el desarrollo (`npm run dev`)
- **Frontend (Vite)**: Lee el archivo `.env` en la raíz y hace disponibles todas las variables `VITE_*` mediante `import.meta.env`
- **Desktop (Tauri)**: El script `build.rs` lee `.env` y pasa las variables al código Rust en tiempo de compilación

### Durante el build (`npm run build`)
- **Web**: Vite **inyecta las variables en tiempo de compilación** en el bundle JavaScript. Los valores se incrustan literalmente en el código.
- **Desktop**: `cargo build` usa las variables del `.env` para compilar el binario nativo con las credenciales embebidas.

⚠️ **Importante**: 
- Las variables `VITE_*` en web son **públicas** (visibles en el JavaScript del navegador)
- Las variables en Tauri se compilan en el binario nativo (más seguras pero requieren recompilar)

## Variables disponibles

### 📍 OAuth Redirect URIs

Estas son las URLs donde los proveedores OAuth redirigirán después de la autenticación:

- **`VITE_OAUTH_REDIRECT_URI_DEV`** (Desarrollo)
  - Default: `http://localhost:3000/oauth-callback`
  - Se usa durante `npm run dev`
  - **Tauri**: También lee esta variable para el servidor OAuth local
  
- **`VITE_OAUTH_REDIRECT_URI_PROD`** (Producción web)
  - Default: `https://app.apuntador.io/oauth-callback`
  - **Importante**: Cambia esto por tu dominio en producción
  
- **`VITE_OAUTH_REDIRECT_URI_NATIVE`** (Móvil)
  - Default: `apuntador://oauth-callback`
  - Custom URL scheme para Android/iOS con Capacitor
  
- **`VITE_OAUTH_REDIRECT_URI_TAURI`** (Desktop) 🆕
  - Default: `http://localhost:8080/oauth/callback`
  - Específico para la versión desktop de Tauri
  - **IMPORTANTE**: Debe estar registrada en Dropbox App Console
  - El servidor HTTP local de Tauri escucha en este puerto

### 🔑 Google Drive API

- **`VITE_GOOGLE_DRIVE_CLIENT_ID`** (Requerida)
  - Cliente Web/Desktop de Google Cloud Console
  - Tipo: "Aplicación de escritorio"
  
- **`VITE_GOOGLE_DRIVE_CLIENT_SECRET`** (Requerida)
  - Secret del cliente Web/Desktop
  - ⚠️ Se expone en el bundle web pero está protegido por PKCE
  
- **`VITE_GOOGLE_DRIVE_CLIENT_ID_ANDROID`** (Opcional)
  - Cliente Android de Google Cloud Console
  - Tipo: "Android"
  - Si no se proporciona, se usa el cliente Web para móvil

### 📦 Dropbox API

- **`VITE_DROPBOX_CLIENT_ID`** (Requerida)
  - App Key de Dropbox App Console
  - Tipo: "Scoped access"
  - **Usado en**: Frontend (web/móvil) Y Backend (Tauri desktop)

## Configuración para diferentes entornos

### 1. Desarrollo Local

Crea un archivo `.env` en la raíz (ya ignorado por git):

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales reales:

```bash
VITE_GOOGLE_DRIVE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
VITE_GOOGLE_DRIVE_CLIENT_SECRET=tu-client-secret
VITE_GOOGLE_DRIVE_CLIENT_ID_ANDROID=tu-android-client-id.apps.googleusercontent.com
```

### 2. Producción Web (Vercel/Netlify)

**No subas el archivo `.env` al repositorio.** En su lugar, configura las variables en el panel del hosting:

#### Vercel
1. Ve a tu proyecto → Settings → Environment Variables
2. Agrega cada variable:
   - `VITE_GOOGLE_DRIVE_CLIENT_ID`
   - `VITE_GOOGLE_DRIVE_CLIENT_SECRET`
   - `VITE_GOOGLE_DRIVE_CLIENT_ID_ANDROID` (opcional)
   - `VITE_DROPBOX_CLIENT_ID`
   - `VITE_OAUTH_REDIRECT_URI_PROD` (tu dominio)
   - `VITE_OAUTH_REDIRECT_URI_NATIVE` (si usas móvil)

#### Netlify
1. Ve a Site settings → Build & deploy → Environment
2. Agrega cada variable con sus valores

#### GitHub Actions
Si usas GitHub Actions para builds, configura los secrets:

1. Ve a tu repositorio → Settings → Secrets and variables → Actions
2. Agrega cada secret
3. En tu workflow `.github/workflows/*.yml`:

```yaml
- name: Build
  env:
    VITE_GOOGLE_DRIVE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_DRIVE_CLIENT_ID }}
    VITE_GOOGLE_DRIVE_CLIENT_SECRET: ${{ secrets.VITE_GOOGLE_DRIVE_CLIENT_SECRET }}
    VITE_GOOGLE_DRIVE_CLIENT_ID_ANDROID: ${{ secrets.VITE_GOOGLE_DRIVE_CLIENT_ID_ANDROID }}
    VITE_DROPBOX_CLIENT_ID: ${{ secrets.VITE_DROPBOX_CLIENT_ID }}
    VITE_OAUTH_REDIRECT_URI_PROD: ${{ secrets.VITE_OAUTH_REDIRECT_URI_PROD }}
  run: npm run build
```

### 3. Build Desktop (Tauri)

Para Tauri, las variables se leen del `.env` local durante el build. Puedes crear `.env.production` para separar configuraciones:

```bash
# .env.production
VITE_GOOGLE_DRIVE_CLIENT_ID=production-client-id
VITE_GOOGLE_DRIVE_CLIENT_SECRET=production-secret
```

Luego:
```bash
npm run tauri:build  # Usa .env por defecto
```

### 4. Build Android (Capacitor)

Para Android, las variables se inyectan durante `npm run build` antes de sincronizar con Capacitor:

```bash
npm run build  # Inyecta variables del .env
npx cap sync   # Sincroniza el build con Android
```

## Jerarquía de archivos .env

Vite carga los archivos en este orden (los últimos sobrescriben a los primeros):

1. `.env` - Base para todos los entornos
2. `.env.local` - Local, ignorado por git
3. `.env.[mode]` - Específico del modo (development/production)
4. `.env.[mode].local` - Específico del modo, ignorado por git

## Seguridad

### Variables públicas (OK para exponer)
- `VITE_GOOGLE_DRIVE_CLIENT_ID` - Cliente OAuth público
- `VITE_GOOGLE_DRIVE_CLIENT_ID_ANDROID` - Cliente OAuth público

### Variables sensibles (⚠️ Expuestas en web)
- `VITE_GOOGLE_DRIVE_CLIENT_SECRET` - Se incrusta en el bundle

**Nota sobre seguridad**: Aunque `CLIENT_SECRET` se expone en el bundle web, esto es **aceptable** cuando se usa OAuth 2.0 con PKCE (Proof Key for Code Exchange), que es el flujo que implementamos. PKCE protege contra el robo del secret porque cada autorización requiere un código verifier único.

### Alternativa más segura (proxy backend)

Para máxima seguridad, podrías implementar un proxy backend:

```
Cliente → Tu Backend → Google Drive API
```

El backend mantendría el `CLIENT_SECRET` y haría las peticiones a Google. Pero esto requiere mantener un servidor, lo cual contradice la arquitectura "local-first" de Apuntador.

## Builds de Desktop (Tauri)

### Cómo funciona en Tauri

El archivo `src-tauri/build.rs` se ejecuta **antes** de compilar el código Rust y:

1. Lee el archivo `.env` desde la raíz del proyecto
2. Extrae `VITE_DROPBOX_CLIENT_ID` y `VITE_OAUTH_REDIRECT_URI_NATIVE`
3. Las pasa como variables de entorno de compilación a Rust usando `cargo:rustc-env`
4. El código Rust accede a ellas con `env!("DROPBOX_CLIENT_ID")`

### Variables usadas en Tauri

- **`VITE_DROPBOX_CLIENT_ID`** → compilada como `DROPBOX_CLIENT_ID` en el binario
- **`VITE_OAUTH_REDIRECT_URI_NATIVE`** → compilada como `OAUTH_REDIRECT_URI` en el binario
  - Default: `http://localhost:8080/oauth/callback` (servidor local de Tauri)

### Build de Desktop

```bash
# Asegúrate de que .env existe con las variables correctas
npm run tauri:build

# O para desarrollo
npm run tauri:dev
```

⚠️ **Importante**: Si cambias las variables de entorno, debes **recompilar** el binario de Tauri:

```bash
cd src-tauri
cargo clean
cd ..
npm run tauri:build
```

### Ventajas del enfoque Tauri

- ✅ Variables embebidas en el binario compilado (más seguras que JavaScript)
- ✅ No hay forma de extraerlas fácilmente del ejecutable
- ✅ Compatible con el mismo `.env` que usa Vite para web
- ✅ No requiere configuración adicional

### Desventajas

- ⚠️ Requiere recompilar para cambiar credenciales
- ⚠️ Cada distribución del binario tiene las credenciales hardcodeadas

## Verificar variables en build

Para verificar qué variables se inyectaron en un build:

```bash
npm run build
grep -r "VITE_" dist/assets/*.js
```

Verás los valores literales incrustados en el JavaScript.

## Troubleshooting

### "Variables undefined en producción"
- ✅ Verifica que las variables empiecen con `VITE_`
- ✅ Confirma que están configuradas en el hosting
- ✅ Haz un rebuild después de agregar variables

### "No puedo ver el valor en import.meta.env"
- Solo funciona en el código del cliente (src/)
- No funciona en archivos de configuración (vite.config.ts)
- Las variables deben empezar con `VITE_`

### "El build local funciona pero producción no"
- Las variables del `.env` local no se suben al hosting
- Debes configurarlas manualmente en el panel del hosting
