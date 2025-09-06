#!/bin/bash

# ====================================================================
# 🔐 Android Keystore Setup Script (Bash)
# ====================================================================
# 
# Purpose: Configure Android keystore for release builds
# Usage: ./setup-keystore.sh
#
# This script will:
# 1. Generate a new keystore if needed
# 2. Create key.properties file
# 3. Set up environment variables
# ====================================================================

set -e  # Exit on any error

# Default values
KEYSTORE_PATH="android/app/apuntador-release-key.keystore"
ALIAS="apuntador"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions for colored output
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_step() {
    echo -e "${MAGENTA}🔧 $1${NC}"
}

# Show help
show_help() {
    echo -e "${CYAN}🔐 Android Keystore Setup Script${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "  ${GREEN}./setup-keystore.sh [--keystore path] [--alias alias]${NC}"
    echo ""
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  ${NC}--keystore PATH : Path to keystore file (default: android/app/apuntador-release-key.keystore)${NC}"
    echo -e "  ${NC}--alias ALIAS   : Key alias (default: apuntador)${NC}"
    echo -e "  ${NC}--help, -h      : Show this help${NC}"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  ${GREEN}./setup-keystore.sh${NC}"
    echo -e "  ${GREEN}./setup-keystore.sh --keystore my-app.keystore --alias myapp${NC}"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --keystore)
            KEYSTORE_PATH="$2"
            shift 2
            ;;
        --alias)
            ALIAS="$2"
            shift 2
            ;;
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

echo -e "${CYAN}🔐 Setting up Android Keystore for Release Builds${NC}"
echo ""

# Check if keystore already exists
if [[ -f "$KEYSTORE_PATH" ]]; then
    print_warning "Keystore already exists: $KEYSTORE_PATH"
    echo -n "Do you want to overwrite it? (y/N): "
    read -r OVERWRITE
    if [[ "$OVERWRITE" != "y" && "$OVERWRITE" != "Y" ]]; then
        print_error "Cancelled by user"
        exit 0
    fi
fi

# Check if keytool is available
if ! command -v keytool &> /dev/null; then
    print_error "keytool is not available. Please install Java JDK."
    exit 1
fi

# Get keystore information
echo -e "${YELLOW}📝 Please provide the following information:${NC}"
echo ""

echo -n "Keystore password: "
read -rs STORE_PASSWORD
echo ""

echo -n "Key password: "
read -rs KEY_PASSWORD
echo ""

echo -n "First name: "
read -r FIRST_NAME

echo -n "Last name: "
read -r LAST_NAME

echo -n "Organization unit (e.g., IT Department): "
read -r ORGANIZATION_UNIT

echo -n "Organization (e.g., Your Company): "
read -r ORGANIZATION

echo -n "City: "
read -r CITY

echo -n "State/Province: "
read -r STATE

echo -n "Country code (e.g., US, ES): "
read -r COUNTRY

# Create android/app directory if it doesn't exist
KEYSTORE_DIR=$(dirname "$KEYSTORE_PATH")
if [[ ! -d "$KEYSTORE_DIR" ]]; then
    mkdir -p "$KEYSTORE_DIR"
    print_success "Created directory: $KEYSTORE_DIR"
fi

# Generate keystore
echo ""
print_step "Generating keystore..."

DNAME="CN=$FIRST_NAME $LAST_NAME, OU=$ORGANIZATION_UNIT, O=$ORGANIZATION, L=$CITY, ST=$STATE, C=$COUNTRY"

if keytool -genkeypair \
    -v \
    -keystore "$KEYSTORE_PATH" \
    -alias "$ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$STORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "$DNAME"; then
    
    print_success "Keystore generated successfully"
else
    print_error "Failed to generate keystore"
    exit 1
fi

# Create key.properties file
echo ""
print_step "Creating key.properties file..."

KEY_PROPERTIES_PATH="android/key.properties"
KEYSTORE_FILENAME=$(basename "$KEYSTORE_PATH")

cat > "$KEY_PROPERTIES_PATH" << EOF
storePassword=$STORE_PASSWORD
keyPassword=$KEY_PASSWORD
keyAlias=$ALIAS
storeFile=$KEYSTORE_FILENAME
EOF

print_success "Created: $KEY_PROPERTIES_PATH"

# Create environment variables setup script
echo ""
print_step "Creating environment variables setup script..."

ENV_SCRIPT="scripts/set-android-env.sh"
cat > "$ENV_SCRIPT" << EOF
#!/bin/bash
# Android Environment Variables
# Source this file: source scripts/set-android-env.sh

export ANDROID_KEYSTORE_PASSWORD="$STORE_PASSWORD"
export ANDROID_KEY_PASSWORD="$KEY_PASSWORD"
export ANDROID_KEY_ALIAS="$ALIAS"
export ANDROID_KEYSTORE_FILE="$KEYSTORE_FILENAME"

echo "✅ Android environment variables set"
EOF

chmod +x "$ENV_SCRIPT"
print_success "Created: $ENV_SCRIPT"

# Show summary
echo ""
print_success "🎉 Keystore setup completed!"
echo ""
echo -e "${YELLOW}📋 Summary:${NC}"
echo -e "  ${NC}Keystore file: $KEYSTORE_PATH${NC}"
echo -e "  ${NC}Key alias: $ALIAS${NC}"
echo -e "  ${NC}Properties file: $KEY_PROPERTIES_PATH${NC}"
echo -e "  ${NC}Environment script: $ENV_SCRIPT${NC}"
echo ""
echo -e "${YELLOW}🔒 Security Notes:${NC}"
echo -e "  ${NC}• Keep your keystore file secure and backed up${NC}"
echo -e "  ${NC}• Never commit key.properties to version control${NC}"
echo -e "  ${NC}• Store passwords securely (consider using a password manager)${NC}"
echo ""
echo -e "${YELLOW}🚀 Next Steps:${NC}"
echo -e "  ${NC}1. To set environment variables: source $ENV_SCRIPT${NC}"
echo -e "  ${NC}2. Build release bundle: ./scripts/build-bundle.sh release${NC}"
echo ""
print_success "You can now build release APKs and Bundles!"

# Clean up sensitive variables
unset STORE_PASSWORD
unset KEY_PASSWORD
