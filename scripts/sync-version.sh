#!/bin/bash

# ====================================================================
# Version Sync Script (Bash)
# ====================================================================
#
# Purpose: Sync version from package.json to Android build.gradle and
#          iOS project.pbxproj (MARKETING_VERSION/CURRENT_PROJECT_VERSION)
# Usage: ./sync-version.sh
# ====================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions for colored output
print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_info() {
    echo -e "${CYAN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]  $1${NC}"
}

# Show help
show_help() {
    echo -e "${CYAN}Version Sync Script${NC}"
    echo ""
    echo -e "${YELLOW}Purpose: Synchronize version from package.json to Android build.gradle and iOS project.pbxproj${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "  ${GREEN}./sync-version.sh${NC}"
    echo ""
    echo -e "${YELLOW}This script will:${NC}"
    echo -e "  ${NC}1. Read version from package.json${NC}"
    echo -e "  ${NC}2. Calculate appropriate versionCode${NC}"
    echo -e "  ${NC}3. Update android/app/build.gradle${NC}"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${CYAN}Synchronizing version from package.json to Android...${NC}"

# Check if files exist
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found"
    exit 1
fi

if [[ ! -f "android/app/build.gradle" ]]; then
    print_error "android/app/build.gradle not found"
    exit 1
fi

# Read version from package.json
if ! command -v jq &> /dev/null; then
    print_error "jq is required but not installed. Please install jq first."
    echo -e "${YELLOW}On Ubuntu/Debian: sudo apt install jq${NC}"
    echo -e "${YELLOW}On macOS: brew install jq${NC}"
    exit 1
fi

VERSION=$(jq -r '.version' package.json)
if [[ "$VERSION" == "null" || -z "$VERSION" ]]; then
    print_error "Could not read version from package.json"
    exit 1
fi

print_info "Found version in package.json: $VERSION"

# Parse semantic version (major.minor.patch)
if [[ $VERSION =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)(-.*)?$ ]]; then
    MAJOR=${BASH_REMATCH[1]}
    MINOR=${BASH_REMATCH[2]}
    PATCH=${BASH_REMATCH[3]}
    PRERELEASE=${BASH_REMATCH[4]}
    
    # Calculate versionCode (major * 10000 + minor * 100 + patch)
    VERSION_CODE=$((MAJOR * 10000 + MINOR * 100 + PATCH))
    
    # For pre-1.0 versions, use simpler calculation
    if [[ $MAJOR -eq 0 ]]; then
        VERSION_CODE=$((MINOR * 10 + PATCH))
    fi
    
    print_success "Calculated versionCode: $VERSION_CODE"
    
    # Update build.gradle
    BUILD_GRADLE_FILE="android/app/build.gradle"
    
    # Create backup
    cp "$BUILD_GRADLE_FILE" "$BUILD_GRADLE_FILE.bak"
    
    # Update versionCode
    # NOTE: use [0-9][0-9]* rather than [0-9]\+ - BSD sed (macOS) does not support \+ in BRE
    sed -i.tmp "s/versionCode [0-9][0-9]*/versionCode $VERSION_CODE/" "$BUILD_GRADLE_FILE"
    
    # Update versionName
    sed -i.tmp "s/versionName \"[^\"]*\"/versionName \"$VERSION\"/" "$BUILD_GRADLE_FILE"
    
    # Remove temporary file
    rm -f "$BUILD_GRADLE_FILE.tmp"
    
    print_success "Updated android/app/build.gradle:"
    echo -e "   ${NC}versionCode: $VERSION_CODE${NC}"
    echo -e "   ${NC}versionName: \"$VERSION\"${NC}"

    # Clean up backup if update was successful
    rm -f "$BUILD_GRADLE_FILE.bak"

    # Update iOS project.pbxproj (MARKETING_VERSION, CURRENT_PROJECT_VERSION)
    PBXPROJ_FILE="ios/App/App.xcodeproj/project.pbxproj"

    if [[ -f "$PBXPROJ_FILE" ]]; then
        cp "$PBXPROJ_FILE" "$PBXPROJ_FILE.bak"

        sed -i.tmp "s/MARKETING_VERSION = [0-9][^;]*;/MARKETING_VERSION = $VERSION;/" "$PBXPROJ_FILE"
        sed -i.tmp "s/CURRENT_PROJECT_VERSION = [0-9][0-9]*;/CURRENT_PROJECT_VERSION = $VERSION_CODE;/" "$PBXPROJ_FILE"

        rm -f "$PBXPROJ_FILE.tmp"

        print_success "Updated ios/App/App.xcodeproj/project.pbxproj:"
        echo -e "   ${NC}MARKETING_VERSION: $VERSION${NC}"
        echo -e "   ${NC}CURRENT_PROJECT_VERSION: $VERSION_CODE${NC}"

        rm -f "$PBXPROJ_FILE.bak"
    else
        print_warning "ios/App/App.xcodeproj/project.pbxproj not found, skipping iOS sync"
    fi

else
    print_error "Invalid version format in package.json: $VERSION"
    print_warning "Expected format: major.minor.patch (e.g., 1.2.3)"
    exit 1
fi

echo ""
print_success "[SUCCESS] Version synchronization completed!"
print_warning "Remember to rebuild your Android and iOS apps to see the new version."
