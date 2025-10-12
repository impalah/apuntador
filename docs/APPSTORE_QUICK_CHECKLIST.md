# App Store Submission Quick Checklist for Apuntador

## ⚠️ Prerequisites (MUST complete first)

### 1. Apple Developer Account
- [ ] **Apple Developer Program membership** ($99/year) at https://developer.apple.com/programs/
- [ ] **Identity verification completed**
- [ ] **Latest agreements accepted** in App Store Connect

### 2. App Store Connect App Record
- [ ] **Create app** at https://appstoreconnect.apple.com
  - App Name: `Apuntador`
  - Bundle ID: `io.apuntador.app`
  - SKU: `apuntador-ios-v1`
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
2. **App target** → **Signing & Capabilities**
3. **Team**: Select your Apple Developer Team
4. **Bundle ID**: Verify `io.apuntador.app`
5. **Auto-manage**: ✅ "Automatically manage signing"

### 3. Archive in Xcode  
1. **Device selection**: Select `Any iOS Device (arm64)` 
2. **Archive**: `Product` → `Archive` (will sign automatically)
3. **Wait**: Archive process completes (~2-5 minutes)

### 4. Upload to App Store
1. **Organizer opens**: Select your archive
2. **Distribute**: Click `Distribute App`
3. **Destination**: Choose `App Store Connect`
4. **Signing**: Select "Automatically manage signing" (recommended)
5. **Upload**: Follow wizard (~5-15 minutes)

---

## 📝 App Store Connect Configuration

### Required Information
```
App Name: Apuntador
Subtitle: Teleprompter Profesional
Category: Productivity
```

### Description (Spanish)
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

### Keywords
```
teleprompter,prompter,video,presentacion,speech,streaming,content creator
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

### "No signing certificate"
```
Xcode → Preferences → Accounts → Download Manual Profiles
```

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