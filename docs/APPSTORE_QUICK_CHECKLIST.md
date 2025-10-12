# App Store Submission Quick Checklist for Apuntador

## ⚠️ Prerequisites (MUST complete first)

### 1. Apple Developer Account
- [ ] **Apple Developer Program membership** ($99/year) at https://developer.apple.com/programs/
- [ ] **Identity verification completed**
- [ ] **Latest agreements accepted** in App Store Connect

### 2. Apple Developer App ID (FIRST)
- [ ] **Create App ID** at https://developer.apple.com/account/
  - Description: `Apuntador - Professional Teleprompter`
  - Bundle ID: `io.apuntador.app` (Explicit)
  - Capabilities: None (initially)

### 3. App Store Connect App Record
- [ ] **Create app** at https://appstoreconnect.apple.com
  - App Name: `Apuntador`
  - Bundle ID: Select `io.apuntador.app` from list
  - SKU: `apuntador-ios-2025`
  - Category: `Productivity`

---

## 📱 Quick Build Process

### 1. Prepare Build
```bash
npm run ios:appstore
# or
make ios-appstore
```

### 2. Configure Signing in Xcode (FIRST TIME ONLY)
1. **Open project**: Xcode opens automatically from script
2. **Navigate to App Target**:
   - In **Navigator panel** (left), click on blue project icon "**App**" (at the top)
   - In center panel, ensure "**App**" target is selected (not "App (iOS)")
   - Click on "**Signing & Capabilities**" tab
3. **Configure Team**: 
   - In "**Signing**" section, "**Team**" dropdown → Select your Apple Developer Team
4. **Verify Bundle ID**: 
   - Verify "**Bundle Identifier**" shows `io.apuntador.app`
5. **Enable Auto-signing**: 
   - ✅ Check "**Automatically manage signing**"

### 3. Archive in Xcode  
1. **Device selection**: 
   - In top toolbar, click dropdown next to ▶️ button
   - Select "**Any iOS Device (arm64)**" (NOT a simulator)
2. **Archive**: 
   - Menu **Product** → **Archive** (signs automatically)
3. **Wait**: Archive process completes (~2-5 minutes)

### 4. Upload to App Store
1. **Organizer opens**: 
   - Xcode automatically opens "**Organizer**" window
   - Select your most recent archive from the list
2. **Distribute**: 
   - Click blue "**Distribute App**" button
3. **Destination**: 
   - Select "**App Store Connect**" → **Next**
4. **Signing**: 
   - Select "**Upload**" → **Next**
   - Leave "**Automatically manage signing**" checked → **Next**
5. **Upload**: 
   - Review and click "**Upload**" → Follow wizard (~5-15 minutes)

---

## 📝 App Store Connect Configuration

### Required Information
```
App Name: Apuntador
Subtitle: Professional Teleprompter
Category: Productivity
```

### Description (English)
```
Apuntador is a modular, professional teleprompter designed for content creators, presenters, and communication professionals.

KEY FEATURES:
• Clean and easy-to-use interface
• Adjustable speed control
• Markdown compatibility
• Horizontal and vertical mirror modes
• Multi-orientation support
• Optimized for iPhone and iPad

PERFECT FOR:
• Professional presentations
• Social media videos
• Speeches and conferences
• Content creation
• Streaming and podcasts

Apuntador helps you maintain eye contact with your audience while reading your script smoothly and professionally.
```

### Keywords
```
teleprompter,prompter,video,presentation,speech,streaming,content creator
```

---

## 📸 Screenshots Needed

### iPhone (6.7" display)
- [ ] **Main interface** - teleprompter showing text
- [ ] **Settings screen** - speed/font controls  
- [ ] **File selection** - markdown import
- [ ] **Mirror mode** - showing reversed text

### iPad Pro (12.9" display)  
- [ ] **Landscape view** - wide teleprompter
- [ ] **Portrait mode** - tablet optimized
- [ ] **Settings panel** - larger interface

**Tip**: Use iOS Simulator to capture screenshots at exact required resolutions.

---

## 🔒 Privacy & Legal

### Privacy Policy (Required)
Create at: https://privacypolicytemplate.net/ or similar

**Basic content**:
- App doesn't collect personal data
- Local file processing only
- No network requests
- No analytics/tracking

**Host anywhere** and add URL to App Store Connect.

### Age Rating
- **4+** (suitable for all ages)
- No objectionable content
- No in-app purchases

---

## ⚡ Build Methods

### Option A: GitHub Actions (Automated) ⭐
```bash
# Setup secrets (one-time)
npm run ios:setup-github

# Trigger workflow
# GitHub → Actions → "Build iOS App Store Package"
# Fill parameters and run
```

### Option B: Local Xcode (Manual)
```bash
# Complete build and prep
npm run ios:appstore

# In Xcode (after it opens):
# 1. Cmd+Shift+K (clean)
# 2. Product → Archive
# 3. Distribute App → App Store Connect
```

| Method | Setup Time | Build Time | Automation | Team Friendly |
|--------|------------|------------|------------|---------------|
| **GitHub Actions** | 30-60 min | 15-25 min | 100% | ✅ Yes |
| **Local Xcode** | 5 min | 5-10 min | Manual | ❌ No |

---

## 🚨 Common Issues & Fixes

### "No signing certificate" or "No devices registered"
**Cause**: Apple Developer needs at least one registered device
**Quick solution**:
1. **Connect your iPhone/iPad** to Mac via USB
2. **Xcode** → **Window** → **Devices and Simulators** (verify it appears)
3. **Return to Signing & Capabilities** (errors should disappear)

**Without physical iPhone/iPad**:
```
Xcode → Preferences → Accounts → Download Manual Profiles
```
See complete guide: `docs/IOS_SIGNING_ERRORS_EN.md`

### "Missing app icon"  
```bash
npm run ios:icons
```

### "Invalid Bundle ID"
- Must match App Store Connect: `io.apuntador.app`
- Check in Xcode project settings

### "Build validation failed"
```
Product → Clean Build Folder
Try archive again
```

---

## ⏱️ Timeline Estimate

| Phase | Duration |
|-------|----------|
| Apple Developer setup | 1-2 days (verification) |
| App Store Connect config | 2-3 hours |
| Screenshots & assets | 2-4 hours |  
| First build & upload | 1 hour |
| **Review process** | **1-7 days** |
| **Total** | **4-14 days** |

---

## 🎯 Ready to Submit?

### Final Checklist
- [ ] Apple Developer account active
- [ ] **Code signing configured** (Team selected in Xcode)
- [ ] **Distribution certificate** created (automatic via Xcode)
- [ ] **App Store provisioning profile** generated (automatic)
- [ ] App Store Connect app created
- [ ] Privacy policy created & hosted
- [ ] Screenshots captured (iPhone + iPad)
- [ ] Description & keywords written
- [ ] Build uploaded successfully (signed)
- [ ] All metadata completed

### Submit for Review
1. **App Store Connect** → **Your App** → **iOS App**
2. **Build** → Select uploaded build
3. **Complete all sections** (should be green checkmarks)
4. **Submit for Review**

---

## 📞 Need Help?

- **Documentation**: `docs/APPSTORE_SUBMISSION.md` (complete guide)
- **Apple Support**: https://developer.apple.com/support/
- **Status Check**: App Store Connect app status page

**Success!** Your app is now in the review queue! 🎉