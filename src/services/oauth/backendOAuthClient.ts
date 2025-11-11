/**
 * Backend OAuth Client
 * 
 * Cliente para conectar con apuntador-backend OAuth proxy.
 * Maneja el flujo OAuth 2.0 + PKCE a través del backend.
 * Usa mTLS en Android para solicitar tokens.
 * 
 * Flujo:
 * 1. POST /oauth/authorize/{provider} → Obtiene authorization_url y state firmado
 * 2. Redirect al authorization_url
 * 3. Provider redirect a callback con code y state
 * 4. GET /oauth/callback/{provider}?code=X&state=Y → Obtiene tokens (CON mTLS)
 * 5. POST /oauth/token/refresh/{provider} → Refresca token expirado (CON mTLS)
 */

import { CapacitorHttp } from '@capacitor/core'
import { createBackendClient } from '@/services/http/mtlsHttpAdapter'
import { isTauri } from '@/utils/tauri'
import { tauriService } from '@/services/tauriService'

export interface BackendOAuthConfig {
  backendUrl: string
  provider: 'googledrive' | 'dropbox'
  redirectUri: string
}

export interface OAuthTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope?: string
}

export interface AuthorizeResponse {
  authorization_url: string
  state: string // State firmado por el backend
}

export class BackendOAuthClient {
  private readonly config: BackendOAuthConfig
  private readonly httpClient: ReturnType<typeof createBackendClient>
  private codeVerifier: string | null = null

  constructor(config: BackendOAuthConfig) {
    this.config = config
    this.httpClient = createBackendClient(config.backendUrl)
    console.log(`🔧 BackendOAuthClient: Initialized for ${config.provider}`, {
      backendUrl: config.backendUrl,
      redirectUri: config.redirectUri
    })
  }

  /**
   * Genera un code verifier aleatorio para PKCE
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
   * Inicia el flujo OAuth obteniendo la URL de autorización del backend
   * IMPORTANTE: En Desktop y Mobile, este endpoint REQUIERE mTLS
   * porque el dispositivo debe estar enrolled antes de hacer OAuth.
   * 
   * - Desktop (Tauri): Usa comando `backend_oauth_authorize` con mTLS
   * - Mobile (Android): Usa CapacitorHttp que maneja mTLS automáticamente
   */
  async authorize(): Promise<AuthorizeResponse> {
    console.log(`🚀 BackendOAuthClient: Starting OAuth flow for ${this.config.provider}`)
    console.log(`🔗 BackendOAuthClient: Backend URL: ${this.config.backendUrl}`)

    try {
      // Generar code verifier para PKCE
      this.codeVerifier = this.generateCodeVerifier()
      console.log(`🔐 BackendOAuthClient: Generated code_verifier`)

      // Desktop (Tauri): Usar comando Rust con mTLS
      if (isTauri()) {
        console.log(`🖥️ BackendOAuthClient: Using Tauri mTLS command`)
        
        const result = await tauriService.backendOAuthAuthorize(
          this.config.provider,
          this.codeVerifier,
          this.config.redirectUri
        )

        console.log(`✅ BackendOAuthClient: Authorization URL received from Tauri`, {
          url: result.authorization_url.substring(0, 100) + '...',
          hasState: !!result.state
        })

        // Guardar code_verifier para usar en el callback
        localStorage.setItem(`${this.config.provider}_code_verifier`, this.codeVerifier)
        localStorage.setItem('oauth_current_provider', this.config.provider)

        return result
      }

      // Mobile (Android): Usar CapacitorHttp con mTLS nativo
      const authUrl = `${this.config.backendUrl}/oauth/authorize/${this.config.provider}`
      console.log(`📡 BackendOAuthClient: Calling: ${authUrl}`)

      // IMPORTANTE: Usar CapacitorHttp en lugar de fetch
      // fetch tiene problemas con Mixed Content en Android WebView
      // CapacitorHttp usa la API nativa y bypasea las restricciones del WebView
      const response = await CapacitorHttp.post({
        url: authUrl,
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          code_verifier: this.codeVerifier,
          redirect_uri: this.config.redirectUri,
          state: null // Optional: client-side state
        }
      })

      console.log(`📥 BackendOAuthClient: Response status: ${response.status}`)

      if (response.status !== 200) {
        const errorData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
        throw new Error(
          `Backend authorization failed: ${response.status} - ${errorData}`
        )
      }

      const data: AuthorizeResponse = response.data
      
      console.log(`✅ BackendOAuthClient: Authorization URL received`, {
        url: data.authorization_url.substring(0, 100) + '...',
        hasState: !!data.state
      })

      // Guardar code_verifier para usar en el callback
      localStorage.setItem(`${this.config.provider}_code_verifier`, this.codeVerifier)
      
      // Guardar provider para detectarlo en el callback
      localStorage.setItem('oauth_current_provider', this.config.provider)

      return data
    } catch (error) {
      console.error(`❌ BackendOAuthClient: Authorization failed:`, error)
      console.error(`❌ BackendOAuthClient: Error type: ${error instanceof TypeError ? 'TypeError' : typeof error}`)
      console.error(`❌ BackendOAuthClient: Error message: ${error instanceof Error ? error.message : String(error)}`)
      console.error(`❌ BackendOAuthClient: Backend URL was: ${this.config.backendUrl}`)
      throw error
    }
  }

  /**
   * Completa el flujo OAuth intercambiando el código por tokens
   * IMPORTANTE: Este endpoint REQUIERE mTLS
   * 
   * - Desktop (Tauri): Usa comando `backend_oauth_token_exchange` con mTLS
   * - Mobile (Android): Usa httpClient (CapacitorHttp) con mTLS nativo
   */
  async handleCallback(code: string, state: string): Promise<OAuthTokens> {
    console.log(`🔐 BackendOAuthClient: Handling OAuth callback for ${this.config.provider}`)

    try {
      // Recuperar code_verifier del localStorage
      const codeVerifier = localStorage.getItem(`${this.config.provider}_code_verifier`)
      if (!codeVerifier) {
        throw new Error('Code verifier not found. Please restart the OAuth flow.')
      }

      console.log(`🔑 BackendOAuthClient: Code verifier retrieved from storage`)
      console.log(`🔒 BackendOAuthClient: Using mTLS for token exchange`)

      let tokens: OAuthTokens

      // Desktop (Tauri): Usar comando Rust con mTLS
      if (isTauri()) {
        console.log(`🖥️ BackendOAuthClient: Using Tauri mTLS command for token exchange`)
        
        const result = await tauriService.backendOAuthTokenExchange(
          this.config.provider,
          code,
          codeVerifier,
          state
        )

        tokens = result

        console.log(`✅ BackendOAuthClient: Tokens received from Tauri`, {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiresIn: tokens.expires_in,
          tokenType: tokens.token_type
        })
      } else {
        // Mobile (Android): Usar httpClient con mTLS nativo
        const response = await this.httpClient.post<OAuthTokens>(
          `/oauth/token/${this.config.provider}`,
          {
            code: code,
            code_verifier: codeVerifier,
            state: state
          }
        )

        if (response.status !== 200) {
          throw new Error(
            `Token exchange failed: ${response.status}`
          )
        }

        tokens = response.data

        console.log(`✅ BackendOAuthClient: Tokens received`, {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          expiresIn: tokens.expires_in,
          tokenType: tokens.token_type
        })
      }

      // Limpiar code_verifier del localStorage
      localStorage.removeItem(`${this.config.provider}_code_verifier`)

      return tokens
    } catch (error) {
      console.error(`❌ BackendOAuthClient: Callback failed:`, error)
      // Limpiar code_verifier incluso si hay error
      localStorage.removeItem(`${this.config.provider}_code_verifier`)
      throw error
    }
  }

  /**
   * Refresca un access token expirado usando el refresh token
   * NOTA: Este endpoint SÍ requiere mTLS
   */
  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    console.log(`🔄 BackendOAuthClient: Refreshing token for ${this.config.provider}`)

    try {
      console.log(`🔒 BackendOAuthClient: Using mTLS for token refresh`)

      const response = await this.httpClient.post<OAuthTokens>(
        `/oauth/token/refresh/${this.config.provider}`,
        {
          refresh_token: refreshToken
        }
      )

      if (response.status !== 200) {
        throw new Error(
          `Token refresh failed: ${response.status}`
        )
      }

      const tokens = response.data

      console.log(`✅ BackendOAuthClient: Token refreshed`, {
        expiresIn: tokens.expires_in
      })

      return tokens
    } catch (error) {
      console.error(`❌ BackendOAuthClient: Refresh failed:`, error)
      throw error
    }
  }

  /**
   * Revoca un token (logout)
   * NOTA: Este endpoint SÍ requiere mTLS
   */
  async revokeToken(token: string): Promise<void> {
    console.log(`🚫 BackendOAuthClient: Revoking token for ${this.config.provider}`)

    try {
      console.log(`🔒 BackendOAuthClient: Using mTLS for token revocation`)

      const response = await this.httpClient.post(
        `/oauth/token/revoke/${this.config.provider}`,
        {
          token: token
        }
      )

      if (response.status !== 200) {
        console.warn(`⚠️ Token revocation failed: ${response.status}`)
        // No lanzar error, el token puede estar ya inválido
      } else {
        console.log(`✅ BackendOAuthClient: Token revoked successfully`)
      }
    } catch (error) {
      console.error(`❌ BackendOAuthClient: Revoke failed:`, error)
      // No lanzar error, continuar con logout local
    }
  }
}
