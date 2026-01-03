#!/bin/bash
# Script to generate Base64 of keystore for GitHub Secrets
# generate-keystore-base64.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}[SECURE] Android Keystore Base64 Generator${NC}"
echo "=================================================="

# Verify that keystore exists
KEYSTORE_PATH="android/app/apuntador-release-key.keystore"

if [ ! -f "$KEYSTORE_PATH" ]; then
    echo -e "${RED}[ERROR] ERROR: Keystore file not found at: $KEYSTORE_PATH${NC}"
    echo -e "${YELLOW}   Make sure the keystore is in the correct location.${NC}"
    echo -e "${YELLOW}   If you don't have a keystore, run first: ./build-signed-apk.sh${NC}"
    exit 1
fi

echo -e "${GREEN}[OK] Keystore found: $KEYSTORE_PATH${NC}"

# Generate Base64
echo -e "${YELLOW}[REFRESH] Generating Base64...${NC}"

if ! command -v base64 &> /dev/null; then
    echo -e "${RED}[ERROR] ERROR: base64 command not found${NC}"
    echo -e "${YELLOW}   Please install base64 utility${NC}"
    exit 1
fi

# Save to file
OUTPUT_FILE="keystore-base64.txt"
base64 -w 0 "$KEYSTORE_PATH" > "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK] Base64 generated successfully!${NC}"
    echo -e "${CYAN}📁 File saved to: $OUTPUT_FILE${NC}"
    
    # Show information
    echo -e "\n${MAGENTA}[LIST] INFORMATION FOR GITHUB SECRETS:${NC}"
    echo "========================================"
    echo -e "${WHITE}ANDROID_KEYSTORE_BASE64:${NC}"
    echo -e "${GRAY}  -> Copy the complete content of $OUTPUT_FILE${NC}"
    echo -e "\n${WHITE}ANDROID_KEYSTORE_PASSWORD:${NC}"
    echo -e "${GRAY}  -> apuntador123${NC}"
    echo -e "\n${WHITE}ANDROID_KEY_ALIAS:${NC}"
    echo -e "${GRAY}  -> apuntador${NC}"
    echo -e "\n${WHITE}ANDROID_KEY_PASSWORD:${NC}"
    echo -e "${GRAY}  -> apuntador123${NC}"
    
    echo -e "\n${MAGENTA}[WEB] GITHUB CONFIGURATION:${NC}"
    echo -e "${WHITE}1. Go to your repository on GitHub${NC}"
    echo -e "${WHITE}2. Settings -> Secrets and variables -> Actions${NC}"
    echo -e "${WHITE}3. New repository secret${NC}"
    echo -e "${WHITE}4. Add the 4 secrets shown above${NC}"
    
    echo -e "\n${YELLOW}[WARNING]  IMPORTANT:${NC}"
    echo -e "${RED}   - Do not share these values publicly${NC}"
    echo -e "${RED}   - Delete $OUTPUT_FILE after configuring GitHub${NC}"
    echo -e "${YELLOW}   - Secrets are case-sensitive${NC}"
    
    echo -e "\n${GREEN}[LAUNCH] Once the secrets are configured, the workflow${NC}"
    echo -e "${GREEN}   build-android-apk.yml will work automatically!${NC}"
    
else
    echo -e "${RED}[ERROR] ERROR generating Base64${NC}"
    exit 1
fi

echo -e "\n${CYAN}[FEATURE] Process completed!${NC}"
