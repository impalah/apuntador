#!/bin/bash
set -e

echo "[SECURE] iOS GitHub Actions Setup Helper"
echo "This script helps generate base64 values for GitHub Secrets"
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "[ERROR] This script requires macOS for iOS certificate handling"
    exit 1
fi

# Function to encode file to base64
encode_file() {
    local file_path="$1"
    local description="$2"
    
    if [ ! -f "$file_path" ]; then
        echo "[ERROR] File not found: $file_path"
        return 1
    fi
    
    echo ""
    echo "[NOTE] $description"
    echo "File: $file_path"
    echo "Base64 (copy this to GitHub Secrets):"
    echo "----------------------------------------"
    base64 -i "$file_path"
    echo "----------------------------------------"
    echo "[OK] Copied to clipboard"
    base64 -i "$file_path" | pbcopy
}

echo "🍎 Apple Developer Certificate & Profile Setup"
echo ""
echo "Required files for GitHub Actions iOS build:"
echo "1. Distribution Certificate (.p12)"
echo "2. App Store Provisioning Profile (.mobileprovision)"  
echo "3. App Store Connect API Key (.p8) - optional"
echo ""

# Certificate handling
echo "1️⃣ DISTRIBUTION CERTIFICATE"
echo "Path to your Apple Distribution certificate (.p12 file):"
read -r cert_path

if [ -n "$cert_path" ] && [ -f "$cert_path" ]; then
    encode_file "$cert_path" "IOS_CERTIFICATE_BASE64"
    
    echo ""
    echo "Certificate password (for IOS_CERTIFICATE_PASSWORD secret):"
    read -s cert_password
    echo "Password length: ${#cert_password} characters"
    if [ ${#cert_password} -gt 0 ]; then
        echo "[OK] Remember to add this password as IOS_CERTIFICATE_PASSWORD in GitHub"
    fi
else
    echo "⏭️  Skipping certificate (file not found)"
fi

echo ""
echo "2️⃣ PROVISIONING PROFILE"
echo "Path to your App Store provisioning profile (.mobileprovision):"
read -r profile_path

if [ -n "$profile_path" ] && [ -f "$profile_path" ]; then
    encode_file "$profile_path" "IOS_PROVISIONING_PROFILE_BASE64"
    
    # Extract some info from the profile
    echo "Profile information:"
    security cms -D -i "$profile_path" | plutil -p - | grep -E "(TeamName|ApplicationIdentifierPrefix|Name)" || true
else
    echo "⏭️  Skipping provisioning profile (file not found)"
fi

echo ""
echo "3️⃣ APP STORE CONNECT API KEY (Optional - for TestFlight)"
echo "Path to your App Store Connect API key (.p8 file):"
read -r api_key_path

if [ -n "$api_key_path" ] && [ -f "$api_key_path" ]; then
    encode_file "$api_key_path" "APP_STORE_CONNECT_API_KEY_BASE64"
    
    # Extract key ID from filename
    key_id=$(basename "$api_key_path" .p8 | sed 's/AuthKey_//')
    if [ ${#key_id} -eq 10 ]; then
        echo "Detected Key ID: $key_id"
        echo "Use this for APP_STORE_CONNECT_API_KEY_ID secret"
    fi
else
    echo "⏭️  Skipping API key (TestFlight upload will be disabled)"
fi

echo ""
echo "4️⃣ TEAM INFORMATION"
echo "You'll need your Apple Developer Team ID (10 characters)."
echo "Find it at: https://developer.apple.com/account/#/membership"
echo ""
echo "Enter your Team ID (or press Enter to skip):"
read -r team_id

if [ ${#team_id} -eq 10 ]; then
    echo "[OK] Team ID: $team_id"
    echo "Use this for IOS_TEAM_ID secret"
elif [ -n "$team_id" ]; then
    echo "[WARNING]  Team ID should be 10 characters. You entered: $team_id (${#team_id} chars)"
fi

echo ""
echo "[LIST] SUMMARY OF GITHUB SECRETS TO CREATE:"
echo "======================================="
echo ""
echo "Required secrets:"
echo "- IOS_CERTIFICATE_BASE64 (generated above)"
echo "- IOS_CERTIFICATE_PASSWORD (your certificate password)"
echo "- IOS_PROVISIONING_PROFILE_BASE64 (generated above)"
echo "- IOS_TEAM_ID ($team_id)"
echo "- KEYCHAIN_PASSWORD (create any secure password)"
echo ""
echo "Optional secrets (for TestFlight upload):"
echo "- APP_STORE_CONNECT_API_KEY_ID (Key ID from filename)"
echo "- APP_STORE_CONNECT_API_ISSUER_ID (from App Store Connect)"
echo "- APP_STORE_CONNECT_API_KEY_BASE64 (generated above)"
echo ""
echo "📖 Full setup guide: docs/IOS_GITHUB_ACTIONS.md"
echo ""
echo "[LAUNCH] Next steps:"
echo "1. Add all secrets to GitHub: Settings → Secrets and variables → Actions"
echo "2. Test the workflow: Actions → 'Build iOS App Store Package'"
echo "3. Check the build output and artifacts"
echo ""
echo "[OK] Setup helper completed!"