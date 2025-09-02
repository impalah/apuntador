# Android Edge-to-Edge Support

## Problem Solved

In Android 15, edge-to-edge mode is applied by default to all web applications, which caused toolbar buttons to appear below the system controls (navigation bar) and could not be tapped.

## Implemented Solution

### 1. Window Insets Composable (`src/utils/windowInsets.ts`)

- **Automatic detection**: Detects if the device is Android and supports edge-to-edge
- **Dynamic CSS variables**: Creates CSS custom properties for safe areas
- **Viewport monitoring**: Listens to visual viewport changes
- **Fallbacks**: Provides default values when APIs are not available

```typescript
// Available CSS variables:
--safe - area - inset - top
--safe - area - inset - right
--safe - area - inset - bottom
--safe - area - inset - left
```

### 2. Updated FloatingToolbar

- **Safe positioning**: Uses `max(0px, env(safe-area-inset-bottom))` to avoid overlap
- **Dynamic padding**: Applies additional padding when necessary
- **Responsive**: Automatically adapts to orientation changes

### 3. Global Configuration

- **App.vue**: Initializes the insets system and applies global CSS classes
- **index.html**: Includes `viewport-fit=cover` to enable edge-to-edge
- **Meta tags**: Configuration for PWA and full-screen mode

## How to Test

### 1. Local Development

```bash
npm run dev
```

Open in Chrome DevTools:

1. Enable "Device Toolbar" (F12 → Ctrl+Shift+M)
2. Select an Android device (e.g., Pixel 5)
3. Verify that the toolbar doesn't overlap with simulated controls

### 2. Real Android Device

1. Connect via USB or use the network IP shown by Vite
2. Open in Chrome Android
3. Verify that toolbar buttons are accessible
4. Test in portrait and landscape orientation

### 3. Automated Tests

```bash
# Edge-to-edge specific tests
npm run test:e2e -- tests/e2e/android-edge-to-edge.spec.ts

# All E2E tests
npm run test:e2e
```

## Included Features

### ✅ Automatic Detection

- Detects Android via User Agent
- Verifies CSS env() variables support
- Monitors Visual Viewport API changes

### ✅ CSS Safe Areas

- CSS variables for all safe areas
- Positioning with `max()` function
- Dynamic padding as needed

### ✅ Responsive Design

- Works in portrait and landscape
- Adapts to viewport changes
- Compatible with zoom and virtual keyboard

### ✅ Fallbacks

- Default values when APIs are not available
- Compatible with older browsers
- Graceful degradation

## Available CSS Variables

```css
/* Automatically applied to :root */
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-right: env(safe-area-inset-right, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-inset-left: env(safe-area-inset-left, 0px);
}
```

## Component Usage

```vue
<template>
  <div class="component-with-safe-area">
    <!-- Content -->
  </div>
</template>

<style scoped>
.component-with-safe-area {
  /* Example: safe top padding */
  padding-top: max(1rem, var(--safe-area-inset-top));

  /* Example: safe bottom position */
  bottom: max(0px, var(--safe-area-inset-bottom));
}
</style>
```

## Debugging

### Console Logs

The `useWindowInsets()` composable can enable debug logs for development:

```javascript
// In browser console
localStorage.setItem('DEBUG_INSETS', 'true')
location.reload()
```

### CSS Inspection

In DevTools, verify that CSS variables have values:

```css
:root {
  --safe-area-inset-bottom: 34px; /* Example on iPhone */
}
```

### Visual Viewport API

Check if the device supports the API:

```javascript
console.log('Visual Viewport API:', !!window.visualViewport)
```

## Compatibility

- ✅ Android 15+ (automatic edge-to-edge)
- ✅ Android 10-14 (optional edge-to-edge)
- ✅ iOS Safari (native safe areas)
- ✅ Chrome Mobile
- ✅ Firefox Mobile
- ✅ Desktop browsers (no effect)

## References

- [Android Edge-to-Edge Documentation](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- [CSS env() Function](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [Visual Viewport API](https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API)
