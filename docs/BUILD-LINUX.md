# 🐧 Linux Desktop Build Guide - Apuntador

This guide provides detailed instructions for building **Apuntador** as a desktop application for Linux using Tauri.

## 📋 Prerequisites

### 1. Required Tools

```bash
# Node.js (v18 or higher)
node --version

# Rust (latest stable version)
rustc --version

# Build tools
sudo apt-get install build-essential
```

### 2. Linux System Dependencies

For **Ubuntu/Debian** systems:

```bash
# For Ubuntu 24.04+ (Noble) - Remove any conflicting packages first
sudo apt-get remove -y libappindicator3-dev || true

# Install all required dependencies
sudo apt-get update
sudo apt-get install -y \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  libssl-dev \
  pkg-config \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev
```

For **Fedora/RHEL** systems:

```bash
sudo dnf install -y \
  gtk3-devel \
  webkit2gtk3-devel \
  libappindicator-gtk3-devel \
  librsvg2-devel \
  openssl-devel \
  pkg-config \
  gcc \
  gcc-c++ \
  curl \
  wget \
  file
```

For **Arch Linux**:

```bash
sudo pacman -S \
  gtk3 \
  webkit2gtk \
  libappindicator-gtk3 \
  librsvg \
  openssl \
  pkg-config \
  base-devel \
  curl \
  wget \
  file
```

### 3. Rust Targets for Linux

```bash
# x86_64 (most common)
rustup target add x86_64-unknown-linux-gnu

# ARM64 (for ARM processors)
rustup target add aarch64-unknown-linux-gnu
```

### 4. Verify Prerequisites

```bash
# Verify Node.js
node --version

# Verify Rust
rustc --version

# Verify system libraries
pkg-config --cflags gtk+-3.0
pkg-config --cflags webkit2gtk-4.0
```

## 🚀 Building the Application

### Quick Build (Recommended)

```bash
# Using Makefile (if available)
make tauri-build-linux

# Or direct npm command
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

### GitHub Actions (Automated)

The project includes a Linux build workflow:

```yaml
# .github/workflows/build-linux-desktop.yml
# Triggers on:
# - Manual workflow dispatch
# - Configurable for x86_64 and ARM64
```

**To trigger manually:**

1. Go to GitHub Actions tab
2. Select "Build Linux Desktop"
3. Click "Run workflow"
4. Choose target architecture and configuration

### Build Options

#### Debug Build (Fast)

```bash
# Debug build for development
npm run tauri build -- --debug --target x86_64-unknown-linux-gnu

# Or using Makefile
make tauri-build-linux-debug
```

#### Release Build (Optimized)

```bash
# Release build for distribution
npm run tauri build -- --target x86_64-unknown-linux-gnu

# With specific target
npm run tauri build -- --target aarch64-unknown-linux-gnu  # ARM64
```

#### Different Architectures

```bash
# x86_64 (Intel/AMD 64-bit) - Default
npm run tauri build -- --target x86_64-unknown-linux-gnu

# ARM64 (ARM 64-bit processors)
npm run tauri build -- --target aarch64-unknown-linux-gnu
```

## 📁 Generated Files

### Output Structure

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

### Package Types

| File Type   | Description             | Use Case                  | Size  |
| ----------- | ----------------------- | ------------------------- | ----- |
| `apuntador` | Standalone binary       | Manual installation       | ~25MB |
| `.deb`      | Debian/Ubuntu package   | APT package manager       | ~15MB |
| `.rpm`      | Red Hat/Fedora package  | YUM/DNF package manager   | ~15MB |
| `.AppImage` | Universal Linux package | Portable, no installation | ~20MB |

## 📦 Installation Methods

### DEB Package (Ubuntu/Debian)

```bash
# Install DEB package
sudo dpkg -i apuntador_1.0.0_amd64.deb

# Fix dependencies if needed
sudo apt-get install -f

# Or using apt directly
sudo apt install ./apuntador_1.0.0_amd64.deb
```

### RPM Package (Fedora/RHEL)

```bash
# Install RPM package
sudo rpm -i apuntador-1.0.0-1.x86_64.rpm

# Or using dnf
sudo dnf install ./apuntador-1.0.0-1.x86_64.rpm

# Or using yum
sudo yum install ./apuntador-1.0.0-1.x86_64.rpm
```

### AppImage (Universal)

```bash
# Make executable and run
chmod +x apuntador_1.0.0_amd64.AppImage
./apuntador_1.0.0_amd64.AppImage

# Or integrate with system (optional)
./apuntador_1.0.0_amd64.AppImage --appimage-extract-and-run
```

### Standalone Binary

```bash
# Copy to system path
sudo cp apuntador /usr/local/bin/

# Make executable
sudo chmod +x /usr/local/bin/apuntador

# Run from anywhere
apuntador
```

## ⏱️ Build Times

| Build Type          | Estimated Time | Use Case      |
| ------------------- | -------------- | ------------- |
| Debug build         | 5-8 minutes    | Development   |
| Release build       | 10-20 minutes  | Distribution  |
| ARM64 cross-compile | 15-30 minutes  | ARM64 devices |
| Full CI build       | 20-40 minutes  | All packages  |

_Times vary based on hardware and whether Rust cache exists_

## 🐛 Troubleshooting

### Error: "libayatana-appindicator3-1 conflicts with libappindicator3-1"

This is a common conflict in Ubuntu 24.04+ between old and new appindicator packages:

```bash
# Remove conflicting old package
sudo apt-get remove -y libappindicator3-dev libappindicator3-1

# Install the newer ayatana version
sudo apt-get install -y libayatana-appindicator3-dev

# If still having issues, try:
sudo apt-get autoremove
sudo apt-get autoclean
sudo apt-get update
sudo apt-get install -y libayatana-appindicator3-dev
```

### Error: "gtk-3-dev not found"

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install libgtk-3-dev

# Fedora
sudo dnf install gtk3-devel

# Arch
sudo pacman -S gtk3
```

### Error: "webkit2gtk not found"

```bash
# Ubuntu/Debian (24.04+)
sudo apt-get install libwebkit2gtk-4.1-dev

# Ubuntu/Debian (older versions)
sudo apt-get install libwebkit2gtk-4.0-dev

# Fedora
sudo dnf install webkit2gtk3-devel

# Arch
sudo pacman -S webkit2gtk
```

### Error: "pkg-config not found"

```bash
# Ubuntu/Debian
sudo apt-get install pkg-config

# Fedora
sudo dnf install pkg-config

# Arch
sudo pacman -S pkg-config
```

### Error: "Rust target not found"

```bash
# Install Linux targets
rustup target add x86_64-unknown-linux-gnu
rustup target add aarch64-unknown-linux-gnu

# Verify installed targets
rustup target list --installed
```

### Error: "libappindicator not found"

```bash
# Ubuntu/Debian (older)
sudo apt-get install libappindicator3-dev

# Ubuntu/Debian (newer)
sudo apt-get install libayatana-appindicator3-dev

# Try both if unsure
sudo apt-get install libappindicator3-dev libayatana-appindicator3-dev
```

### Build Fails with Missing Dependencies

```bash
# Install all common build dependencies
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  libwebkit2gtk-4.1-dev \
  librsvg2-dev \
  patchelf
```

### ARM64 Cross-Compilation Issues

```bash
# Install cross-compilation tools
sudo apt-get install gcc-aarch64-linux-gnu

# Configure Cargo for cross-compilation
echo "[target.aarch64-unknown-linux-gnu]" >> ~/.cargo/config.toml
echo "linker = \"aarch64-linux-gnu-gcc\"" >> ~/.cargo/config.toml
```

## 🔧 Development Workflow

### Recommended Development Process

1. **Web Development First**

   ```bash
   npm run dev
   # Test in browser for rapid iteration
   ```

2. **Linux Testing**

   ```bash
   npm run tauri build -- --debug
   # Quick native testing
   ```

3. **Package Testing**
   ```bash
   npm run tauri build
   # Test full packages
   ```

### Using Makefile (if available)

```bash
# Available targets
make tauri-build-linux        # Release build
make tauri-build-linux-debug  # Debug build
make tauri-clean-linux        # Clean Linux artifacts
```

## 🔍 Build Verification

### Test the Binary

```bash
# Run the built binary directly
./src-tauri/target/x86_64-unknown-linux-gnu/release/apuntador

# Check dependencies
ldd ./src-tauri/target/x86_64-unknown-linux-gnu/release/apuntador
```

### Test Packages

```bash
# Test DEB package (don't install)
dpkg -c apuntador_1.0.0_amd64.deb

# Test RPM package (don't install)
rpm -qlp apuntador-1.0.0-1.x86_64.rpm

# Test AppImage
chmod +x apuntador_1.0.0_amd64.AppImage
./apuntador_1.0.0_amd64.AppImage --help
```

## 🚨 Important Notes

### Desktop Integration

All package formats include:

- **Desktop entry** (`.desktop` file)
- **Application icon** (multiple sizes)
- **MIME type associations** (if configured)
- **Menu integration** (Applications menu)

### System Requirements

- **OS**: Modern Linux distribution (kernel 3.17+)
- **Architecture**: x86_64 or ARM64
- **Display**: X11 or Wayland
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 100MB for installation

### Distribution-Specific Notes

#### Ubuntu/Debian

- Use `.deb` packages for APT integration
- Works with `dpkg`, `apt`, `gdebi`
- Automatic dependency resolution

#### Fedora/RHEL/CentOS

- Use `.rpm` packages for YUM/DNF integration
- Works with `rpm`, `dnf`, `yum`
- Automatic dependency resolution

#### Arch Linux

- Convert packages with `debtap` or use AppImage
- Consider creating AUR package

#### AppImage (Universal)

- Works on most distributions
- No installation required
- Portable and self-contained

### Performance Considerations

- **Native performance** similar to other native applications
- **Memory usage** comparable to Electron apps but more efficient
- **Startup time** faster than Electron equivalents
- **Resource usage** optimized for Linux systems

## 📋 Makefile Targets (if available)

```bash
# Available make targets for Linux
make tauri-build-linux         # Standard release build
make tauri-build-linux-debug   # Debug build (faster)
make tauri-build-linux-arm64   # ARM64 release build
make tauri-clean-linux         # Clean Linux build artifacts
make tauri-test-linux          # Run Linux-specific tests
```

## 🔗 Related Documentation

- [Main Build Guide](./BUILD.md) - All platforms
- [Windows Build Guide](./BUILD-WINDOWS.md) - Windows desktop
- [macOS Build Guide](./BUILD-MACOS.md) - macOS desktop
- [Android Build Guide](./BUILD-ANDROID.md) - Android mobile
- [GitHub Actions Workflows](../.github/workflows/) - Automated builds

## 📞 Additional Help

### Common Solutions

1. **Clean Build**: `cargo clean` in `src-tauri/` directory
2. **Update Dependencies**: `sudo apt-get update && sudo apt-get upgrade`
3. **Reinstall Rust**: `rustup update`
4. **Check System Libraries**: `pkg-config --list-all | grep gtk`

### Support Resources

- [Tauri Documentation](https://tauri.app/)
- [Rust Installation Guide](https://rustup.rs/)
- [Linux Distribution Packages](https://pkgs.org/)

### Distribution-Specific Help

- **Ubuntu**: [Ubuntu Packages](https://packages.ubuntu.com/)
- **Fedora**: [Fedora Packages](https://packages.fedoraproject.org/)
- **Arch**: [Arch Packages](https://archlinux.org/packages/)

---

_This documentation corresponds to Apuntador v1.0 with Tauri 2.x_
