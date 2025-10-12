# App Store Submission Guide for Apuntador

This guide covers the complete process to prepare and submit Apuntador to the Apple App Store.

## Prerequisites Checklist

### 1. Apple Developer Account
- [ ] **Apple Developer Program membership** ($99/year)
  - Sign up at: https://developer.apple.com/programs/
  - Complete identity verification
  - Accept latest agreements

### 2. Development Environment
- [ ] **Xcode 15+** with latest iOS SDK
- [ ] **macOS Ventura 13+** or later
- [ ] **Valid signing certificates**

---

## Phase 1: App Store Connect Setup

### 1.1 Create App ID (FIRST - Required)
**⚠️ You must create the App ID BEFORE creating the app in App Store Connect**

1. Go to **Apple Developer Portal**: https://developer.apple.com/account/
2. **Certificates, Identifiers & Profiles** → **Identifiers** → **+**
3. **App IDs** → **Continue**
4. Fill in details:
   - **Description**: `Apuntador - Professional Teleprompter`
   - **Bundle ID**: `io.apuntador.app` (Explicit)
   - **Capabilities**: None needed initially

**📖 Detailed guide**: `docs/APPLE_DEVELOPER_APP_ID.md`

### 1.2 Create App Store Connect Record
1. Go to https://appstoreconnect.apple.com
2. **My Apps** → **+** → **New App**
3. Fill in details:
   - **App Name**: `Apuntador`
   - **Primary Language**: Spanish (or your preference)
   - **Bundle ID**: Select `io.apuntador.app` from dropdown
   - **SKU**: `apuntador-ios-2025` (unique identifier)

### 1.2 App Information
- **Category**: Productivity (or Utilities)
- **Content Rights**: Own or have rights to all content
- **Age Rating**: Complete questionnaire (likely 4+)

---

## Phase 2: Code Signing & Xcode Configuration

### 2.1 Code Signing Setup (CRITICAL)
**⚠️ The app MUST be signed to upload to App Store Connect**

1. Open `ios/App/App.xcodeproj` in Xcode
2. Select **App** target → **Signing & Capabilities**
3. Configure signing:
   - **Automatically manage signing**: ✅ Checked (recommended)
   - **Team**: Select your Apple Developer Team
   - **Bundle Identifier**: `io.apuntador.app`

### 2.2 Signing Certificates Required
You need these certificates in your Apple Developer Account:

**Development Certificate:**
- Used for local testing
- Created automatically by Xcode

**Distribution Certificate:**
- **Apple Distribution** certificate (for App Store)
- Created in Apple Developer Portal or Xcode

### 2.3 Provisioning Profiles
Xcode will automatically create:
- **Development Provisioning Profile** (testing)
- **App Store Provisioning Profile** (distribution)

### 2.4 Verify Signing Configuration
In Xcode project settings, confirm:
```
CODE_SIGN_STYLE = Automatic
PRODUCT_BUNDLE_IDENTIFIER = io.apuntador.app
DEVELOPMENT_TEAM = [Your Team ID]
```

### 2.2 Version Information
Update in Xcode project settings:
- **Version**: `1.0.0` (Marketing Version)
- **Build**: `1` (Project Version - increment for each submission)

### 2.3 App Icons
Ensure you have all required icon sizes in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:
- 1024×1024 (App Store)
- 180×180 (iPhone 3x)
- 120×120 (iPhone 2x)
- 167×167 (iPad Pro)
- 152×152 (iPad 2x)
- 76×76 (iPad 1x)

**Generate icons:**
```bash
npm run ios:icons
```

### 2.4 Launch Screen
- Verify `LaunchScreen.storyboard` is properly configured
- Test on different device sizes
- Ensure it matches your app's branding

---

## Phase 3: App Store Requirements

### 3.1 Privacy Policy (Required)
Create a privacy policy covering:
- Data collection (if any)
- Third-party analytics
- User permissions requested

**Add to App Store Connect:**
1. **App Information** → **General Information**
2. **Privacy Policy URL**: Add your hosted privacy policy

### 3.2 App Description & Metadata
Prepare content for App Store Connect:

**App Description** (Spanish):
```
Apuntador es un teleprompter modular y profesional diseñado para creadores de contenido, presentadores y profesionales de la comunicación.

CARACTERÍSTICAS PRINCIPALES:
• Interfaz limpia y fácil de usar
• Control de velocidad ajustable
• Compatibilidad con markdown
• Modo espejo horizontal y vertical
• Soporte para múltiples orientaciones
• Optimizado para iPhone y iPad

PERFECTO PARA:
• Presentaciones profesionales
• Videos en redes sociales
• Discursos y conferencias
• Creación de contenido
• Streaming y podcasts

Apuntador te ayuda a mantener contacto visual con tu audiencia mientras lees tu script de manera fluida y profesional.
```

**Keywords** (100 characters max):
```
teleprompter,prompter,video,presentacion,speech,streaming,content creator
```

### 3.3 Screenshots
Create screenshots for:
- **iPhone** (6.7", 6.5", 5.5")
- **iPad Pro** (12.9")

**Required screenshots:**
1. Main teleprompter interface
2. Settings/configuration screen
3. File/text editing view
4. Different orientations

---

## Phase 4: Build for Distribution

### 4.1 Create Distribution Build
```bash
# Ensure latest web build
npm run build

# Sync with iOS
npx cap copy ios
npx cap sync ios

# Open Xcode
npx cap open ios
```

### 4.2 Archive in Xcode
1. In Xcode, select **Generic iOS Device** (not simulator)
2. **Product** → **Archive**
3. Wait for archive to complete
4. **Organizer** will open automatically

### 4.3 Upload to App Store Connect
1. In **Organizer** → **Archives**
2. Select your archive → **Distribute App**
3. Choose **App Store Connect**
4. Select your team and app
5. **Upload** (will take 5-15 minutes)

---

## Phase 5: App Store Connect Configuration

### 5.1 Build Selection
1. Go to **App Store Connect** → **My Apps** → **Apuntador**
2. **iOS App** → **Version** → **Build**
3. Select the uploaded build

### 5.2 App Review Information
- **Contact Information**: Your developer details
- **Demo Account**: Not needed for Apuntador
- **Notes**: Any special instructions for reviewers

### 5.3 Version Release
- **Automatic**: Release immediately after approval
- **Manual**: Hold for manual release

---

## Phase 6: Submission

### 6.1 Submit for Review
1. Complete all required fields
2. **Save** → **Submit for Review**
3. **Export Compliance**: Select "No" (unless using encryption)

### 6.2 Review Process
- **Timeline**: 1-7 days typically
- **Status tracking**: Monitor in App Store Connect
- **Rejection handling**: Address feedback and resubmit

---

## Common Issues & Solutions

### Code Signing Issues

#### "No signing certificate found"
**Solution**: 
1. Xcode → **Preferences** → **Accounts** → Add your Apple ID
2. **Download Manual Profiles** 
3. Project → **Signing & Capabilities** → Select your team
4. Verify Bundle ID matches App Store Connect

#### "Failed to create provisioning profile"
**Solution**:
1. Apple Developer Portal → **Certificates, Identifiers & Profiles**
2. **App IDs** → Verify `io.apuntador.app` is registered
3. **Profiles** → Create App Store Distribution profile if missing
4. Xcode → **Refresh** signing profiles

#### "Code signing error: No profiles for 'io.apuntador.app' were found"
**Solution**:
1. Clean Build Folder: **Product** → **Clean Build Folder**
2. **Signing & Capabilities** → Uncheck "Automatically manage signing"
3. Re-check "Automatically manage signing" 
4. Select correct team again

#### "This certificate has an invalid issuer"
**Solution**:
1. **Keychain Access** → Delete old/expired certificates
2. Xcode → **Preferences** → **Accounts** → **Download Manual Profiles**
3. Try archiving again

### Missing Icons
**Issue**: "Missing required icon sizes"
**Solution**: Run `npm run ios:icons` to generate all sizes

### Privacy Description
**Issue**: "Missing usage description"
**Solution**: Add to `ios/App/App/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>This app does not access the camera.</string>
```

### Build Validation
**Issue**: "Invalid binary"
**Solution**: 
1. Clean build folder: **Product** → **Clean Build Folder**
2. Archive again with **Generic iOS Device** selected

---

## Automated Build Script

Create `scripts/build-ios-appstore.sh`:

```bash
#!/bin/bash
set -e

echo "🍎 Building Apuntador for App Store submission..."

# Build web assets
echo "📦 Building web assets..."
npm run build

# Sync with iOS
echo "📱 Syncing with iOS..."
npx cap copy ios
npx cap sync ios

# Open Xcode for manual archive
echo "🔧 Opening Xcode..."
echo "Next steps:"
echo "1. Select 'Generic iOS Device'"
echo "2. Product → Archive"
echo "3. Distribute App → App Store Connect"
npx cap open ios
```

Make executable:
```bash
chmod +x scripts/build-ios-appstore.sh
```

---

## Final Checklist

### Pre-Submission
- [ ] App tested on physical iPhone/iPad
- [ ] All screenshots captured
- [ ] Privacy policy created and hosted
- [ ] App description written
- [ ] Keywords researched
- [ ] Version and build numbers set
- [ ] All required icons generated
- [ ] Signing certificates valid

### Post-Submission
- [ ] Monitor App Store Connect for status
- [ ] Respond to review feedback if needed
- [ ] Plan marketing/announcement
- [ ] Prepare for user feedback and updates

---

## Support Resources

- **Apple Developer Documentation**: https://developer.apple.com/app-store/
- **App Store Connect Help**: https://help.apple.com/app-store-connect/
- **Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/

---

**Estimated Timeline**: 2-3 days preparation + 1-7 days review = 3-10 days total