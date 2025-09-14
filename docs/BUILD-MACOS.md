# 🍎 macOS Desktop Build Guide - Apuntador

This guide provides detailed instructions for building **Apuntador** as a desktop application for macOS using Tauri.

## 📋 Prerequisites

### 1. Required Tools

```bash
# Node.js (v18 or higher)
node --version

# Rust (latest stable version)
rustc --version

# Xcode Command Line Tools
xcode-select --install
```

### 2. Rust Targets for macOS

```bash
# For universal builds (ARM64 + Intel)
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin
```

### 3. Verify Prerequisites

The build script includes automatic verification, but you can verify manually:

```bash
# Verify Node.js
which node && node --version

# Verify Rust
which rustc && rustc --version

# Verify Xcode tools
xcode-select --version
```

## 🚀 Using the Build Script

### Basic Build (Recommended)

```bash
# Universal build (ARM64 + Intel) with DMG
./build-macos-release.sh
```

This command:

- ✅ Installs npm dependencies
- ✅ Builds for ARM64 and Intel
- ✅ Creates universal binary
- ✅ Generates DMG file
- ✅ Shows file size information

### Advanced Options

#### Architecture-Specific Builds

```bash
# Apple Silicon only (M1/M2/M3/M4)
./build-macos-release.sh --arch arm64

# Intel only
./build-macos-release.sh --arch x86_64

# Universal (ARM64 + Intel) - Default
./build-macos-release.sh --arch universal
```

#### Build Types

```bash
# Release (optimized, slower) - Default
./build-macos-release.sh --type release

# Debug (fast, for development)
./build-macos-release.sh --type debug
```

#### DMG Control

```bash
# Without DMG generation (.app only)
./build-macos-release.sh --no-dmg

# Force DMG recreation
./build-macos-release.sh --force-dmg
```

#### Useful Combinations

```bash
# Fast build for testing (debug without DMG)
./build-macos-release.sh --type debug --no-dmg

# Apple Silicon optimized with DMG
./build-macos-release.sh --arch arm64 --type release

# Intel optimized build
./build-macos-release.sh --arch x86_64 --type release
```

## 🔧 Using Makefile

### Available Targets

```bash
# Universal release build with DMG
make tauri-build-mac

# Debug build (fast, no DMG)
make tauri-build-mac-debug

# Intel only build
make tauri-build-mac-intel

# Universal build (same as tauri-build-mac)
make tauri-build-mac-universal

# Release build with all options
make tauri-build-mac-release
```

### Automatic OS Detection

The Makefile automatically detects if you're on macOS:

```bash
# On macOS - runs the macOS script
make tauri-build-mac

# On Windows/Linux - shows appropriate error message
make tauri-build-mac
```

## 📁 Generated Files

### Output Structure

```
src-tauri/target/
├── aarch64-apple-darwin/release/
│   └── apuntador              # ARM64 binary
├── x86_64-apple-darwin/release/
│   └── apuntador              # Intel binary
└── universal-apple-darwin/release/
    └── bundle/macos/
        ├── Apuntador.app      # Universal application
        └── Apuntador.dmg      # DMG installer
```

### Main Files

| File                | Description       | Approx. Size |
| ------------------- | ----------------- | ------------ |
| `Apuntador.app`     | macOS Application | 15-25 MB     |
| `Apuntador.dmg`     | DMG Installer     | 10-20 MB     |
| Individual binaries | Per architecture  | 8-15 MB each |

## ⏱️ Build Times

| Build Type        | Estimated Time | Recommended Use    |
| ----------------- | -------------- | ------------------ |
| Debug (no DMG)    | 2-3 minutes    | Quick development  |
| Release (1 arch)  | 4-6 minutes    | Specific testing   |
| Universal Release | 8-12 minutes   | Final distribution |

## 🐛 Troubleshooting

### Error: "No Xcode Command Line Tools"

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Verify installation
xcode-select --version
```

### Error: "Rust target not found"

```bash
# Install required targets
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin

# Verify installed targets
rustup target list --installed
```

### Error: "DMG creation failed"

```bash
# Build without DMG first
./build-macos-release.sh --no-dmg

# Then create DMG manually if needed
cd src-tauri/target/universal-apple-darwin/release/bundle/macos/
```

### Error: "Permission denied"

```bash
# Give execution permissions to script
chmod +x build-macos-release.sh

# Run again
./build-macos-release.sh
```

### Slow Build Times

```bash
# Use debug build for development
./build-macos-release.sh --type debug

# Or architecture-specific build
./build-macos-release.sh --arch arm64  # If you have M1/M2/M3/M4
```

## 🔍 Build Verification

### Verify Application

```bash
# Check that the app was created
ls -la src-tauri/target/universal-apple-darwin/release/bundle/macos/

# Verify supported architectures
file src-tauri/target/universal-apple-darwin/release/bundle/macos/Apuntador.app/Contents/MacOS/Apuntador
```

### Test the Application

```bash
# Open application from terminal
open src-tauri/target/universal-apple-darwin/release/bundle/macos/Apuntador.app

# Or double-click in Finder
```

## 📦 Distribution

### DMG File

The `Apuntador.dmg` file is ready for distribution:

1. **Direct sharing**: Share the DMG file
2. **GitHub upload**: Use in GitHub Releases
3. **Notarization**: For App Store distribution (optional)

### Verify DMG

```bash
# Mount DMG to verify
hdiutil attach src-tauri/target/universal-apple-darwin/release/bundle/macos/Apuntador.dmg

# Unmount after verification
hdiutil detach /Volumes/Apuntador
```

## 🚨 Important Notes

### Compatibility

- **Universal Binary**: Compatible with all Macs (Intel and Apple Silicon)
- **ARM64**: Apple Silicon Macs only (M1/M2/M3/M4)
- **Intel**: Intel Macs and Apple Silicon (via Rosetta)

### Performance

- **On Apple Silicon**: Native ARM64 is ~20-40% faster
- **On Intel**: Native x86_64 is optimal
- **Universal**: Works on both, ~1.5x larger file size

### Development

For daily development, use:

```bash
# Fast build for testing
make tauri-build-mac-debug

# Or with script directly
./build-macos-release.sh --type debug --no-dmg
```

## 📞 Additional Help

If you encounter issues:

1. **Verify prerequisites**: Run the script without arguments to see specific errors
2. **Clean cache**: `cd src-tauri && cargo clean`
3. **Update Rust**: `rustup update`
4. **Reinstall targets**: Remove and reinstall Rust targets

## 🔗 Related Documentation

- [Main Build Guide](./BUILD.md) - All platforms
- [Windows Build Guide](./BUILD-WINDOWS.md) - Windows desktop
- [Android Build Guide](./BUILD-ANDROID.md) - Android mobile

---

_This documentation corresponds to Apuntador v1.0 with Tauri 2.x_
