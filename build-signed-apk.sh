#!/bin/bash
# Build Signed Android APK
# build-signed-apk.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "===================================="
echo "   Building Signed Android APK"
echo "===================================="
echo

# Function to check command exit status
check_status() {
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: $1${NC}"
        exit 1
    fi
}

echo "Step 1: Building web application..."
npm run build
check_status "Failed to build web application"

echo
echo "Step 2: Copying to Android project..."
npx cap copy android
check_status "Failed to copy to Android"

echo
echo "Step 3: Syncing Android project..."
npx cap sync android
check_status "Failed to sync Android project"

echo
echo "Step 4: Building signed APK..."
cd android
./gradlew assembleRelease
check_status "Failed to build APK"

cd ..
echo
echo "===================================="
echo -e "${GREEN}   BUILD SUCCESSFUL!${NC}"
echo "===================================="
echo
echo "Your signed APK is ready at:"
echo -e "${CYAN}android/app/build/outputs/apk/release/app-release.apk${NC}"
echo

# Show file size if the file exists
APK_FILE="android/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_FILE" ]; then
    echo "File size:"
    ls -lh "$APK_FILE" | awk '{print $5 " " $9}'
    echo
fi

echo "To install on device:"
echo "1. Enable USB Debugging on your Android device"
echo "2. Connect via USB"
echo -e "3. Run: ${CYAN}adb install android/app/build/outputs/apk/release/app-release.apk${NC}"
echo
echo "Or transfer the APK file to your device and install manually"
echo

# Make the script wait for user input on some terminals
if [ -t 0 ]; then
    echo "Press Enter to continue..."
    read
fi
