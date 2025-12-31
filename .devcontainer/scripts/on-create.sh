#!/bin/bash
set -e

echo "🔧 Setting up Apuntador development environment..."

# Fix permissions
sudo chown -R node:node /workspaces/apuntador

# Create necessary directories
mkdir -p /workspaces/apuntador/node_modules
mkdir -p /workspaces/apuntador/src-tauri/target
sudo chown -R node:node /workspaces/apuntador/node_modules
sudo chown -R node:node /workspaces/apuntador/src-tauri/target

# Test network connectivity
echo "🌐 Testing network connectivity..."
if ! ping -c 1 google.com > /dev/null 2>&1; then
    echo "⚠️  Warning: No internet connectivity detected. Some installations may fail."
fi

# Install Android SDK and NDK
echo "📱 Installing Android SDK and tools..."

# Detect architecture and enable amd64 if on ARM
ARCH=$(dpkg --print-architecture)
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    echo "🔧 ARM64 detected - enabling amd64 compatibility for Android SDK..."
    sudo dpkg --add-architecture amd64 || true
fi

sudo apt-get update
sudo apt-get install -y \
    wget \
    unzip \
    libgtk-3-0 \
    libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    patchelf

# Install amd64 dependencies if on ARM (required for Android SDK tools)
if [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
    echo "📦 Installing amd64 libraries for Android SDK compatibility..."
    sudo apt-get install -y \
        libc6:amd64 \
        libstdc++6:amd64 \
        zlib1g:amd64 || echo "⚠️  Warning: Some amd64 libraries failed to install"
fi

# Install Android Command Line Tools
ANDROID_SDK_ROOT=/home/node/Android/Sdk
CMDLINE_TOOLS_VERSION=11076708
mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools

# Skip Android SDK installation if SKIP_ANDROID env var is set
if [ "${SKIP_ANDROID}" = "true" ]; then
    echo "⏭️  Skipping Android SDK installation (SKIP_ANDROID=true)"
else
    if [ ! -d "${ANDROID_SDK_ROOT}/cmdline-tools/latest" ]; then
        echo "Downloading Android Command Line Tools..."
        if wget -q https://dl.google.com/android/repository/commandlinetools-linux-${CMDLINE_TOOLS_VERSION}_latest.zip -O /tmp/cmdline-tools.zip; then
            unzip -q /tmp/cmdline-tools.zip -d /tmp/cmdline-tools
            mv /tmp/cmdline-tools/cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest
            rm /tmp/cmdline-tools.zip
        else
            echo "⚠️  Failed to download Android Command Line Tools. Continuing without Android SDK..."
            echo "   You can install it manually later or rebuild the container."
            export SKIP_ANDROID=true
        fi
    fi
fi

# Set Android environment variables
export ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT}
export ANDROID_HOME=${ANDROID_SDK_ROOT}
export PATH=${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools:${ANDROID_SDK_ROOT}/emulator:${PATH}

# Only configure Android if not skipped
if [ "${SKIP_ANDROID}" != "true" ]; then
    # Accept Android licenses
    echo "📝 Accepting Android licenses..."
    yes | ${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager --licenses || true

    # Install Android SDK components with retries and error handling
    echo "📦 Installing Android SDK components..."

    # Function to install SDK package with retries
    install_sdk_package() {
        local package=$1
        local max_retries=3
        local retry=0
        
        while [ $retry -lt $max_retries ]; do
            echo "Installing $package (attempt $((retry + 1))/$max_retries)..."
            if ${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager "$package" --channel=0; then
                echo "✓ Successfully installed $package"
                return 0
            else
                retry=$((retry + 1))
                if [ $retry -lt $max_retries ]; then
                    echo "⚠ Failed to install $package, retrying in 5 seconds..."
                    sleep 5
                fi
            fi
        done
        
        echo "⚠ Warning: Could not install $package after $max_retries attempts"
        return 1
    }

    # Install packages individually with retries
    install_sdk_package "platform-tools" || echo "⚠ Continuing without platform-tools..."
    install_sdk_package "platforms;android-34" || echo "⚠ Continuing without android-34 platform..."
    install_sdk_package "build-tools;34.0.0" || echo "⚠ Continuing without build-tools..."
    install_sdk_package "ndk;26.1.10909125" || echo "⚠ Continuing without NDK..."
    install_sdk_package "cmake;3.22.1" || echo "⚠ Continuing without CMake..."
fi

# Add Android environment to bashrc and zshrc
{
    echo ""
    echo "# Android SDK"
    echo "export ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT}"
    echo "export ANDROID_HOME=\${ANDROID_SDK_ROOT}"
    echo "export PATH=\${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:\${ANDROID_SDK_ROOT}/platform-tools:\${ANDROID_SDK_ROOT}/emulator:\${PATH}"
} >> /home/node/.bashrc

{
    echo ""
    echo "# Android SDK"
    echo "export ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT}"
    echo "export ANDROID_HOME=\${ANDROID_SDK_ROOT}"
    echo "export PATH=\${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:\${ANDROID_SDK_ROOT}/platform-tools:\${ANDROID_SDK_ROOT}/emulator:\${PATH}"
} >> /home/node/.zshrc

# Install Tauri CLI
echo "🦀 Installing Tauri CLI..."
cargo install tauri-cli --version "^2.0" || echo "Tauri CLI already installed or failed"

# Install iOS build tools (CocoaPods) - requires Ruby
echo "🍎 Installing iOS build tools..."
sudo apt-get install -y ruby-full
sudo gem install cocoapods || echo "CocoaPods installation failed (expected in Linux container)"

# Install Ionic CLI globally
echo "⚡ Installing Ionic CLI..."
npm install -g @ionic/cli

# Install Capacitor CLI globally
echo "⚡ Installing Capacitor CLI..."
npm install -g @capacitor/cli

echo "✅ On-create setup completed!"
