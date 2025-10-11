# iOS Development Guide - Apuntador

This guide will help you set up and run Apuntador on iOS devices (iPhone and iPad).

## 📋 Prerequisites

### Required
- **macOS** (iOS development only available on Mac)
- **Xcode 14+** installed from App Store
- **Command Line Tools**: `sudo xcode-select --install`
- **Node.js 20+**
- **CocoaPods**: `sudo gem install cocoapods`

### Verify Installation
```bash
# Verify Xcode
xcode-select -p

# Verify CocoaPods
pod --version
```

## 🚀 Initial Setup

### Option 1: Automatic Script (Recommended)
```bash
# Run complete setup script
npm run ios:setup
# or
./scripts/setup-ios.sh
```

### Option 2: Manual Setup
```bash
# 1. Install iOS dependencies
npm install @capacitor/ios @capacitor/splash-screen

# 2. Add iOS platform
npx cap add ios

# 3. Build web project
npm run build

# 4. Sync with iOS
npx cap sync ios

# 5. Install CocoaPods
cd ios/App
pod install --repo-update
cd ../..
```

### Option 3: Using Makefile
```bash
# Complete setup
make ios-setup
make ios-pods

# Generate icons
make ios-icons
```

## 📱 Development Commands

### Xcode Development
```bash
# Open project in Xcode
npm run ios:dev
# or
make ios-dev
```

### Run on Simulators

#### iPhone
```bash
# Default iPhone
npm run ios:run
make ios-run

# iPhone 17
npm run ios:run:iphone
make ios-run-iphone

# iPhone 17 Pro
npm run ios:run:iphone-pro
make ios-run-iphone-pro

# iPhone 17 Pro Max
npm run ios:run:iphone-pro-max
make ios-run-iphone-pro-max
```

#### iPad
```bash
# Standard iPad
npm run ios:run:ipad
make ios-run-ipad

# iPad Pro
npm run ios:run:ipad-pro
make ios-run-ipad-pro

# iPad Air
npm run ios:run:ipad-air
make ios-run-ipad-air
```

### Utilities
```bash
# List available simulators
npm run ios:list-simulators
make ios-list

# Generate icons and splash screens
npm run ios:icons
make ios-icons

# Create custom splash screen with resized logo
make ios-splash

# Clean build
make ios-clean
```

## 🎯 Recommended Simulators

### For Development
- **iPhone 17** - Most common device
- **iPad (A16)** - Standard iPad
- **iPad Pro 13-inch (M4)** - Large screen

### For Testing
- **iPhone 17 Pro Max** - Largest screen
- **iPad Air 13-inch (M3)** - Medium size
- **iPhone SE** - Small screen (install manually if needed)

## 📁 iOS Project Structure

```
ios/
├── App/                          # Main Xcode project
│   ├── App/                      # iOS source code
│   │   ├── Info.plist           # App configuration
│   │   ├── AppDelegate.swift    # Main delegate
│   │   └── public/              # Web assets
│   ├── App.xcodeproj/           # Xcode project
│   ├── App.xcworkspace/         # Workspace with CocoaPods
│   ├── Podfile                  # CocoaPods dependencies
│   └── Pods/                    # Installed dependencies
└── capacitor-cordova-ios-plugins/
```

## 🔧 Teleprompter-Specific Configuration

### Supported Orientations
- **iPhone**: Portrait, Landscape Left, Landscape Right
- **iPad**: All orientations

### Configured Permissions
- **Camera**: For recording presentations (future feature)
- **Microphone**: For presentation audio (future feature)
- **Documents**: For importing/exporting scripts

### iOS Features
- **Status Bar**: Configurable (hidden during presentations)
- **Idle Timer**: Prevents screen from sleeping
- **Background Modes**: App continues running in background
- **Screen Recording**: Compatible with screen recording

## 🐛 Troubleshooting

### Error: "xcode-select: error: tool 'xcodebuild' requires Xcode"
```bash
# Install full Xcode from App Store
# Then run:
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### Error: CocoaPods not found
```bash
sudo gem install cocoapods
pod setup
```

### Error: "No simulator available"
1. Open Xcode
2. Window → Devices and Simulators
3. Install required simulators

### Xcode compilation error
1. Clean build: Product → Clean Build Folder
2. Update pods: `cd ios/App && pod install`
3. Verify signing configuration

### App doesn't update in simulator
```bash
# Sync changes
npm run build
npx cap copy ios
npx cap sync ios
```

## 📊 iOS Performance

### Applied Optimizations
- **WKWebView**: Better performance than UIWebView
- **Hardware Acceleration**: Enabled for animations
- **Memory Management**: Automatic memory management
- **Background Processing**: Optimized for teleprompter usage

### Testing Recommendations
- **Test on physical devices** for real performance
- **Verify different screen sizes**
- **Orientation testing** in real-time
- **Verify offline functionality**

## 🚢 Distribution

### Prepare for App Store
1. Configure signing in Xcode
2. Create distribution build
3. Upload to App Store Connect

### TestFlight (Beta Testing)
1. Archive in Xcode
2. Upload to App Store Connect
3. Configure beta testing

### Internal Distribution
1. Use Xcode for direct installation
2. Configure provisioning profiles

## 📚 Additional Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Xcode Guides](https://developer.apple.com/xcode/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

---

**💡 Tip**: For daily development, use `make ios-run-iphone` for quick testing and `make ios-dev` for debugging in Xcode.