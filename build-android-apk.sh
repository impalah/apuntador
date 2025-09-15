#!/bin/bash

# Build Android APK with custom name
# Usage: ./build-android-apk.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building Apuntador Android APK...${NC}"

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo -e "${CYAN}Building version: $VERSION${NC}"

# Build the web app and sync with Android
echo -e "${YELLOW}Building web app and syncing with Android...${NC}"
npm run android:build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

# Navigate to Android directory and build APK
echo -e "${YELLOW}Building Android APK...${NC}"
cd android

# Check if gradlew exists and is executable
if [ ! -f "./gradlew" ]; then
    echo -e "${RED}gradlew not found in android directory!${NC}"
    cd ..
    exit 1
fi

# Make gradlew executable if it isn't
chmod +x ./gradlew

# Build release APK
./gradlew assembleRelease

if [ $? -ne 0 ]; then
    echo -e "${RED}APK build failed!${NC}"
    cd ..
    exit 1
fi

# Go back to root directory
cd ..

# Check if APK was generated and rename it
ORIGINAL_APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
NEW_APK_NAME="apuntador-release-$VERSION.apk"
NEW_APK_PATH="android/app/build/outputs/apk/release/$NEW_APK_NAME"

if [ -f "$ORIGINAL_APK_PATH" ]; then
    # Rename the APK file
    mv "$ORIGINAL_APK_PATH" "$NEW_APK_PATH"
    echo -e "${GREEN}APK renamed to: $NEW_APK_NAME${NC}"
    
    # Copy to root directory for easy access
    cp "$NEW_APK_PATH" "$NEW_APK_NAME"
    echo -e "${GREEN}APK copied to root directory as '$NEW_APK_NAME'${NC}"
    
    # Show file size
    FILE_SIZE=$(du -h "$NEW_APK_NAME" | cut -f1)
    echo -e "${CYAN}APK size: $FILE_SIZE${NC}"
else
    echo -e "${RED}APK not found at expected location!${NC}"
    echo -e "${YELLOW}Looking for APK files...${NC}"
    find android/app/build/outputs/apk -name "*.apk" 2>/dev/null | while read -r apk_file; do
        echo -e "Found: $apk_file"
    done
    exit 1
fi

echo -e "${GREEN}Android APK build completed successfully!${NC}"
echo -e "${CYAN}APK location: $NEW_APK_NAME${NC}"
