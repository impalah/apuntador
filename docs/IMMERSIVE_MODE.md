# 📱 Android Immersive Mode

The **Immersive Mode** allows the Apuntador application to use the entire Android device screen by hiding the status bar and navigation bar of the operating system to maximize the teleprompter reading area.

## ✨ Features

- **🔄 Manual control**: Enable/disable from the application toolbar
- **📱 Android only**: Works exclusively on Android devices
- **🎯 Automatic**: Automatically detects if the device supports it
- **⚡ Immediate**: Instant change without restarting the application
- **🔒 Persistent**: Maintains state until the user changes it

## 🚀 How to Use

### 1. **Direct Access (Large Screens)**

On large screen devices, you'll find the immersive mode button directly in the toolbar:

- **Icon**: 📏 `mdi-fullscreen` (enable) / `mdi-fullscreen-exit` (disable)
- **Location**: Between alignment controls and action buttons

### 2. **Mobile Menu (Small Screens)**

On mobile devices and small tablets:

1. Tap the **⋮** (more options) button in the toolbar
2. Go to the **"Mirror Controls"** section
3. You'll find the **"Fullscreen"** / **"Exit Fullscreen"** button

### 3. **Visual States**

- **🟢 Active**: Highlighted button, `fullscreen-exit` icon
- **⚪ Inactive**: Normal button, `fullscreen` icon
- **🚫 Not available**: Button doesn't appear (only on non-Android devices)

## 🛠️ Technical Implementation

### Frontend (Vue 3)

```typescript
// Composable for immersive mode control
import { useImmersiveMode } from '@/utils/immersiveMode'

const {
  isImmersive, // Current state
  isSupported, // If the device supports it
  toggleImmersiveMode, // Function to toggle
} = useImmersiveMode()
```

### Backend (Native Android)

```java
// Custom native plugin
@CapacitorPlugin(name = "ImmersiveMode")
public class ImmersiveModePlugin extends Plugin {
    @PluginMethod
    public void setImmersiveMode(PluginCall call) {
        // Controls Android system flags
        // SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        // SYSTEM_UI_FLAG_HIDE_NAVIGATION
        // SYSTEM_UI_FLAG_FULLSCREEN
    }
}
```

## 🎨 Visual Effects

### When Activating Immersive Mode:

1. **Status bar** → Hidden
2. **Navigation bar** → Hidden
3. **Safe areas** → Reset to 0px
4. **Viewport** → Uses entire screen (100vh/100dvh)
5. **CSS** → `.immersive-mode` class is applied

### Automatic CSS:

```scss
html.immersive-mode {
  --safe-area-inset-top: 0px !important;
  --safe-area-inset-bottom: 0px !important;

  body,
  #app,
  .teleprompter-container {
    height: 100vh !important;
    height: 100dvh !important;
  }
}
```

## 🔧 Android Configuration

### AndroidManifest.xml

```xml
<activity
    android:name=".MainActivity"
    android:theme="@style/AppTheme.NoActionBarLaunch"
    android:documentLaunchMode="always"
    android:resizeableActivity="true"
    android:enableOnBackInvokedCallback="true">
```

### Styles (styles.xml)

```xml
<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
    <item name="android:windowTranslucentStatus">false</item>
    <item name="android:windowTranslucentNavigation">false</item>
    <item name="android:fitsSystemWindows">false</item>
</style>
```

## 📋 Use Cases

### ✅ **Ideal For:**

- **📖 Reading long speeches**: Maximizes text area
- **🎥 Video recording**: No visual interference from the system
- **🎭 Live presentations**: Completely immersive experience
- **📱 Small devices**: Takes advantage of every available pixel

### ⚠️ **Considerations:**

- **🔙 Navigation**: Users can swipe from edges to temporarily show system controls
- **⚡ Reactivation**: Mode automatically reactivates after any interruption
- **🔄 Compatibility**: Only works on Android API 19+ (Android 4.4+)

## 🐛 Troubleshooting

### **Button doesn't appear**

- ✅ Verify you're on an Android device
- ✅ Make sure the app is updated
- ✅ Restart the application

### **Bars don't hide**

- ✅ Check application permissions
- ✅ Check for other apps in overlay mode
- ✅ Restart the device

### **Automatically restores**

- ✅ Normal behavior - Android may temporarily show bars
- ✅ Mode automatically reactivates

## 🔄 Future Development

### **Possible Improvements:**

- 🕒 **Auto-activation**: Start in immersive mode when opening the app
- ⏰ **Timer**: Automatically activate after X time of inactivity
- 🎛️ **Custom configuration**: Save preference in settings
- 📐 **Partial mode**: Hide only navigation bar or only status bar

## 💡 UX Tips

1. **📚 Education**: Inform users about this feature
2. **🎯 Context**: Explain when immersive mode is useful
3. **🔍 Visibility**: Make sure the button is easy to find
4. **↩️ Reversibility**: Always allow easy deactivation

---

**🎉 Enjoy the completely immersive teleprompter experience!**
