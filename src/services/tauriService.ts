// Dynamic imports to avoid bundling issues in web builds
// These modules are only available in Tauri desktop environment

export interface TauriDropboxFile {
  name: string
  path: string
  content: string
}

export interface TauriOAuthResponse {
  access_token: string
}

export class TauriService {
  private oauthCallbackListener: (() => void) | null = null

  async isAvailable(): Promise<boolean> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('is_theater_mode')
      return true
    } catch {
      return false
    }
  }

  /**
   * Open URL in system browser
   * Uses Tauri command to properly open URLs in external browser
   */
  async openUrl(url: string): Promise<void> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('open_url', { url })
    } catch (error) {
      console.error('Failed to open URL:', error)
      throw error
    }
  }

  /**
   * Start OAuth callback server on localhost:8080
   * This is needed for backend proxy OAuth flow
   */
  async startOAuthCallbackServer(): Promise<void> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('start_oauth_callback_server')
      console.log('[OK] OAuth callback server started on localhost:8080')
    } catch (error) {
      console.error('Error starting OAuth callback server:', error)
      throw error
    }
  }

  /**
   * Request OAuth authorization URL from backend using mTLS
   * This is needed for Desktop where the app must authenticate with the backend
   */
  async backendOAuthAuthorize(
    provider: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<{ authorization_url: string; state: string }> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const result = await invoke<{ authorization_url: string; state: string }>(
        'backend_oauth_authorize',
        { provider, codeVerifier, redirectUri }
      )
      return result
    } catch (error) {
      console.error('Error requesting OAuth authorization:', error)
      throw error
    }
  }

  /**
   * Exchange OAuth authorization code for access token via backend using mTLS
   */
  async backendOAuthTokenExchange(
    provider: string,
    code: string,
    codeVerifier: string,
    state: string
  ): Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
    token_type: string
  }> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const result = await invoke<{
        access_token: string
        refresh_token?: string
        expires_in: number
        token_type: string
      }>('backend_oauth_token_exchange', { provider, code, codeVerifier, state })
      return result
    } catch (error) {
      console.error('Error exchanging OAuth code:', error)
      throw error
    }
  }

  async startDropboxOAuth(): Promise<string> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      return await invoke('start_dropbox_oauth')
    } catch (error) {
      console.error('Error starting Dropbox OAuth:', error)
      throw error
    }
  }

  async exchangeOAuthCode(code: string, state: string): Promise<TauriOAuthResponse> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      return await invoke('exchange_oauth_code', { code, state })
    } catch (error) {
      console.error('Error exchanging OAuth code:', error)
      throw error
    }
  }

  async listDropboxFiles(accessToken: string, path?: string): Promise<any[]> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      return await invoke('list_dropbox_files', { 
        accessToken, 
        path: path || '' 
      })
    } catch (error) {
      console.error('Error listing Dropbox files:', error)
      throw error
    }
  }

  async downloadDropboxFile(accessToken: string, path: string): Promise<TauriDropboxFile> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      return await invoke('download_dropbox_file', { 
        accessToken, 
        path 
      })
    } catch (error) {
      console.error('Error downloading Dropbox file:', error)
      throw error
    }
  }

  async uploadDropboxFile(accessToken: string, path: string, content: string): Promise<any> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      return await invoke('upload_dropbox_file', { 
        accessToken, 
        path, 
        content 
      })
    } catch (error) {
      console.error('Error uploading Dropbox file:', error)
      throw error
    }
  }

  async listenForOAuthCallback(): Promise<{ code: string; state: string }> {
    console.log('[LISTEN] TauriService: Setting up listener for oauth-callback')
    
    this.stopOAuthListener() // Clean up previous listener
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log('[TIME] TauriService: OAuth timeout after 5 minutes')
        this.stopOAuthListener()
        reject(new Error('OAuth timeout'))
      }, 300000) // 5 minutes timeout

      // Import and set up listener asynchronously
      import('@tauri-apps/api/event')
        .then(({ listen }) => {
          // listen() returns a Promise that resolves to the unlisten function
          return listen('oauth-callback', (event: any) => {
            console.log('[CALL] TauriService: oauth-callback event received:', event.payload)
            clearTimeout(timeout)
            this.stopOAuthListener()
            resolve(event.payload)
          })
        })
        .then(unlistenFn => {
          this.oauthCallbackListener = unlistenFn
          console.log('[OK] TauriService: oauth-callback listener configured')
        })
        .catch(error => {
          console.error('[ERROR] TauriService: Error setting up listener:', error)
          clearTimeout(timeout)
          reject(error)
        })
    })
  }

  private stopOAuthListener() {
    if (this.oauthCallbackListener) {
      this.oauthCallbackListener()
      this.oauthCallbackListener = null
    }
  }

  async toggleTheaterMode(): Promise<boolean> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      return await invoke('toggle_theater_mode')
    } catch (error) {
      console.error('Error toggling theater mode:', error)
      throw error
    }
  }

  async isTheaterMode(): Promise<boolean> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      return await invoke('is_theater_mode')
    } catch (error) {
      console.error('Error checking theater mode:', error)
      return false
    }
  }

  async testEventEmit(): Promise<void> {
    console.log('[EXPERIMENT] Testing event emission...')
    
    try {
      const { listen } = await import('@tauri-apps/api/event')
      const { invoke } = await import('@tauri-apps/api/core')
      
      // Set up test listener
      const unlisten = await listen('test-event', (event: any) => {
        console.log('[OK] Test event received:', event.payload)
      })
      
      // Emit test event
      try {
        const result = await invoke('test_event_emit')
        console.log('[LAUNCH] Test emit result:', result)
      } catch (error) {
        console.error('[ERROR] Test emit failed:', error)
      }
      
      // Clean up listener after 2 seconds
      setTimeout(() => {
        unlisten()
        console.log('[CLEANUP] Test listener cleaned up')
      }, 2000)
    } catch (error) {
      console.error('[ERROR] Error in testEventEmit:', error)
    }
  }
}

export const tauriService = new TauriService()