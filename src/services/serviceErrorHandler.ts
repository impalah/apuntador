import { useNotification } from '@/composables/useNotification'
import { useI18n } from 'vue-i18n'

/**
 * Error severity levels
 * - silent: Only log to console (developer errors, expected failures)
 * - user: Show to user via notification (user-facing errors)
 */
export type ErrorSeverity = 'silent' | 'user'

/**
 * Service error options
 */
export interface ServiceErrorOptions {
  /** Error severity - determines if error is shown to user */
  severity?: ErrorSeverity
  /** i18n key for user-facing error message */
  messageKey?: string
  /** Additional context for console logging */
  context?: Record<string, any>
  /** Whether to log to console (default: true) */
  logToConsole?: boolean
}

/**
 * Helper for handling service errors consistently
 *
 * Features:
 * - Automatic error logging to console
 * - Optional user notifications via snackbar
 * - i18n support for user-facing messages
 * - Severity-based filtering (silent vs user)
 *
 * @example
 * ```typescript
 * const errorHandler = createServiceErrorHandler()
 *
 * // Silent error (only console)
 * errorHandler.handle(error, {
 *   severity: 'silent',
 *   context: { provider: 'googledrive', action: 'refresh_token' }
 * })
 *
 * // User-facing error (console + notification)
 * errorHandler.handle(error, {
 *   severity: 'user',
 *   messageKey: 'errors.services.cloud.notConnected'
 * })
 * ```
 */
export function createServiceErrorHandler() {
  const notification = useNotification()
  const { t } = useI18n()

  /**
   * Handle a service error
   */
  function handle(error: unknown, options: ServiceErrorOptions = {}) {
    const {
      severity = 'silent',
      messageKey,
      context,
      logToConsole = true,
    } = options

    // Always log to console if enabled
    if (logToConsole) {
      if (context) {
        console.error('Service error:', error, context)
      } else {
        console.error('Service error:', error)
      }
    }

    // Show notification to user if severity is 'user'
    if (severity === 'user' && messageKey) {
      const message = t(messageKey)
      notification.showError(message)
    }
  }

  /**
   * Handle OAuth-specific errors
   */
  function handleOAuthError(error: unknown, context?: Record<string, any>) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Determine error type and severity
    if (errorMessage.includes('Invalid OAuth state') || errorMessage.includes('CSRF')) {
      handle(error, {
        severity: 'user',
        messageKey: 'errors.services.oauth.csrfDetected',
        context: { ...context, type: 'csrf' },
      })
    } else if (errorMessage.includes('No access token')) {
      handle(error, {
        severity: 'user',
        messageKey: 'errors.services.oauth.noAccessToken',
        context: { ...context, type: 'no_token' },
      })
    } else if (errorMessage.includes('Code verifier')) {
      handle(error, {
        severity: 'user',
        messageKey: 'errors.services.oauth.codeVerifierMissing',
        context: { ...context, type: 'code_verifier' },
      })
    } else {
      // Generic OAuth error - show to user
      handle(error, {
        severity: 'user',
        messageKey: 'errors.services.oauth.invalidState',
        context,
      })
    }
  }

  /**
   * Handle cloud storage errors
   */
  function handleCloudError(
    error: unknown,
    operation: 'connect' | 'disconnect' | 'list' | 'download' | 'upload' | 'delete',
    context?: Record<string, any>
  ) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Map operation to i18n key
    const operationKeys: Record<typeof operation, string> = {
      connect: 'errors.services.cloud.connectionFailed',
      disconnect: 'errors.services.cloud.disconnectionFailed',
      list: 'errors.services.cloud.listFilesFailed',
      download: 'errors.services.cloud.downloadFailed',
      upload: 'errors.services.cloud.uploadFailed',
      delete: 'errors.services.cloud.deleteFailed',
    }

    // Check for specific error types
    if (errorMessage.includes('Not connected')) {
      handle(error, {
        severity: 'user',
        messageKey: 'errors.services.cloud.notConnected',
        context: { ...context, operation },
      })
    } else if (errorMessage.includes('No file content')) {
      handle(error, {
        severity: 'user',
        messageKey: 'errors.services.cloud.noContent',
        context: { ...context, operation },
      })
    } else {
      // Generic cloud operation error
      handle(error, {
        severity: 'user',
        messageKey: operationKeys[operation],
        context: { ...context, operation },
      })
    }
  }

  /**
   * Handle file operation errors
   */
  function handleFileError(
    error: unknown,
    operation: 'read' | 'write',
    context?: Record<string, any>
  ) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Check for specific error types
    if (errorMessage.includes('Invalid file type') || errorMessage.includes('only .md')) {
      handle(error, {
        severity: 'user',
        messageKey: 'errors.services.file.invalidType',
        context: { ...context, operation },
      })
    } else if (errorMessage.includes('No file handle')) {
      handle(error, {
        severity: 'user',
        messageKey: 'errors.services.file.noFileHandle',
        context: { ...context, operation },
      })
    } else if (errorMessage.includes('access denied') || errorMessage.includes('Permission')) {
      handle(error, {
        severity: 'user',
        messageKey: 'errors.services.file.accessDenied',
        context: { ...context, operation },
      })
    } else {
      // Generic file error
      const messageKey = operation === 'read' 
        ? 'errors.services.file.readFailed'
        : 'errors.services.file.writeFailed'
      
      handle(error, {
        severity: 'user',
        messageKey,
        context: { ...context, operation },
      })
    }
  }

  return {
    handle,
    handleOAuthError,
    handleCloudError,
    handleFileError,
  }
}

/**
 * Success message helper
 */
export function createServiceSuccessHandler() {
  const notification = useNotification()
  const { t } = useI18n()

  /**
   * Show success notification
   */
  function show(messageKey: string, timeout?: number) {
    const message = t(messageKey)
    notification.showSuccess(message, timeout)
  }

  /**
   * Show cloud operation success
   */
  function showCloudSuccess(
    operation: 'connect' | 'disconnect' | 'upload' | 'download' | 'delete'
  ) {
    const operationKeys: Record<typeof operation, string> = {
      connect: 'messages.services.cloud.connected',
      disconnect: 'messages.services.cloud.disconnected',
      upload: 'messages.services.cloud.fileUploaded',
      download: 'messages.services.cloud.fileDownloaded',
      delete: 'messages.services.cloud.fileDeleted',
    }

    show(operationKeys[operation])
  }

  /**
   * Show file operation success
   */
  function showFileSuccess(operation: 'load' | 'save') {
    const operationKeys: Record<typeof operation, string> = {
      load: 'messages.services.file.loaded',
      save: 'messages.services.file.saved',
    }

    show(operationKeys[operation])
  }

  return {
    show,
    showCloudSuccess,
    showFileSuccess,
  }
}
