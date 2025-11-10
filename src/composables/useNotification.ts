import { ref, computed } from 'vue'

/**
 * Notification types with associated colors
 */
export type NotificationType = 'error' | 'success' | 'warning' | 'info'

/**
 * Notification item
 */
export interface Notification {
  id: number
  message: string
  type: NotificationType
  timeout: number
  visible: boolean
}

/**
 * Notification configuration
 */
interface NotificationConfig {
  timeout?: number // Duration in ms before auto-close (0 = no auto-close)
  type?: NotificationType
}

// ========================================
// Global State (Reactive)
// ========================================

let notificationCounter = 0
const notifications = ref<Notification[]>([])

// Current active notification (only show one at a time)
const currentNotification = computed(() =>
  notifications.value.find((n) => n.visible)
)

// ========================================
// Notification Colors (Vuetify theme colors)
// ========================================

const TYPE_COLORS: Record<NotificationType, string> = {
  error: 'error', // Red
  success: 'success', // Green
  warning: 'warning', // Orange
  info: 'info', // Blue
}

// ========================================
// Core Functions
// ========================================

/**
 * Show a notification
 */
function show(message: string, config: NotificationConfig = {}) {
  const { timeout = 5000, type = 'info' } = config

  const notification: Notification = {
    id: ++notificationCounter,
    message,
    type,
    timeout,
    visible: true,
  }

  // If there's already a visible notification, hide it first
  if (currentNotification.value) {
    currentNotification.value.visible = false
  }

  notifications.value.push(notification)

  // Auto-hide after timeout (if timeout > 0)
  if (timeout > 0) {
    setTimeout(() => {
      hideNotification(notification.id)
    }, timeout)
  }

  return notification.id
}

/**
 * Hide a specific notification
 */
function hideNotification(id: number) {
  const notification = notifications.value.find((n) => n.id === id)
  if (notification) {
    notification.visible = false

    // Remove from array after animation (300ms transition)
    setTimeout(() => {
      const index = notifications.value.findIndex((n) => n.id === id)
      if (index > -1) {
        notifications.value.splice(index, 1)
      }

      // Show next notification in queue if available
      const nextVisible = notifications.value.find((n) => !n.visible)
      if (nextVisible) {
        nextVisible.visible = true
      }
    }, 300)
  }
}

/**
 * Hide current notification (used when clicking on snackbar)
 */
function hideCurrent() {
  if (currentNotification.value) {
    hideNotification(currentNotification.value.id)
  }
}

/**
 * Clear all notifications
 */
function clearAll() {
  notifications.value = []
}

// ========================================
// Convenience Methods
// ========================================

/**
 * Show error notification (red, longer timeout)
 */
function showError(message: string, timeout = 7000) {
  return show(message, { type: 'error', timeout })
}

/**
 * Show success notification (green, shorter timeout)
 */
function showSuccess(message: string, timeout = 4000) {
  return show(message, { type: 'success', timeout })
}

/**
 * Show warning notification (orange)
 */
function showWarning(message: string, timeout = 5000) {
  return show(message, { type: 'warning', timeout })
}

/**
 * Show info notification (blue)
 */
function showInfo(message: string, timeout = 5000) {
  return show(message, { type: 'info', timeout })
}

// ========================================
// Composable Export
// ========================================

/**
 * Notification system composable
 *
 * Features:
 * - Multiple notification types (error, success, warning, info)
 * - Automatic color coding
 * - Queue system (one notification at a time)
 * - Click to dismiss
 * - Auto-hide with configurable timeout
 * - i18n support (pass translated messages)
 *
 * @example
 * ```typescript
 * const { showError, showSuccess } = useNotification()
 *
 * // Show error
 * showError(t('errors.services.notConnected'))
 *
 * // Show success with custom timeout
 * showSuccess(t('messages.fileSaved'), 3000)
 * ```
 */
export function useNotification() {
  return {
    // State
    currentNotification,
    notifications,

    // Core functions
    show,
    hideCurrent,
    hideNotification,
    clearAll,

    // Convenience methods
    showError,
    showSuccess,
    showWarning,
    showInfo,

    // Color mapping
    getColor: (type: NotificationType) => TYPE_COLORS[type],
  }
}
