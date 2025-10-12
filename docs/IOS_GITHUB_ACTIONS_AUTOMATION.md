# iOS GitHub Actions Automation Guide

Complete guide to automate iOS App Store builds and TestFlight uploads using GitHub Actions.

## 🎯 Overview

Your GitHub Actions workflow can automatically:
- ✅ **Build iOS app** from any release/tag
- ✅ **Sign with certificates** (no manual Xcode needed)
- ✅ **Upload to TestFlight** automatically
- ✅ **Generate IPA files** as downloadable artifacts
- ✅ **Increment build numbers** automatically
- ✅ **Create release notes**

## 🔐 One-Time Setup: GitHub Secrets

### Step 1: Configure Secrets

Run the setup script to configure all required secrets:

```bash
# Setup all GitHub secrets for iOS automation
npm run ios:setup-github
# or
make ios-setup-github
```

### Step 2: Required Certificates & Profiles

You'll need these from Apple Developer Portal:

#### **A. iOS Distribution Certificate**
1. **Keychain Access** → **Certificate Assistant** → **Request a Certificate**
2. Upload CSR to **Apple Developer Portal** → **Certificates**
3. Download certificate and install in Keychain
4. **Export as P12** with password

#### **B. App Store Provisioning Profile**
1. **Apple Developer Portal** → **Profiles** → **+**
2. **Distribution** → **App Store**
3. Select your **App ID**: `io.apuntador.app`
4. Select your **Distribution Certificate**
5. **Generate** and **Download**

#### **C. App Store Connect API Key**
1. **App Store Connect** → **Users and Access** → **Keys**
2. **Generate API Key** with **App Manager** role
3. Download the **P8 file**
4. Note the **Key ID** and **Issuer ID**

### Step 3: GitHub Secrets List

After running the setup script, verify these secrets exist:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `IOS_CERTIFICATE_BASE64` | Distribution certificate (P12) as base64 | `MIIK...` |
| `IOS_CERTIFICATE_PASSWORD` | Password for P12 certificate | `mypassword123` |
| `IOS_PROVISIONING_PROFILE_BASE64` | App Store profile as base64 | `MIIK...` |
| `KEYCHAIN_PASSWORD` | Temporary keychain password | `build123!` |
| `IOS_TEAM_ID` | Apple Developer Team ID | `ABCD123456` |
| `APP_STORE_CONNECT_API_KEY_ID` | API Key ID (8 chars) | `ABCD1234` |
| `APP_STORE_CONNECT_API_ISSUER_ID` | API Issuer ID (UUID) | `12345678-1234-...` |
| `APP_STORE_CONNECT_API_KEY_BASE64` | P8 API key file as base64 | `LS0tLS1...` |

## 🚀 Using GitHub Actions

### Method 1: Quick Command (Recommended)

Deploy current version to TestFlight:

```bash
# Automatic build + upload to TestFlight
npm run ios:testflight
# or
make ios-testflight
```

This command:
- ✅ Uses current `package.json` version
- ✅ Auto-increments build number
- ✅ Builds and uploads to TestFlight
- ✅ Shows progress and links

### Method 2: Manual Workflow Trigger

1. **Go to GitHub** → **Actions** → **Build iOS App Store Package**
2. **Click "Run workflow"**
3. **Fill parameters**:
   - **Release tag**: `1.0.11` (current version)
   - **Version Code**: `36` (increment from last build)
   - **Upload to TestFlight**: `✅ true`
   - **Log Level**: `info`
4. **Click "Run workflow"**

### Method 3: Automatic on Tags

Push a git tag to trigger automatic build:

```bash
# Create and push tag
git tag v1.0.12
git push origin v1.0.12
```

## 📱 Build Process Flow

The GitHub Actions workflow performs these steps:

### 1. **Environment Setup**
- ✅ macOS runner with Xcode 15.4
- ✅ Node.js 20 installation  
- ✅ Capacitor CLI setup

### 2. **Source Preparation**
- ✅ Download release ZIP from GitHub
- ✅ Extract web build to `dist/`
- ✅ Update iOS version numbers

### 3. **iOS Project Setup**
- ✅ Import signing certificates
- ✅ Install provisioning profiles
- ✅ Copy web assets: `npx cap copy ios`
- ✅ Sync Capacitor: `npx cap sync ios`
- ✅ Install CocoaPods dependencies

### 4. **Build & Archive**
- ✅ Build iOS archive with Xcode
- ✅ Export IPA for App Store
- ✅ Apply code signing automatically

### 5. **Upload & Artifacts**
- ✅ Upload to TestFlight (if enabled)
- ✅ Create GitHub artifacts with IPA
- ✅ Generate release notes
- ✅ Clean up temporary files

## 📊 Monitoring & Results

### GitHub Actions Dashboard
```
https://github.com/YOUR_USERNAME/apuntador/actions
```

### Build Artifacts
- **IPA File**: `Apuntador-1.0.11-36.ipa`
- **Release Notes**: `iOS-Release-Notes-1.0.11.md`
- **Build Logs**: Complete Xcode build output

### TestFlight Status
- **Processing Time**: 5-15 minutes after upload
- **App Store Connect**: Check build processing status
- **TestFlight App**: Available for internal testing

## 🎯 Build Status Examples

### ✅ Successful Build
```
🎉 iOS build completed successfully!

📱 Generated Files:
  - IPA: Apuntador-1.0.11-36.ipa
  - Archive: App.xcarchive
  - Release Notes: ios-release-notes.md

📋 Next Steps:
  - ✅ Uploaded to TestFlight automatically
  - 🔍 Check App Store Connect for processing status
  - 📝 Complete app metadata in App Store Connect
  - 🚀 Submit for App Store review
```

### ❌ Common Issues & Solutions

#### **Certificate Issues**
```bash
# Verify secrets are set correctly
gh secret list

# Re-export certificate with correct password
# Re-run setup script
npm run ios:setup-github
```

#### **Provisioning Profile Issues**
```bash
# Ensure provisioning profile matches:
# - Bundle ID: io.apuntador.app
# - Certificate: Your distribution certificate
# - Type: App Store Distribution
```

#### **Build Number Issues**
```bash
# Increment build number manually
# Check last successful build in GitHub Actions
```

## 🔧 Advanced Configuration

### Custom Build Parameters

Modify `.github/workflows/build-ios-appstore.yml` for:

- **Different Xcode versions**
- **Custom build settings**
- **Additional test steps** 
- **Slack/Discord notifications**

### Version Management

The workflow supports:
- ✅ **Semantic versioning** from `package.json`
- ✅ **Auto-incrementing** build numbers
- ✅ **Tag-based triggers**
- ✅ **Manual version overrides**

## 🚀 Complete Workflow Example

```bash
# 1. One-time setup (if not done)
npm run ios:setup-github

# 2. Verify Bundle ID is correct
make ios-verify-bundle

# 3. Deploy to TestFlight
npm run ios:testflight

# 4. Monitor progress
open "https://github.com/YOUR_USERNAME/apuntador/actions"

# 5. Check TestFlight
open "https://appstoreconnect.apple.com"
```

## 📋 Checklist

### Before First Use
- [ ] ✅ Apple Developer Program membership active
- [ ] ✅ App ID created: `io.apuntador.app`
- [ ] ✅ Distribution certificate generated
- [ ] ✅ App Store provisioning profile created  
- [ ] ✅ App Store Connect API key created
- [ ] ✅ All GitHub secrets configured
- [ ] ✅ App created in App Store Connect

### For Each Release
- [ ] ✅ Version updated in `package.json`
- [ ] ✅ Code pushed to GitHub
- [ ] ✅ Run `npm run ios:testflight`
- [ ] ✅ Monitor GitHub Actions
- [ ] ✅ Check TestFlight processing
- [ ] ✅ Test build in TestFlight
- [ ] ✅ Submit for App Store review

## 🔗 Links

- **GitHub Actions**: https://github.com/YOUR_USERNAME/apuntador/actions
- **App Store Connect**: https://appstoreconnect.apple.com
- **Apple Developer Portal**: https://developer.apple.com/account
- **TestFlight**: https://testflight.apple.com

---

**🎉 With this setup, your iOS deployments are fully automated!** No more manual Xcode builds or TestFlight uploads.