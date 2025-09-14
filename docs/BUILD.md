# 🚀 Build Guide - Apuntador

Complete build documentation for **Apuntador** teleprompter application across all supported platforms.

## 📱 Platform Support

| Platform       | Status   | Output                      | Distribution     |
| -------------- | -------- | --------------------------- | ---------------- |
| 🌐 **Web**     | ✅ Ready | Static files                | Any web host     |
| 🖥️ **Windows** | ✅ Ready | `.exe`, `.msi`              | Direct install   |
| 🍎 **macOS**   | ✅ Ready | `.app`, `.dmg`              | Direct install   |
| 📱 **Android** | ✅ Ready | `.apk`                      | Sideload/Store   |
| 🐧 **Linux**   | ✅ Ready | `.deb`, `.rpm`, `.AppImage` | Package managers |

---

## 🌐 Web Application

### Quick Start

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview build locally
npm run preview
```

### Static Hosting Deployment

```bash
# Build for production
npm run build

# Upload dist/ folder to any of these:
```

**Recommended Platforms:**

- **Vercel** - Zero-config with automatic HTTPS
- **Netlify** - Git integration with CDN
- **GitHub Pages** - Free for public repos
- **Firebase Hosting** - Google Cloud integration
- **AWS S3 + CloudFront** - Enterprise scaling

### Docker Deployment

```bash
# Build container
docker build -t apuntador .

# Run with nginx
docker run -p 80:80 apuntador
```

**Dockerfile** (already included):

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

---

## 🖥️ Windows Desktop

### Prerequisites

```powershell
# Node.js (v18+)
node --version

# Rust (latest stable)
rustc --version

# Visual Studio Build Tools or Visual Studio Community
# Download from: https://visualstudio.microsoft.com/downloads/
```

### Quick Build

```powershell
# Using GitHub Actions workflow (recommended)
# Push to main branch or manually trigger workflow

# Local build using Makefile
make tauri-build-windows

# Or direct npm command
npm run tauri build -- --target x86_64-pc-windows-msvc
```

### Advanced Options

```powershell
# Debug build (faster)
npm run tauri build -- --debug

# Specific target
npm run tauri build -- --target x86_64-pc-windows-msvc

# With specific features
npm run tauri build -- --features "custom-protocol"
```

### Output Files

```
src-tauri/target/x86_64-pc-windows-msvc/release/
├── apuntador.exe              # Standalone executable
└── bundle/
    ├── msi/
    │   └── Apuntador_1.0.0_x64_en-US.msi
    └── nsis/
        └── Apuntador_1.0.0_x64-setup.exe
```

### Distribution

- **MSI Package**: Enterprise deployment via Group Policy
- **NSIS Installer**: Standard user installation
- **Portable EXE**: No installation required

---

## 🍎 macOS Desktop

### Prerequisites

```bash
# Node.js (v18+)
node --version

# Rust (latest stable)
rustc --version

# Xcode Command Line Tools
xcode-select --install

# Rust targets for macOS
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin
```

### Quick Build

```bash
# Using build script (recommended)
./build-macos-release.sh

# Using Makefile
make tauri-build-mac

# Direct npm command
npm run tauri build -- --target universal-apple-darwin
```

### Build Script Options

```bash
# Universal build (ARM64 + Intel) with DMG
./build-macos-release.sh

# Apple Silicon only (M1/M2/M3)
./build-macos-release.sh --arch arm64

# Intel only
./build-macos-release.sh --arch x86_64

# Debug build (fast, for development)
./build-macos-release.sh --type debug

# Without DMG generation (.app only)
./build-macos-release.sh --no-dmg

# Useful combinations
./build-macos-release.sh --type debug --no-dmg  # Fast testing
./build-macos-release.sh --arch arm64           # M1/M2/M3 specific
```

### Makefile Targets

```bash
make tauri-build-mac           # Universal release build
make tauri-build-mac-debug     # Debug build (no DMG)
make tauri-build-mac-intel     # Intel only
make tauri-build-mac-universal # Universal (same as tauri-build-mac)
```

### Output Files

```
src-tauri/target/universal-apple-darwin/release/bundle/macos/
├── Apuntador.app              # Universal application
└── Apuntador.dmg              # Installer disk image
```

### Build Times

| Build Type            | Time Estimate | Use Case     |
| --------------------- | ------------- | ------------ |
| Debug (no DMG)        | 2-3 minutes   | Development  |
| Release (single arch) | 4-6 minutes   | Testing      |
| Universal release     | 8-12 minutes  | Distribution |

### Distribution

- **DMG File**: Standard macOS distribution
- **App Bundle**: Direct .app sharing
- **App Store**: Requires notarization and signing

---

## 📱 Android Application

### Prerequisites

```bash
# Node.js (v18+)
node --version

# Android Studio or Android SDK Tools
# Set ANDROID_HOME environment variable

# Java Development Kit (JDK 8 or 11)
java --version
```

### Quick APK Build

```bash
# Build custom-named APK
make android-build-apk

# This creates: apuntador.apk (ready for installation)
```

### Advanced Android Builds

```bash
# Debug APK (faster, for testing)
make android-build-debug

# Release APK (optimized)
make android-build-release

# Android App Bundle (for Play Store)
make android-build-bundle
```

### Manual Build Process

```bash
# Add Android platform (first time only)
npx cap add android

# Sync web assets
npx cap sync android

# Open in Android Studio
npx cap open android

# Or build via CLI
cd android && ./gradlew assembleRelease
```

### Output Files

```
android/app/build/outputs/apk/release/
├── app-release.apk            # Standard APK
└── app-release-unsigned.apk   # Unsigned APK

android/app/build/outputs/bundle/release/
└── app-release.aab            # App Bundle for Play Store
```

### Installation

```bash
# Install on connected device
adb install apuntador.apk

# Or transfer APK to device and install via file manager
```

---

## 🐧 Linux Desktop

### Prerequisites

```bash
# Node.js (v18+)
node --version

# Rust (latest stable)
rustc --version

# System dependencies (Ubuntu/Debian)
sudo apt-get install -y \
  libgtk-3-dev \
  libwebkit2gtk-4.0-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf \
  libssl-dev \
  pkg-config \
  build-essential
```

### Quick Build

```bash
# Using GitHub Actions workflow (recommended)
# Push to main branch or manually trigger workflow

# Local build using Makefile
make tauri-build-linux

# Or direct npm command
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

### Advanced Options

```bash
# Debug build (faster)
npm run tauri build -- --debug --target x86_64-unknown-linux-gnu

# ARM64 target
npm run tauri build -- --target aarch64-unknown-linux-gnu

# Specific distribution packages
npm run tauri build -- --target x86_64-unknown-linux-gnu --bundles deb,rpm,appimage
```

### Output Files

```
src-tauri/target/x86_64-unknown-linux-gnu/release/
├── apuntador                  # Standalone binary
└── bundle/
    ├── deb/
    │   └── apuntador_1.0.0_amd64.deb
    ├── rpm/
    │   └── apuntador-1.0.0-1.x86_64.rpm
    └── appimage/
        └── apuntador_1.0.0_amd64.AppImage
```

### Installation

```bash
# DEB package (Ubuntu/Debian)
sudo apt install ./apuntador_1.0.0_amd64.deb

# RPM package (Fedora/RHEL)
sudo dnf install ./apuntador-1.0.0-1.x86_64.rpm

# AppImage (Universal)
chmod +x apuntador_1.0.0_amd64.AppImage
./apuntador_1.0.0_amd64.AppImage

# Standalone binary
sudo cp apuntador /usr/local/bin/
```

### Distribution

- **DEB Package**: APT package manager integration
- **RPM Package**: YUM/DNF package manager integration
- **AppImage**: Portable, no installation required
- **Binary**: Manual installation and distribution

---

## 🚨 Troubleshooting

### Common Issues

#### Windows Build Errors

```powershell
# Visual Studio Build Tools missing
# Download and install from Microsoft

# Rust target missing
rustup target add x86_64-pc-windows-msvc

# Node.js version too old
# Update to Node.js 18+
```

#### macOS Build Errors

```bash
# Xcode Command Line Tools missing
xcode-select --install

# Rust targets missing
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin

# Permission denied on script
chmod +x build-macos-release.sh
```

#### Android Build Errors

```bash
# ANDROID_HOME not set
export ANDROID_HOME=$HOME/Android/Sdk

# JDK version incompatible
# Use JDK 8 or 11, not newer versions

# Gradle daemon issues
cd android && ./gradlew --stop
```

### Clean Build

```bash
# Clean all build artifacts
make clean

# Clean specific platforms
npm run tauri clean         # Desktop platforms
npx cap clean android       # Android platform
rm -rf dist/                # Web build
```

### Environment Verification

```bash
# Check all prerequisites
npm run doctor

# Or manually verify:
node --version              # Should be 18+
rustc --version            # Should be latest stable
```

---

## 📦 Distribution

### Release Process

1. **Version Bump**

   ```bash
   npm version patch  # or minor/major
   ```

2. **Build All Platforms**

   ```bash
   # Web
   npm run build

   # Windows (via GitHub Actions or local)
   make tauri-build-windows

   # macOS
   ./build-macos-release.sh

   # Android
   make android-build-apk
   ```

3. **Create GitHub Release**
   - Upload all build artifacts
   - Include release notes
   - Tag with version number

### Automated Builds

**GitHub Actions workflows** are included for:

- ✅ Windows desktop builds (`.github/workflows/build-windows-desktop.yml`)
- ✅ macOS desktop builds (`.github/workflows/build-macos-desktop.yml`)

Trigger via:

- Push to `main` branch
- Manual workflow dispatch
- Git tag creation

### File Checksums

```bash
# Generate checksums for verification
sha256sum apuntador.exe > checksums.txt
shasum -a 256 Apuntador.dmg >> checksums.txt
md5sum apuntador.apk >> checksums.txt
```

---

## 🔧 Development Workflow

### Recommended Development Flow

1. **Web Development** (fastest iteration)

   ```bash
   npm run dev
   # Test features in browser first
   ```

2. **Desktop Testing** (macOS example)

   ```bash
   ./build-macos-release.sh --type debug --no-dmg
   # Quick native testing
   ```

3. **Mobile Testing**

   ```bash
   make android-build-debug
   # Test on device/emulator
   ```

4. **Production Builds**
   ```bash
   # Final builds for all platforms
   make build-all  # If you want to add this target
   ```

### Performance Tips

- Use **debug builds** during development
- Enable **incremental compilation** in Rust
- Use **watch mode** for web development
- **Cache** dependencies in CI/CD

---

## 📝 Notes

### Platform-Specific Features

- **Windows**: System tray integration, Windows-style notifications
- **macOS**: Menu bar integration, macOS-style notifications
- **Android**: Hardware back button, Android sharing
- **Web**: PWA capabilities, web sharing API

### File Sizes (Approximate)

| Platform      | Size  | Compressed |
| ------------- | ----- | ---------- |
| Web (gzipped) | ~2MB  | ~500KB     |
| Windows .exe  | ~15MB | ~8MB       |
| macOS .app    | ~20MB | ~12MB      |
| Android .apk  | ~10MB | ~8MB       |

### Requirements

- **Node.js**: 18+ (for all platforms)
- **Rust**: Latest stable (for desktop)
- **Android SDK**: API 24+ (Android 7.0+)
- **Browser**: Modern browsers with ES2020 support

---

_This documentation corresponds to Apuntador v1.0 with Tauri 2.x and Capacitor 6.x_
