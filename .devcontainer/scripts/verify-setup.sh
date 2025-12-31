#!/bin/bash
# Verification script for DevContainer setup
# Run this inside the container to verify all tools are installed correctly

# Don't exit on errors - we want to see all verification results
set +e

echo "🔍 Verifying DevContainer Setup for Apuntador..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verification counter
PASS=0
FAIL=0

# Function to check command
check_command() {
    local cmd=$1
    local name=$2
    local version_arg=${3:---version}
    
    if command -v $cmd &> /dev/null; then
        version=$($cmd $version_arg 2>&1 | head -n1)
        echo -e "${GREEN}✓${NC} $name: $version"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $name: NOT FOUND"
        ((FAIL++))
    fi
}

# Check Node.js environment
echo "=== Node.js Environment ==="
check_command node "Node.js" "-v"
check_command npm "npm" "-v"
check_command npx "npx" "-v"
echo ""

# Check Rust environment
echo "=== Rust Environment ==="
check_command rustc "Rust Compiler" "--version"
check_command cargo "Cargo" "--version"
check_command rustup "Rustup" "--version"
echo ""

# Check Android SDK
echo "=== Android SDK ==="

# Check architecture and amd64 support
ARCH=$(dpkg --print-architecture 2>/dev/null || echo "unknown")
echo -e "${GREEN}✓${NC} Architecture: $ARCH"

if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    # Check if amd64 libraries are installed
    if dpkg -l | grep -q "libc6.*amd64"; then
        echo -e "${GREEN}✓${NC} Multi-arch support (amd64): Enabled"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} Multi-arch support (amd64): MISSING"
        echo -e "${YELLOW}  → Run: sudo dpkg --add-architecture amd64 && sudo apt-get update && sudo apt-get install -y libc6:amd64${NC}"
        ((FAIL++))
    fi
fi

if [ -d "$ANDROID_SDK_ROOT" ]; then
    echo -e "${GREEN}✓${NC} ANDROID_SDK_ROOT: $ANDROID_SDK_ROOT"
    ((PASS++))
    
    if [ -f "$ANDROID_SDK_ROOT/platform-tools/adb" ]; then
        # Try to run adb to verify it works
        if adb_version=$($ANDROID_SDK_ROOT/platform-tools/adb version 2>&1 | head -n1); then
            echo -e "${GREEN}✓${NC} ADB: $adb_version"
            ((PASS++))
        else
            echo -e "${RED}✗${NC} ADB: Found but cannot execute"
            echo -e "${YELLOW}  → Error: $adb_version${NC}"
            echo -e "${YELLOW}  → This may indicate missing amd64 libraries on ARM64 systems${NC}"
            ((FAIL++))
        fi
    else
        echo -e "${RED}✗${NC} ADB: NOT FOUND"
        ((FAIL++))
    fi
    
    if [ -f "$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]; then
        echo -e "${GREEN}✓${NC} SDK Manager: Found"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} SDK Manager: NOT FOUND"
        ((FAIL++))
    fi
else
    echo -e "${RED}✗${NC} ANDROID_SDK_ROOT: NOT SET"
    ((FAIL++))
fi
echo ""

# Check Java
echo "=== Java Environment ==="
check_command java "Java" "-version"
check_command javac "Java Compiler" "-version"
if [ -d "$ANDROID_SDK_ROOT/../../android" ]; then
    cd /workspaces/apuntador/android 2>/dev/null && check_command ./gradlew "Gradle Wrapper" "--version" || echo -e "${YELLOW}⚠${NC} Gradle: android/ directory not found"
fi
echo ""

# Check Ionic/Capacitor
echo "=== Ionic & Capacitor ==="
check_command ionic "Ionic CLI" "--version"
check_command cap "Capacitor CLI" "--version"
echo ""

# Check Git
echo "=== Version Control ==="
check_command git "Git" "--version"
echo ""

# Check build tools
echo "=== Build Tools ==="
check_command make "Make" "--version"
check_command curl "cURL" "--version"
check_command wget "wget" "--version"
echo ""

# Check project dependencies
echo "=== Project Dependencies ==="
if [ -d "/workspaces/apuntador/node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules: Exists"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} node_modules: Not found (run 'npm install')"
    ((FAIL++))
fi

if [ -d "/workspaces/apuntador/src-tauri/target" ]; then
    echo -e "${GREEN}✓${NC} Rust target: Exists"
    ((PASS++))
else
    echo -e "${YELLOW}⚠${NC} Rust target: Not found (will be created on first build)"
fi
echo ""

# Check VS Code extensions (if running in VS Code)
echo "=== VS Code Extensions (Expected) ==="
echo "  - Vue - Official (vue.volar)"
echo "  - TypeScript Vue Plugin (vue.vscode-typescript-vue-plugin)"
echo "  - ESLint (dbaeumer.vscode-eslint)"
echo "  - Prettier (esbenp.prettier-vscode)"
echo "  - Playwright Test (ms-playwright.playwright)"
echo "  - i18n Ally (lokalise.i18n-ally)"
echo "  - Rust Analyzer (rust-lang.rust-analyzer)"
echo "  - Even Better TOML (tamasfe.even-better-toml)"
echo "  - Crates (serayuzgur.crates)"
echo "  - Ionic (ionic.ionic)"
echo ""
echo -e "${YELLOW}ℹ${NC} Extensions are installed automatically by VS Code when opening in container"
echo ""

# Summary
echo "========================================="
echo "=== Verification Summary ==="
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo "========================================="
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "You can now:"
    echo "  npm run dev              # Start Vite dev server"
    echo "  npm run tauri dev        # Start Tauri desktop app"
    echo "  npx cap sync android     # Sync Capacitor to Android"
    echo "  cargo build              # Build Rust code"
    echo ""
    echo "Happy coding! 🚀"
    exit 0
else
    echo -e "${YELLOW}⚠ Some checks failed. Please review the output above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - If node_modules missing: npm install"
    echo "  - If Android SDK issues: Rebuild container"
    echo "  - If Rust missing: source ~/.bashrc or ~/.zshrc"
    echo ""
    exit 1
fi
