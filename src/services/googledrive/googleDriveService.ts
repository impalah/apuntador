import type { CloudService, CloudFile, OAuthConfig } from '@/types/cloud'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'

/**
 * Google Drive API Service
 * Implementa CloudService interface para Google Drive usando OAuth 2.0 + PKCE
 */
export class GoogleDriveService implements CloudService {
  private accessToken: string | null = null
  private readonly config: OAuthConfig
  private codeVerifier: string | null = null

  constructor(config: OAuthConfig) {
    this.config = config
  }

  /**
   * Inicia el flujo de OAuth 2.0 con PKCE
   */
  async connect(): Promise<void> {
    try {
      console.log('🚀 GoogleDrive Service: Starting OAuth connection with PKCE...')
      
      // Generar PKCE code verifier y challenge
      this.codeVerifier = this.generateCodeVerifier()
      const codeChallenge = await this.generateCodeChallenge(this.codeVerifier)
      
      console.log('🔐 GoogleDrive Service: Generated PKCE parameters')
      
      // Generar state para identificar el proveedor en el callback
      const state = `googledrive-${Date.now()}`
      
      // Construir URL de autenticación
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        response_type: 'code',
        redirect_uri: this.config.redirectUri,
        scope: this.config.scope,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: state, // Agregar state para identificar el proveedor
        access_type: 'offline', // Para obtener refresh token
        prompt: 'consent' // Forzar pantalla de consentimiento
      })
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
      
      console.log('🔗 GoogleDrive Service: Generated auth URL')
      console.log('📍 GoogleDrive Service: Redirect URI:', this.config.redirectUri)

      // Guardar code_verifier para usar en el callback
      localStorage.setItem('googledrive_code_verifier', this.codeVerifier)

      // Redirigir al usuario a Google para autorizar
      if (Capacitor.isNativePlatform()) {
        console.log('📱 GoogleDrive Service: Opening OAuth URL in system browser (native platform)')
        await Browser.open({ url: authUrl })
      } else {
        console.log('🌐 GoogleDrive Service: Redirecting to OAuth URL (web platform)')
        window.location.href = authUrl
      }
    } catch (error) {
      console.error('❌ GoogleDrive Service: Error connecting to Google Drive:', error)
      throw new Error(`Failed to initiate Google Drive connection: ${error}`)
    }
  }

  /**
   * Maneja el callback de OAuth y obtiene el access token
   */
  async handleOAuthCallback(code: string): Promise<void> {
    console.log('🔧 GoogleDrive Service: handleOAuthCallback called')
    
    try {
      console.log('🔐 GoogleDrive Service: Exchanging code for token...')
      
      // Recuperar code_verifier del localStorage
      const codeVerifier = localStorage.getItem('googledrive_code_verifier')
      if (!codeVerifier) {
        throw new Error('Code verifier not found. Please restart the OAuth flow.')
      }
      
      // Intercambiar código por token
      // NOTA DE SEGURIDAD: Google requiere client_secret para tipo "Aplicación de escritorio"
      // incluso con PKCE. Esto es una limitación conocida - el secret NO se puede proteger
      // completamente en aplicaciones distribuidas (SPA/móvil/desktop) pero es práctica aceptada.
      // 
      // Alternativas más seguras (para considerar en producción):
      // 1. Backend OAuth proxy que mantiene el secret servidor-side
      // 2. Google Sign-In SDK en lugar de OAuth directo
      // 3. Clientes tipo Android/iOS (no requieren secret pero no funcionan en web)
      //
      // Ver docs/GOOGLE_DRIVE_APP_SETUP.md sección "Consideraciones de Seguridad"
      const tokenParams: Record<string, string> = {
        client_id: this.config.clientId,
        code: code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: this.config.redirectUri
      }
      
      // Agregar client_secret si está disponible (requerido por Google para tipo "Aplicación de escritorio")
      if (this.config.clientSecret) {
        tokenParams.client_secret = this.config.clientSecret
      }
      
      console.log('📤 GoogleDrive Service: Token request params:', {
        client_id: tokenParams.client_id.substring(0, 20) + '...',
        has_code: !!tokenParams.code,
        has_code_verifier: !!tokenParams.code_verifier,
        grant_type: tokenParams.grant_type,
        redirect_uri: tokenParams.redirect_uri,
        has_client_secret: 'client_secret' in tokenParams
      })
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenParams)
      })
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text()
        console.error('❌ GoogleDrive Service: Token response error:', errorData)
        throw new Error(`Token exchange failed: ${tokenResponse.status}`)
      }
      
      const tokenData = await tokenResponse.json()
      console.log('🔑 GoogleDrive Service: Token data received successfully')

      if (tokenData.access_token) {
        this.accessToken = tokenData.access_token
        
        // Guardar token (con refresh token si está disponible)
        localStorage.setItem('googledrive_access_token', tokenData.access_token)
        if (tokenData.refresh_token) {
          localStorage.setItem('googledrive_refresh_token', tokenData.refresh_token)
        }
        if (tokenData.expires_in) {
          const expiresAt = Date.now() + (tokenData.expires_in * 1000)
          localStorage.setItem('googledrive_token_expires_at', expiresAt.toString())
        }
        
        // Limpiar code_verifier
        localStorage.removeItem('googledrive_code_verifier')
        
        console.log('✅ GoogleDrive Service: Token saved successfully')
      } else {
        throw new Error('No access token received from Google')
      }
    } catch (error) {
      console.error('❌ GoogleDrive Service: Error in OAuth callback:', error)
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
    this.accessToken = null
    localStorage.removeItem('googledrive_access_token')
    localStorage.removeItem('googledrive_refresh_token')
    localStorage.removeItem('googledrive_token_expires_at')
    localStorage.removeItem('googledrive_code_verifier')
    console.log('👋 GoogleDrive Service: Disconnected')
  }

  /**
   * Verifica si hay una conexión activa
   */
  isConnected(): boolean {
    return !!this.accessToken || !!localStorage.getItem('googledrive_access_token')
  }

  /**
   * Inicializa el servicio con token guardado
   */
  async initialize(): Promise<void> {
    const savedToken = localStorage.getItem('googledrive_access_token')
    if (savedToken) {
      this.accessToken = savedToken
      console.log('🔄 GoogleDrive Service: Initialized with saved token')
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
        `https://www.googleapis.com/drive/v3/files?` + new URLSearchParams({
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
      console.error('❌ GoogleDrive Service: Error listing files:', error)
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
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`)
      }

      return await response.text()
    } catch (error) {
      console.error('❌ GoogleDrive Service: Error downloading file:', error)
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
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
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
      
      return {
        id: data.id,
        name: data.name,
        path: data.id,
        size: parseInt(data.size || '0'),
        modified: new Date(data.modifiedTime),
        isFolder: false,
      }
    } catch (error) {
      console.error('❌ GoogleDrive Service: Error uploading file:', error)
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
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
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
    } catch (error) {
      console.error('❌ GoogleDrive Service: Error deleting file:', error)
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
        'https://www.googleapis.com/drive/v3/about?fields=user',
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
      console.error('❌ GoogleDrive Service: Error getting user info:', error)
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
