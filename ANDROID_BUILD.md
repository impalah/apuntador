# Android APK Build Guide

## Generating APK with Custom Name

This project is configured to generate Android APK files with the custom name `apuntador.apk` instead of the default `app-release.apk`.

## Quick Start

### Method 1: npm script (Recommended)

**Windows:**

```bash
npm run android:apk:build
```

**Linux/macOS:**

```bash
npm run android:apk:build:linux
```

### Method 2: Makefile (Cross-platform)

```bash
make android-apk
```

_Automatically detects OS and uses the appropriate script_

### Method 3: Manual Scripts

**Windows (PowerShell):**

```bash
.\build-android-apk.ps1
```

**Linux/macOS (Bash):**

```bash
./build-android-apk.sh
```

## Available Commands

### Package.json Scripts

```bash
# Build web app and sync with Android
npm run android:build

# Open Android Studio for development
npm run android:dev

# Run app on connected device/emulator
npm run android:run

# Generate release APK with Gradle only
npm run android:release

# Build APK with custom name and copy to root (Windows)
npm run android:apk:build

# Build APK with custom name and copy to root (Linux/macOS)
npm run android:apk:build:linux
```

### Makefile Targets

```bash
# Setup Android platform
make android-setup

# Build and sync Android project
make android-build

# Generate signed release APK
make android-release

# Build APK with custom name (uses PowerShell script)
make android-apk

# Build debug APK
make android-debug

# Clean Android build
make android-clean
```

## Cross-Platform Support

### Platform-Specific Scripts

The project includes build scripts for both Windows and Linux/macOS:

#### Windows (PowerShell)

- **File**: `build-android-apk.ps1`
- **Usage**: `npm run android:apk:build`
- **Features**:
  - Color output
  - Error handling
  - File size reporting
  - Automatic APK copying

#### Linux/macOS (Bash)

- **File**: `build-android-apk.sh`
- **Usage**: `npm run android:apk:build:linux`
- **Features**:
  - ANSI color codes
  - Permission checking
  - Executable validation
  - Cross-platform file operations

#### Auto-Detection (Makefile)

- **Usage**: `make android-apk`
- **Behavior**: Automatically detects Windows vs Unix and runs the appropriate script

### Prerequisites by Platform

#### Windows

- PowerShell 5.1+ (included in Windows 10+)
- Node.js 20+
- Android Studio or Android SDK
- Java 17 JDK

#### Linux/Ubuntu

```bash
# Install required packages
sudo apt update
sudo apt install nodejs npm openjdk-17-jdk

# Install Android SDK (option 1: Android Studio)
# Download from: https://developer.android.com/studio

# Or install SDK tools only (option 2)
sudo apt install android-sdk
```

#### macOS

```bash
# Install via Homebrew
brew install node openjdk@17 android-studio

# Or install SDK tools only
brew install --cask android-commandlinetools
```

## Configuration Details

### 1. Custom APK Name in build.gradle

The APK name is configured in `android/app/build.gradle`:

```gradle
applicationVariants.all { variant ->
    variant.outputs.all {
        def outputName = "apuntador.apk"
        outputFileName = outputName
    }
}
```

### 2. PowerShell Build Script

The `build-android-apk.ps1` script:

- Builds the web application
- Syncs with Android platform
- Builds the release APK
- Copies the APK to the root directory
- Shows file size and location

### 3. Output Locations

After building, you'll find the APK in two locations:

1. **Root directory** (for easy access):

   ```
   apuntador.apk
   ```

2. **Android build output** (original location):
   ```
   android/app/build/outputs/apk/release/apuntador.apk
   ```

## Build Requirements

### Prerequisites

- Node.js 20+
- Java 17 (JDK)
- Android SDK
- Gradle (included with Android Studio)

### Android Setup

```bash
# First time setup
make android-setup

# Or manually
npx cap add android
npx cap copy android
npx cap sync android
```

## Signing Configuration

For release builds, ensure you have a keystore configured:

1. Create `android/key.properties`:

   ```properties
   storeFile=path/to/your/keystore.jks
   storePassword=your_store_password
   keyAlias=your_key_alias
   keyPassword=your_key_password
   ```

2. The build.gradle is already configured to use these properties for signing.

## Troubleshooting

### Common Issues

1. **Gradle not found**
   - Install Android Studio
   - Or install Gradle manually

2. **Java version issues**
   - Ensure Java 17 is installed
   - Set JAVA_HOME environment variable

3. **Android SDK not found**
   - Install Android Studio
   - Or set ANDROID_HOME environment variable

4. **PowerShell execution policy**
   - The script uses `-ExecutionPolicy Bypass`
   - If issues persist, run: `Set-ExecutionPolicy RemoteSigned`

### Build Verification

After building, verify the APK:

```bash
# Check file exists and size
Get-Item apuntador.apk

# Or use aapt to inspect APK (if Android tools are in PATH)
aapt dump badging apuntador.apk
```

## File Size Optimization

Current APK size: ~6.3 MB

To reduce size:

1. Use dynamic imports for large libraries
2. Configure `build.rollupOptions.output.manualChunks`
3. Enable ProGuard/R8 (set `minifyEnabled true` in build.gradle)
4. Use vector drawables instead of PNGs

## CI/CD Integration

For automated builds, the scripts work in CI environments:

```yaml
# GitHub Actions example
- name: Build Android APK
  run: npm run android:apk:build

- name: Upload APK
  uses: actions/upload-artifact@v3
  with:
    name: apuntador-apk
    path: apuntador.apk
```
