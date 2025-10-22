import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

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
      await invoke('is_theater_mode')
      return true
    } catch {
      return false
    }
  }

  async startDropboxOAuth(): Promise<string> {
    try {
      return await invoke('start_dropbox_oauth')
    } catch (error) {
      console.error('Error starting Dropbox OAuth:', error)
      throw error
    }
  }

  async exchangeOAuthCode(code: string, state: string): Promise<TauriOAuthResponse> {
    try {
      return await invoke('exchange_oauth_code', { code, state })
    } catch (error) {
      console.error('Error exchanging OAuth code:', error)
      throw error
    }
  }

  async listDropboxFiles(accessToken: string, path?: string): Promise<any[]> {
    try {
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
    console.log('👂 TauriService: Setting up listener for oauth-callback')
    
    this.stopOAuthListener() // Clean up previous listener
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log('⏰ TauriService: OAuth timeout after 5 minutes')
        this.stopOAuthListener()
        reject(new Error('OAuth timeout'))
      }, 300000) // 5 minutes timeout

      // Set up listener and handle Promise
      listen('oauth-callback', (event: any) => {
        console.log('📞 TauriService: oauth-callback event received:', event.payload)
        clearTimeout(timeout)
        this.stopOAuthListener()
        resolve(event.payload)
      }).then((unlistenFn) => {
        this.oauthCallbackListener = unlistenFn
        console.log('✅ TauriService: oauth-callback listener configured')
      }).catch((error) => {
        console.error('❌ TauriService: Error setting up listener:', error)
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
      return await invoke('toggle_theater_mode')
    } catch (error) {
      console.error('Error toggling theater mode:', error)
      throw error
    }
  }

  async isTheaterMode(): Promise<boolean> {
    try {
      return await invoke('is_theater_mode')
    } catch (error) {
      console.error('Error checking theater mode:', error)
      return false
    }
  }

  async testEventEmit(): Promise<void> {
    console.log('🧪 Testing event emission...')
    
    // Set up test listener
    const unlisten = await listen('test-event', (event: any) => {
      console.log('✅ Test event received:', event.payload)
    })
    
    // Emit test event
    try {
      const result = await invoke('test_event_emit')
      console.log('🚀 Test emit result:', result)
    } catch (error) {
      console.error('❌ Test emit failed:', error)
    }
    
    // Clean up listener after 2 seconds
    setTimeout(() => {
      unlisten()
      console.log('🧹 Test listener cleaned up')
    }, 2000)
  }
}

export const tauriService = new TauriService()