import type { CloudService, CloudFile, OAuthConfig } from '@/types/cloud'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { BackendOAuthClient } from '@/services/oauth/backendOAuthClient'
import { getBackendUrl, getOAuthRedirectUri } from '@/services/oauth/config'
import { GOOGLE_API_URLS } from '@/config/api'
import { storage } from '@/utils/persistence'
import { STORAGE_KEYS } from '@/utils/constants'
import { isTauri } from '@/utils/tauri'
import { tauriService } from '@/services/tauriService'
import { createServiceErrorHandler, createServiceSuccessHandler } from '@/utils/serviceErrorHandler'

/**
 * Google Drive API Service
 * Implementa CloudService interface para Google Drive usando OAuth 2.0 + PKCE
 */
export class GoogleDriveService implements CloudService {
  private accessToken: string | null = null
  private readonly config: OAuthConfig
  private readonly backendClient: BackendOAuthClient
  private readonly errorHandler = createServiceErrorHandler()
  private readonly successHandler = createServiceSuccessHandler()

  constructor(config: OAuthConfig) {
    this.config = config
    
    // Inicializar cliente del backend OAuth
    this.backendClient = new BackendOAuthClient({
      backendUrl: getBackendUrl(),
      provider: 'googledrive',
      redirectUri: getOAuthRedirectUri()
    })
    
    console.log('🔧 GoogleDriveService: Initialized with backend OAuth proxy', {
      backendUrl: getBackendUrl(),
      redirectUri: getOAuthRedirectUri()
    })
  }

  /**
   * Inicia el flujo de OAuth 2.0 con PKCE a través del backend
   */
  async connect(): Promise<void> {
    try {
      console.log('🚀 GoogleDriveService: Starting OAuth connection via backend...')
      
      // Obtener URL de autorización del backend
      const { authorization_url, state } = await this.backendClient.authorize()
      
      console.log('🔗 GoogleDriveService: Authorization URL received from backend')
      console.log('� GoogleDriveService: Redirect URI:', getOAuthRedirectUri())

      // Guardar state para validar en el callback
      localStorage.setItem('googledrive_oauth_state', state)

      // Redirigir al usuario a Google para autorizar
      const isTauriPlatform = isTauri()
      
      if (isTauriPlatform) {
        // En Tauri (Desktop), abrir en navegador del sistema
        console.log('🖥️ GoogleDriveService: Opening OAuth URL in system browser (Tauri/Desktop)')
        await tauriService.openUrl(authorization_url)
      } else if (Capacitor.isNativePlatform()) {
        // En plataformas nativas (iOS/Android), usar Browser plugin
        console.log('📱 GoogleDriveService: Opening OAuth URL in system browser (native platform)')
        await Browser.open({ url: authorization_url })
      } else {
        // En web, usar redirección normal
        console.log('🌐 GoogleDriveService: Redirecting to OAuth URL (web platform)')
        window.location.href = authorization_url
      }
    } catch (error) {
      this.errorHandler.handleCloudError(error, 'connect', { provider: 'googledrive' })
      throw error
    }
  }

  /**
   * Maneja el callback de OAuth y obtiene el access token
   */
  async handleOAuthCallback(code: string, state?: string): Promise<void> {
    console.log('� GoogleDriveService: handleOAuthCallback called via backend')
    
    try {
      // Verificar state si está disponible
      if (state) {
        const savedState = localStorage.getItem('googledrive_oauth_state')
        if (!savedState || savedState !== state) {
          throw new Error('Invalid OAuth state. Possible CSRF attack.')
        }
      }
      
      console.log('� GoogleDriveService: Exchanging code for tokens via backend...')
      
      // Intercambiar código por tokens a través del backend
      const tokens = await this.backendClient.handleCallback(code, state || '')
      
      console.log('� GoogleDriveService: Tokens received from backend', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in
      })

      // Guardar access token
      if (tokens.access_token) {
        this.accessToken = tokens.access_token
        
        // Guardar tokens usando el sistema de persistencia
        console.log('� GoogleDriveService: Saving tokens to storage...')
        await storage.set(STORAGE_KEYS.GOOGLEDRIVE_TOKEN, tokens.access_token)
        
        // Guardar refresh token si está disponible
        if (tokens.refresh_token) {
          await storage.set(STORAGE_KEYS.GOOGLEDRIVE_REFRESH_TOKEN, tokens.refresh_token)
        }
        
        // Verificar que se guardó
        const savedToken = await storage.get<string>(STORAGE_KEYS.GOOGLEDRIVE_TOKEN)
        console.log('✅ GoogleDriveService: Tokens saved and verified:', {
          saved: !!savedToken,
          matches: savedToken === tokens.access_token
        })
        
        console.log('✅ GoogleDriveService: OAuth flow completed successfully via backend')
        
        // Mostrar mensaje de éxito al usuario
        this.successHandler.showCloudSuccess('connect')
      } else {
        throw new Error('No access token received from backend')
      }
      
      // Limpiar state
      localStorage.removeItem('googledrive_oauth_state')
      
    } catch (error) {
      this.errorHandler.handleOAuthError(error, { provider: 'googledrive', step: 'callback' })
      localStorage.removeItem('googledrive_oauth_state')
      throw error
    }
  }

  /**
   * Establece el access token manualmente (útil para Tauri)
   */
  setAccessToken(token: string): void {
    this.accessToken = token
    localStorage.setItem('googledrive_access_token', token)
  }

  /**
   * Desconecta y limpia tokens
   */
  async disconnect(): Promise<void> {
    console.log('🔌 GoogleDriveService: Disconnecting...')
    
    this.accessToken = null
    
    // Limpiar tokens usando el sistema de persistencia
    await storage.remove(STORAGE_KEYS.GOOGLEDRIVE_TOKEN)
    await storage.remove(STORAGE_KEYS.GOOGLEDRIVE_REFRESH_TOKEN)
    
    // Limpiar state de OAuth
    localStorage.removeItem('googledrive_oauth_state')
    
    console.log('👋 GoogleDriveService: Disconnected successfully')
    
    // Mostrar mensaje de éxito
    this.successHandler.showCloudSuccess('disconnect')
  }

  /**
   * Verifica si hay una conexión activa
   */
  isConnected(): boolean {
    // Verificar si hay token en memoria
    const result = !!this.accessToken
    
    console.log('🔍 GoogleDriveService isConnected():', {
      hasAccessToken: !!this.accessToken,
      result
    })
    
    return result
  }

  /**
   * Inicializa el servicio con token guardado
   */
  async initialize(): Promise<void> {
    console.log('🔄 GoogleDriveService: Initializing...')
    
    const savedToken = await storage.get<string>(STORAGE_KEYS.GOOGLEDRIVE_TOKEN)
    if (savedToken) {
      this.accessToken = savedToken
      console.log('✅ GoogleDriveService: Initialized with saved token')
    } else {
      console.log('ℹ️ GoogleDriveService: No saved token found')
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
      
      // Query para buscar solo archivos de markdown en la carpeta especificada
      const query = targetPath === 'root' 
        ? "mimeType='text/markdown' or mimeType='text/plain' or mimeType='application/vnd.google-apps.folder' and trashed=false"
        : `'${targetPath}' in parents and (mimeType='text/markdown' or mimeType='text/plain' or mimeType='application/vnd.google-apps.folder') and trashed=false`

      const response = await fetch(
        `${GOOGLE_API_URLS.drive}/files?` + new URLSearchParams({
          q: query,
          fields: 'files(id,name,mimeType,size,modifiedTime,parents)',
          orderBy: 'folder,name'
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
        size: parseInt(file.size || '0'),
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
      const response = await fetch(
        `${GOOGLE_API_URLS.drive}/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

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
      // Extraer nombre del archivo del path
      const fileName = path.split('/').pop() || 'untitled.md'
      
      // Metadata del archivo
      const metadata = {
        name: fileName,
        mimeType: 'text/markdown',
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

      const response = await fetch(
        `${GOOGLE_API_URLS.upload}/files?uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`)
      }

      const data = await response.json()
      
      const result: CloudFile = {
        id: data.id,
        name: data.name,
        path: data.id,
        size: parseInt(data.size || '0'),
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
      const response = await fetch(
        `${GOOGLE_API_URLS.drive}/files/${fileId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`)
      }

      console.log('✅ GoogleDrive Service: File deleted successfully')
      
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
      const response = await fetch(
        `${GOOGLE_API_URLS.drive}/about?fields=user`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

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
        context: { provider: 'googledrive', operation: 'getUserInfo' }
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
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * Genera code challenge desde verifier
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
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
