# iOS Troubleshooting Guide

Common iOS development issues and their solutions for Apuntador.

## Bundle ID Issues

### ❌ "Bundle identifier is already in use"

**Solution:**
```bash
# Check what's configured
make ios-verify-bundle

# If Bundle ID is wrong, fix in capacitor.config.ts:
{
  "appId": "io.apuntador.app"  // Must match Apple Developer
}

# Sync changes
npx cap sync ios
```

### ❌ Bundle ID shows as "io.ionic.starter"

**Root Cause:** Old Ionic template wasn't updated

**Solution:**
```bash
# Fix capacitor.config.ts
# Fix package.json name field
# Fix android/app/build.gradle applicationId
make ios-verify-bundle  # Should show all consistent
```

## Xcode Signing Issues

### ❌ "No signing certificate found"

**Solution:**
1. **Check Apple Developer Membership**: Visit [developer.apple.com](https://developer.apple.com) → Account
2. **Create Development Certificate** (if none exists):
   - Keychain Access → Certificate Assistant → Request Certificate
   - Upload to Apple Developer Portal
3. **Xcode**: Preferences → Accounts → Download Manual Profiles

### ❌ "Provisioning profile doesn't match Bundle ID"

**Solution:**
```bash
# Verify App ID exists in Apple Developer Portal
open "https://developer.apple.com/account/resources/identifiers/list"

# Create App ID if missing (use exact values):
# Description: "Apuntador - Professional Teleprompter"  
# Bundle ID: "io.apuntador.app"
```

### ❌ "Team not found" in Xcode

**Solution:**
1. **Xcode → Preferences → Accounts**
2. **Add Apple ID** with Developer Program access
3. **Download Manual Profiles**
4. **Project → Signing & Capabilities → Team** (select correct team)

## Build Failures

### ❌ "Command PhaseScriptExecution failed"

**Common Causes:**
- Node.js version mismatch
- Missing Capacitor dependencies  

**Solution:**
```bash
# Clean everything
make ios-clean
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
npx cap sync ios

# If still failing, check Xcode build logs for specific error
```

### ❌ "Module 'Capacitor' not found"

**Solution:**
```bash
# Reinstall iOS platform
npx cap add ios --force
npx cap sync ios

# Verify capacitor.config.ts is correct
make ios-verify-bundle
```

### ❌ Archive builds but upload fails

**Possible Issues:**
1. **Missing App in App Store Connect**
2. **Wrong Bundle ID in App Store Connect**
3. **Invalid provisioning profile**

**Solution:**
```bash
# Verify App Store Connect app exists with correct Bundle ID
open "https://appstoreconnect.apple.com/apps"

# App must have Bundle ID: io.apuntador.app
# If wrong, create new app with correct Bundle ID
```

## GitHub Actions Failures

### ❌ "Certificate import failed"

**Solution:**
```bash
# Regenerate certificate base64
make ios-setup-github

# Verify GitHub secrets are set:
# IOS_CERTIFICATE_P12_BASE64
# IOS_CERTIFICATE_PASSWORD
```

### ❌ "Provisioning profile not found"

**Solution:**
1. **Create Distribution Profile** in Apple Developer Portal
2. **Download profile** → Convert to base64
3. **Update GitHub secret**: `IOS_PROVISIONING_PROFILE_BASE64`

### ❌ "App Store API authentication failed"

**Solution:**
```bash
# Verify App Store Connect API key
# Must have App Manager role or higher

# Check GitHub secrets:
# APPSTORE_API_KEY_ID (8-character ID)
# APPSTORE_API_ISSUER_ID (UUID format)  
# APPSTORE_API_PRIVATE_KEY (full .p8 content)
```

## Capacitor Issues

### ❌ "Capacitor not found" errors

**Solution:**
```bash
# Reinstall Capacitor
npm install @capacitor/core @capacitor/ios @capacitor/cli
npx cap add ios
npx cap sync ios
```

### ❌ iOS app crashes on device

**Common Causes:**
- Missing permissions in Info.plist
- Plugin compatibility issues

**Debug Steps:**
```bash
# Check Xcode console for crash logs
# Common fixes:

# 1. Add camera/microphone permissions if needed
# 2. Update all Capacitor plugins to latest
npm update @capacitor/core @capacitor/ios

# 3. Clean and rebuild
make ios-clean
npx cap sync ios
```

## Performance Issues

### ❌ Slow build times

**Solutions:**
```bash
# 1. Enable Xcode build cache
# 2. Use faster Mac if available  
# 3. Close other Xcode projects

# For GitHub Actions:
# - Use larger runner size
# - Cache node_modules and Xcode build cache
```

### ❌ Large app size

**Solutions:**
```bash
# 1. Enable bitcode (reduces download size)
# 2. Remove unused dependencies
npm run build:analyze  # If configured

# 3. Optimize images in public/ folder
# 4. Consider lazy loading for large components
```

## Version & Deployment Issues

### ❌ "Version already exists" in TestFlight

**Solution:**
```bash
# Increment build number in package.json
# Or use automatic versioning in GitHub Actions

# Manual version bump:
npm version patch  # 1.0.0 → 1.0.1
npm run build
npx cap sync ios
```

### ❌ App Store rejection for missing metadata

**Solution:**
1. **App Store Connect** → Your App → App Information
2. **Fill required fields**:
   - App Description
   - Keywords  
   - Support URL
   - Privacy Policy URL
   - Screenshots (all required sizes)

## Advanced Debugging

### Enable Detailed Logging

**Xcode Console:**
```
# Filter by: Apuntador
# Look for Capacitor plugin errors
```

**iOS Simulator:**
```bash
# Reset simulator if behavior is weird
Device → Erase All Content and Settings
```

### Network Issues

```bash
# If app can't reach your dev server:
# 1. Check iOS app uses correct server URL
# 2. Ensure dev server allows connections from device IP
# 3. Use real device instead of simulator for testing
```

## Quick Diagnosis Commands

```bash
# Check project health
make ios-verify-bundle    # Bundle ID consistency
npx cap doctor           # Capacitor status  
xcode-select --print-path # Xcode path
xcrun simctl list        # Available simulators

# Clean slate rebuild
make ios-clean
rm -rf ios/
npx cap add ios
npm run build
npx cap copy ios
npx cap open ios
```

## Getting Help

1. **Check specific error** in Xcode Build Navigator
2. **Review logs** in Console.app (filter by "Capacitor" or "Apuntador")
3. **Verify Apple Developer** account status and certificates
4. **Test on physical device** if simulator issues persist

---

**Still stuck?** Create an issue with:
- Full error message
- Output of `make ios-verify-bundle`
- Xcode version and macOS version
- Steps to reproduce