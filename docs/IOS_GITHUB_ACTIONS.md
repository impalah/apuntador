# iOS GitHub Actions Setup Guide

This guide explains how to configure GitHub Actions to automatically build and upload iOS apps to the App Store.

## Overview

The iOS workflow (`build-ios-appstore.yml`) can:
- ✅ Build iOS archive automatically
- ✅ Export App Store-ready IPA
- ✅ Upload to TestFlight (optional)
- ✅ Create signed packages without manual Xcode steps

## Prerequisites

### 1. Apple Developer Account
- **Apple Developer Program** membership ($99/year)
- **App Store Connect** access
- **Certificates & Profiles** management rights

### 2. Required Certificates & Profiles
You need these from Apple Developer Portal:

#### Distribution Certificate
1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. **Certificates** → **+** → **Apple Distribution**
3. Download certificate (.cer) and private key (.p12)

#### App Store Provisioning Profile  
1. **Profiles** → **+** → **App Store**
2. Select your app ID: `io.apuntador.app`
3. Select your Distribution Certificate
4. Download profile (.mobileprovision)

### 3. App Store Connect API Key (Optional - for TestFlight)
1. [App Store Connect](https://appstoreconnect.apple.com/)
2. **Users and Access** → **Keys** → **+**
3. **Name**: "GitHub Actions iOS"
4. **Access**: Developer
5. Download key (.p8 file)

---

## GitHub Secrets Configuration

Add these secrets in your repository: **Settings** → **Secrets and variables** → **Actions**

### Required Secrets

#### `IOS_CERTIFICATE_BASE64`
```bash
# Convert your distribution certificate to base64
base64 -i AppleDistribution.p12 | pbcopy
```

#### `IOS_CERTIFICATE_PASSWORD`
```
# Password used when exporting the .p12 certificate
YourCertificatePassword123
```

#### `IOS_PROVISIONING_PROFILE_BASE64`
```bash
# Convert your provisioning profile to base64
base64 -i AppStore_io.apuntador.app.mobileprovision | pbcopy
```

#### `IOS_TEAM_ID`
```
# Your Apple Developer Team ID (10 characters)
ABCD123456
```

#### `KEYCHAIN_PASSWORD`
```
# Any secure password for temporary keychain
SecureKeychainPass123
```

### Optional Secrets (TestFlight Upload)

#### `APP_STORE_CONNECT_API_KEY_ID`
```
# Key ID from App Store Connect (10 characters)  
ABC123DEFG
```

#### `APP_STORE_CONNECT_API_ISSUER_ID`
```
# Issuer ID from App Store Connect (UUID format)
12345678-1234-1234-1234-123456789abc
```

#### `APP_STORE_CONNECT_API_KEY_BASE64`
```bash
# Convert your API key to base64
base64 -i AuthKey_ABC123DEFG.p8 | pbcopy
```

---

## Step-by-Step Setup

### Step 1: Create Distribution Certificate

1. **Mac Keychain**: Open **Keychain Access**
2. **Request Certificate**: Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority
3. **Fill details**: Your email, Common Name, Save to disk
4. **Apple Portal**: Upload CSR → Download certificate
5. **Install**: Double-click to install in Keychain
6. **Export**: Right-click certificate → Export → .p12 format

### Step 2: Create Provisioning Profile

1. **Apple Portal**: Certificates, Identifiers & Profiles
2. **App ID**: Ensure `io.apuntador.app` exists
3. **Profile**: Create App Store Distribution profile
4. **Select**: Your app ID and distribution certificate
5. **Download**: Save .mobileprovision file

### Step 3: Convert to Base64

```bash
# Certificate
base64 -i YourCertificate.p12 | pbcopy

# Provisioning Profile  
base64 -i YourProfile.mobileprovision | pbcopy

# API Key (if using TestFlight)
base64 -i AuthKey_XXXXXXXXXX.p8 | pbcopy
```

### Step 4: Add GitHub Secrets

1. **Repository**: GitHub → Settings → Secrets and variables → Actions
2. **Add secrets**: Paste base64 values from Step 3
3. **Verify**: All required secrets are added

---

## Usage

### Trigger Workflow

1. **GitHub**: Actions → "Build iOS App Store Package"
2. **Run workflow**: Fill in parameters:
   - **release_tag**: e.g., `1.0.9`
   - **versionCode**: e.g., `34` (increment each time)
   - **upload_to_testflight**: `true` or `false`

### Workflow Outputs

#### With TestFlight Upload (`true`)
- ✅ **Automatic upload** to TestFlight
- 📧 **Email notification** when ready for testing
- 🔍 **App Store Connect** shows processing status

#### Without TestFlight Upload (`false`)  
- 📥 **Download IPA** from GitHub Actions artifacts
- 📱 **Manual upload** via Xcode Organizer or Transporter

---

## Local Testing Commands

Test the build process locally first:

```bash
# Build and prepare
npm run ios:appstore

# In Xcode, verify signing works:
# 1. Product → Archive  
# 2. Distribute App → App Store Connect
```

---

## Troubleshooting

### "No signing certificate found"
**Issue**: Certificate not properly installed
**Solution**: 
1. Verify certificate is valid and not expired
2. Check Team ID matches your Apple Developer account
3. Ensure private key is included in .p12 export

### "No matching provisioning profile found"  
**Issue**: Profile doesn't match bundle ID or certificate
**Solution**:
1. Verify bundle ID: `io.apuntador.app`
2. Ensure profile includes your distribution certificate
3. Check profile is for App Store distribution

### "API authentication failed"
**Issue**: App Store Connect API key invalid
**Solution**:
1. Verify Key ID, Issuer ID, and API key file
2. Ensure API key has Developer access
3. Check key hasn't been revoked

### "Upload failed"
**Issue**: IPA validation failed
**Solution**:
1. Check minimum iOS version compatibility
2. Verify all required icons are included
3. Ensure app follows App Store guidelines

---

## Workflow Comparison

| Method | Build Time | Setup Complexity | Automation |
|--------|------------|------------------|------------|
| **Local Xcode** | ~5-10 min | Low | Manual |
| **GitHub Actions** | ~15-25 min | Medium | Full Auto |

### When to Use Each

**Local Xcode** (Manual):
- ✅ Quick testing builds
- ✅ First-time setup/testing  
- ✅ Debugging signing issues

**GitHub Actions** (Automated):
- ✅ Release builds
- ✅ Team collaboration
- ✅ Consistent environment
- ✅ Automated TestFlight uploads

---

## Security Notes

- **Secrets are encrypted** in GitHub
- **Temporary keychain** is deleted after build
- **Certificates expire** - update annually
- **API keys** can be revoked anytime

---

## Cost Considerations

- **GitHub Actions**: Free tier includes macOS minutes
- **Paid plans**: Additional macOS minutes if needed
- **Apple Developer**: $99/year (required regardless)

**Estimated monthly usage**: ~50-100 minutes for regular releases.

---

## Next Steps

1. ✅ **Setup secrets** following this guide
2. 🧪 **Test workflow** with a development build  
3. 🚀 **Automate releases** for production builds
4. 📊 **Monitor usage** in GitHub Actions tab

This setup eliminates the need for manual Xcode operations while maintaining the same signing security and App Store compatibility.