#!/bin/bash
# Build Android APK using Android Studio
# build-apk.sh

# Colors for output
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Building Android APK using Android Studio..."
echo
echo -e "${YELLOW}Step 1:${NC} Make sure Android Studio is open with the project"
echo -e "${YELLOW}Step 2:${NC} In Android Studio menu: Build → Build Bundle(s) / APK(s) → Build APK(s)"
echo -e "${YELLOW}Step 3:${NC} Wait for build to complete"
echo -e "${YELLOW}Step 4:${NC} APK will be generated at:"
echo -e "         ${CYAN}android/app/build/outputs/apk/debug/app-debug.apk${NC}"
echo
echo "To install on device:"
echo -e "${GREEN}1.${NC} Enable \"Developer Options\" and \"USB Debugging\" on your Android device"
echo -e "${GREEN}2.${NC} Connect device via USB"
echo -e "${GREEN}3.${NC} Transfer the APK file to your device"
echo -e "${GREEN}4.${NC} Install the APK (you may need to allow \"Install from unknown sources\")"
echo
echo -e "Alternative: Use adb install command if you have ADB configured"
echo -e "${CYAN}adb install android/app/build/outputs/apk/debug/app-debug.apk${NC}"

# Make the script wait for user input on some terminals
if [ -t 0 ]; then
    echo
    echo "Press Enter to continue..."
    read
fi
