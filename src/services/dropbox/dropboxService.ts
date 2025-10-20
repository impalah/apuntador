import { Dropbox, DropboxAuth } from 'dropbox'
import type { CloudService, CloudFile, OAuthConfig } from '@/types/cloud'
import { storage } from '@/utils/persistence'
import { STORAGE_KEYS } from '@/utils/constants'

export class DropboxService implements CloudService {
  private dropbox: Dropbox | null = null
  private auth: DropboxAuth | null = null
  private readonly config: OAuthConfig
  private codeVerifier: string | null = null

  constructor(config: OAuthConfig) {
    this.config = config
    this.initializeAuth()
  }

  private initializeAuth(): void {
    this.auth = new DropboxAuth({
      clientId: this.config.clientId,
      fetch: fetch.bind(globalThis)
    })
  }

  async connect(): Promise<void> {
    if (!this.auth) {
      throw new Error('Dropbox auth not initialized')
    }

    try {
      console.log('🚀 Service: Starting OAuth connection with PKCE...')
      
      // Generar PKCE code verifier y challenge
      this.codeVerifier = this.generateCodeVerifier()
      const codeChallenge = await this.generateCodeChallenge(this.codeVerifier)
      
      console.log('🔐 Service: Generated PKCE parameters')
      
      // Construir URL manualmente con PKCE
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        response_type: 'code',
        redirect_uri: this.config.redirectUri,
        scope: this.config.scope,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      })
      
      const authUrl = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`
      
      console.log('🔗 Service: Generated auth URL:', authUrl)
      console.log('📍 Service: Redirect URI:', this.config.redirectUri)

      // Guardar code_verifier para usar en el callback
      localStorage.setItem('dropbox_code_verifier', this.codeVerifier)

      // Redirigir al usuario a Dropbox para autorizar
      window.location.href = authUrl
    } catch (error) {
      console.error('❌ Service: Error connecting to Dropbox:', error)
      throw new Error(`Failed to initiate Dropbox connection: ${error}`)
    }
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  async handleOAuthCallback(code: string): Promise<void> {
    console.log('🔧 Service: handleOAuthCallback called with code:', code)
    
    try {
      console.log('🔐 Service: Exchanging code for token with manual fetch...')
      
      // Recuperar code_verifier del localStorage
      const codeVerifier = localStorage.getItem('dropbox_code_verifier')
      if (!codeVerifier) {
        throw new Error('Code verifier not found. Please restart the OAuth flow.')
      }
      
      console.log('📞 Service: Making token exchange request...')
      
      // Intercambiar código por token manualmente usando fetch
      const tokenResponse = await fetch('https://api.dropbox.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          code: code,
          code_verifier: codeVerifier,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri
        })
      })
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text()
        console.error('❌ Service: Token response error:', errorData)
        throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorData}`)
      }
      
      const tokenData = await tokenResponse.json()
      console.log('🔑 Service: Token data received successfully')
      console.log('📊 Service: Token data structure:', {
        hasAccessToken: !!tokenData.access_token,
        tokenLength: tokenData.access_token?.length || 0,
        tokenPreview: tokenData.access_token?.substring(0, 20) + '...',
        allKeys: Object.keys(tokenData)
      })

      // Configurar token en auth Y crear cliente con token directo
      if (tokenData.access_token) {
        // Validar formato del token
        const token = tokenData.access_token
        console.log('🔐 Service: Token validation:', {
          length: token.length,
          startsWithSl: token.startsWith('sl.'),
          hasValidFormat: /^[A-Za-z0-9._-]+$/.test(token)
        })
        
        // Método 1: Configurar auth
        if (this.auth) {
          this.auth.setAccessToken(token)
        }
        
        // Método 2: Crear cliente con token directo (más seguro)
        this.dropbox = new Dropbox({ 
          accessToken: token,
          fetch: fetch.bind(globalThis)
        })
        
        // Guardar token usando el sistema de persistencia unificado
        console.log('💾 Service: About to save token to storage...')
        await storage.set(STORAGE_KEYS.DROPBOX_TOKEN, tokenData.access_token)
        
        // Verificar que se guardó
        const savedToken = await storage.get<string>(STORAGE_KEYS.DROPBOX_TOKEN)
        console.log('✅ Service: Token saved and verified:', {
          saved: !!savedToken,
          matches: savedToken === tokenData.access_token,
          savedLength: savedToken?.length || 0
        })
        
        console.log('✅ Service: Token saved and client initialized with direct token')
      } else {
        throw new Error('No access token received from Dropbox')
      }
      
      // Limpiar code verifier
      localStorage.removeItem('dropbox_code_verifier')
      console.log('✅ Service: OAuth flow completed successfully')
      
    } catch (error) {
      console.error('❌ Service: Error handling OAuth callback:', error)
      throw new Error(`Failed to complete Dropbox authentication: ${error}`)
    }
  }

  async disconnect(): Promise<void> {
    // Limpiar token usando el sistema de persistencia
    await storage.set(STORAGE_KEYS.DROPBOX_TOKEN, null)
    
    // Resetear instancias
    this.dropbox = null
    this.auth = null
    this.initializeAuth()
  }

  isConnected(): boolean {
    const token = localStorage.getItem('dropbox_access_token')
    return !!token && !!this.dropbox
  }

    async restoreSession(): Promise<boolean> {
    try {
      const token = await storage.get<string>(STORAGE_KEYS.DROPBOX_TOKEN)
      console.log('🔄 Service: Attempting to restore session with token:', token ? 'PRESENT' : 'NONE')
      console.log('🔍 Service: Storage inspection:', {
        tokenKey: STORAGE_KEYS.DROPBOX_TOKEN,
        tokenFound: !!token,
        tokenLength: token?.length || 0
      })
      
      if (!token) {
        console.log('❌ Service: No token found in localStorage')
        return false
      }

      // Inicializar cliente con token directo
      this.dropbox = new Dropbox({ 
        accessToken: token,
        fetch: fetch.bind(globalThis)
      })
      
      console.log('🔧 Service: Client initialized, testing token...')
      
      // Verificar que el token funciona (con reintento)
      console.log('🔄 Service: Testing token with user info call...')
      
      // Small delay to ensure token is active on Dropbox servers
      console.log('⏳ Service: Waiting 1 second for token to become active...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      await this.getUserInfo()
      console.log('✅ Service: Session restored successfully')
      return true
      
    } catch (error) {
      console.error('❌ Service: Error restoring Dropbox session:', error)
      
      // Solo borrar token si es un error de autenticación específico
      let shouldClearToken = false
      
      if (error && typeof error === 'object') {
        // Borrar token solo si es un error de token inválido/expirado
        if ('status' in error && (error.status === 401 || error.status === 400)) {
          console.log('🔑 Service: Token appears invalid (401/400), clearing...')
          shouldClearToken = true
        }
        // Para otros errores (red, temporales), mantener token
        else {
          console.log('🌐 Service: Temporary error, keeping token for retry...')
        }
      } else {
        // Error desconocido, ser conservador y mantener token
        console.log('❓ Service: Unknown error, keeping token for retry...')
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
      const response = await this.dropbox.filesListFolder({
        path: path || '',
        recursive: false,
        include_media_info: false,
        include_deleted: false,
        include_has_explicit_shared_members: false
      })

      return response.result.entries.map(entry => ({
        id: entry.path_lower || entry.name,
        name: entry.name,
        path: entry.path_lower || entry.name,
        size: entry['.tag'] === 'file' ? (entry as any).size || 0 : 0,
        modified: entry['.tag'] === 'file' ? new Date((entry as any).server_modified) : new Date(),
        isFolder: entry['.tag'] === 'folder',
        downloadUrl: entry['.tag'] === 'file' ? entry.path_lower : undefined
      }))
    } catch (error) {
      console.error('Error listing files:', error)
      throw new Error('Failed to list Dropbox files')
    }
  }

  async downloadFile(filePath: string): Promise<string> {
    if (!this.dropbox) {
      throw new Error('Not connected to Dropbox')
    }

    try {
      console.log('🔽 Service: Downloading file:', filePath)
      
      const response = await this.dropbox.filesDownload({
        path: filePath
      })

      console.log('📦 Service: Download response received:', response)
      console.log('📄 Service: Response keys:', Object.keys(response))
      console.log('📄 Service: Result keys:', Object.keys(response.result))

      // En el SDK de Dropbox JavaScript, el contenido viene en diferentes propiedades
      // dependiendo del entorno (node vs browser)
      const result = response.result as any
      
      // Buscar el contenido en diferentes ubicaciones posibles
      let fileContent: Blob | ArrayBuffer | string | null = null
      
      if (result.fileBinary) {
        console.log('💾 Service: Found fileBinary')
        fileContent = result.fileBinary
      } else if (result.content) {
        console.log('💾 Service: Found content')
        fileContent = result.content
      } else if (response.result && (response.result as any).fileBlob) {
        console.log('💾 Service: Found fileBlob')
        fileContent = (response.result as any).fileBlob
      } else if ((response as any).fileBinary) {
        console.log('💾 Service: Found response.fileBinary')
        fileContent = (response as any).fileBinary
      } else if (response.result) {
        // Buscar propiedades que contengan 'content', 'data', 'blob', etc.
        const resultKeys = Object.keys(result)
        console.log('🔍 Service: Searching in result keys:', resultKeys)
        
        for (const key of resultKeys) {
          if (key.toLowerCase().includes('content') || 
              key.toLowerCase().includes('data') || 
              key.toLowerCase().includes('blob') ||
              key.toLowerCase().includes('binary')) {
            console.log(`💾 Service: Found potential content in key: ${key}`)
            fileContent = result[key]
            break
          }
        }
      }
      
      if (!fileContent) {
        console.error('❌ Service: No file content found in response')
        console.error('📋 Service: Full response structure:', JSON.stringify(response, null, 2))
        throw new Error('No file content received from Dropbox - check API response structure')
      }
      
      console.log('📄 Service: File content type:', typeof fileContent)
      console.log('📄 Service: File content constructor:', fileContent.constructor.name)
      
      // Convertir a texto según el tipo
      let textContent: string
      
      if (typeof fileContent === 'string') {
        textContent = fileContent
      } else if (fileContent instanceof Blob) {
        textContent = await fileContent.text()
      } else if (fileContent instanceof ArrayBuffer) {
        textContent = new TextDecoder().decode(fileContent)
      } else if (fileContent && typeof fileContent === 'object' && 'text' in fileContent) {
        textContent = await (fileContent as Blob).text()
      } else {
        console.error('❌ Service: Unknown file content type:', typeof fileContent)
        throw new Error('Unknown file content format received from Dropbox')
      }
      
      console.log('✅ Service: File content converted successfully, length:', textContent.length)
      console.log('📝 Service: First 100 chars:', textContent.substring(0, 100))
      
      return textContent
    } catch (error) {
      console.error('❌ Service: Error downloading file:', error)
      throw new Error('Failed to download file from Dropbox')
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
        autorename: true
      })

      return {
        id: response.result.path_lower || response.result.name,
        name: response.result.name,
        path: response.result.path_lower || response.result.name,
        size: response.result.size,
        modified: new Date(response.result.server_modified),
        isFolder: false,
        downloadUrl: response.result.path_lower
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw new Error('Failed to upload file to Dropbox')
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    if (!this.dropbox) {
      throw new Error('Not connected to Dropbox')
    }

    try {
      await this.dropbox.filesDeleteV2({
        path: filePath
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      throw new Error('Failed to delete file from Dropbox')
    }
  }

    async getUserInfo(): Promise<{ name: string; email: string }> {
    try {
      if (!this.dropbox) {
        console.log('❌ Service: No Dropbox client available for getUserInfo')
        throw new Error('No Dropbox client available')
      }

      // Debug: Verificar que el cliente tiene token
      console.log('📞 Service: Calling usersGetCurrentAccount...')
      console.log('🔐 Service: Client token status:', {
        hasClient: !!this.dropbox,
        clientType: this.dropbox.constructor.name,
        // Note: No exponemos el token completo por seguridad
      })

      // Debug: Intercept the request to see what's being sent
      const originalFetch = globalThis.fetch
      globalThis.fetch = async (url, options) => {
        if (url.toString().includes('dropboxapi.com')) {
          console.log('🌐 Service: Dropbox API request:', {
            url: url.toString(),
            method: options?.method || 'GET',
            headers: options?.headers || {},
            hasAuth: !!(options?.headers as any)?.Authorization
          })
        }
        return originalFetch(url, options)
      }
      
      try {
        const response = await this.dropbox.usersGetCurrentAccount()
        
        // Restore original fetch
        globalThis.fetch = originalFetch
        
        console.log('✅ Service: usersGetCurrentAccount succeeded!')
        console.log('✅ Service: User info response:', {
          name: response.result.name?.display_name,
          email: response.result.email
        })
        
        return {
          name: response.result.name?.display_name || 'Unknown',
          email: response.result.email || 'unknown@dropbox.com'
        }
        
      } catch (error) {
        // Restore original fetch
        globalThis.fetch = originalFetch
        
        console.log('❌ Service: usersGetCurrentAccount failed, trying alternative approach...')
        console.log('📊 Service: Testing if this is an App Folder limitation...')
        
        // Try a simpler endpoint that should work with App Folder
        try {
          console.log('🔄 Service: Trying filesListFolder (should work with App Folder)...')
          await this.dropbox.filesListFolder({ path: '' })
          console.log('✅ Service: filesListFolder works! This confirms App Folder limitation.')
          console.log('💡 Service: Recommendation: Create Full Dropbox app for better compatibility')
          
          // Return fake user info for App Folder apps
          return {
            name: 'App Folder User',
            email: 'appfolder@dropbox.local'
          }
          
        } catch (listError) {
          console.log('❌ Service: Even filesListFolder failed, this is a deeper auth issue')
          throw error // Original error
        }
      }
      
    } catch (error) {
      console.error('❌ Service: Error getting user info:', error)
      
      // Log detalles del error para debugging
      if (error && typeof error === 'object' && 'status' in error) {
        console.error('📊 Service: Error status:', error.status)
        console.error('📝 Service: Error details:', error)
      }
      
      throw new Error('Failed to get Dropbox user info')
    }
  }
}