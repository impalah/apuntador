# Xcode Visual Guide for Apuntador iOS

This guide shows you exactly where to find each option in Xcode to configure signing and upload your app.

## 🎯 Signing Configuration

### Step 1: Find the App Target

```
📁 Navigator Panel (left)
└── 📘 App (blue project icon - CLICK HERE)
    └── 🎯 TARGETS
        └── 📱 App (select this one, NOT "App (iOS)")
```

**Visual:**
```
Navigator               Main Panel
├─ 📘 App          →   ┌─ TARGETS ─────────┐
├─ 📂 App              │ 📱 App            │ ← THIS ONE
├─ 📂 Pods             │ 🧪 AppTests       │
└─ ...                 │ 📱 App (iOS)      │
                       └───────────────────┘
```

### Step 2: Navigate to Signing & Capabilities

Once "**App**" target is selected:

```
Tabs in Main Panel:
┌─────────┬─────────────────────┬──────────┬─────────┐
│ General │ Signing & Capabilities │ Resource │ Build   │
└─────────┴─────────────────────┴──────────┴─────────┘
                     ↑ CLICK HERE
```

### Step 3: Configure Team and Bundle ID

In **Signing & Capabilities** tab:

```
┌─ Signing ─────────────────────────────────┐
│ ✅ Automatically manage signing            │ ← CHECK THIS
│                                           │
│ Team: [Dropdown ▼]                       │ ← SELECT YOUR TEAM
│                                           │
│ Bundle Identifier: io.apuntador.app       │ ← VERIFY THIS
└───────────────────────────────────────────┘
```

## 📦 Archive Process

### Step 1: Select Device Target

In Xcode's **top toolbar**:

```
┌─ Scheme Control ─────────────────┐
│ ▶️ App    │ Any iOS Device (arm64) ▼ │ ← CLICK DROPDOWN
└──────────┴─────────────────────────┘

Options:
├─ 📱 Any iOS Device (arm64)  ← THIS FOR APP STORE
├─ 🔄 iPhone 15 Simulator
├─ 🔄 iPad Simulator
└─ ...
```

### Step 2: Archive

**Menu Bar:**
```
Product → Archive
```

Or use shortcut: `⌘ + Shift + B`

## 📤 App Store Upload

### Step 1: Organizer Window

After archiving, Xcode automatically opens:

```
┌─ Organizer ─────────────────────────────────┐
│ Archives  Crashes  Energy  Metrics         │
├─────────────────────────────────────────────┤
│ 📦 Apuntador 1.0 (Build 1)                 │ ← YOUR BUILD
│    Today at 3:45 PM                        │
│    ✅ Valid for App Store                   │
├─────────────────────────────────────────────┤
│                           [Distribute App] │ ← CLICK
└─────────────────────────────────────────────┘
```

### Step 2: Distribution Wizard

**Screen 1 - Destination:**
```
┌─ Select a method of distribution ──┐
│ ⚫ App Store Connect              │ ← SELECT THIS
│ ⚪ Ad Hoc                         │
│ ⚪ Enterprise                     │
│ ⚪ Development                    │
│                         [Next >] │
└───────────────────────────────────┘
```

**Screen 2 - Distribution type:**
```
┌─ Select a destination ─────────────┐
│ ⚫ Upload                         │ ← SELECT THIS
│ ⚪ Export                         │
│                         [Next >] │
└───────────────────────────────────┘
```

**Screen 3 - Options:**
```
┌─ App Store Connect distribution options ─┐
│ ✅ Upload your app's symbols             │ ← LEAVE CHECKED
│ ✅ Automatically manage signing          │ ← LEAVE CHECKED
│ ⚪ Manually manage signing               │
│                                [Next >] │
└──────────────────────────────────────────┘
```

**Screen 4 - Review:**
```
┌─ Review App.ipa content ──────────────────┐
│ App: Apuntador                            │
│ Bundle ID: io.apuntador.app               │ ← VERIFY THIS
│ Version: 1.0 (1)                         │
│ Team: Your Developer Team                 │
│                               [Upload] │ ← FINAL CLICK
└───────────────────────────────────────────┘
```

## 🚨 Common Errors and Solutions

### ❌ "No signing certificate iOS Distribution found"

**Solution:**
```
Xcode → Preferences → Accounts
├─ Your Apple ID
└─ [Download Manual Profiles]  ← CLICK
```

### ❌ "Bundle identifier is not available"

**Verify:**
1. App ID exists at https://developer.apple.com/account/
2. Bundle ID is exactly `io.apuntador.app`
3. Correct team is selected

### ❌ "No destination available" for Archive

**Solution:**
- Make sure to select "**Any iOS Device (arm64)**"
- Do NOT use simulator for Archive
- If it doesn't appear, connect a physical iPhone

### ❌ Archive fails with build errors

**Clean and rebuild:**
```
Product → Clean Build Folder  (⌘ + Shift + K)
Then: Product → Archive
```

## 📱 Useful Shortcuts

| Action | Shortcut |
|--------|----------|
| Build | `⌘ + B` |
| Clean | `⌘ + Shift + K` |
| Archive | `⌘ + Shift + B` |
| Organizer | `⌘ + Shift + 9` |

## ✅ Visual Checklist

Before archiving, verify:

- [ ] 📘 Target "**App**" selected (not "App (iOS)")
- [ ] 🏷️ **Signing & Capabilities** configured
- [ ] ✅ "**Automatically manage signing**" checked
- [ ] 👥 **Team** selected (your Apple Developer Team)
- [ ] 🔖 **Bundle Identifier**: `io.apuntador.app`
- [ ] 📱 Device target: "**Any iOS Device (arm64)**"
- [ ] 🟢 Build succeeds without errors

---

**Need more help?** This visual guide should cover all exact steps to find each option in Xcode.