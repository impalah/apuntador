#!/bin/bash
set -e

echo "🍎 Building Apuntador for App Store submission..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Verificar que Xcode está instalado
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Error: Xcode is not installed or not in PATH"
    exit 1
fi

# Build web assets
echo "📦 Building web assets..."
npm run build

# Verificar que el build fue exitoso
if [ ! -d "dist" ]; then
    echo "❌ Error: Web build failed - dist directory not found"
    exit 1
fi

# Sync with iOS
echo "📱 Syncing with iOS..."
npx cap copy ios
npx cap sync ios

# Verificar la configuración de iOS
echo "🔍 Checking iOS configuration..."
if [ ! -f "ios/App/App.xcodeproj/project.pbxproj" ]; then
    echo "❌ Error: iOS project not found"
    exit 1
fi

# Verificar configuración de firma
echo "🔐 Checking code signing configuration..."
if grep -q "CODE_SIGN_STYLE = Automatic" ios/App/App.xcodeproj/project.pbxproj; then
    echo "  ✅ Automatic signing enabled"
else
    echo "  ⚠️  Warning: Manual signing detected - may need configuration"
fi

if grep -q "PRODUCT_BUNDLE_IDENTIFIER = io.apuntador.app" ios/App/App.xcodeproj/project.pbxproj; then
    echo "  ✅ Bundle ID configured correctly"
else
    echo "  ❌ Warning: Bundle ID may not match App Store Connect"
fi

# Mostrar información del proyecto
echo "📋 Project Information:"
echo "  Bundle ID: io.apuntador.app"
echo "  Display Name: Apuntador"
echo "  Signing: Automatic (requires Apple Developer Team selection)"

# Verificar que los iconos existen
if [ ! -f "ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json" ]; then
    echo "⚠️  Warning: App icons may not be properly configured"
    echo "   Run 'npm run ios:icons' to generate icons"
fi

echo ""
echo "✅ Pre-build steps completed successfully!"
echo ""
echo "� CRITICAL: Configure Code Signing in Xcode:"
echo "1. App target → Signing & Capabilities"
echo "2. Select your Apple Developer Team"
echo "3. Verify Bundle ID: io.apuntador.app"
echo "4. Ensure 'Automatically manage signing' is checked"
echo ""
echo "🔧 Archive & Upload steps:"
echo "1. Select 'Any iOS Device (arm64)' as build destination"
echo "2. Product → Archive (will sign automatically)"
echo "3. In Organizer → Select archive → Distribute App"
echo "4. Choose 'App Store Connect'"
echo "5. Select signing options (automatic recommended)"
echo "6. Upload (Xcode will handle signing)"
echo ""
echo "Opening Xcode..."

# Open Xcode
npx cap open ios

echo "🚀 Ready for App Store submission!"
echo "📖 See docs/APPSTORE_SUBMISSION.md for complete guide"