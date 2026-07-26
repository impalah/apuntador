import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createServiceErrorHandler, createServiceSuccessHandler } from '@/services/serviceErrorHandler'

const showError = vi.fn()
const showSuccess = vi.fn()

vi.mock('@/composables/useNotification', () => ({
  useNotification: () => ({
    showError,
    showSuccess,
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    // Identity translation so assertions can check the exact key was used
    t: (key: string) => key,
  }),
}))

describe('serviceErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('createServiceErrorHandler().handle', () => {
    it('logs to console by default (severity defaults to silent)', () => {
      const handler = createServiceErrorHandler()
      const error = new Error('boom')

      handler.handle(error)

      expect(console.error).toHaveBeenCalledWith('Service error:', error)
      expect(showError).not.toHaveBeenCalled()
    })

    it('includes context in the console log when provided', () => {
      const handler = createServiceErrorHandler()
      const error = new Error('boom')
      const context = { provider: 'googledrive' }

      handler.handle(error, { context })

      expect(console.error).toHaveBeenCalledWith('Service error:', error, context)
    })

    it('does not log to console when logToConsole is false', () => {
      const handler = createServiceErrorHandler()

      handler.handle(new Error('boom'), { logToConsole: false })

      expect(console.error).not.toHaveBeenCalled()
    })

    it('shows a notification when severity is "user" and messageKey is set', () => {
      const handler = createServiceErrorHandler()

      handler.handle(new Error('boom'), {
        severity: 'user',
        messageKey: 'errors.services.cloud.notConnected',
      })

      expect(showError).toHaveBeenCalledWith('errors.services.cloud.notConnected')
    })

    it('does not show a notification when severity is "user" but messageKey is missing', () => {
      const handler = createServiceErrorHandler()

      handler.handle(new Error('boom'), { severity: 'user' })

      expect(showError).not.toHaveBeenCalled()
    })

    it('does not show a notification when severity is "silent" even with a messageKey', () => {
      const handler = createServiceErrorHandler()

      handler.handle(new Error('boom'), {
        severity: 'silent',
        messageKey: 'errors.services.cloud.notConnected',
      })

      expect(showError).not.toHaveBeenCalled()
    })
  })

  describe('createServiceErrorHandler().handleOAuthError', () => {
    it.each([
      ['Invalid OAuth state received', 'errors.services.oauth.csrfDetected', 'csrf'],
      ['CSRF token mismatch', 'errors.services.oauth.csrfDetected', 'csrf'],
      ['No access token returned', 'errors.services.oauth.noAccessToken', 'no_token'],
      ['Code verifier missing', 'errors.services.oauth.codeVerifierMissing', 'code_verifier'],
    ])('maps "%s" to %s', (message, expectedKey, expectedType) => {
      const handler = createServiceErrorHandler()

      handler.handleOAuthError(new Error(message), { requestId: '1' })

      expect(showError).toHaveBeenCalledWith(expectedKey)
      expect(console.error).toHaveBeenCalledWith(
        'Service error:',
        expect.any(Error),
        expect.objectContaining({ requestId: '1', type: expectedType })
      )
    })

    it('falls back to the generic invalidState message for unrecognized errors', () => {
      const handler = createServiceErrorHandler()

      handler.handleOAuthError(new Error('totally unexpected'))

      expect(showError).toHaveBeenCalledWith('errors.services.oauth.invalidState')
    })

    it('stringifies non-Error values', () => {
      const handler = createServiceErrorHandler()

      handler.handleOAuthError('No access token here')

      expect(showError).toHaveBeenCalledWith('errors.services.oauth.noAccessToken')
    })
  })

  describe('createServiceErrorHandler().handleCloudError', () => {
    it('maps "Not connected" errors regardless of operation', () => {
      const handler = createServiceErrorHandler()

      handler.handleCloudError(new Error('Not connected to provider'), 'upload')

      expect(showError).toHaveBeenCalledWith('errors.services.cloud.notConnected')
    })

    it('maps "No file content" errors', () => {
      const handler = createServiceErrorHandler()

      handler.handleCloudError(new Error('No file content'), 'download')

      expect(showError).toHaveBeenCalledWith('errors.services.cloud.noContent')
    })

    it.each([
      ['connect', 'errors.services.cloud.connectionFailed'],
      ['disconnect', 'errors.services.cloud.disconnectionFailed'],
      ['list', 'errors.services.cloud.listFilesFailed'],
      ['download', 'errors.services.cloud.downloadFailed'],
      ['upload', 'errors.services.cloud.uploadFailed'],
      ['delete', 'errors.services.cloud.deleteFailed'],
    ] as const)('maps generic errors for operation "%s" to %s', (operation, expectedKey) => {
      const handler = createServiceErrorHandler()

      handler.handleCloudError(new Error('network timeout'), operation)

      expect(showError).toHaveBeenCalledWith(expectedKey)
    })

    it('stringifies non-Error values', () => {
      const handler = createServiceErrorHandler()

      handler.handleCloudError('Not connected', 'list')

      expect(showError).toHaveBeenCalledWith('errors.services.cloud.notConnected')
    })
  })

  describe('createServiceErrorHandler().handleFileError', () => {
    it.each([
      ['Invalid file type selected', 'errors.services.file.invalidType'],
      ['only .md files supported', 'errors.services.file.invalidType'],
      ['No file handle available', 'errors.services.file.noFileHandle'],
      ['access denied by OS', 'errors.services.file.accessDenied'],
      ['Permission required', 'errors.services.file.accessDenied'],
    ])('maps "%s" to %s for read operations', (message, expectedKey) => {
      const handler = createServiceErrorHandler()

      handler.handleFileError(new Error(message), 'read')

      expect(showError).toHaveBeenCalledWith(expectedKey)
    })

    it('falls back to readFailed for unrecognized read errors', () => {
      const handler = createServiceErrorHandler()

      handler.handleFileError(new Error('disk error'), 'read')

      expect(showError).toHaveBeenCalledWith('errors.services.file.readFailed')
    })

    it('stringifies non-Error values', () => {
      const handler = createServiceErrorHandler()

      handler.handleFileError('No file handle', 'read')

      expect(showError).toHaveBeenCalledWith('errors.services.file.noFileHandle')
    })

    it('falls back to writeFailed for unrecognized write errors', () => {
      const handler = createServiceErrorHandler()

      handler.handleFileError(new Error('disk error'), 'write')

      expect(showError).toHaveBeenCalledWith('errors.services.file.writeFailed')
    })
  })

  describe('createServiceSuccessHandler', () => {
    it('show() translates the key and forwards the timeout', () => {
      const handler = createServiceSuccessHandler()

      handler.show('messages.services.file.saved', 1234)

      expect(showSuccess).toHaveBeenCalledWith('messages.services.file.saved', 1234)
    })

    it.each([
      ['connect', 'messages.services.cloud.connected'],
      ['disconnect', 'messages.services.cloud.disconnected'],
      ['upload', 'messages.services.cloud.fileUploaded'],
      ['download', 'messages.services.cloud.fileDownloaded'],
      ['delete', 'messages.services.cloud.fileDeleted'],
    ] as const)('showCloudSuccess maps "%s" to %s', (operation, expectedKey) => {
      const handler = createServiceSuccessHandler()

      handler.showCloudSuccess(operation)

      expect(showSuccess).toHaveBeenCalledWith(expectedKey, undefined)
    })

    it.each([
      ['load', 'messages.services.file.loaded'],
      ['save', 'messages.services.file.saved'],
    ] as const)('showFileSuccess maps "%s" to %s', (operation, expectedKey) => {
      const handler = createServiceSuccessHandler()

      handler.showFileSuccess(operation)

      expect(showSuccess).toHaveBeenCalledWith(expectedKey, undefined)
    })
  })
})
