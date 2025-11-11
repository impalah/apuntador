# 🤖 Android Dropbox Integration - Technical Implementation

## 📋 Overview

This document details the technical implementation of Dropbox OAuth integration in the Android version of Apuntador using Capacitor.

## 🔧 Implementation Details

### 1. Custom URL Scheme Configuration

**File**: `android/app/src/main/AndroidManifest.xml`

```xml
<!-- Custom URL Scheme for Dropbox OAuth Callback -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="apuntador" android:host="oauth" android:pathPrefix="/dropbox" />
</intent-filter>
```

**Purpose**: Allows the Android system to open Apuntador when the URL `apuntador://oauth/dropbox` is accessed.

### 2. Platform-Aware Configuration

**File**: `src/services/dropbox/config.ts`

```typescript
import { Capacitor } from '@capacitor/core'

function getRedirectUri(): string {
  if (Capacitor.isNativePlatform()) {
    return 'apuntador://oauth/dropbox'
  } else if (isDevelopment) {
    return 'http://localhost:3000/oauth-callback'
  } else {
    return 'https://app.apuntador.io/oauth-callback'
  }
}
```

**Logic**: Automatically detects if running on native platform and uses appropriate redirect URI.

### 3. Deep Link Handler

**File**: `src/composables/useDeepLinks.ts`

```typescript
const handleAppUrl = async (data: { url: string }) => {
  const url = new URL(data.url)
  
  if (url.protocol === 'apuntador:' && url.hostname === 'oauth' && url.pathname === '/dropbox') {
    const params = new URLSearchParams(url.search)
    await router.push({
      name: 'oauth-callback',
      query: {
        code: params.get('code'),
        error: params.get('error'),
        state: params.get('state')
      }
    })
  }
}
```

**Purpose**: Intercepts deep links and routes them to the OAuth callback page with proper parameters.

### 4. Capacitor App Plugin Integration

**Dependencies**:
- `@capacitor/app`: Handles app lifecycle and URL events
- `@capacitor/core`: Core Capacitor functionality

**Setup in App.vue**:
```typescript
import { useDeepLinks } from '@/composables/useDeepLinks'
useDeepLinks() // Automatically configures deep link handling
```

## 🔄 OAuth Flow in Android

### Step-by-Step Process

1. **User taps "Connect to Dropbox"**
   - App generates PKCE challenge
   - Opens system browser with Dropbox OAuth URL
   - Redirect URI set to `apuntador://oauth/dropbox`

2. **User authorizes on Dropbox**
   - Dropbox redirects to `apuntador://oauth/dropbox?code=...`
   - Android system recognizes the custom scheme
   - Opens Apuntador app via intent filter

3. **Deep link processing**
   - `useDeepLinks` composable catches the URL
   - Extracts authorization code from parameters
   - Routes to `/oauth-callback` page internally

4. **OAuth completion**
   - `OAuthCallback.vue` processes the authorization code
   - Exchanges code for access token using PKCE verifier
   - Stores tokens and updates UI state

## 📱 Android-Specific Considerations

### URL Scheme Security
- Uses `android:autoVerify="true"` for App Link verification
- Scheme `apuntador://` is unique to avoid conflicts
- Host and path pattern provide additional specificity

### HTTPS Requirements
- Dropbox OAuth requires HTTPS for web redirects
- Custom scheme bypasses HTTPS requirement
- All API calls to Dropbox still use HTTPS

### Background/Foreground Handling
- App may be backgrounded during OAuth flow
- `App.addListener('appUrlOpen')` handles return from browser
- State preservation ensures smooth user experience

## 🧪 Testing Instructions

### Development Testing
1. **Build and run on device/emulator**:
   ```bash
   npm run android:build
   npx cap run android
   ```

2. **Test OAuth flow**:
   - Tap Settings → Cloud Integration → Connect to Dropbox
   - Verify browser opens with Dropbox login
   - Complete authorization
   - Verify app reopens and shows success

3. **Test file operations**:
   - Save a script to Dropbox
   - Load a script from Dropbox
   - Verify synchronization works

### Manual Deep Link Testing
```bash
# Test deep link handling (on device via ADB)
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "apuntador://oauth/dropbox?code=test123" \
  io.apuntador.app
```

## 🚀 Build Configuration

### Debug Build
```bash
npm run android:build
npx cap run android
```

### Release APK
```bash
./scripts/build-android-apk.sh
```

### Release Bundle (Play Store)
```bash
npm run android:bundle:release
```

## 🔒 Security Implementation

### Token Storage
- OAuth tokens stored securely using Capacitor preferences
- Tokens encrypted at rest on device
- No tokens transmitted to Apuntador servers

### PKCE Implementation
- Uses SHA256 for code challenge generation
- Code verifier generated with crypto-random values
- Prevents authorization code interception attacks

### Network Security
- All Dropbox API calls use TLS 1.2+
- Certificate pinning through standard HTTPS
- No custom network security configuration needed

## 📋 Troubleshooting

### Common Issues

1. **Deep link not working**:
   - Verify AndroidManifest.xml has correct intent filter
   - Check if another app claims the same scheme
   - Test with `adb shell am start` command

2. **OAuth timeout**:
   - Verify redirect URI in Dropbox app config
   - Check network connectivity
   - Ensure PKCE parameters are correctly generated

3. **App not returning from browser**:
   - Verify custom scheme is registered
   - Check if intent filter has `android:autoVerify="true"`
   - Test on different Android versions

### Debug Logging

Enable debug mode in development:
```typescript
// In dropboxService.ts
console.log('🔗 OAuth URL:', authUrl)
console.log('🔐 Code verifier generated')
console.log('📱 Redirect URI:', this.config.redirectUri)
```

## 🔄 Update Process

### Updating Dropbox Integration

1. **Change redirect URI**:
   - Update Dropbox app configuration
   - Modify `src/services/dropbox/config.ts`
   - Update AndroidManifest.xml if scheme changes

2. **Update dependencies**:
   ```bash
   npm update dropbox
   npm update @capacitor/app
   npx cap sync android
   ```

3. **Test after updates**:
   - Rebuild app with `npm run android:build`
   - Test complete OAuth flow
   - Verify file operations still work

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Target Android API**: 34+  
**Minimum Android Version**: 7.0 (API 24)