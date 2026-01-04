import type { CloudService, CloudFile, OAuthConfig } from '@/types/cloud'
import { GOOGLE_API_URLS } from '@/config/api'
import { storage } from '@/utils/persistence'
import { STORAGE_KEYS } from '@/utils/constants'
import { BaseOAuthService } from '@/services/oauth/baseOAuthService'

/**
 * Google Drive API Service
 * Implementa CloudService interface para Google Drive usando OAuth 2.0 + PKCE
 */
export class GoogleDriveService extends BaseOAuthService implements CloudService {
  private accessToken: string | null = null

  constructor(config: OAuthConfig) {
    super(config, 'googledrive')
  }

  /**
   * Nombre del proveedor para logging
   */
  protected getProviderName(): string {
    return 'GoogleDriveService'
  }

  /**
   * Guarda tokens de Google Drive en storage persistente
   */
  protected async saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
    console.log('GoogleDriveService: Saving tokens to storage...')

    await storage.set(STORAGE_KEYS.GOOGLEDRIVE_TOKEN, accessToken)

    if (refreshToken) {
      await storage.set(STORAGE_KEYS.GOOGLEDRIVE_REFRESH_TOKEN, refreshToken)
    }

    // Verificar que se guardó
    const savedToken = await storage.get<string>(STORAGE_KEYS.GOOGLEDRIVE_TOKEN)
    console.log('GoogleDriveService: Tokens saved and verified:', {
      saved: !!savedToken,
      matches: savedToken === accessToken,
    })
  }

  /**
   * Procesa los tokens recibidos (guardar en instancia)
   */
  protected async onTokensReceived(accessToken: string, refreshToken?: string): Promise<void> {
    this.accessToken = accessToken
  }

  /**
   * Establece el access token manualmente (útil para Tauri)
   */
  async setAccessToken(token: string): Promise<void> {
    this.accessToken = token
    localStorage.setItem('googledrive_access_token', token)
  }

  /**
   * Desconecta y limpia tokens
   */
  async disconnect(): Promise<void> {
    console.log('[PLUGIN] GoogleDriveService: Disconnecting...')

    this.accessToken = null

    // Limpiar tokens usando el sistema de persistencia
    await storage.remove(STORAGE_KEYS.GOOGLEDRIVE_TOKEN)
    await storage.remove(STORAGE_KEYS.GOOGLEDRIVE_REFRESH_TOKEN)

    // Limpiar state de OAuth
    localStorage.removeItem('googledrive_oauth_state')

    console.log('[GOODBYE] GoogleDriveService: Disconnected successfully')

    // Mostrar mensaje de éxito
    this.successHandler.showCloudSuccess('disconnect')
  }

  /**
   * Verifica si hay una conexión activa
   */
  isConnected(): boolean {
    // Verificar si hay token en memoria
    const result = !!this.accessToken

    console.log('GoogleDriveService isConnected():', {
      hasAccessToken: !!this.accessToken,
      result,
    })

    return result
  }

  /**
   * Inicializa el servicio con token guardado
   */
  async initialize(): Promise<void> {
    console.log('GoogleDriveService: Initializing...')

    const savedToken = await storage.get<string>(STORAGE_KEYS.GOOGLEDRIVE_TOKEN)
    if (savedToken) {
      this.accessToken = savedToken
      console.log('GoogleDriveService: Initialized with saved token')
    } else {
      console.log('GoogleDriveService: No saved token found')
    }
  }

  /**
   * Restaura una sesión existente desde el storage
   */
  async restoreSession(): Promise<boolean> {
    try {
      const token = await storage.get<string>(STORAGE_KEYS.GOOGLEDRIVE_TOKEN)
      console.log(
        'GoogleDriveService: Attempting to restore session with token:',
        token ? 'PRESENT' : 'NONE'
      )
      console.log('GoogleDriveService: Storage inspection:', {
        tokenKey: STORAGE_KEYS.GOOGLEDRIVE_TOKEN,
        tokenFound: !!token,
        tokenLength: token?.length || 0,
      })

      if (!token) {
        console.log('[ERROR] GoogleDriveService: No token found in storage')
        return false
      }

      // Establecer token en memoria
      this.accessToken = token

      console.log('GoogleDriveService: Token set, testing validity...')

      // Verificar que el token funciona llamando a getUserInfo
      console.log('GoogleDriveService: Testing token with user info call...')

      // Small delay to ensure token is active on Google servers
      console.log('⏳ GoogleDriveService: Waiting 1 second for token to become active...')
      await new Promise((resolve) => setTimeout(resolve, 1000))

      await this.getUserInfo()
      console.log('GoogleDriveService: Session restored successfully')
      return true
    } catch (error) {
      console.error('[ERROR] GoogleDriveService: Error restoring session:', error)

      // Solo borrar token si es un error de autenticación específico
      let shouldClearToken = false

      if (error && typeof error === 'object') {
        // Borrar token solo si es un error de token inválido/expirado
        if ('status' in error && (error.status === 401 || error.status === 400)) {
          console.log('[KEY] GoogleDriveService: Token appears invalid (401/400), clearing...')
          shouldClearToken = true
        }
        // Para otros errores (red, temporales), mantener token
        else {
          console.log('GoogleDriveService: Temporary error, keeping token for retry...')
        }
      } else {
        // Error desconocido, ser conservador y mantener token
        console.log('[QUESTION] GoogleDriveService: Unknown error, keeping token for retry...')
      }

      if (shouldClearToken) {
        await storage.remove(STORAGE_KEYS.GOOGLEDRIVE_TOKEN)
        await storage.remove(STORAGE_KEYS.GOOGLEDRIVE_REFRESH_TOKEN)
      }

      this.accessToken = null
      return false
    }
  }

  /**
   * Lista archivos en Google Drive
   */
  async listFiles(path: string = 'root'): Promise<CloudFile[]> {
    await this.ensureToken()

    try {
      // Tratar cadena vacía como 'root'
      const targetPath = !path || path === 'root' ? 'root' : path

      // Query para buscar archivos de markdown y carpetas en la ubicación especificada
      const query =
        targetPath === 'root'
          ? "'root' in parents and (mimeType='text/markdown' or mimeType='text/plain' or mimeType='application/vnd.google-apps.folder') and trashed=false"
          : `'${targetPath}' in parents and (mimeType='text/markdown' or mimeType='text/plain' or mimeType='application/vnd.google-apps.folder') and trashed=false`

      const response = await fetch(
        `${GOOGLE_API_URLS.drive}/files?` +
          new URLSearchParams({
            q: query,
            fields: 'files(id,name,mimeType,size,modifiedTime,parents)',
            orderBy: 'folder,name',
          }),
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.statusText}`)
      }

      const data = await response.json()

      return data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        path: file.id, // En Google Drive usamos el ID como path
        size: Number.parseInt(file.size || '0'),
        modified: new Date(file.modifiedTime),
        isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      }))
    } catch (error) {
      this.errorHandler.handleCloudError(error, 'list', { provider: 'googledrive', path })
      throw error
    }
  }

  /**
   * Descarga un archivo de Google Drive
   */
  async downloadFile(fileId: string): Promise<string> {
    await this.ensureToken()

    try {
      const response = await fetch(`${GOOGLE_API_URLS.drive}/files/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`)
      }

      const content = await response.text()

      // Mostrar mensaje de éxito
      this.successHandler.showCloudSuccess('download')

      return content
    } catch (error) {
      this.errorHandler.handleCloudError(error, 'download', { provider: 'googledrive', fileId })
      throw error
    }
  }

  /**
   * Sube un archivo a Google Drive
   */
  async uploadFile(path: string, content: string): Promise<CloudFile> {
    await this.ensureToken()

    try {
      // Para Google Drive, el path puede ser:
      // - Solo el nombre del archivo: "file.md" → guarda en root
      // - ID de carpeta/nombre: "folderId/file.md" → guarda en esa carpeta
      // - Solo ID de carpeta: "folderId" → error, necesita nombre

      const parts = path.split('/')
      const fileName = parts[parts.length - 1] || 'untitled.md'
      const parentFolderId = parts.length > 1 ? parts[parts.length - 2] : null

      // Metadata del archivo
      const metadata: any = {
        name: fileName,
        mimeType: 'text/markdown',
      }

      // Si hay un parent folder ID, incluirlo en metadata
      if (parentFolderId && parentFolderId !== 'root') {
        metadata.parents = [parentFolderId]
      }

      // Crear multipart request
      const boundary = '-------314159265358979323846'
      const delimiter = `\r\n--${boundary}\r\n`
      const closeDelimiter = `\r\n--${boundary}--`

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/markdown\r\n\r\n' +
        content +
        closeDelimiter

      const response = await fetch(`${GOOGLE_API_URLS.upload}/files?uploadType=multipart`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      })

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`)
      }

      const data = await response.json()

      const result: CloudFile = {
        id: data.id,
        name: data.name,
        path: data.id,
        size: Number.parseInt(data.size || '0'),
        modified: new Date(data.modifiedTime),
        isFolder: false,
      }

      // Mostrar mensaje de éxito
      this.successHandler.showCloudSuccess('upload')

      return result
    } catch (error) {
      this.errorHandler.handleCloudError(error, 'upload', { provider: 'googledrive', path })
      throw error
    }
  }

  /**
   * Elimina un archivo de Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    await this.ensureToken()

    try {
      const response = await fetch(`${GOOGLE_API_URLS.drive}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`)
      }

      console.log('GoogleDrive Service: File deleted successfully')

      // Mostrar mensaje de éxito
      this.successHandler.showCloudSuccess('delete')
    } catch (error) {
      this.errorHandler.handleCloudError(error, 'delete', { provider: 'googledrive', fileId })
      throw error
    }
  }

  /**
   * Obtiene información del usuario
   */
  async getUserInfo(): Promise<{ name: string; email: string }> {
    await this.ensureToken()

    try {
      const response = await fetch(`${GOOGLE_API_URLS.drive}/about?fields=user`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        name: data.user.displayName,
        email: data.user.emailAddress,
      }
    } catch (error) {
      // Este error es silencioso - no es crítico para el usuario
      this.errorHandler.handle(error, {
        severity: 'silent',
        context: { provider: 'googledrive', operation: 'getUserInfo' },
      })
      throw error
    }
  }

  // ===== MÉTODOS PRIVADOS =====

  /**
   * Genera code verifier para PKCE
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCodePoint(...Array.from(array)))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '')
  }

  /**
   * Genera code challenge desde verifier
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCodePoint(...Array.from(new Uint8Array(digest))))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replaceAll('=', '')
  }

  /**
   * Asegura que hay un token válido, refrescándolo si es necesario
   */
  private async ensureToken(): Promise<void> {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('googledrive_access_token')
    }

    if (!this.accessToken) {
      throw new Error('Not connected to Google Drive')
    }

    // TODO: Implementar refresh token logic si el token ha expirado
    // Por ahora asumimos que el token es válido
  }
}
