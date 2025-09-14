# 📱 Android Build Guide - Apuntador

This guide provides detailed instructions for building **Apuntador** as an Android application using Capacitor.

## 📋 Prerequisites

### 1. Required Tools

```bash
# Node.js (v18 or higher)
node --version

# Java Development Kit (JDK 8 or 11)
java -version
javac -version

# Android Studio or Android SDK Tools
# Download from: https://developer.android.com/studio
```

### 2. Android SDK Setup

```bash
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Android/Sdk  # macOS/Linux
# Windows: set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk

# Add to PATH
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

### 3. Android SDK Components

Using Android Studio SDK Manager, install:

- **Android SDK Platform 24+** (Android 7.0+)
- **Android SDK Build-Tools** (latest)
- **Android SDK Platform-Tools** (latest)
- **Android Emulator** (for testing)

### 4. Verify Prerequisites

```bash
# Verify Node.js
node --version

# Verify Java
java -version

# Verify Android SDK
adb version

# Verify ANDROID_HOME
echo $ANDROID_HOME  # Should show SDK path
```

## 🚀 Quick Build

### Build Custom APK

```bash
# Build custom-named APK in one command
make android-build-apk

# This creates: apuntador.apk (ready for installation)
```

The quick build process:

1. Builds web assets (`npm run build`)
2. Syncs to Android project (`npx cap sync android`)
3. Builds release APK via Gradle
4. Copies and renames to `apuntador.apk`

## 📦 Build Options

### Debug Build (Fast)

```bash
# Debug APK for development/testing
make android-build-debug

# Or manually:
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

### Release Build (Optimized)

```bash
# Release APK for distribution
make android-build-release

# Or manually:
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
```

### Android App Bundle (Play Store)

```bash
# AAB for Google Play Store
make android-build-bundle

# Or manually:
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
```

## 🛠️ Manual Build Process

### First-Time Setup

```bash
# Add Android platform (first time only)
npx cap add android

# Install dependencies
npm install
```

### Standard Build Process

```bash
# 1. Build web assets
npm run build

# 2. Sync web assets to Android
npx cap sync android

# 3. Open in Android Studio (optional)
npx cap open android

# 4. Build via Gradle (command line)
cd android
./gradlew assembleRelease  # Release APK
./gradlew assembleDebug    # Debug APK
./gradlew bundleRelease    # App Bundle
```

## 📁 Generated Files

### Output Structure

```
android/app/build/outputs/
├── apk/
│   ├── debug/
│   │   └── app-debug.apk           # Debug APK
│   └── release/
│       ├── app-release.apk         # Release APK
│       └── app-release-unsigned.apk
└── bundle/
    └── release/
        └── app-release.aab         # App Bundle
```

### Custom Output

```
# After running make android-build-apk
apuntador.apk                       # Ready-to-install APK
```

### File Types

| File              | Description   | Use Case            | Size |
| ----------------- | ------------- | ------------------- | ---- |
| `app-debug.apk`   | Debug build   | Development/testing | ~8MB |
| `app-release.apk` | Release build | Direct distribution | ~6MB |
| `app-release.aab` | App Bundle    | Google Play Store   | ~4MB |
| `apuntador.apk`   | Custom named  | Easy distribution   | ~6MB |

## 📱 Installation & Testing

### Install on Device

```bash
# Install APK on connected device
adb install apuntador.apk

# Install debug APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Force reinstall (if already installed)
adb install -r apuntador.apk
```

### Install via File Transfer

1. Copy `apuntador.apk` to device storage
2. Enable "Install from unknown sources" in device settings
3. Open file manager and tap the APK file
4. Follow installation prompts

### Testing on Emulator

```bash
# List available emulators
emulator -list-avds

# Start emulator
emulator -avd <emulator_name>

# Install on emulator
adb install apuntador.apk
```

## ⏱️ Build Times

| Build Type  | Estimated Time | Use Case     |
| ----------- | -------------- | ------------ |
| Debug APK   | 2-4 minutes    | Development  |
| Release APK | 4-8 minutes    | Distribution |
| App Bundle  | 4-8 minutes    | Play Store   |
| Clean build | 6-12 minutes   | First build  |

_Times vary based on hardware and whether Gradle cache exists_

## 🐛 Troubleshooting

### Error: "ANDROID_HOME not set"

```bash
# macOS/Linux
export ANDROID_HOME=$HOME/Android/Sdk
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc

# Windows
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
# Add to system environment variables permanently
```

### Error: "Java version incompatible"

```bash
# Check Java version
java -version

# Use JDK 8 or 11 (not newer versions)
# Install appropriate JDK version

# Set JAVA_HOME if needed
export JAVA_HOME=/path/to/jdk
```

### Error: "Android SDK not found"

```bash
# Install Android SDK via Android Studio
# Or using command line tools

# Verify SDK location
ls $ANDROID_HOME/platforms  # Should show installed platforms
```

### Error: "Gradle build failed"

```bash
# Clean Gradle cache
cd android
./gradlew clean

# Stop Gradle daemon
./gradlew --stop

# Try build again
./gradlew assembleRelease
```

### Error: "Platform android not found"

```bash
# Add Android platform
npx cap add android

# Or reinstall
npx cap platform remove android
npx cap add android
```

### Error: "Build tools version"

```bash
# Update build tools in android/app/build.gradle
android {
    compileSdkVersion 34
    buildToolsVersion "34.0.0"
    // ...
}
```

## 🔧 Development Workflow

### Recommended Development Process

1. **Web Development First**

   ```bash
   npm run dev
   # Test in browser for rapid iteration
   ```

2. **Android Testing**

   ```bash
   make android-build-debug
   adb install apuntador.apk
   # Test on device/emulator
   ```

3. **Production Build**
   ```bash
   make android-build-apk
   # Final APK for distribution
   ```

### Live Reload Development

```bash
# Start development server
npm run dev

# In another terminal, run on device with live reload
npx cap run android --livereload --external

# Or using Android Studio
npx cap open android
# Then run from Android Studio with live reload
```

## 🔍 Build Verification

### Test Installation

```bash
# Install and verify
adb install apuntador.apk
adb shell pm list packages | grep com.apuntador

# Launch app
adb shell am start -n com.apuntador.app/.MainActivity

# Check logs
adb logcat | grep -i apuntador
```

### Verify APK

```bash
# Check APK information
aapt dump badging apuntador.apk

# List APK contents
unzip -l apuntador.apk

# Verify signing (for release builds)
jarsigner -verify -verbose -certs apuntador.apk
```

## 📋 Makefile Targets

```bash
# Available Android build targets
make android-build-apk       # Custom named APK (apuntador.apk)
make android-build-debug     # Debug APK
make android-build-release   # Release APK
make android-build-bundle    # App Bundle (AAB)
make android-clean           # Clean Android build
make android-install         # Build and install debug APK
```

## 🚨 Important Notes

### Android Permissions

The app requests these permissions (defined in `android/app/src/main/AndroidManifest.xml`):

- **INTERNET** - For web content loading
- **WRITE_EXTERNAL_STORAGE** - For file operations
- **READ_EXTERNAL_STORAGE** - For file access

### App Signing

For **Google Play Store** distribution:

1. Generate signing key: `keytool -genkey -v -keystore my-release-key.jks`
2. Configure signing in `android/app/build.gradle`
3. Build signed APK/AAB

### System Requirements

- **Android Version**: 7.0+ (API level 24+)
- **Architecture**: ARM64, ARM, x86_64
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 50MB for installation

### Performance Tips

- Use **release builds** for performance testing
- Enable **R8/ProGuard** for smaller APK size
- Test on **various screen sizes** and Android versions
- Use **Android Profiler** for performance analysis

## 🏪 Distribution

### Direct Distribution

1. Share `apuntador.apk` file directly
2. Users enable "Unknown sources" installation
3. Install via file manager or ADB

### Google Play Store

1. Build App Bundle (`.aab` file)
2. Create Google Play Console account
3. Upload AAB through Play Console
4. Complete store listing and publish

### Alternative Stores

- **F-Droid** - Open source app store
- **Amazon Appstore** - Amazon devices
- **Samsung Galaxy Store** - Samsung devices

## 🔗 Related Documentation

- [Main Build Guide](./BUILD.md) - All platforms
- [Windows Build Guide](./BUILD-WINDOWS.md) - Windows desktop
- [macOS Build Guide](./BUILD-MACOS.md) - macOS desktop
- [Capacitor Documentation](https://capacitorjs.com/docs)

## 📞 Additional Help

### Common Solutions

1. **Clean Build**: `npx cap clean android && make android-clean`
2. **Update Dependencies**: `npm install && npx cap sync android`
3. **Reset Android Project**: Remove and re-add Android platform
4. **Check Device Connection**: `adb devices`

### Support Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Gradle Build Tool](https://gradle.org/guides/)

---

_This documentation corresponds to Apuntador v1.0 with Capacitor 6.x_
