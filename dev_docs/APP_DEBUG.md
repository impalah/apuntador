# [BUG] App Debugging Guide - Physical Devices

This guide covers how to debug **Apuntador** on physical Android and iOS devices using wireless debugging and USB connections.

---

## [MOBILE] Android Debugging

### Prerequisites

- Android device with **Developer Mode** enabled
- Device and development machine on the **same WiFi network** (for wireless debugging)
- Or USB cable (for wired debugging)

---

## [CONFIG] Android: Wireless Debugging Setup

### Step 1: Enable Developer Mode on Your Android Device

1. Open **Settings** on your Android device
2. Navigate to **About phone** or **About tablet**
3. Find **Build number** (may be under "Software information")
4. **Tap 7 times** on "Build number"
5. Enter your PIN/password when prompted
6. You'll see a message: "You are now a developer!"

### Step 2: Enable Wireless Debugging

1. Return to main **Settings** menu
2. Find and open **Developer options** (now visible)
3. Enable the **Developer options** toggle
4. Find and enable:
   - [OK] **USB debugging**
   - [OK] **Wireless debugging** (or "Wireless ADB")

### Step 3: Pair Your Device (First Time Only)

1. Inside **Developer options**, tap on **Wireless debugging**
2. Tap **Pair device with pairing code**
3. You'll see a screen showing:
   ```
   Pairing code: 123456
   IP address: 192.168.0.137
   Port: 43747
   ```
4. **Keep this screen open** (the code expires in ~60 seconds)

5. In your **devcontainer terminal**, run:

   ```bash
   adb pair <IP_ADDRESS>:<PAIRING_PORT>

   # Example:
   adb pair 192.168.0.137:43747
   ```

6. When prompted, enter the 6-digit **pairing code** from your device

7. You should see: `Successfully paired to 192.168.0.137:43747`

### Step 4: Connect to Your Device

1. Return to the **Wireless debugging** screen on your device
2. Note the **IP address and port** shown at the top (different from pairing port)

   ```
   IP address & Port: 192.168.0.137:44113
   ```

3. In your devcontainer terminal, run:

   ```bash
   adb connect <IP_ADDRESS>:<CONNECTION_PORT>

   # Example:
   adb connect 192.168.0.137:44113
   ```

4. You should see: `connected to 192.168.0.137:44113`

### Step 5: Verify Connection

```bash
# List connected devices
adb devices -l

# Expected output:
# List of devices attached
# 192.168.0.137:44113    device product:... model:SM_X115 ...
```

---

## [LAUNCH] Building and Installing on Android

### Quick Build & Install

Once your device is connected, use this complete workflow:

```bash
# From /workspaces/apuntador directory

# 1. Build the web app
npm run build

# 2. Sync Capacitor to Android project
npx cap sync android

# 3. Build the debug APK
cd android && ./gradlew assembleDebug && cd ..

# 4. Install on the connected device
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 5. Launch the app
adb shell am start -n io.apuntador.app/.MainActivity
```

### Alternative: Using npm Scripts

```bash
# Build and sync
npm run android:build

# Build debug APK (manual Gradle command)
cd android && ./gradlew assembleDebug && cd ..

# Install and run
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n io.apuntador.app/.MainActivity
```

---

## [REFRESH] Daily Development Workflow

### Reconnecting After Reboot

After restarting your device or computer, you only need to reconnect (no pairing):

```bash
# Connect to the device
adb connect 192.168.0.137:44113

# Verify connection
adb devices
```

**Note**: The IP address may change if your device gets a different DHCP lease. Check the **Wireless debugging** screen for the current IP.

### Rapid Development Cycle

Create a script for quick iterations:

```bash
#!/bin/bash
# quick-android-deploy.sh

# Verify connection
if ! adb devices | grep -q "192.168.0.137"; then
    echo "[PLUGIN] Connecting to device..."
    adb connect 192.168.0.137:44113
fi

echo "[BUILD]  Building web app..."
npm run build

echo "[FAST] Syncing Capacitor..."
npx cap sync android

echo "[PACKAGE] Building APK..."
cd android && ./gradlew assembleDebug && cd ..

echo "[INSTALL] Installing on device..."
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

echo "[LAUNCH] Launching app..."
adb shell am start -n io.apuntador.app/.MainActivity

echo "[OK] Deployment complete!"
```

Make it executable:

```bash
chmod +x quick-android-deploy.sh
./quick-android-deploy.sh
```

---

## [STATS] Debugging & Monitoring

### View Logs in Real-Time

```bash
# All logs from your app
adb logcat | grep -i apuntador

# All logs with tag filtering
adb logcat *:E  # Errors only
adb logcat *:W  # Warnings and errors
adb logcat *:D  # Debug and above

# Clear logs first, then show new ones
adb logcat -c && adb logcat | grep -i apuntador
```

### Chrome DevTools (Web Inspector)

1. Open **Chrome** browser on your development machine
2. Navigate to: `chrome://inspect/#devices`
3. Your device should appear under "Remote Target"
4. Click **inspect** next to `io.apuntador.app`
5. Use the full Chrome DevTools (Console, Network, Elements, etc.)

### Useful ADB Commands

```bash
# Check device info
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release

# Take a screenshot
adb exec-out screencap -p > screenshot.png

# Record screen video
adb shell screenrecord /sdcard/demo.mp4
# Stop recording with Ctrl+C, then pull:
adb pull /sdcard/demo.mp4

# Uninstall app
adb uninstall io.apuntador.app

# Clear app data
adb shell pm clear io.apuntador.app

# Force stop app
adb shell am force-stop io.apuntador.app

# Restart app
adb shell am force-stop io.apuntador.app && \
adb shell am start -n io.apuntador.app/.MainActivity
```

---

## [PLUGIN] Android: USB Debugging (Alternative)

If wireless debugging is unavailable or unreliable:

### Setup

1. Enable **Developer options** and **USB debugging** (Steps 1-2 from wireless section)
2. Connect your device via **USB cable**
3. On your device, tap **Allow** when prompted to "Allow USB debugging?"
4. Check the box **"Always allow from this computer"** (optional)

### Using USB in DevContainer

**Important**: USB devices need to be forwarded from host to container.

**Option A: Docker Desktop**

- USB passthrough is supported on Linux hosts
- Limited support on macOS/Windows

**Option B: Port Forwarding (Recommended for devcontainers)**

```bash
# On host machine (outside container), after connecting USB:
adb tcpip 5555

# From devcontainer:
adb connect <DEVICE_IP>:5555
```

---

## 🍎 iOS Debugging

### Prerequisites

- **macOS** host machine (iOS development requires Xcode)
- **Xcode 14+** installed from App Store
- **iOS device** (iPhone/iPad) with iOS 13+
- **USB cable** to connect device
- **Apple ID** (free account works for development)

### Important: Hybrid Development with DevContainer

Since iOS development requires macOS and Xcode, you'll use a **hybrid approach**:

- **DevContainer (Linux)**: Build web assets
- **macOS Host**: Run Xcode and deploy to device

[OK] **Good News**: The devcontainer uses **bind mounts** (shared directories), so `node_modules` is automatically accessible from both the container and your Mac. No special setup needed!

**How it works:**

```
/Users/yourname/projects/apuntador/
├── node_modules/          # Shared between Mac and container [OK]
│   └── @capacitor/ios/    # Xcode can read this directly
└── src-tauri/
    └── target/            # Also shared (Rust builds)
```

When you run `npm install` in the devcontainer, the files appear on your Mac automatically. When Xcode builds, it finds everything it needs.

---

## [LAUNCH] Building and Installing on iOS

### Step 1: Build Web Assets (In DevContainer)

```bash
# From /workspaces/apuntador directory

# Build the web app
npm run build

# Sync Capacitor to iOS project
npx cap sync ios
```

### Step 2: Open in Xcode (On macOS Host)

**Option A: Using npm script**

```bash
# On your Mac, in the project directory
npm run ios:dev
```

**Option B: Manual open**

```bash
# On your Mac
cd /path/to/apuntador
open ios/App/App.xcworkspace
```

**Option C: Using Makefile**

```bash
make ios-dev
```

[WARNING] **Important**: Always open `App.xcworkspace`, **NOT** `App.xcodeproj`

### Step 3: Configure Signing (First Time Only)

1. In Xcode, select the **App** project in the left sidebar
2. Select the **App** target
3. Go to the **Signing & Capabilities** tab
4. Under **Team**, click the dropdown:
   - If you see your Apple ID, select it
   - If empty, click **Add an Account...** and sign in with your Apple ID
5. Xcode will automatically create a provisioning profile
6. If you see errors about Bundle Identifier:
   - Change `io.apuntador.app` to something unique like `com.yourname.apuntador`

### Step 4: Trust Developer on Device (First Time Only)

1. Connect your iPad via USB
2. Unlock your iPad
3. If prompted on iPad, tap **Trust This Computer**
4. Enter your iPad passcode

### Step 5: Select Device and Run

1. In Xcode, top bar, click the device selector (next to "App" scheme)
2. You should see your iPad listed under **iOS Device**
   - If it shows "iPad (unavailable)", wait ~10 seconds while it prepares
3. Select your iPad
4. Click the **[PLAY] Run** button (or press `Cmd + R`)
5. Xcode will:
   - Build the app
   - Install on your iPad
   - Launch automatically

### Step 6: Trust Developer Certificate (First Time)

If the app doesn't launch and shows "Untrusted Developer":

1. On your iPad: **Settings > General > VPN & Device Management**
2. Under **Developer App**, tap on your Apple ID
3. Tap **Trust "[Your Apple ID]"**
4. Confirm with **Trust**
5. Return to Xcode and click **[PLAY] Run** again

---

## [BUG] Debugging on iOS

### Option 1: Safari Web Inspector (Recommended)

The most powerful debugging option for Capacitor apps.

**Setup (One-time):**

1. **On your iPad:**
   - Go to **Settings > Safari > Advanced**
   - Enable **Web Inspector**

2. **On your Mac:**
   - Open **Safari**
   - If you don't see "Develop" in the menu bar:
     - Safari > Settings > Advanced
     - Check [OK] **Show Develop menu in menu bar**

**Debugging:**

1. Run the app on your iPad from Xcode
2. On your Mac, open **Safari**
3. In Safari menu bar: **Develop** → **[Your iPad's Name]** → **Apuntador** (or localhost)
4. Safari Web Inspector opens with full DevTools:
   - **Console**: View `console.log()`, errors, warnings
   - **Elements**: Inspect DOM, modify CSS in real-time
   - **Network**: Monitor HTTP requests
   - **Debugger**: Set breakpoints, step through code
   - **Storage**: Inspect localStorage, IndexedDB, cookies

**Using in your code:**

```typescript
// These will appear in Safari Web Inspector Console
console.log('Debug info:', userData)
console.error('Error occurred:', error)
console.warn('Warning:', someIssue)
console.table(arrayData) // Nice table format
```

### Option 2: Xcode Console

**View Native Logs:**

1. While app is running from Xcode
2. Open the **Console** area (bottom right pane)
3. Filter messages using the search box:
   ```
   Capacitor    # Capacitor plugin logs
   WebKit       # WebView logs
   Error        # Only errors
   JS LOG       # JavaScript console.log
   ```

**Useful for:**

- Native iOS errors
- Capacitor plugin issues
- App lifecycle events

### Option 3: Xcode Debugger (Advanced)

For Swift/Objective-C native code debugging:

1. Set breakpoints in native files (`ios/App/App/` directory)
2. Run with debugger (`Cmd + R`)
3. Inspect native variables when breakpoints hit

---

## [REFRESH] Daily iOS Development Workflow

### Quick Iteration Cycle

**When you change Vue/TypeScript code:**

```bash
# In DevContainer (or on Mac)
npm run build && npx cap sync ios

# Then in Xcode
# Press Cmd + R to rebuild and run
```

### With Live Reload (Optional)

For faster development without rebuilding each time:

**Setup:**

1. **Find your Mac's local IP:**

   ```bash
   # On Mac
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Example output: inet 192.168.0.100
   ```

2. **Start dev server in DevContainer:**

   ```bash
   npm run dev
   # Server running on http://localhost:3000
   ```

3. **Configure Capacitor temporarily:**

   Edit `capacitor.config.ts`:

   ```typescript
   const config: CapacitorConfig = {
     // ... existing config
     server: {
       url: 'http://192.168.0.100:3000', // Your Mac's IP
       cleartext: true,
     },
   }
   ```

4. **Sync and run:**

   ```bash
   npx cap sync ios
   # Then Run from Xcode
   ```

5. **Develop**: Changes auto-reload on device
6. **When done**: Remove `server` config from `capacitor.config.ts`

---

## [STATS] Monitoring & Debugging Tools

### View Device Logs

```bash
# On Mac, monitor iOS device logs
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "Apuntador"'

# Or for physical devices (requires installing idevicesyslog)
brew install libimobiledevice
idevicesyslog | grep -i apuntador
```

### Screenshots & Video

**Xcode Method:**

1. While app is running, go to **Debug > View Debugging > Capture View Hierarchy**
2. For screenshots: `Cmd + S` while viewing your app

**Device Method:**

- iPad: Press **Power + Volume Up** simultaneously
- Screenshots save to Photos app

### Network Inspection

Use Safari Web Inspector's **Network** tab:

- See all HTTP/HTTPS requests
- Check request/response headers
- View response bodies
- Monitor timing and performance

---

## [TOOLS] Useful Xcode Shortcuts

```bash
Cmd + R          # Build and Run
Cmd + .          # Stop running app
Cmd + B          # Build only
Cmd + Shift + K  # Clean Build Folder
Cmd + 0          # Show/hide Navigator
Cmd + Shift + Y  # Show/hide Console
Cmd + Shift + 2  # Show Breakpoint Navigator
```

---

## [PLUGIN] iOS: USB vs Wireless Debugging

### USB Debugging (Default)

- **Pros**: More stable, faster deployment
- **Cons**: Requires cable, limited mobility

### Wireless Debugging (iOS 9+)

1. Connect iPad via USB initially
2. In Xcode: **Window > Devices and Simulators**
3. Select your iPad
4. Check [OK] **Connect via network**
5. Disconnect USB cable
6. iPad will appear in device menu with a network icon
7. Select and run as normal

**Note**: Both devices must be on same WiFi network

---

## [CONFIG] Quick Development Script (iOS)

Create a script for rapid iterations:

```bash
#!/bin/bash
# quick-ios-deploy.sh

echo "[BUILD]  Building web app..."
npm run build

echo "[FAST] Syncing Capacitor..."
npx cap sync ios

echo "[MOBILE] Opening Xcode..."
open ios/App/App.xcworkspace

echo "[OK] Ready! Press [PLAY] in Xcode to run on iPad"
```

Make executable:

```bash
chmod +x quick-ios-deploy.sh
./quick-ios-deploy.sh
```

---

## [BUG] Troubleshooting

### Android Device Not Found

**Problem**: `adb devices` shows no devices

**Solutions**:

```bash
# Restart ADB server
adb kill-server
adb start-server

# Reconnect
adb connect <DEVICE_IP>:<PORT>

# Check if device IP changed (check Wireless debugging screen)
```

### Connection Timeout

**Problem**: `adb connect` hangs or times out

**Solutions**:

- Ensure device and PC are on the **same WiFi network**
- Check firewall settings (allow port 5555 and dynamic ports 30000-65535)
- Disable VPN on development machine or device
- Try USB debugging instead

### App Doesn't Launch

**Problem**: APK installs but app doesn't start

**Solutions**:

```bash
# Check if app is installed
adb shell pm list packages | grep apuntador

# Clear app data and try again
adb shell pm clear io.apuntador.app
adb shell am start -n io.apuntador.app/.MainActivity

# Check logs for crash reports
adb logcat | grep -i "AndroidRuntime\|apuntador"
```

### Build Failures

**Problem**: `./gradlew assembleDebug` fails

**Common causes**:

- Java version mismatch (need JDK 17)
- Missing Android SDK components
- Network issues downloading dependencies

**Solutions**:

```bash
# Verify Java version
java -version  # Should show 17.x.x

# Verify Android SDK
echo $ANDROID_SDK_ROOT  # Should be set
adb --version  # Should work

# Clean Gradle cache
cd android
./gradlew clean
./gradlew assembleDebug --refresh-dependencies
cd ..
```

### "Could not open '/lib64/ld-linux-x86-64.so.2'" Error

**Problem**: `adb` fails with library error on ARM64 devcontainer

**Solution**: Your devcontainer is missing amd64 compatibility libraries. Rebuild:

```bash
# In VS Code:
# Cmd+Shift+P → "Dev Containers: Rebuild Container"
```

See [.devcontainer/TROUBLESHOOTING_ANDROID_SDK.md](../.devcontainer/TROUBLESHOOTING_ANDROID_SDK.md) for details.

### iOS: "No such file or directory" - Capacitor.h or other node_modules files

**Problem**: Xcode build fails with errors like:

```
lstat(/Users/yourname/projects/apuntador/node_modules/@capacitor/ios/Capacitor/Capacitor/Capacitor.h):
No such file or directory (2)
```

**Cause**: The devcontainer uses a Docker volume for `node_modules`, which is not accessible to Xcode running on the host Mac.

**Solution**:

```bash
# On your Mac (outside the devcontainer)
cd /Users/yourname/projects/apuntador

# Install dependencies on the host
npm install

# Verify the files now exist
ls -la node_modules/@capacitor/ios/Capacitor/Capacitor/Capacitor.h

# Clean and rebuild in Xcode
# Cmd + Shift + K (Clean Build Folder)
# Cmd + R (Build and Run)
```

**Why this happens:**

- DevContainer mounts `node_modules` as a Docker volume for performance
- This volume only exists inside the container
- Xcode runs on the host and cannot access Docker volumes
- Solution: Install `node_modules` on both host and container

**When to run `npm install` on host again:**

- After pulling changes that modify `package.json` or `package-lock.json`
- After adding new dependencies in the container
- If you see similar "file not found" errors in Xcode

### iOS: Device Not Appearing in Xcode

**Problem**: iPad connected but not showing in Xcode device list

**Solutions**:

- Unlock your iPad
- Trust the computer (tap "Trust" on iPad dialog)
- Wait 10-15 seconds for device to prepare
- Check cable connection (try different USB port/cable)
- Restart Xcode: `Cmd + Q`, then reopen
- Check if device appears in: **Window > Devices and Simulators**

### iOS: "Untrusted Developer" Error

**Problem**: App installs but doesn't launch, shows untrusted developer message

**Solution**:

1. On iPad: **Settings > General > VPN & Device Management**
2. Under **Developer App**, tap your Apple ID
3. Tap **Trust "[Your Apple ID]"**
4. Confirm with **Trust**
5. Try running from Xcode again

### iOS: Code Signing Errors

**Problem**: Build fails with provisioning profile or signing errors

**Solutions**:

- In Xcode, select **App** target > **Signing & Capabilities**
- Try **Automatically manage signing**
- Change Bundle Identifier to something unique (e.g., `com.yourname.apuntador`)
- Ensure you're signed in: **Xcode > Settings > Accounts**
- Clean build folder: `Cmd + Shift + K`, then build again

### iOS: Safari Web Inspector Not Showing Device

**Problem**: iPad doesn't appear in Safari's Develop menu

**Solutions**:

- Ensure **Web Inspector** is enabled on iPad (Settings > Safari > Advanced)
- App must be running on the device
- Both Mac and iPad should be on same network (for wireless) or connected via USB
- Close and reopen Safari
- Try toggling Web Inspector off and on again on iPad

### iOS: Build Succeeds but App Crashes on Launch

**Solutions**:

```bash
# View crash logs in Xcode
# Window > Devices and Simulators > Select your iPad > View Device Logs

# Or check Console app on Mac:
# Filter for your device name
```

Common causes:

- Missing Capacitor plugins - run `npx cap sync ios`
- Corrupted build - Clean build folder: `Cmd + Shift + K`
- Outdated CocoaPods - `cd ios/App && pod install --repo-update`

---

## [DOCS] Related Documentation

- [BUILD-ANDROID.md](BUILD-ANDROID.md) - Complete Android build guide
- [BUILD-iOS.md](BUILD-iOS.md) - iOS build guide
- [.devcontainer/README.md](../.devcontainer/README.md) - DevContainer setup
- [.devcontainer/TROUBLESHOOTING_ANDROID_SDK.md](../.devcontainer/TROUBLESHOOTING_ANDROID_SDK.md) - Android SDK issues

---

## [TARGET] Quick Reference

### First-Time Setup (Android WiFi)

```bash
# 1. Enable Developer Mode on device (tap Build Number 7 times)
# 2. Enable Wireless Debugging in Developer Options
# 3. Pair device
adb pair <IP>:<PAIRING_PORT>  # Enter 6-digit code

# 4. Connect
adb connect <IP>:<CONNECTION_PORT>

# 5. Verify
adb devices
```

### First-Time Setup (iOS USB)

```bash
# 1. Build web assets (DevContainer or Mac)
npm run build && npx cap sync ios

# 2. Open Xcode (Mac only)
open ios/App/App.xcworkspace

# 3. In Xcode:
#    - Select your iPad from device menu
#    - Configure signing (Signing & Capabilities tab)
#    - Click Run ([PLAY])
#    - Trust developer on iPad if prompted
```

### Daily Deployment (Android)

```bash
# 1. Connect (if needed)
adb connect 192.168.0.137:44113

# 2. Build & install
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug && cd ..
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n io.apuntador.app/.MainActivity
```

### Daily Deployment (iOS)

```bash
# 1. Build web assets
npm run build && npx cap sync ios

# 2. Run from Xcode (Mac)
# Open Xcode and press Cmd + R
# Or use: npm run ios:dev (opens Xcode)
```

### Common Commands (Android)

```bash
adb devices              # List connected devices
adb logcat              # View logs
adb install app.apk     # Install APK
adb uninstall <pkg>     # Remove app
adb shell am start ...  # Launch app
```

### Common Commands (iOS)

```bash
# Build and sync
npm run ios:build       # Build web + sync iOS

# Open Xcode
open ios/App/App.xcworkspace

# List simulators
npm run ios:list-simulators

# View device logs (requires libimobiledevice)
idevicesyslog | grep -i apuntador
```

### Debugging Quick Access

**Android:**

- Logs: `adb logcat | grep -i apuntador`
- Chrome DevTools: `chrome://inspect/#devices`

**iOS:**

- Safari Web Inspector: Safari > Develop > [Your iPad] > Apuntador
- Xcode Console: Bottom panel in Xcode while running

---

## [SERVER] Desktop Debugging (Tauri)

### Prerequisites

- **macOS** (for macOS builds), Windows, or Linux
- **Rust** toolchain installed
- **Xcode Command Line Tools** (macOS only)
- **Node.js** and dependencies already installed

[WARNING] **Important**: Tauri **cannot** be built from the devcontainer for macOS. You must build on your Mac directly.

### Why Build on Host Instead of DevContainer?

Tauri desktop apps require:

- Native system frameworks (WebKit on macOS, WebView2 on Windows)
- Platform-specific linkers and build tools
- Code signing capabilities

The devcontainer (Linux) cannot create macOS binaries even though it has Rust installed.

---

## [TOOLS] macOS: Setup for Tauri Development

### Step 1: Install Xcode Command Line Tools

```bash
# Check if already installed
xcode-select -p

# If not installed (shows error), install:
xcode-select --install

# A dialog will appear - click Install and wait (~5-10 minutes)

# Verify installation
xcode-select -p
# Should show: /Library/Developer/CommandLineTools
# or: /Applications/Xcode.app/Contents/Developer
```

### Step 2: Install Rust

Since you have Homebrew, you can use it or the official installer:

**Option A: Using rustup (Recommended)**

```bash
# Install Rust via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow the prompts (default options are fine)
# Select option 1) Proceed with installation (default)

# Activate Rust in current session
source $HOME/.cargo/env

# Add to your shell profile automatically (already done by installer)
# For zsh (default on macOS):
echo 'source $HOME/.cargo/env' >> ~/.zshrc
```

**Option B: Using Homebrew**

```bash
# Install Rust
brew install rust

# Note: rustup method is preferred for Tauri development
# as it allows easier target management
```

### Step 3: Verify Rust Installation

```bash
# Check Rust version
rustc --version
# Should show: rustc 1.XX.X (...)

# Check Cargo version
cargo --version
# Should show: cargo 1.XX.X (...)

# Check rustup (if installed via rustup)
rustup --version
# Should show: rustup 1.XX.X (...)
```

### Step 4: Install Rust Targets for Cross-Compilation

```bash
# For Apple Silicon Macs - add Intel target for universal binaries
rustup target add x86_64-apple-darwin

# For Intel Macs - add Apple Silicon target for universal binaries
rustup target add aarch64-apple-darwin

# Verify installed targets
rustup target list | grep installed
# Should show both:
# aarch64-apple-darwin (installed)
# x86_64-apple-darwin (installed)
```

### Step 5: Install Tauri CLI (Optional)

```bash
# Install Tauri CLI globally (makes commands shorter)
cargo install tauri-cli

# Or use via npm scripts (already configured in package.json)
# No need to install globally if using npm run commands
```

### Step 6: Verify All Prerequisites

```bash
# Check all tools
which rustc && echo "[OK] Rust installed"
which cargo && echo "[OK] Cargo installed"
xcode-select -p && echo "[OK] Xcode tools installed"
which node && echo "[OK] Node.js installed"

# Check for required dependencies
brew list | grep -E "pkg-config|openssl" || brew install pkg-config openssl
```

---

## [LAUNCH] Building Tauri Desktop App on macOS

### Development Mode (Hot Reload)

**In your Mac terminal (NOT in devcontainer):**

```bash
# Navigate to project
cd /Users/yourname/projects/apuntador

# Run Tauri in development mode
npm run tauri:dev

# Or using Makefile:
make tauri-dev
```

**What happens:**

1. Vite builds the frontend
2. Rust compiles the backend (first time: 5-10 minutes)
3. Native macOS window opens with your app
4. Hot reload enabled - changes reflect automatically

### Production Build

**For your Mac's architecture:**

```bash
# Apple Silicon (M1/M2/M3)
npm run tauri:build:mac
# Or: make tauri-build-mac

# Intel Mac
npm run tauri:build:mac-intel
# Or: make tauri-build-mac-intel

# Universal binary (both architectures, larger file)
npm run tauri:build:mac-universal
# Or: make tauri-build-mac-universal
```

**Build output location:**

```
src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Apuntador.app
src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/Apuntador_1.1.89.dmg
```

**To run the built app:**

```bash
open src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Apuntador.app
```

### Debug Build (Faster compilation)

```bash
# Build without optimizations (faster to compile, slower to run)
npm run tauri:build:mac-debug
# Or: make tauri-build-mac-debug

# No DMG is created, just the .app
```

---

## [BUG] Debugging Desktop App

### Console Logs

**In your Rust code** (`src-tauri/src/lib.rs`):

```rust
println!("Debug message from Rust");
eprintln!("Error message from Rust");
```

**In your Vue/TypeScript code:**

```typescript
console.log('Debug from frontend')
console.error('Error from frontend')
```

**View logs:**

```bash
# When running in dev mode, logs appear in the terminal
npm run tauri:dev

# Frontend logs in browser DevTools
# Right-click on app window → Inspect Element
```

### DevTools

**Enable DevTools in development:**

Already configured in `package.json`:

```json
"tauri:dev": "tauri dev --features devtools"
```

**Access DevTools:**

- Right-click anywhere in the app
- Select **Inspect Element**
- Full Chrome DevTools available

### Debugging Rust Code

**Add debug symbols:**

Edit `src-tauri/Cargo.toml`:

```toml
[profile.dev]
debug = true
```

**Use Rust debugger:**

```bash
# In VS Code with rust-analyzer extension
# Set breakpoints in Rust files
# Run "Debug" from the sidebar
```

---

## [CONFIG] Troubleshooting Tauri on macOS

### "xcrun: error: unable to find utility"

**Problem**: Xcode Command Line Tools not installed

**Solution:**

```bash
xcode-select --install
# Wait for installation to complete
xcode-select -p  # Verify
```

### "linker `cc` not found"

**Problem**: Missing C compiler

**Solution:**

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Or install full Xcode from App Store
```

### "error: failed to run custom build command"

**Problem**: Missing system dependencies

**Solution:**

```bash
# Install required dependencies
brew install pkg-config openssl

# Retry build
npm run tauri:dev
```

### Build is extremely slow (first time)

**Expected**: First Rust compilation takes 5-10 minutes

**Why:**

- Rust compiles all dependencies from source
- Tauri has many dependencies
- Subsequent builds are much faster (30 seconds - 2 minutes)

**Speed up future builds:**

```bash
# Use release profile with fewer optimizations
cargo build --release
```

### "Failed to bundle project"

**Problem**: Missing app icon or config error

**Solution:**

```bash
# Check tauri.conf.json is valid
cat src-tauri/tauri.conf.json

# Ensure icons exist
ls -la src-tauri/icons/

# Clean and rebuild
cd src-tauri
cargo clean
cd ..
npm run tauri:build:mac
```

### App crashes on launch

**Debug steps:**

```bash
# Run in dev mode to see error messages
npm run tauri:dev

# Check Rust console output
# Check browser DevTools console

# Verify all dependencies installed
npm install
cd src-tauri && cargo check
```

### "Cannot find native binding" - npm optional dependencies error

**Problem**: Error when running `npm run tauri:dev` on Mac:

```
Error: Cannot find native binding. npm has a bug related to optional dependencies
Cannot find module './cli.darwin-universal.node'
Cannot find module '@tauri-apps/cli-darwin-arm64'
```

**Cause**: The `node_modules` directory is shared between the devcontainer (Linux) and your Mac via bind mounts. The devcontainer installed Linux binaries, which don't work on macOS.

**[ERROR] Don't do this**: Running `npm install` on your Mac will break the devcontainer by replacing Linux binaries with macOS binaries.

**[OK] Solution: Install Tauri CLI via Cargo**

Instead of using npm's Tauri CLI, install it globally via Cargo (Rust's package manager):

```bash
# On your Mac
cargo install tauri-cli --version "^2.0.0"

# Verify installation
cargo tauri --version
# Should show: tauri-cli 2.x.x
```

**Use cargo commands instead of npm:**

```bash
# Development mode (replaces: npm run tauri:dev)
cargo tauri dev

# Build for Apple Silicon (replaces: npm run tauri:build:mac)
cargo tauri build --target aarch64-apple-darwin

# Build for Intel (replaces: npm run tauri:build:mac-intel)
cargo tauri build --target x86_64-apple-darwin

# Build universal binary (replaces: npm run tauri:build:mac-universal)
cargo tauri build --target universal-apple-darwin

# Show Tauri environment info
cargo tauri info
```

**Why this works:**

- `cargo install tauri-cli` installs the CLI in `~/.cargo/bin/` (not in `node_modules`)
- No conflict with the devcontainer's `node_modules`
- Both environments work independently
- Cargo manages the native binaries correctly for macOS

**Alternative: Update Makefile targets**

The existing Makefile targets still work, they'll use `cargo tauri` if available:

```bash
make tauri-dev              # Uses cargo tauri dev
make tauri-build-mac        # Uses cargo tauri build
```

**When to use each:**

- **In devcontainer**: `npm run tauri:dev` won't work (Linux can't build macOS apps)
- **On Mac**: Use `cargo tauri dev` or Makefile targets

### "failed to build x86_64-apple-darwin binary: Target x86_64-apple-darwin is not installed"

**Problem**: Error when building universal binary:

```
Error failed to build x86_64-apple-darwin binary: Target x86_64-apple-darwin is not installed
(installed targets: aarch64-apple-darwin). Please run `rustup target add x86_64-apple-darwin`.
```

**Cause**: Universal binaries require both Apple Silicon (aarch64) and Intel (x86_64) targets installed.

**Solution:**

```bash
# Add Intel target (on Apple Silicon Mac)
rustup target add x86_64-apple-darwin

# Or add Apple Silicon target (on Intel Mac)
rustup target add aarch64-apple-darwin

# Verify both are installed
rustup target list | grep installed
# Should show:
# aarch64-apple-darwin (installed)
# x86_64-apple-darwin (installed)

# Now build universal binary
cargo tauri build --target universal-apple-darwin
```

**Note**: You only need the universal binary if distributing to users with different Mac architectures. For personal use, stick to your native architecture:

```bash
# Apple Silicon only (faster build)
cargo tauri build --target aarch64-apple-darwin

# Intel only (faster build)
cargo tauri build --target x86_64-apple-darwin
```

---

## [STATS] Workflow: DevContainer + Mac Tauri

### Recommended Setup

**[WARNING] Important**: Due to shared `node_modules` (bind mounts), you must build the frontend in the devcontainer and then run Tauri on Mac.

**Terminal 1 - DevContainer (Build frontend):**

```bash
# In VS Code devcontainer
npm run build
# Creates dist/ directory with production build
```

**Terminal 2 - Mac (Run Tauri):**

```bash
# In Mac terminal, same project
cd /Users/yourname/projects/apuntador
cargo tauri dev
# Uses the dist/ folder created by devcontainer
```

### Why This Workflow?

**Problem**: `node_modules` is shared via bind mounts between Linux (devcontainer) and macOS (host). Native binaries like `@rollup/rollup-darwin-arm64` are missing because `npm install` ran in Linux.

**Solution**:

- [OK] **Build in devcontainer** - npm/Vite work correctly with Linux binaries
- [OK] **Run Tauri on Mac** - Uses the pre-built `dist/` folder
- [OK] **No conflicts** - Each environment uses what it needs

### Development Mode (Hot Reload)

**Option 1: Manual refresh (recommended)**

```bash
# Terminal 1 - DevContainer: Build on each change
npm run build

# Terminal 2 - Mac: Run Tauri once
cargo tauri dev
# Refresh the app window manually after each build
```

**Option 2: Watch mode (advanced)**

```bash
# Terminal 1 - DevContainer: Watch and rebuild
npm run build -- --watch

# Terminal 2 - Mac: Run Tauri
cargo tauri dev
# App will reload automatically when dist/ changes
```

### Build for Distribution

**On your Mac:**

```bash
cd /Users/yourname/projects/apuntador

# 1. Build web assets IN DEVCONTAINER (important!)
# Open devcontainer terminal and run:
npm run build

# 2. Then on Mac: Build Tauri app
cargo tauri build --target aarch64-apple-darwin

# 3. Find your .app and .dmg
ls -lh src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/
ls -lh src-tauri/target/aarch64-apple-darwin/release/bundle/macos/
```

**Universal binary (Apple Silicon + Intel):**

```bash
# 1. Build in devcontainer
npm run build

# 2. Build on Mac
cargo tauri build --target universal-apple-darwin
```

---

## [TARGET] Quick Reference - Desktop

### First-Time Setup (macOS)

```bash
# 1. Install Xcode Command Line Tools
xcode-select --install

# 2. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 3. Add cross-compilation targets (for universal binaries)
rustup target add x86_64-apple-darwin      # Intel
rustup target add aarch64-apple-darwin     # Apple Silicon

# 4. Install dependencies
brew install pkg-config openssl

# 5. Install Tauri CLI (optional)
cargo install tauri-cli --version "^2.0.0"

# 6. Verify
rustc --version && cargo --version
rustup target list | grep installed
```

### Daily Development (macOS)

```bash
# STEP 1: Build frontend in devcontainer
# (In VS Code devcontainer terminal)
npm run build

# STEP 2: Run Tauri on Mac
# (In Mac terminal)
cd /Users/yourname/projects/apuntador
cargo tauri dev
```

**Quick iteration:**

```bash
# Terminal 1 - DevContainer: Watch mode
npm run build -- --watch

# Terminal 2 - Mac: Run once
cargo tauri dev
# Reloads automatically when dist/ changes
```

### Build for Distribution (macOS)

```bash
# STEP 1: In devcontainer
npm run build

# STEP 2: On Mac - Apple Silicon
cargo tauri build --target aarch64-apple-darwin

# Intel Mac
cargo tauri build --target x86_64-apple-darwin

# Universal (both architectures)
cargo tauri build --target universal-apple-darwin
```

### Common Tauri Commands

```bash
# Development mode
npm run tauri:dev
cargo tauri dev --features devtools

# Build
npm run tauri:build:mac
cargo tauri build

# Info about Tauri setup
cargo tauri info

# Clean build artifacts
cd src-tauri && cargo clean
```

---

**Last updated**: December 31, 2025
