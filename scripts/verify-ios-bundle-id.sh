#!/bin/bash
set -e

echo "🔍 Apuntador Bundle ID Verification Tool"
echo "========================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "capacitor.config.ts" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "📱 Checking current project configuration..."
echo ""

# Verificar Bundle ID en capacitor.config.ts
CAPACITOR_BUNDLE_ID=$(grep -o "appId: '[^']*'" capacitor.config.ts | sed "s/appId: '//;s/'//")
echo "✅ Capacitor Config Bundle ID: $CAPACITOR_BUNDLE_ID"

# Verificar Bundle ID en iOS project
if [ -f "ios/App/App.xcodeproj/project.pbxproj" ]; then
    IOS_BUNDLE_ID=$(grep -o "PRODUCT_BUNDLE_IDENTIFIER = [^;]*" ios/App/App.xcodeproj/project.pbxproj | head -1 | sed 's/PRODUCT_BUNDLE_IDENTIFIER = //;s/;//')
    echo "✅ iOS Project Bundle ID: $IOS_BUNDLE_ID"
    
    if [ "$CAPACITOR_BUNDLE_ID" = "$IOS_BUNDLE_ID" ]; then
        echo "✅ Bundle IDs match correctly"
    else
        echo "⚠️  Bundle ID mismatch detected!"
        echo "   Capacitor: $CAPACITOR_BUNDLE_ID"
        echo "   iOS: $IOS_BUNDLE_ID"
    fi
else
    echo "⚠️  iOS project not found - run 'npx cap add ios' first"
fi

echo ""
echo "📋 Apple Developer Portal Setup Required:"
echo "========================================="
echo ""
echo "🎯 Use these EXACT values when creating App ID:"
echo ""
echo "Description: Apuntador - Professional Teleprompter"
echo "Bundle ID: $CAPACITOR_BUNDLE_ID"
echo "Bundle ID Type: Explicit"
echo "Capabilities: NONE (leave all unchecked for now)"
echo ""
echo "📍 Where to create:"
echo "1. https://developer.apple.com/account/"
echo "2. Certificates, Identifiers & Profiles"
echo "3. Identifiers → + (plus button)"
echo "4. App IDs → Continue"
echo ""

# Verificar si el Bundle ID es válido
if [[ $CAPACITOR_BUNDLE_ID =~ ^[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+$ ]]; then
    echo "✅ Bundle ID format is valid"
else
    echo "❌ Bundle ID format appears invalid"
    echo "   Expected format: com.company.appname or io.company.app"
fi

# Verificar longitud
if [ ${#CAPACITOR_BUNDLE_ID} -gt 3 ] && [ ${#CAPACITOR_BUNDLE_ID} -lt 200 ]; then
    echo "✅ Bundle ID length is acceptable (${#CAPACITOR_BUNDLE_ID} characters)"
else
    echo "⚠️  Bundle ID length may be problematic: ${#CAPACITOR_BUNDLE_ID} characters"
fi

echo ""
echo "🔗 Next Steps:"
echo "=============="
echo ""
echo "1. 📋 Create App ID with values shown above"
echo "2. 🏪 Create app in App Store Connect"
echo "3. 🔐 Configure code signing in Xcode"
echo "4. 📦 Build and upload to App Store"
echo ""
echo "📖 Detailed guides:"
echo "  - docs/APPLE_DEVELOPER_APP_ID.md (App ID creation)"
echo "  - docs/APPSTORE_QUICK_CHECKLIST.md (Complete process)"
echo ""
echo "✅ Verification complete!"