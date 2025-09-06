# 📱 Android Bundle Build Guide

This guide explains how to build Android App Bundles (AAB) for Google Play Store distribution.

## 🎯 What is an Android App Bundle?

Android App Bundle (AAB) is the recommended publishing format for Android apps. It offers several advantages over APK:

- **Smaller downloads**: Google Play generates optimized APKs for each device
- **Dynamic delivery**: Users only download the features they need
- **Better compression**: Reduces app size by up to 15%
- **Required for new apps**: Google Play requires AAB for apps targeting Android 12+

## 🚀 Quick Start

### Option 1: GitHub Actions (Recommended)

1. **Trigger the workflow**:
   - Go to Actions tab in your repository
   - Select "Build Android Bundle (AAB)"
   - Click "Run workflow"
   - Enter release tag (e.g., `0.1.6`)
   - Choose build type (`release` or `debug`)

2. **Download the bundle**:
   - Once completed, download the artifact
   - Upload the `.aab` file to Google Play Console

### Option 2: Local Scripts

#### Windows (PowerShell)

```powershell
# Build release bundle
.\scripts\build-bundle.ps1 release 0.1.6

# Build debug bundle
.\scripts\build-bundle.ps1 debug
```

#### Linux/macOS (Bash)

```bash
# Make script executable
chmod +x scripts/build-bundle.sh

# Build release bundle
./scripts/build-bundle.sh release 0.1.6

# Build debug bundle
./scripts/build-bundle.sh debug
```

## 🔐 Keystore Setup

Before building release bundles, you need to set up your keystore:

### Using Setup Script (Windows)

```powershell
.\scripts\setup-keystore.ps1
```

### Manual Setup

1. **Generate keystore**:

```bash
keytool -genkeypair -v -keystore android/app/apuntador-release-key.keystore -alias apuntador -keyalg RSA -keysize 2048 -validity 10000
```

2. **Create key.properties**:

```properties
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=apuntador
storeFile=apuntador-release-key.keystore
```

3. **Set environment variables**:

```bash
export ANDROID_KEYSTORE_PASSWORD="your_store_password"
export ANDROID_KEY_PASSWORD="your_key_password"
export ANDROID_KEY_ALIAS="apuntador"
export ANDROID_KEYSTORE_FILE="apuntador-release-key.keystore"
```

## 📋 Prerequisites

### Software Requirements

- **Node.js 20+**: JavaScript runtime
- **Java JDK 17+**: Required for Android builds
- **Android SDK**: Android development tools
- **Capacitor CLI**: Cross-platform app framework

### GitHub Secrets (for CI/CD)

Set these secrets in your repository:

| Secret                      | Description                  |
| --------------------------- | ---------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | Base64 encoded keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password            |
| `ANDROID_KEY_PASSWORD`      | Key password                 |
| `ANDROID_KEY_ALIAS`         | Key alias                    |

### Encoding Keystore for GitHub

```bash
# Encode keystore to base64
base64 -i android/app/apuntador-release-key.keystore | pbcopy
```

## 🔧 Build Process

The build process consists of these steps:

1. **📦 Install Dependencies**: Install npm packages
2. **🏗️ Build Web**: Create production web build
3. **📱 Copy Assets**: Copy web files to Android project
4. **🔄 Sync Capacitor**: Update native plugins
5. **🔐 Setup Keystore**: Configure signing (release only)
6. **📱 Build Bundle**: Generate AAB file

## 📁 Output Files

### File Locations

- **Release Bundle**: `android/app/build/outputs/bundle/release/apuntador.aab`
- **Debug Bundle**: `android/app/build/outputs/bundle/debug/apuntador.aab`
- **Copied to Root**: `apuntador-[version]-[buildtype].aab`

### File Structure

```
project-root/
├── android/
│   └── app/
│       └── build/
│           └── outputs/
│               └── bundle/
│                   ├── release/
│                   │   └── apuntador.aab
│                   └── debug/
│                       └── apuntador.aab
├── scripts/
│   ├── build-bundle.ps1
│   ├── build-bundle.sh
│   └── setup-keystore.ps1
└── .github/
    └── workflows/
        └── build-android-bundle.yml
```

## 🚀 Uploading to Google Play

1. **Open Google Play Console**: Go to [play.google.com/console](https://play.google.com/console)
2. **Select Your App**: Choose your app from the dashboard
3. **Go to Release Management**: Navigate to "Release" > "Production"
4. **Create New Release**: Click "Create new release"
5. **Upload Bundle**: Upload your `.aab` file
6. **Complete Release Notes**: Add release information
7. **Review and Publish**: Submit for review

## 🐛 Troubleshooting

### Common Issues

#### "Keystore not found"

```bash
# Make sure keystore exists
ls -la android/app/*.keystore

# Check key.properties
cat android/key.properties
```

#### "Gradle build failed"

```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew bundleRelease
```

#### "Java version issues"

```bash
# Check Java version
java -version
javac -version

# Should be JDK 17+
```

#### "Android SDK not found"

```bash
# Set ANDROID_HOME
export ANDROID_HOME=/path/to/android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Build Logs

Check these files for detailed error information:

- `android/build/reports/problems/problems-report.html`
- Gradle console output
- GitHub Actions logs (for CI builds)

## 🔒 Security Best Practices

### Keystore Security

- ✅ **Backup your keystore**: Store in multiple secure locations
- ✅ **Use strong passwords**: Minimum 12 characters
- ✅ **Never commit**: Add to `.gitignore`
- ✅ **Rotate regularly**: Update keys periodically

### Environment Variables

- ✅ **Use encrypted storage**: GitHub Secrets, Azure Key Vault, etc.
- ✅ **Limit access**: Only necessary team members
- ✅ **Audit regularly**: Review who has access
- ✅ **Use different keys**: Separate keys for dev/staging/production

### Version Control

```gitignore
# Add to .gitignore
android/key.properties
android/app/*.keystore
*.jks
*.p12
```

## 📊 Bundle Analysis

### Checking Bundle Size

```bash
# Get bundle info
ls -lh apuntador-release.aab

# Analyze bundle contents (requires bundletool)
bundletool build-apks --bundle=apuntador-release.aab --output=apuntador.apks
bundletool get-size total --apks=apuntador.apks
```

### Performance Tips

- **Enable ProGuard**: Minify and obfuscate code
- **Optimize images**: Use WebP format
- **Remove unused resources**: Enable resource shrinking
- **Split by ABI**: Generate separate APKs for different architectures

## 🎯 Next Steps

1. **Test Bundle**: Install and test the generated bundle
2. **Upload to Play Console**: Submit for review
3. **Monitor Performance**: Use Google Play Console analytics
4. **Automate Releases**: Set up automated deployment
5. **Add Dynamic Features**: Implement on-demand delivery

---

**🎉 Happy Building!** Your app is ready for the Google Play Store!
