# Android Edge-to-Edge Debugging Guide

## Problem on Samsung Galaxy S22 (Android 15)

The toolbar appears mixed with Android system navigation buttons.

## Implemented Improvements

### 1. More Aggressive Detection

- Force edge-to-edge on all Android devices
- Multiple methods for calculating safe areas
- Detection based on screen dimensions

### 2. Improved CSS

- Multiple fallbacks for `safe-area-inset-bottom`
- Higher minimum values (48px-60px)
- Support for CSS custom variables

### 3. Optimized Meta Tags

- `viewport-fit=cover` for edge-to-edge
- `user-scalable=no` to prevent zoom
- Android-specific meta tags

## How to Debug on Your Device

### Option 1: Remote Debugging (Recommended)

1. **Connect via USB:**

   ```bash
   # Enable USB Debugging on your Samsung
   Settings → Developer options → USB debugging
   ```

2. **Chrome Remote Debugging:**
   - Open Chrome on PC: `chrome://inspect`
   - Connect Samsung via USB
   - Open Apuntador in Samsung Chrome
   - Inspect from PC

3. **View console logs:**
   ```javascript
   // In Chrome DevTools console
   console.log('Safe area insets:', {
     top: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top'),
     bottom: getComputedStyle(document.documentElement).getPropertyValue(
       '--safe-area-inset-bottom'
     ),
   })
   ```
   ),
   })
   ```

   ```

### Option 2: Local Device Debugging

1. **Activate debug mode:**
   - Open Apuntador
   - Go to console (if accessible): `localStorage.setItem('DEBUG_EDGE_TO_EDGE', 'true')`
   - Reload app
2. **View debug information:**
   - Logs will appear automatically in console
   - Information about dimensions and safe areas

### Option 3: Visual Debugging

1. **Activate visual overlay:**

   ```javascript
   // In browser console
   localStorage.setItem('DEBUG_EDGE_TO_EDGE', 'true')
   // Then call:
   import('./src/utils/debug.js').then((m) => m.showDebugOverlay())
   ```

2. **Interpretation:**
   - **Red area** = top safe area
   - **Green area** = bottom safe area (where toolbar should be)

## Implemented Values

### CSS Fallbacks

```css
/* Multiple fallbacks for maximum compatibility */
margin-bottom: max(
  var(--safe-area-inset-bottom, 0px),
  env(safe-area-inset-bottom, 0px),
  48px /* Minimum fallback for Android */
);
```

### JavaScript Detection

```javascript
// Estimation based on screen dimensions
const estimatedNavBarHeight = Math.max(48, Math.round(screenHeight * 0.06))
```

## What to Look for in Debug

### 1. Screen Dimensions

```

```

Screen: 1080x2340 (example Galaxy S22)
Viewport: 1080x2210 (difference = nav bar)

```

### 2. Safe Area Insets
```

--safe-area-inset-bottom: 48px (or greater)
env(safe-area-inset-bottom): 48px

```

### 3. Applied CSS Classes
```

html.android
body.edge-to-edge

````

## Expected Solutions

### Current Version (Improved)
- **Minimum margin bottom:** 48px on mobile, 60px on small screens
- **Forced detection:** All Android devices enter edge-to-edge mode
- **Multiple fallbacks:** CSS env(), custom variables, fixed values

### If Still Failing
1. **Increase minimum values** to 80px-100px
2. **Force specific position** for Samsung
3. **Use JavaScript for dynamic positioning**

## Install New Version

```bash
# Build updated APK
npm run android:apk:build

# Transfer to device
# Install apuntador.apk
````

## Report Results

When testing, please report:

1. **Does the toolbar look better?**
2. **Console logs** (if accessible)
3. **Screenshot** if problem persists
4. **Behavior** in portrait vs landscape

## Quick Test Values

If you need to manually adjust, these are the current CSS values:

```css
/* In FloatingToolbar - mobile */
margin-bottom: max(
  var(--safe-area-inset-bottom, 0px),
  env(safe-area-inset-bottom, 0px),
  60px /* ← You can increase this value */
) !important;
```
