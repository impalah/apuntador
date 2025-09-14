# 🖥️ Windows Desktop Build Guide - Apuntador

This guide provides detailed instructions for building **Apuntador** as a desktop application for Windows using Tauri.

## 📋 Prerequisites

### 1. Required Tools

```powershell
# Node.js (v18 or higher)
node --version

# Rust (latest stable version)
rustc --version

# Visual Studio Build Tools or Visual Studio Community
# Download from: https://visualstudio.microsoft.com/downloads/
```

### 2. Visual Studio Components

When installing Visual Studio, ensure you have:

- **MSVC v143 - VS 2022 C++ x64/x86 build tools**
- **Windows 10/11 SDK** (latest version)
- **CMake tools for Visual Studio** (optional but recommended)

### 3. Rust Target for Windows

```powershell
# Add Windows target (usually installed by default)
rustup target add x86_64-pc-windows-msvc
```

### 4. Verify Prerequisites

```powershell
# Verify Node.js
node --version

# Verify Rust
rustc --version

# Verify Visual Studio tools
where cl
# Should return path to Microsoft C++ compiler
```

## 🚀 Building the Application

### Quick Build (Recommended)

```powershell
# Using Makefile (requires make utility)
make tauri-build-windows

# Or direct npm command
npm run tauri build -- --target x86_64-pc-windows-msvc
```

### GitHub Actions (Automated)

The project includes a Windows build workflow:

```yaml
# .github/workflows/build-windows-desktop.yml
# Triggers on:
# - Push to main branch
# - Manual workflow dispatch
# - Git tag creation
```

**To trigger manually:**

1. Go to GitHub Actions tab
2. Select "Build Windows Desktop"
3. Click "Run workflow"
4. Choose branch and configuration

### Build Options

#### Debug Build (Fast)

```powershell
# Debug build for development
npm run tauri build -- --debug --target x86_64-pc-windows-msvc

# Or using Makefile
make tauri-build-windows-debug
```

#### Release Build (Optimized)

```powershell
# Release build for distribution
npm run tauri build -- --target x86_64-pc-windows-msvc

# With specific features
npm run tauri build -- --target x86_64-pc-windows-msvc --features "custom-protocol"
```

#### Different Targets

```powershell
# 64-bit Windows (default)
npm run tauri build -- --target x86_64-pc-windows-msvc

# 32-bit Windows (if needed)
rustup target add i686-pc-windows-msvc
npm run tauri build -- --target i686-pc-windows-msvc
```

## 📁 Generated Files

### Output Structure

```
src-tauri/target/x86_64-pc-windows-msvc/release/
├── apuntador.exe              # Standalone executable
├── deps/                      # Dependencies
└── bundle/
    ├── msi/
    │   └── Apuntador_1.0.0_x64_en-US.msi
    └── nsis/
        └── Apuntador_1.0.0_x64-setup.exe
```

### File Types

| File             | Description           | Use Case              | Size  |
| ---------------- | --------------------- | --------------------- | ----- |
| `apuntador.exe`  | Standalone executable | Portable usage        | ~15MB |
| `.msi` package   | Windows Installer     | Enterprise deployment | ~12MB |
| `.exe` installer | NSIS installer        | Standard installation | ~10MB |

## 📦 Distribution Options

### MSI Package (Recommended for Enterprise)

- **Group Policy deployment**
- **Administrative installation**
- **Automatic updates support**
- **Registry integration**

```powershell
# Install MSI silently
msiexec /i Apuntador_1.0.0_x64_en-US.msi /quiet
```

### NSIS Installer (Recommended for Users)

- **User-friendly installation wizard**
- **Start menu integration**
- **Desktop shortcut creation**
- **Uninstaller included**

### Portable Executable

- **No installation required**
- **Run from any location**
- **USB drive compatible**
- **Settings stored locally**

## ⏱️ Build Times

| Build Type    | Estimated Time | Use Case         |
| ------------- | -------------- | ---------------- |
| Debug build   | 3-5 minutes    | Development      |
| Release build | 8-15 minutes   | Distribution     |
| Full CI build | 10-20 minutes  | Automated builds |

_Times vary based on hardware and whether dependencies are cached_

## 🐛 Troubleshooting

### Error: "Visual Studio Build Tools not found"

```powershell
# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/

# Verify installation
where cl
# Should show path to compiler
```

### Error: "Rust target not found"

```powershell
# Install Windows target
rustup target add x86_64-pc-windows-msvc

# Verify installed targets
rustup target list --installed
```

### Error: "Windows SDK not found"

```powershell
# Check Windows SDK installation
reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\Microsoft SDKs\Windows\v10.0" /s

# Install Windows SDK if missing
# Download from: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/
```

### Error: "Node.js version too old"

```powershell
# Update Node.js to version 18+
# Download from: https://nodejs.org/

# Verify version
node --version
```

### Build Fails with "Access Denied"

```powershell
# Run PowerShell as Administrator
# Or disable Windows Defender real-time protection temporarily

# Check if antivirus is blocking Rust compilation
```

### Slow Build Times

```powershell
# Use debug build for development
npm run tauri build -- --debug

# Enable incremental compilation (add to Cargo.toml)
[profile.dev]
incremental = true

# Use more CPU cores for compilation
set CARGO_BUILD_JOBS=4
```

## 🔧 Development Workflow

### Recommended Development Process

1. **Web Development First**

   ```powershell
   npm run dev
   # Test in browser for rapid iteration
   ```

2. **Desktop Testing**

   ```powershell
   npm run tauri build -- --debug
   # Quick native testing
   ```

3. **Production Build**
   ```powershell
   npm run tauri build
   # Final optimized build
   ```

### Using Makefile

```powershell
# Install make utility (if not available)
# Using Chocolatey: choco install make
# Using Scoop: scoop install make

# Available targets
make tauri-build-windows        # Release build
make tauri-build-windows-debug  # Debug build
make clean                      # Clean build artifacts
```

## 🔍 Build Verification

### Test the Application

```powershell
# Run the built executable
.\src-tauri\target\x86_64-pc-windows-msvc\release\apuntador.exe

# Or install and test the MSI
msiexec /i .\src-tauri\target\x86_64-pc-windows-msvc\release\bundle\msi\Apuntador_1.0.0_x64_en-US.msi
```

### Verify File Integrity

```powershell
# Check file hashes
Get-FileHash .\src-tauri\target\x86_64-pc-windows-msvc\release\apuntador.exe -Algorithm SHA256

# Check file properties
Get-ItemProperty .\src-tauri\target\x86_64-pc-windows-msvc\release\apuntador.exe
```

## 🚨 Important Notes

### Windows Defender

Windows Defender may flag unsigned executables. For distribution:

1. **Code Signing**: Sign executables with a valid certificate
2. **Microsoft Store**: Submit to Microsoft Store for automatic trust
3. **Reputation Building**: Distribute through known channels

### System Requirements

- **OS**: Windows 10 version 1903 or later
- **Architecture**: x64 (ARM64 support planned)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50MB for installation

### Performance Considerations

- **First Launch**: May be slower due to Windows security scanning
- **Subsequent Launches**: Should be fast with Windows caching
- **Resource Usage**: Similar to other Electron/Tauri applications

## 📋 Makefile Targets

```powershell
# Available make targets for Windows
make tauri-build-windows        # Standard release build
make tauri-build-windows-debug  # Debug build (faster)
make tauri-clean-windows        # Clean Windows build artifacts
make tauri-test-windows         # Run Windows-specific tests
```

## 🔗 Related Documentation

- [Main Build Guide](./BUILD.md) - All platforms
- [macOS Build Guide](./BUILD-MACOS.md) - macOS desktop
- [Android Build Guide](./BUILD-ANDROID.md) - Android mobile
- [GitHub Actions Workflows](../.github/workflows/) - Automated builds

## 📞 Additional Help

### Common Solutions

1. **Clean Build**: `cargo clean` in `src-tauri/` directory
2. **Update Rust**: `rustup update`
3. **Reinstall Targets**: `rustup target remove` then `rustup target add`
4. **Check Dependencies**: `npm install` to ensure all packages

### Support Resources

- [Tauri Documentation](https://tauri.app/)
- [Rust Installation Guide](https://rustup.rs/)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)

---

_This documentation corresponds to Apuntador v1.0 with Tauri 2.x_
