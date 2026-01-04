# Configuración DevContainer Apuntador - Resumen Ejecutivo

## Cambios Realizados

### 1. Actualización de devcontainer.json

Se ha actualizado [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) con:

- **Rust** (última versión estable)
- **Java 17** + Gradle (para Android)
- **Android SDK** (Platform 34, Build Tools, NDK 26)
- **Tauri CLI** (versión 2+)
- **Ionic CLI** + Capacitor CLI
- **Extensiones VS Code**: Rust Analyzer, TOML, Crates, Ionic
- **Puertos adicionales**: 1420 (Tauri dev server)
- **Volúmenes persistentes**:
  - `apuntador-node-modules` (npm dependencies)
  - `apuntador-rust-target` (Rust build artifacts)

### 2. Scripts de Configuración Automática

Creados dos scripts en [.devcontainer/scripts/](.devcontainer/scripts/):

**[on-create.sh](.devcontainer/scripts/on-create.sh)**:

- Instala Android SDK y herramientas
- Configura variables de entorno
- Instala Tauri CLI
- Instala Ionic/Capacitor CLI globalmente
- Acepta licencias de Android

**[post-create.sh](.devcontainer/scripts/post-create.sh)**:

- `npm install` automático
- Pre-descarga dependencias de Rust (`cargo fetch`)
- Sincronización de Capacitor

### 3. Documentación Completa

**[README.md](.devcontainer/README.md)** - Actualizado con:

- Instrucciones para desarrollo full-stack
- Comandos para cada plataforma (Web/Android/Tauri/Ionic)
- Gestión de volúmenes
- Recursos recomendados (8 CPUs, 16GB RAM)

**[MACOS_SETUP.md](.devcontainer/MACOS_SETUP.md)** - Nuevo:

- Qué instalar en macOS local (Colima, Docker, VS Code, Xcode)
- Instrucciones paso a paso
- Comandos de verificación
- Troubleshooting

**[VOLUME_MANAGEMENT.md](.devcontainer/VOLUME_MANAGEMENT.md)** - Nuevo:

- Cómo gestionar volúmenes Docker
- Mapear a discos externos (ahorra espacio en SSD)
- Limpiar volúmenes
- Migración de volúmenes existentes
- Configuraciones recomendadas por escenario

**[PLATFORM_NOTES.md](.devcontainer/PLATFORM_NOTES.md)** - Nuevo:

- Matriz de compatibilidad por plataforma
- Qué se puede hacer en el container vs en macOS nativo
- Workflows recomendados
- Limitaciones de iOS (requiere macOS + Xcode)
- Comandos específicos por plataforma

---

## Cómo Empezar

### Instalación en macOS (Una Sola Vez)

```bash
# 1. Instalar Homebrew (si no lo tienes)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Instalar Colima + Docker
brew install colima docker docker-compose

# 3. Iniciar Colima con recursos adecuados
colima start --cpu 8 --memory 16 --disk 100 --vm-type vz --vz-rosetta

# 4. Instalar VS Code
brew install --cask visual-studio-code

# 5. Instalar extensión Dev Containers
code --install-extension ms-vscode-remote.remote-containers

# Listo!
```

**Solo si desarrollas iOS** (opcional):

```bash
# Instalar Xcode desde App Store (manual, ~15GB)
# Después:
sudo xcodebuild -license accept
xcode-select --install
sudo gem install cocoapods
```

### Abrir el Proyecto en Container

```bash
# Abrir VS Code
code /Users/linus/projects/apuntador

# Click en "Reopen in Container" cuando aparezca la notificación
# O usar Command Palette: Cmd+Shift+P → "Dev Containers: Reopen in Container"

# Primera vez: ~10 minutos (instalación de Android SDK, dependencias, etc.)
# Siguientes veces: ~1-2 minutos
```

---

## Volúmenes Mapeados

### Configuración Actual (Por Defecto)

```json
"mounts": [
  "source=apuntador-node-modules,target=/workspaces/apuntador/node_modules,type=volume",
  "source=apuntador-rust-target,target=/workspaces/apuntador/src-tauri/target,type=volume"
]
```

**Ventajas**:

- Mejor rendimiento (especialmente en macOS)
- `node_modules` y `target` no ocupan espacio en tu proyecto local
- Persisten entre reconstrucciones del container

**Desventajas**:

- [WARNING] No visibles en Finder (solo dentro del container)
- [WARNING] Ocupan espacio en el disco interno (~15-20GB total)

### Mapear a Disco Externo (Opcional)

Si necesitas ahorrar espacio en tu SSD, puedes mapear los volúmenes a un disco externo.

**Ver instrucciones completas**: [VOLUME_MANAGEMENT.md](.devcontainer/VOLUME_MANAGEMENT.md#-mapear-volúmenes-a-disco-externo)

**Configuración recomendada para SSD pequeño**:

```json
"mounts": [
  // node_modules: mantener en volumen (más rápido)
  "source=apuntador-node-modules,target=/workspaces/apuntador/node_modules,type=volume",

  // rust target: mover a disco externo (libera ~10GB)
  "source=/Volumes/MiDiscoExterno/apuntador-cache/rust-target,target=/workspaces/apuntador/src-tauri/target,type=bind,consistency=cached"
]
```

---

## Qué Puedes Hacer en el Container

| Plataforma        | Desarrollo          | Build                    | Notas                |
| ----------------- | ------------------- | ------------------------ | -------------------- |
| **Web**           | Completo            | Completo                 | Vite, tests, builds  |
| **Android**       | Completo            | APK/AAB                  | Sin emulador gráfico |
| **Tauri Linux**   | Completo            | Completo                 | Binarios Linux       |
| **Tauri macOS**   | Código Rust         | [ERROR] Build en macOS   |                      |
| **Tauri Windows** | Código Rust         | [ERROR] Build en Windows |                      |
| **iOS**           | [WARNING] Sync only | [ERROR] Build en macOS   | Requiere Xcode       |

**Ver detalles completos**: [PLATFORM_NOTES.md](.devcontainer/PLATFORM_NOTES.md)

---

## [DESKTOP] Recursos Recomendados (Colima)

### Desarrollo Full-Stack (Recomendado)

```bash
colima start --cpu 8 --memory 16 --disk 100
```

**Por qué**:

- Rust compilation es intensivo en CPU
- Android Gradle builds requieren bastante RAM
- Android SDK ocupa ~30GB de disco

### Solo Desarrollo Web

Si solo trabajas en Vue/TypeScript (sin Android/Tauri):

```bash
colima start --cpu 4 --memory 8 --disk 60
```

### Ver recursos actuales

```bash
colima status
```

### Cambiar recursos

```bash
colima stop
colima start --cpu 8 --memory 16 --disk 100
```

---

## Comandos Disponibles

### Web Development

```bash
npm run dev              # Vite dev server (port 3000)
npm run build            # Production build
npm test                 # Unit tests
npm run test:e2e         # E2E tests
```

### Tauri Desktop

```bash
npm run tauri dev        # Tauri dev (headless en container)
npm run tauri build      # Build Linux binary
cargo build              # Rust only
cargo test               # Rust tests
```

### Android

```bash
npx cap sync android     # Sync Capacitor
cd android && ./gradlew assembleDebug    # Build APK
npx cap open android     # Open Android Studio (requiere salir del container)
```

### iOS (requiere macOS nativo)

```bash
# Salir del container: Cmd+Shift+P → "Reopen Folder Locally"
npx cap sync ios
npx cap open ios         # Abre Xcode
```

---

## Workflows Recomendados

### Desarrollo Normal (80% del tiempo)

```bash
# En container
npm run dev              # Desarrollar Vue/TypeScript
npm test                 # Tests

# Testear en navegador: http://localhost:3000
```

### Testing Android

```bash
# En container
npx cap sync android     # Sincronizar cambios

# Salir: Cmd+Shift+P → "Reopen Folder Locally"
# En macOS:
npx cap open android     # Android Studio
```

### Testing iOS

```bash
# Salir del container primero
# En macOS:
npx cap sync ios
npx cap open ios         # Xcode
```

### Build Desktop (Linux)

```bash
# En container
npm run tauri build      # Genera binario Linux
```

### Build Desktop (macOS/Windows)

```bash
# En macOS nativo o Windows nativo
npm run tauri build
```

---

## Troubleshooting

### Container no inicia

```bash
# Verificar Colima
colima status

# Si está parado, iniciarlo
colima start

# Verificar Docker
docker ps
```

### Desarrollo lento

```bash
# Aumentar recursos
colima stop
colima start --cpu 8 --memory 16
```

### Cambios no se reflejan

```bash
# Reconstruir container
# Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

### Volúmenes ocupan mucho espacio

```bash
# Ver tamaño
docker system df -v

# Limpiar volúmenes no usados
docker volume prune

# O mapear a disco externo (ver VOLUME_MANAGEMENT.md)
```

---

## Espacio en Disco

### En macOS (fuera del container)

- Colima/Docker: ~500MB
- VS Code: ~300MB
- Xcode (opcional): ~15GB

### En Container (volúmenes Docker)

- Android SDK: ~30GB
- node_modules: ~500MB-1GB
- Rust target: ~5-10GB (puede crecer a 20GB+)
- **Total**: ~40-50GB

**Para ahorrar espacio**: Mapear `rust-target` a disco externo → [VOLUME_MANAGEMENT.md](.devcontainer/VOLUME_MANAGEMENT.md)

---

## Documentación

- **[README.md](README.md)** - Guía principal del devcontainer
- **[MACOS_SETUP.md](MACOS_SETUP.md)** - Instalación en macOS local
- **[VOLUME_MANAGEMENT.md](VOLUME_MANAGEMENT.md)** - Gestión de volúmenes y discos
- **[PLATFORM_NOTES.md](PLATFORM_NOTES.md)** - Notas por plataforma

---

## Checklist de Configuración

### Primera vez

- [ ] Instalar Colima + Docker
- [ ] Instalar VS Code + extensión Dev Containers
- [ ] (Opcional) Instalar Xcode + CocoaPods para iOS
- [ ] Iniciar Colima: `colima start --cpu 8 --memory 16 --disk 100`
- [ ] Abrir proyecto en VS Code
- [ ] Click "Reopen in Container"
- [ ] Esperar configuración inicial (~10 min)
- [ ] Verificar: `npm run dev` funciona

### Cada día

- [ ] Verificar Colima está corriendo: `colima status`
- [ ] Abrir proyecto: `code /Users/linus/projects/apuntador`
- [ ] "Reopen in Container" (si no está ya abierto)
- [ ] Desarrollar normalmente

### Cuando necesites iOS

- [ ] Salir del container: "Reopen Folder Locally"
- [ ] Sincronizar: `npx cap sync ios`
- [ ] Abrir Xcode: `npx cap open ios`
- [ ] Compilar y testear en Xcode

---

## [SUCCESS] ¡Listo!

Con esta configuración tienes un entorno de desarrollo completo para:

- Vue 3 + TypeScript + Vite
- Rust + Tauri (desktop)
- Ionic + Capacitor (mobile)
- Android (APK/AAB builds)
- iOS (requiere macOS nativo para builds)

**Siguiente paso**: `code /Users/linus/projects/apuntador` → "Reopen in Container" → `npm run dev`
