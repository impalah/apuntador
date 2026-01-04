# Build Scripts

This directory contains scripts for building Android App Bundles (AAB) locally.

## [FILES] Scripts Overview

| Script               | Platform           | Purpose                        |
| -------------------- | ------------------ | ------------------------------ |
| `build-bundle.ps1`   | Windows PowerShell | Build Android App Bundle       |
| `build-bundle.sh`    | Linux/macOS Bash   | Build Android App Bundle       |
| `setup-keystore.ps1` | Windows PowerShell | Configure Android keystore     |
| `setup-keystore.sh`  | Linux/macOS Bash   | Configure Android keystore     |
| `sync-version.ps1`   | Windows PowerShell | Sync version from package.json |
| `sync-version.sh`    | Linux/macOS Bash   | Sync version from package.json |

## Quick Start

### Windows (PowerShell)

```powershell
# Show help
.\scripts\build-bundle.ps1 -Help

# Sync version from package.json to Android
.\scripts\sync-version.ps1

# Build release bundle
.\scripts\build-bundle.ps1 release 0.1.11

# Build debug bundle
.\scripts\build-bundle.ps1 debug

# Setup keystore (first time only)
.\scripts\setup-keystore.ps1
```

### Linux/macOS (Bash)

```bash
# Make executable (first time only)
chmod +x scripts/*.sh

# Show help
./scripts/build-bundle.sh --help

# Sync version from package.json to Android
./scripts/sync-version.sh

# Build release bundle
./scripts/build-bundle.sh release 0.1.11

# Build debug bundle
./scripts/build-bundle.sh debug

# Setup keystore (first time only)
./scripts/setup-keystore.sh

# Set environment variables (after keystore setup)
source scripts/set-android-env.sh
```

## Prerequisites

Before running these scripts, make sure you have:

- **Node.js 20+** installed
- **Java JDK 17+** installed
- **Android SDK** configured
- **Capacitor CLI** installed (`npm install -g @capacitor/cli`)
- **Keystore configured** (for release builds)
- **jq** (for Linux/macOS version sync script): `brew install jq` or `sudo apt install jq`

## Version Synchronization

Keep your package.json and Android versions in sync:

### Windows

```powershell
.\scripts\sync-version.ps1
```

### Linux/macOS

```bash
./scripts/sync-version.sh
```

This automatically updates `android/app/build.gradle` with the version from `package.json`.

## Keystore Setup

For release builds, you need a keystore file. Use the setup script:

### Windows

```powershell
.\scripts\setup-keystore.ps1
```

### Linux/macOS

```bash
./scripts/setup-keystore.sh
```

This will:

1. Generate a new keystore file
2. Create `android/key.properties`
3. Set environment variables

## 📁 Output

Built bundles will be placed in:

- `android/app/build/outputs/bundle/release/apuntador.aab` (release)
- `android/app/build/outputs/bundle/debug/apuntador.aab` (debug)
- Root directory: `apuntador-[version]-[buildtype].aab`

## Troubleshooting

### Common Issues

1. **"Keystore not found"**
   - Run `.\scripts\setup-keystore.ps1` first
   - Check if `android/key.properties` exists

2. **"Java version error"**
   - Ensure JDK 17+ is installed and in PATH
   - Check with `java -version`

3. **"Android SDK not found"**
   - Set `ANDROID_HOME` environment variable
   - Add SDK tools to PATH

4. **"Gradle build failed"**
   - Clean build: `cd android && .\gradlew clean`
   - Check error messages in console

## Related Documentation

- [Android Bundle Guide](../docs/ANDROID_BUNDLE_GUIDE.md) - Complete guide
- [GitHub Actions Workflow](../.github/workflows/build-android-bundle.yml) - CI/CD automation

---

**Ready to build your Android App Bundle for Google Play Store!**
