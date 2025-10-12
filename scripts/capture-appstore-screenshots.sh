#!/bin/bash
set -e

echo "📸 Capturing App Store Screenshots for Apuntador..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Crear directorio para screenshots
mkdir -p screenshots/appstore

echo "🚀 Starting iOS Simulator screenshot capture..."

# iPhone screenshots (6.7" - iPhone 14 Pro Max equivalent)
IPHONE_DEVICE="iPhone 15 Pro Max"
IPAD_DEVICE="iPad Pro (12.9-inch) (6th generation)"

echo "📱 Launching iPhone simulator..."
xcrun simctl boot "$IPHONE_DEVICE" 2>/dev/null || echo "Device already booted"

echo "📋 Building and running on iPhone simulator..."
npm run ios:build > /dev/null 2>&1
npx cap run ios --target="$IPHONE_DEVICE" &
IPHONE_PID=$!

# Wait for app to launch
echo "⏱️  Waiting for app to load..."
sleep 10

echo "📸 Capturing iPhone screenshots..."
# Main interface
xcrun simctl io "$IPHONE_DEVICE" screenshot screenshots/appstore/iphone-1-main.png
echo "   ✅ Main interface captured"

# Give time to navigate manually
echo "⏰ Navigate to settings, then press ENTER to capture next screenshot..."
read -r

# Settings screen  
xcrun simctl io "$IPHONE_DEVICE" screenshot screenshots/appstore/iphone-2-settings.png
echo "   ✅ Settings screen captured"

echo "⏰ Navigate to file selection, then press ENTER to capture next screenshot..."
read -r

# File selection
xcrun simctl io "$IPHONE_DEVICE" screenshot screenshots/appstore/iphone-3-files.png  
echo "   ✅ File selection captured"

echo "⏰ Enable mirror mode, then press ENTER to capture final iPhone screenshot..."
read -r

# Mirror mode
xcrun simctl io "$IPHONE_DEVICE" screenshot screenshots/appstore/iphone-4-mirror.png
echo "   ✅ Mirror mode captured"

# Stop iPhone app
kill $IPHONE_PID 2>/dev/null || true

echo ""
echo "📱 Launching iPad simulator..."
xcrun simctl boot "$IPAD_DEVICE" 2>/dev/null || echo "Device already booted"

echo "📋 Running on iPad simulator..."
npx cap run ios --target="$IPAD_DEVICE" &
IPAD_PID=$!

sleep 10

echo "📸 Capturing iPad screenshots..."

# Landscape view
xcrun simctl io "$IPAD_DEVICE" screenshot screenshots/appstore/ipad-1-landscape.png
echo "   ✅ Landscape view captured"

echo "⏰ Rotate to portrait and adjust settings, then press ENTER..."
read -r

# Portrait with settings
xcrun simctl io "$IPAD_DEVICE" screenshot screenshots/appstore/ipad-2-portrait.png
echo "   ✅ Portrait mode captured"

# Stop iPad app
kill $IPAD_PID 2>/dev/null || true

echo ""
echo "✅ Screenshot capture complete!"
echo "📁 Screenshots saved in: screenshots/appstore/"
echo ""
echo "📋 Files created:"
ls -la screenshots/appstore/
echo ""
echo "🔧 Next steps:"
echo "1. Review screenshots for quality"
echo "2. Upload to App Store Connect"
echo "3. Ensure they meet Apple's guidelines"
echo ""
echo "📖 For upload instructions, see: docs/APPSTORE_QUICK_CHECKLIST.md"