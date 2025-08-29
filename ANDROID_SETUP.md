# 🤖 Apuntador - Android Application

## 📱 Setup Completed

The **Apuntador** application has been successfully configured to generate an Android application using **Ionic Capacitor**.

### ✅ What has been installed and configured:

1. **Capacitor Core** - Main framework for native applications
2. **Mobile plugins**:
   - `@capacitor/status-bar` - Status bar control
   - `@capacitor/screen-orientation` - Landscape orientation lock
   - `@capacitor/haptics` - Haptic feedback for interactions
   - `@capacitor/keyboard` - Virtual keyboard management

3. **Android Platform** - Generated native Android project
4. **Optimized configuration** - Dark theme, landscape orientation by default

### 🛠️ Available scripts for Android development:

```bash
# Build and sync
npm run android:build

# Development with live reload
npm run android:dev

# Run on device/emulator
npm run android:run

# Sync changes only
npm run android:sync

# Regenerate app icons
npm run android:icons

# Open in Android Studio
npm run android:open
```

### 📂 Android project structure:

```
android/
├── app/
│   ├── src/main/
│   │   ├── assets/public/     # Web app files
│   │   ├── java/              # Native Java/Kotlin code
│   │   ├── res/               # Android resources
│   │   └── AndroidManifest.xml
├── gradle/
└── build.gradle
```

### 🎯 Implemented mobile features:

- **Dynamic orientation**: App adapts to both portrait and landscape orientations
- **Responsive UI**: Toolbar and layout adjust automatically to orientation changes
- **Dark theme**: Optimized black status bar and background
- **Haptic feedback**: Gentle vibrations on important interactions
- **Optimized keyboard**: Automatically hides when not needed and adjusts layout
- **HTTPS scheme**: Enhanced security for the application
- **Orientation detection**: Automatic layout recalculation on orientation changes
- **Custom app icon**: Uses the Apuntador logo from `public/logo.png`
- **Adaptive icons**: Modern Android adaptive icon support with background and foreground layers
- **Splash screen**: Custom splash screen with logo for app launch

### 🚀 Next steps:

1. **Android Studio** should have opened automatically
2. Wait for Gradle to finish building the project
3. Connect an Android device or start an emulator
4. Click the "Run" button (▶️) in Android Studio

### 🔧 Continuous development:

For continuous development with live reload:

```bash
npm run android:dev
```

This will keep the application updated in real-time while you develop.

### 📱 Device testing:

- The app adapts to both portrait and landscape orientations
- The status bar will be black in both orientations
- Main buttons will have haptic feedback
- The interface will be fully responsive for mobile devices
- Toolbar automatically adjusts height based on orientation
- Content area recalculates when orientation changes

### ⚡ Quick commands:

```bash
# Complete rebuild
npm run build && npx cap sync android

# Debug in Android Studio
npx cap open android

# Update web code only
npx cap copy android

# Regenerate app icons from logo
npm run android:icons
```

### 🎨 App Icon Setup:

The app uses the logo from `public/logo.png` as the icon source. The build process automatically generates:

- **Standard icons**: For older Android versions (ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- **Adaptive icons**: Modern Android adaptive icons with separate foreground and background
- **Round icons**: Circular variants for supported launchers
- **Splash screens**: Launch screens for both portrait and landscape orientations
- **Dark theme splash**: Optimized splash screens for dark mode

To update the app icon, simply replace `public/logo.png` with your new logo and run:

```bash
npm run android:icons
npx cap sync android
```

---

**The Apuntador application is ready to compile as a native Android app!** 🎉
