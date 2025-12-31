# Instalaciones Necesarias en macOS (Host Local)

Este documento describe qué necesitas instalar en tu macOS local para desarrollar con el proyecto Apuntador.

## 📋 Resumen

El **devcontainer maneja la mayoría de las dependencias**, pero hay algunas herramientas que necesitas en tu macOS local:

### ✅ Obligatorio (para usar el devcontainer)

1. **Docker Runtime** (Colima o Docker Desktop)
2. **Visual Studio Code**
3. **Extensión Dev Containers** para VS Code

### 🍎 Opcional (para desarrollo nativo iOS en macOS)

Si quieres compilar aplicaciones iOS **directamente en tu Mac** (fuera del container):

4. **Xcode** (completo, desde App Store)
5. **Xcode Command Line Tools**
6. **CocoaPods**
7. **Node.js** (para ejecutar comandos fuera del container)

---

## 1. Docker Runtime (OBLIGATORIO)

Tienes dos opciones. **Se recomienda Colima** por ser más ligero y eficiente.

### Opción A: Colima (Recomendado)

```bash
# Instalar con Homebrew
brew install colima docker docker-compose

# Iniciar Colima con recursos adecuados para desarrollo full-stack
colima start --cpu 8 --memory 16 --disk 100

# Para Apple Silicon (M1/M2/M3) - mejor rendimiento:
colima start --cpu 8 --memory 16 --disk 100 --vm-type vz --vz-rosetta

# Verificar estado
colima status

# Ver información
colima list
```

**Recursos recomendados**:
- **CPUs**: 8+ (desarrollo full-stack con Rust + Android)
- **Memory**: 16GB (Android SDK + Gradle + compilación Rust)
- **Disk**: 100GB (Android SDK ~30GB, cache de Rust, node_modules)

**Comandos útiles**:
```bash
# Detener Colima
colima stop

# Reiniciar con diferentes recursos
colima delete
colima start --cpu 8 --memory 16 --disk 100

# Ver logs si hay problemas
colima logs
```

### Opción B: Docker Desktop

```bash
# Instalar con Homebrew
brew install --cask docker

# O descargar manualmente desde:
# https://www.docker.com/products/docker-desktop/
```

Después de instalar:
1. Abrir Docker Desktop
2. Ir a Settings → Resources
3. Ajustar CPUs (8+) y Memory (16GB+)
4. Apply & Restart

---

## 2. Visual Studio Code (OBLIGATORIO)

```bash
# Instalar con Homebrew
brew install --cask visual-studio-code

# O descargar desde: https://code.visualstudio.com/
```

---

## 3. Extensión Dev Containers (OBLIGATORIO)

Dos formas de instalar:

### Desde VS Code:
1. Abrir VS Code
2. Ir a Extensions (⌘+Shift+X)
3. Buscar "Dev Containers"
4. Instalar "Dev Containers" por Microsoft

### Desde terminal:
```bash
code --install-extension ms-vscode-remote.remote-containers
```

---

## 4. Xcode (OPCIONAL - Solo para desarrollo iOS nativo)

⚠️ **Nota**: El container Linux NO puede compilar apps iOS. Para iOS necesitas macOS nativo.

### Instalar Xcode completo:

```bash
# Opción 1: Desde App Store (recomendado, ~15GB)
# Buscar "Xcode" en App Store e instalar

# Opción 2: Desde línea de comandos (requiere Apple ID)
mas install 497799835  # Xcode App Store ID

# Después de instalar, aceptar licencia
sudo xcodebuild -license accept
```

### Instalar Command Line Tools:

```bash
xcode-select --install

# Verificar instalación
xcode-select -p
# Debería mostrar: /Applications/Xcode.app/Contents/Developer
```

---

## 5. Ruby 3.x (OPCIONAL - Solo para iOS)

CocoaPods requiere Ruby >= 3.0, pero macOS incluye Ruby 2.6.10. Necesitas instalar una versión más reciente.

### Opción A: Instalar Ruby con rbenv (Recomendado - Versión Estable)

**⚠️ IMPORTANTE**: Homebrew instala Ruby 4.0.0 (inestable). Usa rbenv para instalar Ruby 3.3.x (estable y compatible con CocoaPods).

```bash
# Instalar rbenv y ruby-build
brew install rbenv ruby-build

# Añadir rbenv al PATH
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# Instalar Ruby 3.3.6 (última versión estable 3.x)
rbenv install 3.3.6

# Establecer como versión global
rbenv global 3.3.6

# Verificar
ruby --version   # Debería mostrar 3.3.6
gem --version
```

### Opción B: Instalar Ruby con Homebrew (Puede instalar Ruby 4.0 - NO recomendado)

**⚠️ ADVERTENCIA**: Homebrew puede instalar Ruby 4.0.0 (versión en desarrollo, inestable). Solo usa esta opción si sabes lo que haces.

```bash
# Instalar Ruby (puede ser 4.0.0)
brew install ruby

# Añadir Ruby de Homebrew al PATH
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
echo 'export PATH="$(brew --prefix ruby)/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verificar versión
ruby --version

# Si instaló Ruby 4.0.0, DESINSTALAR y usar rbenv:
brew uninstall ruby
# Luego usar Opción A (rbenv)
```

---

## 6. CocoaPods (OPCIONAL - Solo para iOS)

⚠️ **Importante**: Instalar Ruby 3.x primero (ver sección anterior).

```bash
# Instalar CocoaPods
gem install cocoapods

# Si necesitas permisos, usa --user-install en lugar de sudo:
gem install cocoapods --user-install

# Verificar instalación
pod --version
```

**Si obtienes error de permisos**:
```bash
# Opción 1: Instalar en directorio de usuario
gem install cocoapods --user-install

# Luego añadir al PATH
echo 'export PATH="$HOME/.gem/ruby/3.3.0/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Opción 2: Usar sudo (menos recomendado)
sudo gem install cocoapods
```

---

## 7. Node.js (OPCIONAL - Solo para desarrollo fuera del container)

Si quieres ejecutar comandos npm **fuera del container**:

```bash
# Instalar Node.js 20 (LTS) con Homebrew
brew install node@20

# O usar nvm (recomendado para múltiples versiones)
brew install nvm
nvm install 20
nvm use 20

# Verificar instalación
node --version  # v20.x.x
npm --version   # 10.x.x
```

**Nota**: Dentro del container ya está Node.js 20, no es necesario en el host a menos que quieras desarrollar fuera del container.

---

## 8. Homebrew (Si no lo tienes)

Homebrew es el gestor de paquetes para macOS. La mayoría de instalaciones lo usan.

```bash
# Instalar Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Verificar instalación
brew --version
```

---

## ✅ Verificación Rápida

Ejecuta estos comandos para verificar que todo está instalado correctamente:

```bash
# Docker
docker --version
docker ps

# VS Code
code --version

# Extensión Dev Containers (debe aparecer en la lista)
code --list-extensions | grep ms-vscode-remote.remote-containers

# --- OPCIONAL (solo si instalaste para desarrollo iOS) ---

# Xcode
xcodebuild -version

# Command Line Tools
xcode-select -p

# Ruby (debe ser >= 3.0)
ruby --version

# CocoaPods
pod --version

# Node.js (si lo instalaste en el host)
node --version
npm --version
```

---

## 🚀 Flujo de Trabajo Recomendado

### Desarrollo Web/Android/Tauri → Usar el devcontainer

1. Iniciar Colima (si no está corriendo):
   ```bash
   colima start --cpu 8 --memory 16
   ```

2. Abrir proyecto en VS Code:
   ```bash
   code /Users/linus/projects/apuntador
   ```

3. Cuando VS Code pregunte, click en "Reopen in Container"

4. Esperar a que el container se configure (~5-10 min la primera vez)

5. Desarrollar normalmente dentro del container

**Todo el stack (Node, Rust, Android SDK, Tauri) está en el container.**

### Desarrollo iOS → Usar macOS nativo

Para iOS, necesitas salir del container:

1. En VS Code, Cmd+Shift+P → "Dev Containers: Reopen Folder Locally"

2. Ejecutar comandos iOS en terminal de macOS:
   ```bash
   # Sincronizar Capacitor
   npx cap sync ios
   
   # Abrir en Xcode
   npx cap open ios
   
   # O usar Ionic CLI
   ionic capacitor build ios
   ionic capacitor run ios
   ```

3. Compilar y firmar en Xcode

---

## 📊 Espacio en Disco Requerido

Estima estos tamaños en tu macOS:

| Componente | Tamaño Aproximado |
|------------|-------------------|
| Docker Desktop / Colima | ~500 MB |
| VS Code | ~300 MB |
| Xcode (completo) | ~15 GB |
| Xcode Command Line Tools | ~1.5 GB |
| Node.js (si instalas en host) | ~100 MB |
| **Volúmenes Docker** (node_modules, target) | **5-20 GB** |
| **Android SDK** (en container) | **~30 GB** |

**Total mínimo** (sin iOS): ~6 GB  
**Total completo** (con iOS): ~50-70 GB

---

## 🐛 Troubleshooting

### "Cannot connect to Docker daemon"

```bash
# Si usas Colima, asegúrate que esté corriendo
colima status

# Si está parado, iniciarlo
colima start

# Verificar contexto de Docker
docker context ls
docker context use colima
```

### VS Code no detecta el devcontainer

1. Verificar que la extensión Dev Containers esté instalada:
   ```bash
   code --list-extensions | grep ms-vscode-remote.remote-containers
   ```

2. Reiniciar VS Code

3. Abrir **solo** la carpeta del proyecto (no una carpeta padre):
   ```bash
   code /Users/linus/projects/apuntador
   ```

### Colima consume demasiados recursos

```bash
# Ver uso actual
colima status

# Reducir recursos (detener primero)
colima stop
colima start --cpu 6 --memory 12

# Para desarrollo solo web (sin Android/Tauri pesados)
colima start --cpu 4 --memory 8
```

### Error al instalar CocoaPods

**Problema 1**: `ffi requires Ruby version >= 3.0. The current ruby version is 2.6.10.`

**Solución**:
```bash
# Instalar Ruby 3.3.x con rbenv (NO usar brew install ruby)
brew install rbenv ruby-build

# Añadir rbenv al PATH
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# Instalar Ruby 3.3.6 (última estable)
rbenv install 3.3.6
rbenv global 3.3.6

# Verificar Ruby 3.3.x
ruby --version

# Instalar CocoaPods
gem install cocoapods
```

**Problema 2**: `pod: command not found` después de instalar

**Causa**: CocoaPods se instaló con el Ruby del sistema en una ubicación no incluida en PATH.

**Solución**:
```bash
# 1. Si instalaste Ruby con Homebrew, desinstalarlo
brew uninstall ruby

# 3. Instalar rbenv (gestor de versiones de Ruby)
brew install rbenv ruby-build

# 4. Añadir rbenv al PATH (CRÍTICO)
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# 5. Instalar Ruby 3.3.6 (versión estable)
rbenv install 3.3.6
rbenv global 3.3.6

# 6. Verificar que usas Ruby 3.3.6
ruby --version    # Debe mostrar 3.3.6
which ruby        # Debe mostrar ~/.rbenv/shims/ruby

# 7. Instalar CocoaPods con el nuevo Ruby
gem install cocoapods

# 8. Verificar
pod --version     # Ahora debería funcionar
which pod         # Mostrar ubicación del comando
```

**Problema 3**: Error con Ruby 4.0.0 - `No such file or directory @ rb_sysopen`

**Causa**: Ruby 4.0.0 es una versión en desarrollo (inestable) y tiene problemas con gems.

**Solución**:
```bash
# 1. Desinstalar Ruby 4.0.0 de Homebrew
brew uninstall ruby

# 2. Usar rbenv para instalar Ruby 3.3.6
brew install rbenv ruby-build
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc
rbenv install 3.3.6
rbenv global 3.3.6

# 3. Verificar
ruby --version    # Debe mostrar 3.3.6

# 4. Instalar CocoaPods
gem install cocoapods
# 7. Verificar
pod --version     # Ahora debería funcionar
which pod         # Mostrar ubicación del comando
```

### Error al compilar iOS

1. Verificar que Xcode esté instalado completamente
2. Abrir Xcode al menos una vez (instala componentes adicionales)
3. Aceptar licencia: `sudo xcodebuild -license accept`
4. Verificar simuladores: `xcrun simctl list`

---

## 📝 Resumen para tu Caso

### Instalación Mínima (solo devcontainer)

```bash
# 1. Instalar Homebrew (si no lo tienes)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Instalar Colima y Docker
brew install colima docker docker-compose

# 3. Iniciar Colima con recursos adecuados
colima start --cpu 8 --memory 16 --disk 100 --vm-type vz --vz-rosetta

# 4. Instalar VS Code
brew install --cask visual-studio-code

# 5. Instalar extensión Dev Containers
code --install-extension ms-vscode-remote.remote-containers

# ✅ Listo! Ahora puedes abrir el proyecto en container
```

### Instalación Completa (con soporte iOS nativo)

```bash
# Todo lo anterior +

# 6. Instalar Xcode desde App Store (manual)
# Después aceptar licencia:
sudo xcodebuild -license accept

# 7. Instalar Command Line Tools
xcode-select --install

# 8. Instalar Ruby 3.3.x con rbenv (necesario para CocoaPods)
brew install rbenv ruby-build
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc
rbenv install 3.3.6
rbenv global 3.3.6

# Verificar Ruby 3.3.x
ruby --version  # Debe mostrar 3.3.6

# 9. Instalar CocoaPods
gem install cocoapods

# 10. (Opcional) Instalar Node.js en host
brew install node@20
```

---

## 🎯 ¿Qué se queda en el container vs en tu Mac?

| Herramienta | Container | macOS Host | Notas |
|-------------|-----------|------------|-------|
| Node.js 20 | ✅ | ⚠️ Opcional | En container para desarrollo principal |
| Rust + Cargo | ✅ | ❌ | Solo en container |
| Android SDK | ✅ | ❌ | Solo en container (~30GB) |
| Tauri CLI | ✅ | ❌ | Solo en container |
| Xcode | ❌ | ✅ | Solo en macOS (no funciona en Linux) |
| CocoaPods | ⚠️ Instalado en ambos | ✅ | iOS requiere macOS nativo |
| Docker/Colima | ❌ | ✅ | Runtime en host |
| VS Code | ❌ | ✅ | UI en host, extensiones en container |

---

## 🔗 Links Útiles

- [Colima GitHub](https://github.com/abiosoft/colima)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [Capacitor iOS Setup](https://capacitorjs.com/docs/ios)
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)
