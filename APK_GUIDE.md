# 📱 Android APK Generation Guide

## 🚀 Quick Method (Recommended)

### 1. Prepare the project

```bash
npm run android:build
```

### 2. Open Android Studio

```bash
npm run android:apk
```

### 3. In Android Studio:

1. Wait for the project to load completely
2. Go to menu: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Wait for compilation to finish
4. Click "locate" when the notification appears

### 4. APK Location:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 📲 Install APK on your device

### Option A: Manual transfer

1. Copy `app-debug.apk` to your Android device
2. On device: Settings → Security → Allow unknown sources
3. Open the APK file and follow the instructions

### Option B: Direct installation (if you have ADB)

```bash
# Connect device via USB with debugging enabled
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## 🔐 Production APK (Release)

To generate an optimized APK for distribution:

### 1. Create keystore (only once)

In Android Studio: **Build → Generate Signed Bundle / APK → APK → Create new...**

### 2. Configure signing

- **Keystore path**: Save in secure location
- **Password**: Use secure password
- **Key alias**: `apuntador`
- **Validity**: 25 years

### 3. Generate signed APK

**Build → Generate Signed Bundle / APK → APK → Use existing → Release**

## 🛠️ Troubleshooting

### If you don't have Java installed:

1. Download Java JDK 17 from [Oracle](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)
2. Install and restart the system
3. Verify: `java -version`

### If Android Studio doesn't open:

1. Verify that Android Studio is installed
2. Install from [developer.android.com](https://developer.android.com/studio)

### If APK doesn't install:

1. Verify that "Unknown sources" is enabled
2. Check that the device has sufficient space
3. Try with a debug APK first

## 📁 Important files

- `android/app/build/outputs/apk/debug/app-debug.apk` - Development APK
- `android/app/build/outputs/apk/release/app-release.apk` - Production APK (if generated)
- Keystore file - Keep in secure location for future updates
