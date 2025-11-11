# Variables de Entorno en Tauri (Desktop)

## Resumen

El código Rust de Tauri ahora lee las credenciales de OAuth desde el archivo `.env` en tiempo de compilación, similar a como Vite lo hace para el frontend.

## Cambios implementados

### 1. **Cargo.toml** - Agregada dependencia `dotenvy`

```toml
[build-dependencies]
tauri-build = { version = "2.4.1", features = [] }
dotenvy = "0.15"
```

`dotenvy` es el fork mantenido de `dotenv` que permite leer archivos `.env`.

### 2. **build.rs** - Lectura del .env en tiempo de compilación

El script de build (`src-tauri/build.rs`) ahora:

1. Lee el archivo `.env` desde la raíz del proyecto (directorio padre)
2. Extrae las variables necesarias:
   - `VITE_DROPBOX_CLIENT_ID` → se pasa como `DROPBOX_CLIENT_ID` al código Rust
   - `VITE_OAUTH_REDIRECT_URI_NATIVE` → se pasa como `OAUTH_REDIRECT_URI` al código Rust
3. Si no encuentra las variables, usa valores por defecto o muestra warnings

**Código**:
```rust
fn main() {
  // Load .env file from the root of the project (parent directory)
  let project_root = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).parent().unwrap();
  let env_path = project_root.join(".env");
  
  if env_path.exists() {
    if let Err(e) = dotenvy::from_path(&env_path) {
      println!("cargo:warning=Failed to load .env file: {}", e);
    }
  }
  
  // Read VITE_DROPBOX_CLIENT_ID from environment
  if let Ok(dropbox_client_id) = std::env::var("VITE_DROPBOX_CLIENT_ID") {
    println!("cargo:rustc-env=DROPBOX_CLIENT_ID={}", dropbox_client_id);
  } else {
    println!("cargo:warning=VITE_DROPBOX_CLIENT_ID not found in .env file");
  }
  
  // Read OAuth redirect URI for Tauri desktop
  if let Ok(redirect_uri) = std::env::var("VITE_OAUTH_REDIRECT_URI_NATIVE") {
    println!("cargo:rustc-env=OAUTH_REDIRECT_URI={}", redirect_uri);
  } else {
    println!("cargo:rustc-env=OAUTH_REDIRECT_URI=http://localhost:8080/oauth/callback");
  }
  
  tauri_build::build()
}
```

### 3. **lib.rs** - Uso de variables de entorno de compilación

El código Rust ahora usa `env!()` en lugar de valores hardcodeados:

**Antes**:
```rust
let client_id = "qej36t232go21e8"; // Hardcoded
let redirect_uri = "http://localhost:8080/oauth/callback"; // Hardcoded
```

**Después**:
```rust
let client_id = env!("DROPBOX_CLIENT_ID", "DROPBOX_CLIENT_ID not set in build.rs");
let redirect_uri = env!("OAUTH_REDIRECT_URI", "OAUTH_REDIRECT_URI not set in build.rs");
```

La macro `env!()` se evalúa en **tiempo de compilación**, incrustando los valores directamente en el binario.

## Flujo de trabajo

### Desarrollo (`npm run tauri:dev`)

```bash
# 1. Asegúrate de que .env existe
cp .env.example .env

# 2. Edita .env con tus credenciales
VITE_DROPBOX_CLIENT_ID=qej36t232go21e8
VITE_OAUTH_REDIRECT_URI_NATIVE=http://localhost:8080/oauth/callback

# 3. Ejecuta en modo desarrollo
npm run tauri:dev
```

El script `build.rs` se ejecuta automáticamente antes de compilar Rust.

### Producción (`npm run tauri:build`)

```bash
# 1. Verifica las variables en .env
npm run check:env

# 2. Build
npm run tauri:build:mac  # macOS
npm run tauri:build:win  # Windows
```

El binario compilado tendrá las credenciales **embebidas**.

## Ventajas de este enfoque

✅ **Centralized**: Una sola fuente de verdad (`.env`) para web y desktop  
✅ **Seguro**: Los valores se compilan en el binario (no son fácilmente extraíbles)  
✅ **DX**: Mismo flujo que con Vite, familiar para developers  
✅ **CI/CD**: Compatible con variables de entorno en GitHub Actions  

## Desventajas

⚠️ **Requiere recompilar**: Cambiar las credenciales requiere un rebuild completo  
⚠️ **Distribución única**: Cada binario tiene credenciales específicas hardcodeadas  

## Variables de entorno usadas por Tauri

| Variable en `.env` | Variable en Rust | Descripción | Default |
|-------------------|------------------|-------------|---------|
| `VITE_DROPBOX_CLIENT_ID` | `DROPBOX_CLIENT_ID` | App Key de Dropbox | (requerido) |
| `VITE_OAUTH_REDIRECT_URI_NATIVE` | `OAUTH_REDIRECT_URI` | Redirect URI para desktop | `http://localhost:8080/oauth/callback` |

## Troubleshooting

### "DROPBOX_CLIENT_ID not set in build.rs"

**Causa**: El `.env` no existe o no tiene `VITE_DROPBOX_CLIENT_ID`

**Solución**:
```bash
# Verifica que .env existe
ls -la .env

# Verifica que contiene la variable
grep VITE_DROPBOX_CLIENT_ID .env

# Si no existe, copia el ejemplo
cp .env.example .env
```

### "Cambié .env pero sigue usando el valor anterior"

**Causa**: Cargo cachea el build y no detecta cambios en `.env`

**Solución**:
```bash
cd src-tauri
cargo clean
cd ..
npm run tauri:build
```

### "Funciona en dev pero no en producción"

**Causa**: Diferentes archivos `.env` o variables no configuradas en CI/CD

**Solución**:
```bash
# Verifica las variables antes de build
npm run check:env

# En GitHub Actions, agrega los secrets:
# VITE_DROPBOX_CLIENT_ID
# VITE_OAUTH_REDIRECT_URI_NATIVE (opcional)
```

## Comparación: Web vs Desktop

| Aspecto | Web (Vite) | Desktop (Tauri) |
|---------|-----------|-----------------|
| **Lectura** | Runtime (`import.meta.env`) | Compile-time (`env!()`) |
| **Inyección** | Build de Vite | `build.rs` → Rust compiler |
| **Seguridad** | Visible en DevTools | Compilado en binario |
| **Actualizar** | Redeploy web | Recompilar binario |
| **Variables** | `VITE_*` en `.env` | Mismas `VITE_*`, mapeadas en `build.rs` |

## Referencias

- [Cargo Build Scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html)
- [env! macro](https://doc.rust-lang.org/std/macro.env.html)
- [dotenvy crate](https://docs.rs/dotenvy/latest/dotenvy/)
