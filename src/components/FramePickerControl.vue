<!--
  Toolbar quick-toggle between the markdown and monospace presenter frames.
  Same compact dark rounded-box aesthetic as FloatingToolbar's other buttons
  (voice-mode toggle, play/pause) - a single tap switches frame, consistent
  with that established pattern rather than introducing a dropdown/v-menu
  (no precedent for one in this toolbar, and it's a binary choice).
-->
<template>
  <button
    class="toolbar-btn"
    :class="{ active: isMono }"
    :aria-label="isMono ? t('toolbar.frameMonospace') : t('toolbar.frameMarkdown')"
    data-testid="frame-picker-toggle"
    @click="toggleFrame"
  >
    <v-icon
      :icon="isMono ? 'mdi-console' : 'mdi-file-document-outline'"
      size="26"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePrefsStore } from '@/stores/usePrefsStore'

const { t } = useI18n()
const prefsStore = usePrefsStore()

const isMono = computed(() => prefsStore.activeFrame === 'monospace')

function toggleFrame(): void {
  prefsStore.setActiveFrame(isMono.value ? 'markdown' : 'monospace')
}
</script>

<style scoped>
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  border: none;
  color: white;
  cursor: pointer;
  padding: 12px;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}

.toolbar-btn:hover {
  background: #111;
}

.toolbar-btn:active {
  transform: scale(0.95);
  background: #222;
}

.toolbar-btn.active {
  background: rgba(var(--v-theme-primary), 0.3);
}

.toolbar-btn.active:hover {
  background: rgba(var(--v-theme-primary), 0.4);
}

@media (max-width: 360px) {
  .toolbar-btn {
    width: 52px;
    height: 52px;
    padding: 10px;
  }
}

@media (min-width: 600px) {
  .toolbar-btn {
    width: 60px;
    height: 60px;
    padding: 14px;
  }
}
</style>
