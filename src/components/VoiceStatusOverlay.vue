<!--
  Always-visible status indicator for voice-tracking mode. Rendered whenever
  scrollMode is 'voice' (idle/listening/no-match/error/stopped alike), so the
  reader always has positive confirmation of which mode is driving the scroll
  and its current status - never a silently frozen script with no explanation.
-->
<template>
  <div
    class="voice-status-overlay"
    :class="`status-${status}`"
    data-testid="voice-status-overlay"
  >
    <v-icon
      :icon="icon"
      size="18"
    />
    <span data-testid="voice-status-text">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SpeechEngineErrorCode, SpeechEngineStatus } from '@/services/speech/speechEngine'

interface Props {
  status: SpeechEngineStatus
  errorCode?: SpeechEngineErrorCode
}

const props = defineProps<Props>()
const { t } = useI18n()

const icon = computed(() => {
  switch (props.status) {
    case 'listening':
      return 'mdi-microphone'
    case 'no-match':
      return 'mdi-microphone-question'
    case 'error':
      return 'mdi-microphone-off'
    default:
      return 'mdi-microphone-outline'
  }
})

const label = computed(() => {
  switch (props.status) {
    case 'listening':
      return t('voiceTracking.statusListening')
    case 'no-match':
      return t('voiceTracking.statusNoMatch')
    case 'error':
      return t(errorMessageKey(props.errorCode))
    case 'stopped':
      return t('voiceTracking.statusStopped')
    default:
      return t('voiceTracking.statusIdle')
  }
})

function errorMessageKey(code?: SpeechEngineErrorCode): string {
  switch (code) {
    case 'not-supported':
      return 'voiceTracking.errorNotSupported'
    case 'permission-denied':
      return 'voiceTracking.errorPermissionDenied'
    case 'network':
      return 'voiceTracking.errorNetwork'
    case 'aborted':
      return 'voiceTracking.errorAborted'
    default:
      return 'voiceTracking.errorUnknown'
  }
}
</script>

<style scoped>
.voice-status-overlay {
  position: fixed;
  top: max(12px, env(safe-area-inset-top, 12px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 16px;
  background: rgb(0 0 0 / 60%);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  pointer-events: none;
  white-space: nowrap;
}

.status-listening {
  color: #4caf50;
}

.status-no-match {
  color: #ffb300;
}

.status-error {
  color: #ff5252;
}
</style>
