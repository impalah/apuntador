<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { addSafeAreaInsets, isTouchDevice } from '@/utils/dom'
import { useWindowInsets } from '@/utils/windowInsets'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { useCloudStore } from '@/stores/useCloudStore'
import { useDeepLinks } from '@/composables/useDeepLinks'

// Initialize window insets for Android edge-to-edge support
const { safeAreaInsets, isEdgeToEdge } = useWindowInsets()
const prefsStore = usePrefsStore()
const cloudStore = useCloudStore()

// Initialize deep links for OAuth callbacks in native apps
useDeepLinks()

onMounted(async () => {
  // Load preferences (hotkeys, etc) on app mount
  prefsStore.load()
  // Initialize cloud store (load saved provider)
  await cloudStore.initialize()
  // Add safe area insets for mobile devices
  addSafeAreaInsets()

  // Add touch device class for styling
  if (isTouchDevice()) {
    document.body.classList.add('touch-device')
  }

  // Add edge-to-edge class when detected
  if (isEdgeToEdge.value) {
    document.body.classList.add('edge-to-edge')
  }

  // Add Android-specific classes for better styling support
  const isAndroid = /Android/i.test(navigator.userAgent)
  if (isAndroid) {
    document.documentElement.classList.add('android')
    document.documentElement.setAttribute('data-android', 'true')
    
    // Detect Android API level for specific fixes
    const androidMatch = navigator.userAgent.match(/Android\s+([\d.]+)/)
    if (androidMatch) {
      const version = androidMatch[1]
      document.documentElement.setAttribute('data-android-version', version)
      
      // Map versions to API levels (approximate)
      const majorVersion = parseInt(version.split('.')[0])
      if (majorVersion >= 15) {
        document.documentElement.setAttribute('data-android-api', '35')
      } else if (majorVersion >= 14) {
        document.documentElement.setAttribute('data-android-api', '34')
      }
    }
    
    // Add Capacitor-specific class if running in Capacitor
    if ((window as any).Capacitor) {
      document.documentElement.classList.add('capacitor-android')
    }
    
    // Debug logging - enabled for Android edge-to-edge testing
    console.log('Android device detected:', {
      userAgent: navigator.userAgent,
      isCapacitor: !!(window as any).Capacitor,
      version: androidMatch?.[1]
    })
  }
})
</script>

<style>
/* Global styles for edge-to-edge support */
.v-application {
  background: var(--teleprompter-bg, #000000) !important;
  color: var(--teleprompter-fg, #ffffff) !important;
}

/* Support for devices with safe area insets */
.edge-to-edge {
  /* Ensure body content respects safe areas */
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}

/* Android edge-to-edge specific adjustments */
@supports (padding: max(0px)) {
  .edge-to-edge {
    padding-top: max(0px, env(safe-area-inset-top, 0px));
    padding-bottom: max(0px, env(safe-area-inset-bottom, 0px));
    padding-left: max(0px, env(safe-area-inset-left, 0px));
    padding-right: max(0px, env(safe-area-inset-right, 0px));
  }
}

/* Force edge-to-edge on Android devices */
@media screen and (max-width: 768px) {
  body {
    /* Force full viewport usage */
    height: 100vh !important;
    height: 100dvh !important;
    overflow: hidden !important;
  }

  .v-application {
    /* Ensure application uses full screen */
    height: 100vh !important;
    height: 100dvh !important;
    padding-bottom: 0 !important;
  }

  /* Add explicit Android support */
  html.android .v-application,
  html[data-android] .v-application {
    padding-bottom: 0 !important;
  }
}

/* Ensure viewport meta tag is properly handled */
html {
  /* Support for CSS env() function */
  height: 100%;
  width: 100%;
}

body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

/* Fix for Android Chrome address bar changes */
.v-application {
  height: 100vh;
  height: 100dvh; /* Use dynamic viewport height when available */
}
</style>
