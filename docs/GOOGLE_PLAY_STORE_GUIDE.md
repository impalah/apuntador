# 🤖 Apuntador - Android Dropbox Integration & Play Store Guide

## 📱 Overview

This guide covers the complete setup for publishing **Apuntador** to Google Play Store with integrated Dropbox functionality for cloud file management.

## 🔧 Technical Implementation

### ✅ Custom URL Scheme Configuration

The app is configured to handle Dropbox OAuth callbacks using a custom URL scheme:

**AndroidManifest.xml** (already configured):
```xml
<!-- Custom URL Scheme for Dropbox OAuth Callback -->
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="apuntador" android:host="oauth" android:pathPrefix="/dropbox" />
</intent-filter>
```

### ✅ Dropbox Configuration

**Redirect URI for Android**: `apuntador://oauth/dropbox`

**Automatic Platform Detection** (src/services/dropbox/config.ts):
- Web Development: `http://localhost:3000/oauth-callback`
- Web Production: `https://app.apuntador.io/oauth-callback`
- **Android/iOS**: `apuntador://oauth/dropbox`

### ✅ Deep Link Handling

**Deep Link Manager** (src/composables/useDeepLinks.ts):
- Automatically handles `apuntador://` URLs
- Extracts OAuth parameters (code, error, state)
- Navigates to appropriate callback handler
- Works seamlessly with existing web OAuth flow

## 🏪 Google Play Console Configuration

### Step 1: Create App Listing

1. **App Details**:
   - **App Name**: Apuntador
   - **Package Name**: `io.apuntador.app`
   - **App Category**: Tools → Productivity
   - **Target Audience**: 13+ (Contains no inappropriate content)

2. **App Description**:
```
Apuntador is a professional teleprompter application designed for content creators, speakers, and presenters. 

KEY FEATURES:
• Professional teleprompter with customizable speed and appearance
• Cloud storage integration with Dropbox
• Responsive design for tablets and phones
• Mirror mode for professional setups
• Offline editing and storage
• Dark theme optimized for readability

DROPBOX INTEGRATION:
Save and sync your scripts across devices using your Dropbox account. Your files remain private and are only accessible by you.

Perfect for:
- Content creators and YouTubers
- Public speakers and presenters
- Teachers and trainers
- Anyone who needs to read scripts smoothly
```

3. **Privacy Policy URL**: `https://app.apuntador.io/privacy-policy`
4. **Terms of Service URL**: `https://app.apuntador.io/terms-of-service`

### Step 2: Dropbox App Verification

**Required Information for Play Console**:

1. **Third-Party Integration Declaration**:
   - **Service**: Dropbox API
   - **Purpose**: Cloud file storage and synchronization
   - **Data Types**: Text files (.md, .txt) containing user scripts
   - **User Control**: Users explicitly authorize access
   - **Data Retention**: Files stored in user's own Dropbox account

2. **OAuth Configuration**:
   - **Redirect URI**: `apuntador://oauth/dropbox`
   - **Scopes Requested**:
     - `files.metadata.read` - List user files
     - `files.content.read` - Read script content
     - `files.content.write` - Save/update scripts

3. **Privacy Compliance**:
   - App only accesses files explicitly chosen by user
   - No automatic data collection
   - Users can disconnect Dropbox at any time
   - No data sharing with third parties

### Step 3: App Bundle Configuration

**Build Configuration** (already implemented):
```bash
# Generate signed AAB for Play Store
npm run android:bundle:release
```

**Required Certificates**:
- Upload key certificate (generated via build scripts)
- Play App Signing enabled (recommended)

### Step 4: Required App Information

1. **App Icon**: 
   - Generated via `npm run android:icons`
   - Adaptive icon support included

2. **Screenshots Required**:
   - Phone screenshots (min 2, recommended 4-8)
   - Tablet screenshots (min 2, recommended 4-8)
   - Feature graphic (1024x500)

3. **Store Listing Graphics**:
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Optional: Video demo

### Step 5: App Review Preparation

**Testing Instructions for Google Review**:

1. **Basic Functionality**:
   - Launch app → loads teleprompter interface
   - Enter sample text → verify scrolling works
   - Test speed controls and font adjustments

2. **Dropbox Integration Test**:
   - Tap settings → cloud integration
   - Select "Connect to Dropbox" 
   - Authorize with test Dropbox account
   - Save a sample script to cloud
   - Load the script from cloud storage
   - Verify script displays correctly

3. **Test Account** (provide to Google):
   - **Dropbox Test Account**: [Provide test account credentials]
   - **Sample Script**: Available in app's sample content

## 🔒 Security & Privacy Requirements

### Data Handling Declaration

**Data Types Collected**:
- **User Files**: Text scripts stored in user's Dropbox
- **Authentication Tokens**: Encrypted and stored locally
- **App Preferences**: Stored locally on device

**Data Usage**:
- Files used only for teleprompter display
- No analytics or tracking
- No data transmitted to Apuntador servers
- Dropbox integration uses standard OAuth 2.0

### Permissions Justification

**Required Permissions**:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```
- **Purpose**: Connect to Dropbox API for file synchronization
- **User Benefit**: Cloud storage and cross-device sync

## 🧪 Pre-Release Testing Checklist

### Core Functionality
- [ ] App launches successfully
- [ ] Teleprompter scrolling works smoothly
- [ ] Speed and font controls functional
- [ ] Mirror modes work correctly
- [ ] Local file editing and saving

### Dropbox Integration
- [ ] "Connect to Dropbox" opens browser
- [ ] OAuth flow completes successfully
- [ ] Returns to app after authorization
- [ ] File explorer shows Dropbox files
- [ ] Can save files to Dropbox
- [ ] Can load files from Dropbox
- [ ] Disconnect functionality works

### Android-Specific
- [ ] Deep links handle OAuth callback
- [ ] Back button behavior correct
- [ ] Orientation changes handled
- [ ] App state preserved on background/foreground
- [ ] No crashes on different screen sizes

## 📋 Pre-Submission Requirements

### 1. Legal Documentation
- [ ] Privacy Policy published at app.apuntador.io/privacy-policy
- [ ] Terms of Service published at app.apuntador.io/terms-of-service
- [ ] Dropbox integration disclosed in privacy policy

### 2. Store Assets
- [ ] App screenshots (phone + tablet)
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)

### 3. Technical Requirements
- [ ] Signed AAB generated
- [ ] Target API level meets requirements (API 34+)
- [ ] App tested on multiple Android versions
- [ ] No security vulnerabilities in dependencies

### 4. Dropbox App Configuration
- [ ] Dropbox app verified and approved
- [ ] Production redirect URI registered
- [ ] App permissions properly configured
- [ ] Rate limiting configured appropriately

## 🚀 Release Strategy

### Phased Rollout (Recommended)

1. **Internal Testing** (10 users)
   - Team members and close beta testers
   - Verify core functionality and Dropbox integration

2. **Closed Testing** (100 users)
   - Extended beta test group
   - Gather feedback on usability and performance

3. **Open Testing** (Optional)
   - Public beta via Play Store
   - Broader testing before full release

4. **Production Release**
   - Gradual rollout (10% → 50% → 100%)
   - Monitor crash reports and reviews

### Post-Launch Monitoring

- **Crash Analytics**: Monitor via Play Console
- **User Reviews**: Respond to feedback promptly
- **Performance**: Track app loading times and responsiveness
- **Dropbox API Usage**: Monitor rate limits and errors

## 📞 Support & Maintenance

### User Support Channels
- **In-App**: Settings → Help & Support
- **Email**: support@apuntador.io
- **Website**: app.apuntador.io/support

### Update Strategy
- **Security Updates**: Critical fixes within 48 hours
- **Feature Updates**: Monthly release cycle
- **Dropbox API Changes**: Monitor Dropbox developer updates

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Next Review**: Before Play Store submission