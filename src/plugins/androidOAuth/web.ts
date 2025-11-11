import { WebPlugin } from '@capacitor/core'
import type { AndroidOAuthPlugin } from './index'

/**
 * Implementación Web del plugin AndroidOAuth (stub)
 * En web, el OAuth se maneja directamente con BackendOAuthClient
 */
export class AndroidOAuthWeb extends WebPlugin implements AndroidOAuthPlugin {
  async authorize(): Promise<{ authorization_url: string; state: string; code_verifier: string }> {
    throw this.unimplemented('Not implemented on web. Use BackendOAuthClient instead.')
  }

  async exchangeToken(): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
    throw this.unimplemented('Not implemented on web. Use BackendOAuthClient instead.')
  }

  async refreshToken(): Promise<{ access_token: string; expires_in: number }> {
    throw this.unimplemented('Not implemented on web. Use BackendOAuthClient instead.')
  }

  async revokeToken(): Promise<{ success: boolean }> {
    throw this.unimplemented('Not implemented on web. Use BackendOAuthClient instead.')
  }
}
