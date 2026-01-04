#!/bin/bash

# ====================================================================
# Android Bundle Builder Script (Bash)
# ====================================================================
# 
# Purpose: Build Android App Bundle (AAB) for Google Play Store
# Usage: ./build-bundle.sh [release|debug] [version]
# Example: ./build-bundle.sh release 0.1.6
#
# Requirements:
# - Node.js 20+
# - Java JDK 17+
# - Android SDK
# - Capacitor CLI
# ====================================================================

set -e  # Exit on any error

# Default values
BUILD_TYPE="release"
VERSION=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions for colored output
print_step() {
    echo -e "${MAGENTA}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]  $1${NC}"
}

print_info() {
    echo -e "${CYAN} $1${NC}"
}

# Show help
show_help() {
    echo -e "${CYAN}Android Bundle Builder Script${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "  ${GREEN}./build-bundle.sh [BuildType] [Version]${NC}"
    echo ""
    echo -e "${YELLOW}Parameters:${NC}"
    echo -e "  ${NC}BuildType   : release or debug (default: release)${NC}"
    echo -e "  ${NC}Version     : Version number (optional)${NC}"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  ${GREEN}./build-bundle.sh release 0.1.6${NC}"
    echo -e "  ${GREEN}./build-bundle.sh debug${NC}"
    echo -e "  ${GREEN}./build-bundle.sh --help${NC}"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        release|debug)
            BUILD_TYPE="$1"
            shift
            ;;
        *)
            if [[ -z "$VERSION" ]]; then
                VERSION="$1"
            fi
            shift
            ;;
    esac
done

# Script start
print_info "Starting Android Bundle Build Process"
print_info "Build Type: $BUILD_TYPE"
if [[ -n "$VERSION" ]]; then
    print_info "Version: $VERSION"
fi
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if android directory exists
if [[ ! -d "android" ]]; then
    print_error "Android project not found. Please run 'npx cap add android' first."
    exit 1
fi

# Cleanup function
cleanup() {
    if [[ -f "android/key.properties.tmp" ]]; then
        rm -f "android/key.properties.tmp"
    fi
}
trap cleanup EXIT

# Main build process
main() {
    # Step 1: Install dependencies
    print_step "Installing npm dependencies..."
    npm ci
    print_success "Dependencies installed"

    # Step 2: Build web project
    print_step "Building web project..."
    npm run build
    print_success "Web build completed"

    # Step 3: Copy web assets to Android
    print_step "Copying web assets to Android..."
    npx cap copy android
    print_success "Assets copied to Android"

    # Step 4: Sync Capacitor
    print_step "Syncing Capacitor plugins..."
    npx cap sync android
    print_success "Capacitor sync completed"

    # Step 5: Setup keystore for release build
    if [[ "$BUILD_TYPE" == "release" ]]; then
        if [[ ! -f "android/key.properties" ]]; then
            print_warning "key.properties not found. Creating from environment variables..."
            
            # Check if environment variables are set
            if [[ -z "$ANDROID_KEYSTORE_PASSWORD" ]] || [[ -z "$ANDROID_KEY_PASSWORD" ]] || [[ -z "$ANDROID_KEY_ALIAS" ]]; then
                print_error "Missing keystore configuration. Please set environment variables:"
                echo -e "  ${YELLOW}ANDROID_KEYSTORE_PASSWORD${NC}"
                echo -e "  ${YELLOW}ANDROID_KEY_PASSWORD${NC}"
                echo -e "  ${YELLOW}ANDROID_KEY_ALIAS${NC}"
                echo -e "  ${YELLOW}ANDROID_KEYSTORE_FILE (optional)${NC}"
                exit 1
            fi
            
            KEYSTORE_FILE="${ANDROID_KEYSTORE_FILE:-apuntador-release-key.keystore}"
            
            cat > "android/key.properties" << EOF
storePassword=$ANDROID_KEYSTORE_PASSWORD
keyPassword=$ANDROID_KEY_PASSWORD
keyAlias=$ANDROID_KEY_ALIAS
storeFile=$KEYSTORE_FILE
EOF
            
            print_success "key.properties created"
        fi
    fi

    # Step 6: Build Android Bundle
    print_step "Building Android Bundle ($BUILD_TYPE)..."
    
    cd android
    
    if [[ "$BUILD_TYPE" == "release" ]]; then
        ./gradlew bundleRelease
    else
        ./gradlew bundleDebug
    fi
    
    cd ..
    print_success "Android Bundle build completed"

    # Step 7: Verify bundle was created
    if [[ "$BUILD_TYPE" == "release" ]]; then
        BUNDLE_PATH="android/app/build/outputs/bundle/release/app-release.aab"
    else
        BUNDLE_PATH="android/app/build/outputs/bundle/debug/app-debug.aab"
    fi
    
    if [[ -f "$BUNDLE_PATH" ]]; then
        BUNDLE_SIZE=$(du -h "$BUNDLE_PATH" | cut -f1)
        print_success "Bundle created successfully!"
        print_info "Location: $(realpath "$BUNDLE_PATH")"
        print_info "Size: $BUNDLE_SIZE"
        print_info "Created: $(date -r "$BUNDLE_PATH")"
        
        # Copy to project root with version
        if [[ -n "$VERSION" ]]; then
            OUTPUT_NAME="apuntador-$VERSION-$BUILD_TYPE.aab"
        else
            OUTPUT_NAME="apuntador-$BUILD_TYPE.aab"
        fi
        
        cp "$BUNDLE_PATH" "$OUTPUT_NAME"
        print_success "Bundle copied to: $OUTPUT_NAME"
        
        if [[ "$BUILD_TYPE" == "release" ]]; then
            echo ""
            print_success "[SUCCESS] Ready for Google Play Store!"
            print_warning "Upload the .aab file to Google Play Console"
        fi
    else
        print_error "Bundle file not found at expected location: $BUNDLE_PATH"
        print_info "Checking build output directories..."
        
        RELEASE_DIR="android/app/build/outputs/bundle/release"
        DEBUG_DIR="android/app/build/outputs/bundle/debug"
        
        if [[ -d "$RELEASE_DIR" ]]; then
            print_info "Release directory contents:"
            ls -la "$RELEASE_DIR"
        fi
        
        if [[ -d "$DEBUG_DIR" ]]; then
            print_info "Debug directory contents:"
            ls -la "$DEBUG_DIR"
        fi
        
        exit 1
    fi
}

# Error handling
error_handler() {
    print_error "Build failed on line $1"
    echo ""
    print_warning "Troubleshooting tips:"
    echo -e "  ${NC}1. Make sure you have Android SDK installed${NC}"
    echo -e "  ${NC}2. Verify Java JDK 17+ is installed${NC}"
    echo -e "  ${NC}3. Check that Capacitor is properly configured${NC}"
    echo -e "  ${NC}4. For release builds, ensure keystore is configured${NC}"
    exit 1
}

trap 'error_handler $LINENO' ERR

# Run main function
main

echo ""
print_success "[SUCCESS] Bundle build process completed successfully!"
