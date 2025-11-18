<template>
  <v-snackbar
    v-if="currentNotification"
    v-model="currentNotification.visible"
    :color="getColor(currentNotification.type)"
    :timeout="-1"
    location="top"
    :multi-line="false"
    :vertical="false"
    class="notification-snackbar"
    @click="hideCurrent"
  >
    <div class="notification-content">
      <v-icon
        :icon="getIcon(currentNotification.type)"
        size="small"
        class="mr-2"
      />
      <span class="notification-message">{{ currentNotification.message }}</span>
    </div>

    <template #actions>
      <v-btn
        icon="mdi-close"
        size="small"
        variant="text"
        @click.stop="hideCurrent"
      />
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { useNotification } from '@/composables/useNotification'
import type { NotificationType } from '@/composables/useNotification'

const { currentNotification, hideCurrent, getColor } = useNotification()

/**
 * Get icon for notification type
 */
function getIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    error: 'mdi-alert-circle',
    success: 'mdi-check-circle',
    warning: 'mdi-alert',
    info: 'mdi-information',
  }
  return icons[type]
}
</script>

<style scoped>
.notification-snackbar {
  /* Ensure snackbar is clickable */
  cursor: pointer;
}

.notification-snackbar :deep(.v-snackbar__wrapper) {
  /* Add top margin to avoid system status bar on Android/iOS */
  margin-top: calc(env(safe-area-inset-top) + 60px);
}

.notification-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.notification-message {
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.4;
}

/* Mobile adjustments */
@media (max-width: 599px) {
  .notification-content {
    font-size: 0.9rem;
  }
}
</style>
