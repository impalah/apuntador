# Solution: Provisioning Profile Errors in Xcode

## 🚨 Common Errors

### Error 1: "Your team has no devices"
```
Communication with Apple failed
Your team has no devices from which to generate a provisioning profile. 
Connect a device to use or manually add device IDs in Certificates, Identifiers & Profiles.
```

### Error 2: "No profiles found"
```
No profiles for 'io.apuntador.app' were found
Xcode couldn't find any iOS App Development provisioning profiles matching 'io.apuntador.app'.
```

## ✅ Solutions (Choose one option)

### Option A: Connect Physical iPhone/iPad (Easiest) ⭐

1. **Connect your iPhone/iPad** to Mac via USB
2. **Unlock the device** and accept "Trust this computer"
3. **In Xcode**:
   - Go to **Window** → **Devices and Simulators**
   - Verify that your device appears in the list
4. **Return to Signing & Capabilities**:
   - Xcode should automatically detect the device
   - Errors should disappear

### Option B: Register Device ID manually

If you don't have physical device available:

#### 1. Get device UDID
```bash
# Option 1: iPad/iPhone connected (real UDID)
xcrun xctrace list devices

# Option 2: Use automated script
make ios-detect-device

# Option 3: Manual in Xcode
# Window → Devices and Simulators → [Your iPad] → Identifier
```

#### 2. Register in Apple Developer Portal

1. Go to https://developer.apple.com/account/resources/devices/list
2. Click "**+**" → **Register Device**
3. **Platform**: iOS
4. **Device Name**: `Development iPad` (or any name you want)
5. **Device ID (UDID)**: Paste the obtained UDID
6. Click "**Continue**" → "**Register**"

#### 3. Update profiles in Xcode

```bash
# In Xcode:
# Preferences → Accounts → [Your Apple ID] → Download Manual Profiles
```

### Option C: App Store Only (No local development)

If you only want to upload to App Store without local development:

1. **In Signing & Capabilities**:
   - **Uncheck** ❌ "Automatically manage signing"
   - **Signing Certificate**: Select "**iOS Distribution**"
   - **Provisioning Profile**: Select "**App Store**" profile

2. **Create Distribution Profile manually**:
   - Go to https://developer.apple.com/account/resources/profiles/list
   - Click "**+**" → **App Store** → Continue
   - **App ID**: Select `io.apuntador.app`
   - **Certificates**: Select your Distribution Certificate
   - **Profile Name**: `Apuntador App Store`
   - **Generate** → **Download**

## 🔧 Complete Step-by-Step Configuration

### For development + App Store (Recommended):

#### 1. Connect iPhone/iPad (if you have one)
```bash
# Connect device → Trust → Xcode detects automatically
```

#### 2. Configure Xcode Signing
```
Signing & Capabilities:
├─ ✅ Automatically manage signing
├─ Team: [Your Apple Developer Team]
├─ Bundle Identifier: io.apuntador.app
└─ Provisioning Profile: [Auto-generated]
```

#### 3. Verify configuration
```bash
# You should see:
✅ iOS App Development: [Auto-generated profile]
✅ No errors in Signing section
```

### App Store only (without local development):

#### 1. Create Distribution Certificate (if you don't have one)
```bash
# In Keychain Access:
# Certificate Assistant → Request a Certificate from a Certificate Authority
# Upload CSR to Apple Developer Portal → Download certificate
```

#### 2. Create App Store Provisioning Profile
```
Apple Developer Portal → Profiles → + → App Store
├─ App ID: io.apuntador.app
├─ Certificate: [Your Distribution Certificate]
└─ Generate & Download
```

#### 3. Configure Xcode manually
```
Signing & Capabilities:
├─ ❌ Automatically manage signing
├─ Signing Certificate: iOS Distribution
└─ Provisioning Profile: [Upload downloaded profile]
```

## 🎯 Automated Script (Advanced option)

If you have iPhone connected, you can automate registration:

```bash
#!/bin/bash
# scripts/register-ios-device.sh

echo "🔍 Detecting connected iOS devices..."
UDID=$(xcrun xctrace list devices | grep "iPhone\|iPad" | grep -v Simulator | head -1 | grep -oE '\([0-9A-F]{8}-[0-9A-F]{12}\)' | tr -d '()')

if [ -z "$UDID" ]; then
    echo "❌ No iOS device detected. Connect your iPhone/iPad and try again."
    exit 1
fi

echo "📱 Found device with UDID: $UDID"
echo "🌐 Opening Apple Developer Portal to register device..."
open "https://developer.apple.com/account/resources/devices/add/"
echo "📋 Copy this UDID: $UDID"
```

## ✅ Final Verification

After solving, you should see:

```
Signing & Capabilities panel:
├─ ✅ No error messages
├─ 📱 Team: [Your team name]
├─ 🆔 Bundle Identifier: io.apuntador.app
├─ 📄 Provisioning Profile: [Generated or manual]
└─ ✅ Green checkmarks everywhere
```

## 🚨 If errors persist:

1. **Manual refresh**:
   ```
   Xcode → Preferences → Accounts → [Apple ID] → Download Manual Profiles
   ```

2. **Clean corrupted certificates**:
   ```bash
   # Keychain Access → Delete old iOS certificates → Try again
   ```

3. **Restart Xcode**:
   ```bash
   # Sometimes Xcode needs to restart to detect changes
   ```

---

**Which option do you prefer?** Option A (connect iPhone/iPad) is the fastest and easiest.