import { Dropbox } from 'dropbox'
import type { CloudService, CloudFile, OAuthConfig } from '@/types/cloud'
import { storage } from '@/services/persistence'
import { STORAGE_KEYS, OAUTH_TOKEN_ACTIVATION_DELAY } from '@/utils/constants'
import { BaseOAuthService } from '@/services/oauth/baseOAuthService'

export class DropboxService extends BaseOAuthService implements CloudService {
  private dropbox: Dropbox | null = null

  constructor(config: OAuthConfig) {
    super(config, 'dropbox')
  }

  /**
   * Nombre del proveedor para logging
   */
  protected getProviderName(): string {
    return 'DropboxService'
  }

  /**
   * Guarda tokens de Dropbox en storage persistente
   */
  protected async saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
    console.log('DropboxService: Saving tokens to storage...')

    await storage.set(STORAGE_KEYS.DROPBOX_TOKEN, accessToken)

    if (refreshToken) {
      await storage.set(STORAGE_KEYS.DROPBOX_REFRESH_TOKEN, refreshToken)
    }

    // Verificar que se guardó
    const savedToken = await storage.get<string>(STORAGE_KEYS.DROPBOX_TOKEN)
    console.log('DropboxService: Tokens saved and verified:', {
      saved: !!savedToken,
      matches: savedToken === accessToken,
    })
  }

  /**
   * Procesa los tokens recibidos - Inicializa el cliente Dropbox SDK
   */
  protected async onTokensReceived(accessToken: string, _refreshToken?: string): Promise<void> {
    this.dropbox = new Dropbox({
      accessToken,
      fetch: fetch.bind(globalThis),
    })
  }

  async disconnect(): Promise<void> {
    console.log('🔴 [DropboxService] Disconnect called')
    try {
      // Intentar revocar token en el backend
      const token = await storage.get<string>(STORAGE_KEYS.DROPBOX_TOKEN)
      console.log('[KEY] [DropboxService] Token from storage:', token ? 'PRESENT' : 'NOT FOUND')

      if (token) {
        console.log('[CALL] [DropboxService] Revoking token in backend...')
        await this.backendClient.revokeToken(token)
        console.log('[DropboxService] Token revoked successfully')
      }
    } catch (error) {
      console.warn('[WARNING] [DropboxService] Token revocation failed:', error)
      // Continuar con logout local
    }

    // Limpiar token usando el sistema de persistencia
    console.log('[CLEANUP] [DropboxService] Clearing local storage...')
    await storage.set(STORAGE_KEYS.DROPBOX_TOKEN, null)

    // Resetear instancia
    this.dropbox = null
    console.log('[DropboxService] Disconnect complete, client reset')

    // Mostrar mensaje de éxito
    this.successHandler.showCloudSuccess('disconnect')
  }

  /**
   * Set access token directly (usado por Tauri)
   */
  async setAccessToken(token: string): Promise<void> {
    console.log('Service: Setting access token directly (Tauri mode)')

    // Crear cliente con token directo
    this.dropbox = new Dropbox({
      accessToken: token,
      fetch: fetch.bind(globalThis),
    })

    // Guardar token
    await storage.set(STORAGE_KEYS.DROPBOX_TOKEN, token)

    console.log('Service: Access token set successfully')
  }

  /**
   * Get current access token (usado por Tauri)
   */
  async getAccessToken(): Promise<string> {
    const token = await storage.get<string>(STORAGE_KEYS.DROPBOX_TOKEN)
    if (!token) {
      throw new Error('No access token available')
    }
    return token
  }

  isConnected(): boolean {
    // Verificar si hay instancia de Dropbox (significa que hay token válido)
    const result = !!this.dropbox

    console.log('Dropbox isConnected():', {
      hasDropbox: !!this.dropbox,
      result,
    })

    return result
  }

  async restoreSession(): Promise<boolean> {
    try {
      const token = await storage.get<string>(STORAGE_KEYS.DROPBOX_TOKEN)
      console.log('Service: Attempting to restore session with token:', token ? 'PRESENT' : 'NONE')
      console.log('Service: Storage inspection:', {
        tokenKey: STORAGE_KEYS.DROPBOX_TOKEN,
        tokenFound: !!token,
        tokenLength: token?.length || 0,
      })

      if (!token) {
        console.log('[ERROR] Service: No token found in localStorage')
        return false
      }

      // Inicializar cliente con token directo
      this.dropbox = new Dropbox({
        accessToken: token,
        fetch: fetch.bind(globalThis),
      })

      console.log('Service: Client initialized, testing token...')

      // Verificar que el token funciona (con reintento)
      console.log('Service: Testing token with user info call...')

      // Small delay to ensure token is active on Dropbox servers
      console.log('⏳ Service: Waiting 1 second for token to become active...')
      await new Promise((resolve) => setTimeout(resolve, OAUTH_TOKEN_ACTIVATION_DELAY))

      await this.getUserInfo()
      console.log('Service: Session restored successfully')
      return true
    } catch (error) {
      console.error('[ERROR] Service: Error restoring Dropbox session:', error)

      // Solo borrar token si es un error de autenticación específico
      let shouldClearToken = false

      if (error && typeof error === 'object') {
        // Borrar token solo si es un error de token inválido/expirado
        if ('status' in error && (error.status === 401 || error.status === 400)) {
          console.log('[KEY] Service: Token appears invalid (401/400), clearing...')
          shouldClearToken = true
        }
        // Para otros errores (red, temporales), mantener token
        else {
          console.log('Service: Temporary error, keeping token for retry...')
        }
      } else {
        // Error desconocido, ser conservador y mantener token
        console.log('[QUESTION] Service: Unknown error, keeping token for retry...')
      }

      if (shouldClearToken) {
        await storage.set(STORAGE_KEYS.DROPBOX_TOKEN, null)
      }

      this.dropbox = null
      return false
    }
  }

  async listFiles(path: string = ''): Promise<CloudFile[]> {
    if (!this.dropbox) {
      throw new Error('Not connected to Dropbox')
    }

    try {
      console.log('📂 Dropbox listFiles called with path:', path)

      const response = await this.dropbox.filesListFolder({
        path: path || '',
        recursive: false,
        include_media_info: false,
        include_deleted: false,
        include_has_explicit_shared_members: false,
      })

      console.log('Dropbox response:', {
        entriesCount: response.result.entries.length,
        hasMore: response.result.has_more,
        cursor: response.result.cursor,
      })

      const files = response.result.entries.map((entry) => ({
        id: entry.path_lower || entry.name,
        name: entry.name,
        path: entry.path_lower || entry.name,
        size: entry['.tag'] === 'file' ? (entry as any).size || 0 : 0,
        modified: entry['.tag'] === 'file' ? new Date((entry as any).server_modified) : new Date(),
        isFolder: entry['.tag'] === 'folder',
        downloadUrl: entry['.tag'] === 'file' ? entry.path_lower : undefined,
      }))

      console.log('📁 Dropbox files mapped:', {
        totalFiles: files.length,
        folders: files.filter((f) => f.isFolder).length,
        files: files.filter((f) => !f.isFolder).length,
      })

      return files
    } catch (error) {
      this.errorHandler.handleCloudError(error, 'list', { provider: 'dropbox', path })
      throw error
    }
  }

  /**
   * Extract file content from Dropbox download response
   */
  private extractFileContent(response: any): Blob | ArrayBuffer | string | null {
    const result = response.result as any

    // Direct properties check
    if (result.fileBinary) {
      console.log('Service: Found fileBinary')
      return result.fileBinary
    }

    if (result.content) {
      console.log('Service: Found content')
      return result.content
    }

    if (result.fileBlob) {
      console.log('Service: Found fileBlob')
      return result.fileBlob
    }

    if (response.fileBinary) {
      console.log('Service: Found response.fileBinary')
      return response.fileBinary
    }

    // Search in result keys
    return this.searchContentInKeys(result)
  }

  /**
   * Search for content in result object keys
   */
  private searchContentInKeys(result: any): any {
    const resultKeys = Object.keys(result)
    console.log('Service: Searching in result keys:', resultKeys)

    const contentKeywords = ['content', 'data', 'blob', 'binary']

    for (const key of resultKeys) {
      const lowerKey = key.toLowerCase()
      const hasContentKeyword = contentKeywords.some((keyword) => lowerKey.includes(keyword))

      if (hasContentKeyword) {
        console.log(`Service: Found potential content in key: ${key}`)
        return result[key]
      }
    }

    return null
  }

  /**
   * Convert file content to text string
   */
  private async convertToText(fileContent: any): Promise<string> {
    console.log('Service: File content type:', typeof fileContent)
    console.log('Service: File content constructor:', fileContent.constructor.name)

    if (typeof fileContent === 'string') {
      return fileContent
    }

    if (fileContent instanceof Blob) {
      return await fileContent.text()
    }

    if (fileContent instanceof ArrayBuffer) {
      return new TextDecoder().decode(fileContent)
    }

    if (fileContent && typeof fileContent === 'object' && 'text' in fileContent) {
      return await (fileContent as Blob).text()
    }

    console.error('[ERROR] Service: Unknown file content type:', typeof fileContent)
    throw new Error('Unknown file content format received from Dropbox')
  }

  async downloadFile(filePath: string): Promise<string> {
    if (!this.dropbox) {
      throw new Error('Not connected to Dropbox')
    }

    try {
      console.log('🔽 Service: Downloading file:', filePath)

      const response = await this.dropbox.filesDownload({ path: filePath })

      console.log('Service: Download response received:', response)
      console.log('Service: Response keys:', Object.keys(response))
      console.log('Service: Result keys:', Object.keys(response.result))

      // Extract file content from response
      const fileContent = this.extractFileContent(response)

      if (!fileContent) {
        console.error('[ERROR] Service: No file content found in response')
        console.error('Service: Full response structure:', JSON.stringify(response, null, 2))
        throw new Error('No file content received from Dropbox - check API response structure')
      }

      // Convert to text
      const textContent = await this.convertToText(fileContent)

      console.log('Service: File content converted successfully, length:', textContent.length)
      console.log('Service: First 100 chars:', textContent.substring(0, 100))

      // Show success message
      this.successHandler.showCloudSuccess('download')

      return textContent
    } catch (error) {
      this.errorHandler.handleCloudError(error, 'download', { provider: 'dropbox', filePath })
      throw error
    }
  }

  async uploadFile(path: string, content: string): Promise<CloudFile> {
    if (!this.dropbox) {
      throw new Error('Not connected to Dropbox')
    }

    try {
      const response = await this.dropbox.filesUpload({
        path: path,
        contents: content,
        mode: { '.tag': 'overwrite' },
        autorename: true,
      })

      const result: CloudFile = {
        id: response.result.path_lower || response.result.name,
        name: response.result.name,
        path: response.result.path_lower || response.result.name,
        size: response.result.size,
        modified: new Date(response.result.server_modified),
        isFolder: false,
        downloadUrl: response.result.path_lower,
      }

      // Mostrar mensaje de éxito
      this.successHandler.showCloudSuccess('upload')

      return result
    } catch (error) {
      this.errorHandler.handleCloudError(error, 'upload', { provider: 'dropbox', path })
      throw error
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    if (!this.dropbox) {
      throw new Error('Not connected to Dropbox')
    }

    try {
      await this.dropbox.filesDeleteV2({
        path: filePath,
      })

      // Mostrar mensaje de éxito
      this.successHandler.showCloudSuccess('delete')
    } catch (error) {
      this.errorHandler.handleCloudError(error, 'delete', { provider: 'dropbox', filePath })
      throw error
    }
  }

  async getUserInfo(): Promise<{ name: string; email: string }> {
    try {
      if (!this.dropbox) {
        console.log('[ERROR] Service: No Dropbox client available for getUserInfo')
        throw new Error('No Dropbox client available')
      }

      // Debug: Verificar que el cliente tiene token
      console.log('[CALL] Service: Calling usersGetCurrentAccount...')
      console.log('Service: Client token status:', {
        hasClient: !!this.dropbox,
        clientType: this.dropbox.constructor.name,
        // Note: No exponemos el token completo por seguridad
      })

      // Debug: Intercept the request to see what's being sent
      const originalFetch = globalThis.fetch
      globalThis.fetch = async (url, options) => {
        if (url.toString().includes('dropboxapi.com')) {
          console.log('Service: Dropbox API request:', {
            url: url.toString(),
            method: options?.method || 'GET',
            headers: options?.headers || {},
            hasAuth: !!(options?.headers as any)?.Authorization,
          })
        }
        return originalFetch(url, options)
      }

      try {
        const response = await this.dropbox.usersGetCurrentAccount()

        // Restore original fetch
        globalThis.fetch = originalFetch

        console.log('Service: usersGetCurrentAccount succeeded!')
        console.log('Service: User info response:', {
          name: response.result.name?.display_name,
          email: response.result.email,
        })

        return {
          name: response.result.name?.display_name || 'Unknown',
          email: response.result.email || 'unknown@dropbox.com',
        }
      } catch (error) {
        // Restore original fetch
        globalThis.fetch = originalFetch

        console.log(
          '[ERROR] Service: usersGetCurrentAccount failed, trying alternative approach...'
        )
        console.log('Service: Testing if this is an App Folder limitation...')

        // Try a simpler endpoint that should work with App Folder
        try {
          console.log('Service: Trying filesListFolder (should work with App Folder)...')
          await this.dropbox.filesListFolder({ path: '' })
          console.log('Service: filesListFolder works! This confirms App Folder limitation.')
          console.log('Service: Recommendation: Create Full Dropbox app for better compatibility')

          // Return fake user info for App Folder apps
          return {
            name: 'App Folder User',
            email: 'appfolder@dropbox.local',
          }
        } catch {
          console.log('[ERROR] Service: Even filesListFolder failed, this is a deeper auth issue')
          throw error // Original error
        }
      }
    } catch (error) {
      // Este error es silencioso - no es crítico para el usuario
      this.errorHandler.handle(error, {
        severity: 'silent',
        context: { provider: 'dropbox', operation: 'getUserInfo' },
      })
      throw error
    }
  }
}
