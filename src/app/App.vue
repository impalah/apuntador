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

// Initialize window insets for Android edge-to-edge support
const { safeAreaInsets, isEdgeToEdge } = useWindowInsets()
const prefsStore = usePrefsStore()

onMounted(() => {
  // Load preferences (hotkeys, etc) on app mount
  prefsStore.load()
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
    // Debug logging - disabled for production
    // console.log('Android device detected, applying Android-specific styles')
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
