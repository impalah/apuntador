# Apple Developer App ID Creation Guide for Apuntador

## Create App ID (Bundle ID) in Apple Developer Portal

### 📍 Location
1. Go to: https://developer.apple.com/account/
2. **Certificates, Identifiers & Profiles**
3. **Identifiers** → **+** (blue button)
4. Select **App IDs** → **Continue**

---

## 📝 Exact Values for Apuntador

### 1. Description
```
Apuntador - Professional Teleprompter
```

### 2. Bundle ID
```
io.apuntador.app
```
**⚠️ IMPORTANT**: This Bundle ID must match exactly with your Xcode project.

### 3. Bundle ID Type
- ✅ **Explicit** (recommended)
- ❌ **Wildcard** (do not select)

---

## 🔧 Capabilities

### Capabilities NEEDED for Apuntador:

#### ✅ **App Groups** (Optional - for future expansions)
- **Reason**: Share data between extensions
- **Configuration**: Create later if needed

#### ✅ **Background Modes** (NOT needed currently)
- **Reason**: Apuntador doesn't run in background
- **Action**: ❌ DO NOT select

#### ✅ **Game Center** (NOT needed)
- **Reason**: Not a game
- **Action**: ❌ DO NOT select

#### ✅ **HealthKit** (NOT needed)
- **Reason**: Doesn't access health data
- **Action**: ❌ DO NOT select

#### ✅ **HomeKit** (NOT needed)
- **Reason**: Doesn't control home devices
- **Action**: ❌ DO NOT select

#### ✅ **In-App Purchase** (NOT needed currently)
- **Reason**: Apuntador is free without purchases
- **Action**: ❌ DO NOT select

#### ✅ **Personal VPN** (NOT needed)
- **Reason**: Doesn't require VPN
- **Action**: ❌ DO NOT select

#### ✅ **Push Notifications** (NOT needed currently)
- **Reason**: Apuntador works offline
- **Action**: ❌ DO NOT select

#### ✅ **SiriKit** (NOT needed currently)
- **Reason**: No Siri integration
- **Action**: ❌ DO NOT select

#### ✅ **Wireless Accessory Configuration** (NOT needed)
- **Reason**: Doesn't configure accessories
- **Action**: ❌ DO NOT select

---

## 🎯 **Recommended Minimal Configuration**

### For Apuntador's initial version:
```
Description: Apuntador - Professional Teleprompter
Bundle ID: io.apuntador.app
Bundle ID Type: Explicit
Capabilities: NONE (leave everything unselected)
```

### Why no capabilities?
- **Apuntador is a simple app** that works completely offline
- **Doesn't need special Apple services**
- **Capabilities can be added later** without problems
- **Less complexity** = less possibility of review errors

---

## 📋 Step-by-Step Process

### Step 1: Access Portal
1. **Apple Developer Portal**: https://developer.apple.com/account/
2. **Login**: Your developer Apple ID
3. **Navigate**: Certificates, Identifiers & Profiles

### Step 2: Create Identifier
1. **Identifiers** → **+**
2. **App IDs** → **Continue**

### Step 3: Configure App ID
1. **Description**: `Apuntador - Professional Teleprompter`
2. **Bundle ID**: Select **Explicit**
3. **Bundle ID**: Type `io.apuntador.app`

### Step 4: Capabilities
1. **Review list** of available capabilities
2. **DO NOT select any** to start
3. **Continue**

### Step 5: Confirm
1. **Review**: Verify information
2. **Register**: Create App ID
3. **Done**: App ID created!

---

## 🔄 After Creating the App ID

### In App Store Connect
Now you can create the app in App Store Connect:

1. **App Store Connect**: https://appstoreconnect.apple.com/
2. **My Apps** → **+** → **New App**
3. **Bundle ID**: Select `io.apuntador.app` (will appear in list)

### Information for App Store Connect
```
App Name: Apuntador
Primary Language: English (U.S.)  
Bundle ID: io.apuntador.app (select from list)
SKU: apuntador-ios-2025
```

---

## 🛠️ Future Capabilities (Optional)

If you want to add features in the future, you can edit the App ID:

### Push Notifications
- **For**: Reminder notifications
- **When**: If you add scheduled reminder function

### Background App Refresh  
- **For**: Background synchronization
- **When**: If you add cloud synchronization

### App Groups
- **For**: Share with extensions (widget, etc.)
- **When**: If you create iOS widget or extensions

---

## ❗ Common Problems and Solutions

### "Bundle ID already exists"
**Problem**: Someone already registered that Bundle ID
**Solution**: 
1. Verify if YOU already created it before
2. If it's not yours, change to: `io.apuntador.teleprompter` or similar

### "Invalid Bundle ID format"
**Problem**: Incorrect format
**Solution**: 
- ✅ Correct: `io.apuntador.app`
- ❌ Incorrect: `io.apuntador.app.` (trailing dot)
- ❌ Incorrect: `Io.Apuntador.App` (uppercase)

### "You need to be part of a team"
**Problem**: You don't have Apple Developer Program
**Solution**: 
1. Enroll in Apple Developer Program ($99/year)
2. Wait for approval (1-2 days)

---

## 📞 Executive Summary

### ✅ **Use These Exact Values:**
```
Description: Apuntador - Professional Teleprompter
Bundle ID: io.apuntador.app  
Bundle ID Type: Explicit
Capabilities: NONE (for now)
```

### ⏱️ **Estimated Time**: 5-10 minutes
### 💰 **Cost**: Included in Apple Developer Program
### 🔄 **Reversible**: Yes, capabilities can be added later

With this you'll have your App ID ready to create the app in App Store Connect! 🍎✨