#!/bin/bash

# Test script to verify both PowerShell and Bash build scripts work
# Usage: ./test-build-scripts.sh

echo "Testing Android APK build scripts..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Check if scripts exist
echo -e "${YELLOW}Checking if build scripts exist...${NC}"

if [ -f "build-android-apk.ps1" ]; then
    echo -e "${GREEN}✓ PowerShell script found${NC}"
else
    echo -e "${RED}✗ PowerShell script missing${NC}"
fi

if [ -f "build-android-apk.sh" ]; then
    echo -e "${GREEN}✓ Bash script found${NC}"
else
    echo -e "${RED}✗ Bash script missing${NC}"
fi

# Test 2: Check script permissions
echo -e "${YELLOW}Checking script permissions...${NC}"

if [ -x "build-android-apk.sh" ]; then
    echo -e "${GREEN}✓ Bash script is executable${NC}"
else
    echo -e "${RED}✗ Bash script is not executable${NC}"
    echo "  Run: chmod +x build-android-apk.sh"
fi

# Test 3: Check for required tools
echo -e "${YELLOW}Checking for required tools...${NC}"

if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓ npm found${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
fi

if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ node found${NC}"
else
    echo -e "${RED}✗ node not found${NC}"
fi

if [ -d "android" ]; then
    echo -e "${GREEN}✓ Android directory exists${NC}"
else
    echo -e "${RED}✗ Android directory missing${NC}"
    echo "  Run: npx cap add android"
fi

if [ -f "android/gradlew" ]; then
    echo -e "${GREEN}✓ Gradle wrapper found${NC}"
else
    echo -e "${RED}✗ Gradle wrapper missing${NC}"
fi

# Test 4: Check package.json scripts
echo -e "${YELLOW}Checking package.json scripts...${NC}"

if grep -q "android:apk:build" package.json; then
    echo -e "${GREEN}✓ Windows build script configured${NC}"
else
    echo -e "${RED}✗ Windows build script missing in package.json${NC}"
fi

if grep -q "android:apk:build:linux" package.json; then
    echo -e "${GREEN}✓ Linux build script configured${NC}"
else
    echo -e "${RED}✗ Linux build script missing in package.json${NC}"
fi

echo -e "${YELLOW}Test completed.${NC}"
