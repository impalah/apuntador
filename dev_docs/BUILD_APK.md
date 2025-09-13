# Android APK Generation Guide

## Generate Release APK

### Step 1: Create Keystore (only needed once)

```bash
# Navigate to Android project
cd android

# Generate keystore
keytool -genkey -v -keystore apuntador-release-key.keystore -alias apuntador -keyalg RSA -keysize 2048 -validity 10000
```

### Step 2: Configure signing

Create `android/key.properties` with:

```
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=apuntador
storeFile=apuntador-release-key.keystore
```

### Step 3: Build Release APK

```bash
# From project root
npm run android:build

# Navigate to Android project
cd android

# Generate release APK
./gradlew assembleRelease
```

### Step 4: Find your APK

The APK will be generated at:
`android/app/build/outputs/apk/release/app-release.apk`

## Alternative: Debug APK (easier, but not optimized)

```bash
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

## Install APK on device

```bash
adb install app-release.apk
```

Or transfer the APK file to your device and install manually.
