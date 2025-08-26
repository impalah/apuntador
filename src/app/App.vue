<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { addSafeAreaInsets, isTouchDevice } from '@/utils/dom'

onMounted(() => {
  // Add safe area insets for mobile devices
  addSafeAreaInsets()

  // Add touch device class for styling
  if (isTouchDevice()) {
    document.body.classList.add('touch-device')
  }
})
</script>

<style scoped>
.v-application {
  background: var(--teleprompter-bg, #000000) !important;
  color: var(--teleprompter-fg, #ffffff) !important;
}
</style>
