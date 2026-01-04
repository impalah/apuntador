# Notas sobre Desarrollo Multi-Plataforma

Este documento explica las capacidades y limitaciones del devcontainer para cada plataforma objetivo.

## Matriz de Compatibilidad

| Plataforma                  | Desarrollo en Container | Build en Container | Notas                                                    |
| --------------------------- | ----------------------- | ------------------ | -------------------------------------------------------- |
| **Web**                     | Completo                | Completo           | Vite dev server, builds, tests                           |
| **Android**                 | Completo                | Parcial            | Desarrollo completo, builds APK/AAB. No emulador gráfico |
| **Tauri Desktop (Linux)**   | Completo                | Completo           | Build nativo para Linux                                  |
| **Tauri Desktop (Windows)** | Desarrollo              | [ERROR] No         | Cross-compile limitado, mejor en Windows nativo          |
| **Tauri Desktop (macOS)**   | Desarrollo              | [ERROR] No         | Cross-compile no soportado, requiere macOS nativo        |
| **iOS**                     | [WARNING] Limitado      | [ERROR] No         | Solo sync de Capacitor, builds requieren macOS + Xcode   |

---

## Desarrollo por Plataforma

### Web (Completamente Soportado)

**En el container puedes**:

- Desarrollo con Vite dev server
- Hot reload completo
- Builds de producción
- Tests (Vitest + Playwright)
- Linting y formateo

**Comandos**:

```bash
npm run dev              # Dev server en puerto 3000
npm run build            # Build de producción
npm run preview          # Preview del build
npm test                 # Tests unitarios
npm run test:e2e         # Tests E2E
```

---

### Android (Completamente Soportado)

**En el container puedes**:

- Sincronizar código con Capacitor (`npx cap sync android`)
- Compilar APKs de debug
- Compilar APKs/AABs de release
- Ejecutar Gradle tasks
- [ERROR] Usar Android Emulator con GUI (requiere X11 forwarding complejo)
- [ERROR] Usar Android Studio GUI (mejor en host)

**Comandos**:

```bash
# Sincronizar cambios
npx cap sync android

# Build APK debug
cd android
./gradlew assembleDebug

# Build APK release (requiere firma)
./gradlew assembleRelease

# Build AAB (Google Play)
./gradlew bundleRelease

# Listar tasks disponibles
./gradlew tasks
```

**Para desarrollo visual/debugging**:

1. Sincronizar en el container: `npx cap sync android`
2. Salir del container: Cmd+Shift+P → "Dev Containers: Reopen Folder Locally"
3. Abrir Android Studio en macOS: `npx cap open android`
4. Desarrollar/debuggear en Android Studio nativo

**Workflow híbrido recomendado**:

```bash
# En container: cambios de código + sync
npm run dev               # Desarrollo web
npx cap sync android      # Sync a Android cuando estés listo

# En macOS nativo: Android Studio para testing
npx cap open android      # Abrir proyecto
# Ejecutar en emulador/device desde Android Studio
```

---

### [WARNING] iOS (Limitado - Requiere macOS)

**En el container puedes**:

- Sincronizar código con Capacitor (`npx cap sync ios`)
- Preparar el proyecto iOS
- [ERROR] Compilar apps iOS (requiere Xcode)
- [ERROR] Firmar apps iOS
- [ERROR] Ejecutar en simulador iOS
- [ERROR] Usar Xcode

**Por qué**: Xcode y las herramientas de iOS solo funcionan en macOS.

**Comandos en container**:

```bash
# Solo sync - preparar proyecto iOS
npx cap sync ios
```

**Desarrollo iOS - Workflow Completo**:

1. **Desarrollar código en el container**:

   ```bash
   # En container
   npm run dev              # Desarrollo web/componentes
   ```

2. **Salir del container para builds iOS**:

   ```bash
   # Cmd+Shift+P → "Dev Containers: Reopen Folder Locally"
   ```

3. **En macOS nativo - Sync y build**:

   ```bash
   # Asegurarse que Node.js está instalado en el host
   npx cap sync ios

   # Abrir en Xcode
   npx cap open ios

   # O usar Ionic CLI
   ionic capacitor build ios
   ionic capacitor run ios
   ```

4. **Compilar y firmar en Xcode**:
   - Configurar equipo de desarrollo (Apple Developer)
   - Seleccionar dispositivo/simulador
   - Build & Run

**Recomendación**:

- Desarrollar lógica y UI en el container (web)
- Testear periódicamente en iOS nativo
- Hacer builds finales en macOS nativo

---

### Tauri Desktop - Linux (Completamente Soportado)

**En el container puedes**:

- Desarrollo completo con `cargo tauri dev`
- Compilar binarios Linux
- Tests de Rust
- Builds de producción para Linux

**Comandos**:

```bash
npm run tauri dev        # Dev mode (headless - sin GUI)
npm run tauri build      # Build de producción para Linux

# Comandos Rust directos
cd src-tauri
cargo build              # Build debug
cargo build --release    # Build release
cargo test               # Tests
cargo clippy             # Linting
```

**Limitación GUI**:

- El container es headless (sin interfaz gráfica)
- `tauri dev` ejecuta el backend pero no muestra ventana
- Para ver la UI, necesitas X11 forwarding (complejo) o desarrollar en macOS nativo

**Workaround para testing**:

```bash
# En container: Build del backend
cargo build

# En macOS nativo: Ejecutar la app
npm run tauri dev
```

---

### [WARNING] Tauri Desktop - macOS/Windows (Desarrollo Limitado)

**En el container puedes**:

- Desarrollar código Rust
- Compilar Rust para Linux
- [WARNING] Cross-compilar para macOS (muy limitado)
- [ERROR] Cross-compilar para Windows
- [ERROR] Generar instaladores (.dmg, .msi, .exe)
- [ERROR] Firmar aplicaciones

**Por qué**: Tauri requiere las SDK nativas de cada plataforma para builds completos.

**Desarrollo de la parte Rust**:

```bash
# En container: desarrollar lógica Rust
cd src-tauri
cargo build
cargo test
cargo clippy
```

**Builds específicos de plataforma**:

**macOS (.app, .dmg)**:

```bash
# Debe hacerse en macOS nativo
npm run tauri build -- --target aarch64-apple-darwin  # Apple Silicon
npm run tauri build -- --target x86_64-apple-darwin   # Intel Mac
```

**Windows (.exe, .msi)**:

```bash
# Debe hacerse en Windows nativo o GitHub Actions
npm run tauri build -- --target x86_64-pc-windows-msvc
```

**Linux (en container funciona)**:

```bash
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

---

## Workflows Recomendados

### Workflow 1: Desarrollo Web Principal (80% del tiempo)

```bash
# En container
npm run dev              # Vite dev server
# Desarrollar componentes Vue, lógica, UI
# Tests: npm test, npm run test:e2e
```

**Cuando necesites mobile/desktop**: Salir y testear nativamente.

---

### Workflow 2: Desarrollo Full-Stack (Web + Rust)

```bash
# En container
npm run dev              # Frontend en puerto 3000
npm run tauri dev        # Backend Rust (headless)

# Desarrollar:
# - src/: código Vue/TypeScript
# - src-tauri/: código Rust
```

**Testing**: En macOS nativo con `npm run tauri dev` para ver la UI.

---

### Workflow 3: Builds Multi-Plataforma

**En container**:

```bash
# Web
npm run build            # Output: dist/

# Android
npx cap sync android
cd android && ./gradlew assembleRelease

# Linux (Tauri)
npm run tauri build      # Output: src-tauri/target/release/
```

**En macOS nativo**:

```bash
# iOS
npx cap sync ios
npx cap open ios         # Build en Xcode

# macOS (Tauri)
npm run tauri build      # .app, .dmg
```

**En Windows nativo o CI**:

```bash
# Windows (Tauri)
npm run tauri build      # .exe, .msi
```

**En GitHub Actions** (recomendado para Windows):

- Ver [.github/workflows/](.github/workflows/) para pipelines CI/CD

---

## Configuración para Desarrollo Híbrido

### Estrategia A: Container para todo excepto iOS/macOS

1. **Container**: Web, Android, Tauri (Rust dev), tests
2. **macOS nativo**: Solo cuando necesites iOS o build macOS

### Estrategia B: Alternar según necesidad

```bash
# Abrir en container
code /Users/linus/projects/apuntador
# Cmd+Shift+P → "Reopen in Container"

# Desarrollar web/Android/Rust...

# Cuando necesites iOS:
# Cmd+Shift+P → "Reopen Folder Locally"
npx cap sync ios
npx cap open ios

# Volver al container cuando termines iOS
# Cmd+Shift+P → "Reopen in Container"
```

---

## Resumen de Comandos por Plataforma

### En Container (Linux)

```bash
# Web
npm run dev
npm run build
npm test

# Android
npx cap sync android
cd android && ./gradlew assembleDebug

# Tauri (headless)
npm run tauri dev        # Backend only
npm run tauri build      # Linux binaries

# Rust
cd src-tauri
cargo build
cargo test
cargo clippy
```

### En macOS Nativo

```bash
# iOS
npx cap sync ios
npx cap open ios         # Xcode
ionic capacitor run ios

# macOS Tauri
npm run tauri dev        # Con GUI
npm run tauri build      # .app/.dmg

# Android Studio (GUI)
npx cap open android
```

### En Windows Nativo (o CI)

```bash
# Windows Tauri
npm run tauri dev
npm run tauri build      # .exe/.msi
```

---

## Setup Inicial Recomendado

### 1. Preparar macOS (una vez)

```bash
# Instalar Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Docker runtime
brew install colima docker docker-compose
colima start --cpu 8 --memory 16 --disk 100

# Instalar VS Code + extensión
brew install --cask visual-studio-code
code --install-extension ms-vscode-remote.remote-containers

# Solo si desarrollas iOS:
# - Instalar Xcode desde App Store
# - xcode-select --install
# - sudo gem install cocoapods
```

### 2. Abrir proyecto en container

```bash
code /Users/linus/projects/apuntador
# Click "Reopen in Container"
# Esperar configuración inicial (~10 min primera vez)
```

### 3. Verificar que todo funciona

```bash
# En container
npm run dev              # http://localhost:3000
npm test                 # Tests pasan
cargo build              # Rust compila
npx cap sync android     # Android sincroniza
```

---

## Tips Pro

### Sincronización Rápida entre Container y Nativo

```bash
# Siempre sincroniza antes de salir del container
npx cap sync android
npx cap sync ios         # Si usas iOS

# Luego sal y abre nativamente
# Cmd+Shift+P → "Reopen Folder Locally"
```

### Evitar Reinstalar Dependencias

Los volúmenes `node_modules` y `src-tauri/target` persisten entre sesiones:

- No necesitas `npm install` cada vez que abres el container
- Builds de Rust son incrementales (más rápidas después de la primera)

### Desarrollo Solo Frontend

Si trabajas principalmente en Vue/componentes:

```bash
# En container
npm run dev

# Testear en navegador local: http://localhost:3000
# No necesitas Android/iOS/Tauri para esto
```

---

## [LINK] Documentación Adicional

- [Capacitor iOS Setup](https://capacitorjs.com/docs/ios)
- [Capacitor Android Setup](https://capacitorjs.com/docs/android)
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)
- [GitHub Actions for Multi-Platform](https://github.com/tauri-apps/tauri-action)
