# iOS Quick Start Guide

🚀 Get Apuntador running on iOS in 5 simple steps.

## ✅ Safe Area Issues Fixed

**Editor toolbar spacing has been fixed for iOS and Android:**
- Added `padding-top: max(44px, env(safe-area-inset-top, 0px))` to prevent toolbar overlap
- Toolbar now properly respects status bar and notch areas
- Applied to both mobile and web versions for consistency

## Prerequisites

- ✅ Apple Developer Program membership ($99/year)
- ✅ macOS with Xcode 15+ installed  
- ✅ Node.js 20+ and npm
- ✅ Git repository access

## Step 1: Create Apple Developer App ID

Visit [Apple Developer Portal → Certificates, Identifiers & Profiles → Identifiers](https://developer.apple.com/account/resources/identifiers/list)

**Click "+" → App IDs → App → Continue**

**Fill exactly:**
- **Description**: `Apuntador - Professional Teleprompter`
- **Bundle ID**: Select "Explicit" → Enter `io.apuntador.app`
- **Capabilities**: Leave all unchecked (can add later)

**Click "Continue" → "Register"**

## Step 2: Create App in App Store Connect

Visit [App Store Connect → My Apps](https://appstoreconnect.apple.com/apps)

**Click "+" → New App**

**Fill exactly:**
- **Name**: `Apuntador`
- **Primary Language**: `English (U.S.)`
- **Bundle ID**: Select `io.apuntador.app` (from dropdown)
- **SKU**: `apuntador-teleprompter`

**Click "Create"**

## Step 3: Local iOS Build Setup

```bash
# Clone and setup project
git clone <your-repo-url>
cd apuntador
npm install

# Install iOS platform
npx cap add ios

# Verify Bundle ID is correct
make ios-verify-bundle

# Open Xcode
npx cap open ios
```

**In Xcode:**
1. Select **App → Signing & Capabilities**
2. Check **"Automatically manage signing"**
3. Select your **Team** (Apple Developer account)
4. Verify **Bundle Identifier** shows `io.apuntador.app`

## Step 4: Test Local Build

```bash
# Build for iOS
npm run build
npx cap copy ios

# In Xcode: Product → Archive
# Follow Xcode organizer to upload to TestFlight
```

## Step 5: Setup GitHub Actions (Optional but Recommended)

```bash
# Setup GitHub secrets for automated builds
make ios-setup-github

# Push to trigger automated build
git push origin main
```

**Required GitHub Secrets:**
- `IOS_CERTIFICATE_P12_BASE64`
- `IOS_CERTIFICATE_PASSWORD`  
- `IOS_PROVISIONING_PROFILE_BASE64`
- `APPSTORE_API_KEY_ID`
- `APPSTORE_API_ISSUER_ID`
- `APPSTORE_API_PRIVATE_KEY`

## 🎯 Success Indicators

- ✅ Xcode opens project without Bundle ID errors
- ✅ `make ios-verify-bundle` shows consistent IDs
- ✅ Archive builds successfully in Xcode
- ✅ GitHub Actions builds complete (if enabled)
- ✅ TestFlight receives build uploads

## Common Issues & Fixes

**Bundle ID Mismatch:**
```bash
make ios-verify-bundle
# Fix any inconsistencies shown
```

**Signing Errors:**
- Verify Apple Developer membership is active
- Check team selection in Xcode
- Ensure App ID exists in Developer Portal

**Build Failures:**
```bash
# Clean and rebuild
make ios-clean
npm run build
npx cap sync ios
```

## Next Steps

1. **TestFlight Testing**: Invite beta testers via App Store Connect
2. **App Store Review**: Complete app metadata and submit for review
3. **CI/CD**: Enable GitHub Actions for automated builds

## Documentation Links

- 📖 [Complete App Store Submission Guide](./APPSTORE_SUBMISSION.md)
- 🔧 [GitHub Actions Setup Details](./IOS_GITHUB_ACTIONS.md)  
- 📋 [App Store Submission Checklist](./APPSTORE_QUICK_CHECKLIST.md)
- 🔍 [Apple Developer App ID Guide](./APPLE_DEVELOPER_APP_ID.md)

---

**Need Help?** Check [troubleshooting docs](./IOS_TROUBLESHOOTING.md) or create an issue.