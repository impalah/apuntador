# 🚀 Quick Start - DevContainer Apuntador

## ⏱️ 5 Minutos para Empezar

### Paso 1: Instalar Dependencias en macOS (5 minutos)

```bash
# Copiar y pegar TODO esto en la terminal:

# 1. Instalar Homebrew (si no lo tienes)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Instalar Colima, Docker y VS Code
brew install colima docker docker-compose
brew install --cask visual-studio-code

# 3. Iniciar Colima con recursos adecuados
colima start --cpu 8 --memory 16 --disk 100 --vm-type vz --vz-rosetta

# 4. Instalar extensión Dev Containers
code --install-extension ms-vscode-remote.remote-containers

# ✅ ¡Listo!
```

### (Opcional) Para Desarrollo iOS

Si también quieres compilar apps iOS nativamente:

```bash
# 5. Instalar Xcode desde App Store (manual, ~15GB)
# Después:
sudo xcodebuild -license accept
xcode-select --install

# 6. Instalar Ruby 3.x (necesario para CocoaPods)
brew install ruby
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 7. Verificar Ruby 3.x
ruby --version  # Debe mostrar >= 3.0

# 8. Instalar CocoaPods
gem install cocoapods
```

**¿Problema con CocoaPods?** Ver solución rápida: [FIX_COCOAPODS.md](FIX_COCOAPODS.md)

### Paso 2: Abrir el Proyecto (2 minutos)

```bash
# Abrir en VS Code
code /Users/linus/projects/apuntador
```

Cuando aparezca la notificación en VS Code, click en:
```
"Reopen in Container"
```

**Primera vez**: Esperar ~10 minutos (instalación de Android SDK, Rust, dependencias)  
**Siguientes veces**: ~1-2 minutos

### Paso 3: Verificar que Funciona (1 minuto)

Cuando el container esté listo, ejecutar en la terminal integrada de VS Code:

```bash
npm run dev
```

Abrir en navegador: http://localhost:3000

**¡Funciona!** ✅

---

## 📋 Comandos Rápidos

### Desarrollo Web
```bash
npm run dev              # Dev server → http://localhost:3000
npm run build            # Build producción
npm test                 # Tests
```

### Android
```bash
npx cap sync android     # Sincronizar código
cd android && ./gradlew assembleDebug    # Build APK
```

### Tauri Desktop
```bash
npm run tauri dev        # Dev mode (headless en container)
cargo build              # Build Rust
```

### iOS (requiere salir del container)
```bash
# Cmd+Shift+P → "Dev Containers: Reopen Folder Locally"
npx cap sync ios
npx cap open ios         # Abre Xcode
```

---

## ⚡ Comandos de Colima (macOS)

```bash
# Ver estado
colima status

# Iniciar
colima start

# Detener (libera recursos)
colima stop

# Reiniciar con diferentes recursos
colima stop
colima start --cpu 8 --memory 16 --disk 100
```

---

## 🔄 Entrar/Salir del Container

### Entrar (abrir en container)
```bash
# Método 1: Notificación
# VS Code mostrará "Reopen in Container" → Click

# Método 2: Command Palette
# Cmd+Shift+P → "Dev Containers: Reopen in Container"
```

### Salir (volver a macOS local)
```bash
# Cmd+Shift+P → "Dev Containers: Reopen Folder Locally"
```

### Reconstruir (si cambias configuración)
```bash
# Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

---

## 📚 Documentación Completa

- [SETUP_SUMMARY.md](SETUP_SUMMARY.md) - Resumen ejecutivo completo
- [MACOS_SETUP.md](MACOS_SETUP.md) - Instalación detallada en macOS
- [README.md](README.md) - Guía completa del devcontainer
- [VOLUME_MANAGEMENT.md](VOLUME_MANAGEMENT.md) - Gestión de volúmenes
- [PLATFORM_NOTES.md](PLATFORM_NOTES.md) - Capacidades por plataforma

---

## 🐛 Problemas Comunes

### "Cannot connect to Docker daemon"
```bash
colima status           # Ver si está corriendo
colima start            # Iniciarlo si está parado
```

### Container no inicia
```bash
# Reconstruir
# Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

### Desarrollo muy lento
```bash
# Aumentar recursos
colima stop
colima start --cpu 8 --memory 16
```

### Puerto 3000 ocupado
```bash
# Ver qué lo usa
lsof -ti:3000

# Matar proceso
kill -9 $(lsof -ti:3000)
```

---

## ✅ Checklist

- [ ] Colima instalado y corriendo (`colima status`)
- [ ] VS Code instalado
- [ ] Extensión Dev Containers instalada
- [ ] Proyecto abierto en container
- [ ] `npm run dev` funciona → http://localhost:3000

**¿Todo listo?** → ¡A desarrollar! 🎉

---

## 💡 Tips

### Tip 1: Salir del container antes de apagar el Mac
```bash
# Cmd+Shift+P → "Reopen Folder Locally"
# Luego: colima stop
```

### Tip 2: Ver uso de recursos
```bash
docker stats            # CPU/memoria en tiempo real
docker system df -v     # Espacio en disco
```

### Tip 3: Limpiar espacio
```bash
docker system prune     # Eliminar recursos no usados
docker volume prune     # Eliminar volúmenes no usados
```

### Tip 4: Múltiples proyectos
```bash
# Abrir cada proyecto en su propia ventana de VS Code
code /path/to/proyecto1
code /path/to/proyecto2

# Cada uno tendrá su propio container independiente
```

---

## 🎯 Siguiente Paso

```bash
# 1. Iniciar Colima (si no está corriendo)
colima start

# 2. Abrir proyecto
code /Users/linus/projects/apuntador

# 3. Click "Reopen in Container"

# 4. Esperar...

# 5. Desarrollar!
npm run dev
```

**¡Disfruta del desarrollo!** 🚀
