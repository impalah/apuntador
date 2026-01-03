#!/bin/bash
# Manual Android SDK installation script
# Run this inside the container if Android SDK installation fails during container creation

set -e

echo "[MOBILE] Manual Android SDK Installation"
echo ""

# Set variables
ANDROID_SDK_ROOT=/home/node/Android/Sdk
CMDLINE_TOOLS_VERSION=11076708

# Check if already installed
if [ -d "${ANDROID_SDK_ROOT}/cmdline-tools/latest" ]; then
    echo "[WARNING]  Android SDK Command Line Tools already installed at ${ANDROID_SDK_ROOT}"
    read -p "Do you want to reinstall? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    rm -rf ${ANDROID_SDK_ROOT}/cmdline-tools/latest
fi

# Create directories
echo "📁 Creating directories..."
mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools

# Download Command Line Tools
echo "[DOWN]  Downloading Android Command Line Tools..."
if ! wget -q --show-progress https://dl.google.com/android/repository/commandlinetools-linux-${CMDLINE_TOOLS_VERSION}_latest.zip -O /tmp/cmdline-tools.zip; then
    echo "[ERROR] Failed to download Command Line Tools"
    echo "   Check your internet connection and try again"
    exit 1
fi

# Extract
echo "[PACKAGE] Extracting..."
unzip -q /tmp/cmdline-tools.zip -d /tmp/cmdline-tools
mv /tmp/cmdline-tools/cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest
rm /tmp/cmdline-tools.zip

# Set environment variables
export ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT}
export ANDROID_HOME=${ANDROID_SDK_ROOT}
export PATH=${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools:${ANDROID_SDK_ROOT}/emulator:${PATH}

# Accept licenses
echo "[NOTE] Accepting licenses..."
yes | ${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager --licenses || true

# Install SDK packages
echo "[PACKAGE] Installing SDK packages..."
echo ""

packages=(
    "platform-tools"
    "platforms;android-34"
    "build-tools;34.0.0"
    "ndk;26.1.10909125"
    "cmake;3.22.1"
)

for package in "${packages[@]}"; do
    echo "Installing $package..."
    if ${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager "$package"; then
        echo "✓ $package installed"
    else
        echo "[WARNING]  Failed to install $package (continuing...)"
    fi
    echo ""
done

# Update environment files
echo "[CONFIG] Updating environment files..."

# Add to bashrc if not already there
if ! grep -q "ANDROID_SDK_ROOT" /home/node/.bashrc; then
    {
        echo ""
        echo "# Android SDK"
        echo "export ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT}"
        echo "export ANDROID_HOME=\${ANDROID_SDK_ROOT}"
        echo "export PATH=\${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:\${ANDROID_SDK_ROOT}/platform-tools:\${ANDROID_SDK_ROOT}/emulator:\${PATH}"
    } >> /home/node/.bashrc
fi

# Add to zshrc if it exists
if [ -f /home/node/.zshrc ] && ! grep -q "ANDROID_SDK_ROOT" /home/node/.zshrc; then
    {
        echo ""
        echo "# Android SDK"
        echo "export ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT}"
        echo "export ANDROID_HOME=\${ANDROID_SDK_ROOT}"
        echo "export PATH=\${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:\${ANDROID_SDK_ROOT}/platform-tools:\${ANDROID_SDK_ROOT}/emulator:\${PATH}"
    } >> /home/node/.zshrc
fi

echo ""
echo "[OK] Android SDK installation completed!"
echo ""
echo "Installed components:"
ls -1 ${ANDROID_SDK_ROOT}

echo ""
echo "To use Android SDK in the current session, run:"
echo "  source ~/.bashrc"
echo ""
echo "To verify installation:"
echo "  adb --version"
echo "  sdkmanager --list"
