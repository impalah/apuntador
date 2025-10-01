# Google Play Store Release Guide

This guide explains how to build optimized Android App Bundles (AAB) for Google Play Store with R8 code optimization and deobfuscation files.

## ⚡ Quick Start

```bash
# Build optimized bundle for Play Store
npm run android:bundle:release
```

This creates:
- `android-release/apuntador-release.aab` - Upload to Play Console
- `android-release/mapping.txt` - Upload as deobfuscation file

## 🔍 What is R8 Optimization?

**R8** is Android's code shrinker and obfuscator that:

- **Reduces app size** by removing unused code and resources
- **Obfuscates code** by renaming classes/methods to short names (a, b, c...)
- **Optimizes performance** through advanced compiler optimizations
- **Improves security** by making reverse engineering harder

## 📋 Google Play Console Upload Process

### 1. Upload the App Bundle

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app → **Production** → **Create new release**
3. Upload `android-release/apuntador-release.aab`

### 2. Upload Deobfuscation File

1. In the same release, scroll to **Deobfuscation files**
2. Upload `android-release/mapping.txt`
3. This allows Google Play to show readable crash reports

### 3. Why Upload the Mapping File?

Without the mapping file:
```
❌ Crash at: a.b.c.d(Unknown Source:15)
```

With the mapping file:
```
✅ Crash at: TeleprompterStore.play(TeleprompterStore.java:245)
```

## 🔧 Build Configuration

### R8 Optimization Settings

The build uses these optimizations:

```gradle
buildTypes {
    release {
        minifyEnabled true           // Enable R8 code shrinking
        shrinkResources true         // Remove unused resources
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### ProGuard Rules for Capacitor

Our configuration includes special rules for Capacitor apps:

```proguard
# Keep Capacitor core classes
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }

# Keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep app-specific classes
-keep class io.apuntador.app.** { *; }
```

## 📊 Size Comparison

| Build Type | Size | Optimization |
|------------|------|-------------|
| Debug APK | ~8-12 MB | None |
| Release APK (no R8) | ~6-8 MB | Basic |
| **Release AAB (R8)** | **~4-5 MB** | **Full** |

## 🐛 Debugging Obfuscated Builds

### Testing Locally

```bash
# Build and test optimized version
npm run android:bundle:release
npx cap copy android
npx cap run android --configuration release
```

### Common Issues

**WebView JavaScript errors:**
- Ensure JavaScript interface methods are kept in ProGuard rules
- Test all app functionality in release mode

**Missing classes:**
- Add specific `-keep` rules for any classes accessed via reflection
- Check ProGuard warnings during build

**Performance issues:**
- R8 optimization might change execution order
- Test scrolling performance in release builds

## 🔄 Build Script Details

The `build-release-bundle.ps1` script:

1. **Builds web assets** with Vite production optimization
2. **Syncs with Capacitor** to copy web assets to Android
3. **Runs Gradle** with `bundleRelease` task
4. **Applies R8 optimization** and generates mapping files
5. **Copies outputs** to `android-release/` for easy access

## 📁 Output Files

After successful build:

```
android-release/
├── apuntador-release.aab    # Upload to Play Console
└── mapping.txt              # Upload as deobfuscation file
```

### File Details

**apuntador-release.aab:**
- Android App Bundle format (preferred over APK)
- Contains optimized code and resources
- Google Play generates APKs for specific devices

**mapping.txt:**
- Maps obfuscated names back to original names
- Required for meaningful crash reports
- Should be kept secure (contains internal structure info)

## 🔐 Security Considerations

**Mapping File Security:**
- Contains your app's internal structure
- Store securely (don't commit to public repos)
- Only share with Google Play Console

**Code Obfuscation:**
- Makes reverse engineering harder
- Not foolproof security - use for deterrence only
- Critical business logic should use additional protection

## 🚨 Troubleshooting

### Build Fails with R8 Errors

```bash
# Check ProGuard warnings
cd android
./gradlew bundleRelease --info
```

### App Crashes in Release Mode

1. **Check ProGuard rules** - ensure all used classes are kept
2. **Test in release mode** before uploading
3. **Use mapping file** to decode crash reports

### Mapping File Not Generated

- Ensure `minifyEnabled true` in `build.gradle`
- Check build logs for ProGuard errors
- Verify ProGuard rules syntax

## 📚 Additional Resources

- [Android R8 Documentation](https://developer.android.com/studio/build/shrink-code)
- [Google Play Console Guide](https://developer.android.com/guide/app-bundle)
- [ProGuard Manual](https://www.guardsquare.com/proguard/manual)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)

## 🎯 Best Practices

1. **Always test release builds** locally before uploading
2. **Keep mapping files** for each release version
3. **Monitor crash reports** in Play Console
4. **Update ProGuard rules** when adding new dependencies
5. **Use semantic versioning** for releases