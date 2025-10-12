#!/bin/bash

# Quick iOS TestFlight Build and Upload
# Triggers GitHub Actions workflow to build iOS app and upload to TestFlight

set -e

echo "🍎 iOS TestFlight Build & Upload"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI required. Install: brew install gh${NC}"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not logged in to GitHub. Run: gh auth login${NC}"
    exit 1
fi

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}📱 Current version: $CURRENT_VERSION${NC}"

# Get last iOS build number from GitHub Actions
echo "🔍 Checking last build number..."
LAST_BUILD=$(gh run list --workflow="build-ios-appstore.yml" --limit=1 --json displayTitle | jq -r '.[0].displayTitle' | grep -o 'versionCode: [0-9]*' | cut -d' ' -f2 || echo "35")

if [ "$LAST_BUILD" = "null" ] || [ -z "$LAST_BUILD" ]; then
    LAST_BUILD=35
fi

NEXT_BUILD=$((LAST_BUILD + 1))
echo -e "${BLUE}📈 Next build number: $NEXT_BUILD${NC}"
echo ""

# Ask for confirmation
echo "🚀 Ready to build and upload to TestFlight:"
echo "   Version: $CURRENT_VERSION"
echo "   Build: $NEXT_BUILD"
echo "   Upload: YES"
echo ""
read -p "Proceed with build? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Build cancelled."
    exit 0
fi

echo ""
echo "🔄 Starting GitHub Actions workflow..."

# Trigger the workflow
gh workflow run build-ios-appstore.yml \
    --field release_tag="$CURRENT_VERSION" \
    --field versionCode="$NEXT_BUILD" \
    --field upload_to_testflight=true \
    --field logLevel="info"

echo -e "${GREEN}✅ Workflow started successfully!${NC}"
echo ""

# Wait a moment then show status
sleep 3
echo "📊 Workflow status:"
gh run list --workflow="build-ios-appstore.yml" --limit=1

echo ""
echo -e "${YELLOW}🔗 Monitor progress:${NC}"
echo "   GitHub Actions: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions"
echo "   App Store Connect: https://appstoreconnect.apple.com"
echo ""
echo -e "${GREEN}🎉 Your iOS app will be built and uploaded to TestFlight automatically!${NC}"