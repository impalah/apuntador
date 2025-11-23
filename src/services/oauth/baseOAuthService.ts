import type { CloudService, OAuthConfig } from '@/types/cloud'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { BackendOAuthClient } from '@/services/oauth/backendOAuthClient'
import { getBackendUrl, getOAuthRedirectUri } from '@/services/oauth/config'
import { storage } from '@/utils/persistence'
import { isTauri } from '@/utils/tauri'
import { tauriService } from '@/services/tauriService'
import { createServiceErrorHandler, createServiceSuccessHandler } from '@/utils/serviceErrorHandler'

/**
 * Clase base abstracta para servicios OAuth
 * Implementa la lógica común de OAuth 2.0 + PKCE para todos los proveedores
 * 
 * Responsabilidades:
 * - Gestión del flujo OAuth completo (connect → callback → tokens)
 * - Detección y manejo de plataforma (Web/Tauri/Mobile)
 * - Persistencia de tokens
 * - Validación de state (protección CSRF)
 * - Logging estructurado
 * - Manejo de errores
 */
export abstract class BaseOAuthService implements Partial<CloudService> {
  protected readonly config: OAuthConfig
  protected readonly backendClient: BackendOAuthClient
  protected readonly errorHandler = createServiceErrorHandler()
  protected readonly successHandler = createServiceSuccessHandler()

  constructor(config: OAuthConfig, provider: 'googledrive' | 'dropbox') {
    this.config = config
    
    // Inicializar cliente del backend OAuth
    this.backendClient = new BackendOAuthClient({
      backendUrl: getBackendUrl(),
      provider,
      redirectUri: getOAuthRedirectUri()
    })
    
    console.log(`🔧 ${this.getProviderName()}: Initialized with backend OAuth proxy`, {
      backendUrl: getBackendUrl(),
      redirectUri: getOAuthRedirectUri()
    })
  }

  /**
   * Nombre del proveedor para logging y storage
   * Debe ser implementado por la clase hija
   */
  protected abstract getProviderName(): string

  /**
   * Clave para guardar el state en localStorage
   * Formato: {provider}_oauth_state
   */
  protected getStateKey(): string {
    return `${this.getProviderName().toLowerCase()}_oauth_state`
  }

  /**
   * Inicia el flujo de OAuth 2.0 con PKCE a través del backend
   * 
   * Flow:
   * 1. Solicita URL de autorización al backend
   * 2. Guarda state para validación CSRF
   * 3. Detecta plataforma (Tauri/Native/Web)
   * 4. Abre navegador apropiado para la plataforma
   */
  async connect(): Promise<void> {
    try {
      console.log(`🚀 ${this.getProviderName()}: Starting OAuth connection via backend...`)
      
      if (isTauri()) {
        console.log('🔧 Platform: Tauri/Desktop')
      } else if (Capacitor.isNativePlatform()) {
        console.log('🔧 Platform: Mobile Native', Capacitor.getPlatform())
      } else {
        console.log('🔧 Platform: Web')
      }
      
      // Obtener URL de autorización del backend
      console.log(`📡 ${this.getProviderName()}: Requesting authorization URL from backend...`)
      const { authorization_url, state } = await this.backendClient.authorize()
      
      console.log(`✅ ${this.getProviderName()}: Authorization URL received from backend`)
      console.log(`📍 Redirect URI:`, getOAuthRedirectUri())

      // Guardar state para validar en el callback
      localStorage.setItem(this.getStateKey(), state)
      console.log('💾 State saved to localStorage')

      // Guardar ruta actual para retornar después de OAuth
      // Solo guardar si estamos en la aplicación (no en callback)
      if (typeof window !== 'undefined' && globalThis.location.pathname !== '/oauth-callback') {
        const currentPath = globalThis.location.pathname
        localStorage.setItem('oauth_return_to', currentPath)
        console.log('💾 Return path saved:', currentPath)
      }

      // Redirigir al usuario al proveedor OAuth para autorizar
      await this.openAuthorizationUrl(authorization_url)
      
    } catch (error) {
      this.errorHandler.handleCloudError(error, 'connect', { 
        provider: this.getProviderName().toLowerCase() 
      })
      throw error
    }
  }

  /**
   * Abre la URL de autorización según la plataforma
   * 
   * - Desktop (Tauri): Navegador del sistema
   * - Mobile (iOS/Android): Browser plugin de Capacitor
   * - Web: Redirección directa
   */
  protected async openAuthorizationUrl(url: string): Promise<void> {
    const isTauriPlatform = isTauri()
    
    if (isTauriPlatform) {
      // Desktop (Tauri): abrir en navegador del sistema
      console.log(`🖥️ ${this.getProviderName()}: Opening OAuth URL in system browser (Tauri)`)
      await tauriService.openUrl(url)
      console.log('✅ Browser opened successfully')
      
    } else if (Capacitor.isNativePlatform()) {
      // Mobile: usar Browser plugin
      console.log(`📱 ${this.getProviderName()}: Opening OAuth URL in system browser (Native)`)
      await Browser.open({ url })
      
    } else {
      // Web: redirección normal
      console.log(`🌐 ${this.getProviderName()}: Redirecting to OAuth URL (Web)`)
      globalThis.location.href = url
    }
  }

  /**
   * Maneja el callback de OAuth y obtiene los tokens
   * 
   * Flow:
   * 1. Valida state (protección CSRF)
   * 2. Intercambia código por tokens vía backend
   * 3. Guarda tokens en storage
   * 4. Llama a onTokensReceived() para lógica específica del proveedor
   * 5. Limpia state y muestra éxito
   * 
   * @param code - Código de autorización del proveedor OAuth
   * @param state - State para validación CSRF (opcional)
   */
  async handleOAuthCallback(code: string, state?: string): Promise<void> {
    console.log(`🔧 ${this.getProviderName()}: handleOAuthCallback called via backend`)
    
    try {
      // Verificar state si está disponible
      if (state) {
        const savedState = localStorage.getItem(this.getStateKey())
        if (!savedState || savedState !== state) {
          throw new Error('Invalid OAuth state. Possible CSRF attack.')
        }
      }
      
      console.log(`🔑 ${this.getProviderName()}: Exchanging code for tokens via backend...`)
      
      // Intercambiar código por tokens a través del backend
      const tokens = await this.backendClient.handleCallback(code, state || '')
      
      console.log(`✅ ${this.getProviderName()}: Tokens received from backend`, {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in,
        tokenType: tokens.token_type
      })

      if (!tokens.access_token) {
        throw new Error('No access token received from backend')
      }

      // Guardar tokens en storage
      await this.saveTokens(tokens.access_token, tokens.refresh_token)
      
      // Permitir a la clase hija procesar los tokens (e.g., inicializar cliente SDK)
      await this.onTokensReceived(tokens.access_token, tokens.refresh_token)
      
      console.log(`✅ ${this.getProviderName()}: OAuth flow completed successfully via backend`)
      
      // Limpiar state
      localStorage.removeItem(this.getStateKey())
      
      // Mostrar mensaje de éxito al usuario
      this.successHandler.showCloudSuccess('connect')
      
    } catch (error) {
      this.errorHandler.handleOAuthError(error, { 
        provider: this.getProviderName().toLowerCase(), 
        step: 'callback' 
      })
      localStorage.removeItem(this.getStateKey())
      throw error
    }
  }

  /**
   * Guarda tokens en el storage persistente
   * Las claves específicas deben ser definidas por las clases hijas
   * 
   * @param accessToken - Token de acceso
   * @param refreshToken - Token de refresco (opcional)
   */
  protected abstract saveTokens(
    accessToken: string, 
    refreshToken?: string
  ): Promise<void>

  /**
   * Hook para que las clases hijas procesen los tokens recibidos
   * Ejemplo: inicializar cliente SDK, guardar en instancia, etc.
   * 
   * @param accessToken - Token de acceso
   * @param refreshToken - Token de refresco (opcional)
   */
  protected abstract onTokensReceived(
    accessToken: string, 
    refreshToken?: string
  ): Promise<void>
}
