# Real UDID of iPad de Lino

## ✅ Correct device information

**Device**: iPad de Lino (iOS 18.3.2)
**Real UDID**: `00008122-001950342E61801C`

## 🚨 Problem identified

The command `xcrun devicectl list devices` showed an **internal identifier** (`50E92B6F-D7A4-5279-893B-042BA91B3DA7`), not the real UDID that Apple Developer expects.

## ✅ Solution

Use the correct UDID obtained with:
```bash
xcrun xctrace list devices
```

## 📝 Data for Apple Developer Portal

**When registering the device, use these exact values:**

- **Platform**: iOS
- **Device Name**: `iPad de Lino`
- **Device ID (UDID)**: `00008122-001950342E61801C`

## 🔧 Useful commands to verify UDID

```bash
# Method 1: xctrace (recommended)
xcrun xctrace list devices

# Method 2: devicectl (may show internal ID)
xcrun devicectl list devices

# Method 3: Xcode GUI
# Window → Devices and Simulators
```

## 📱 Differences between identifiers

| Command | Type | Example |
|---------|------|---------|
| `devicectl` | Internal ID | `50E92B6F-D7A4-5279-893B-042BA91B3DA7` |
| `xctrace` | **Real UDID** | `00008122-001950342E61801C` |
| Xcode GUI | **Real UDID** | `00008122-001950342E61801C` |

**Always use the UDID from `xctrace` or Xcode for Apple Developer registration.**