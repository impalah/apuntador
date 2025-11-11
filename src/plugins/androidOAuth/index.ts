import { registerPlugin } from '@capacitor/core'

export interface AndroidOAuthPlugin {
  /**
   * Inicia el flujo de OAuth con PKCE
   * @param options Configuración del OAuth
   * @returns Promesa con la URL de autorización, state y code_verifier
   */
  authorize(options: {
    provider: string
    backendUrl: string
    redirectUri: string
  }): Promise<{
    authorization_url: string
    state: string
    code_verifier: string
  }>

  /**
   * Intercambia el código de autorización por tokens
   * @param options Datos del callback
   * @returns Promesa con access_token, refresh_token y expires_in
   */
  exchangeToken(options: {
    provider: string
    code: string
    state?: string
    backendUrl: string
  }): Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
  }>

  /**
   * Refresca un access token
   * @param options Refresh token y provider
   * @returns Promesa con nuevo access_token y expires_in
   */
  refreshToken(options: {
    provider: string
    refreshToken: string
    backendUrl: string
  }): Promise<{
    access_token: string
    expires_in: number
  }>

  /**
   * Revoca un token
   * @param options Token y provider
   * @returns Promesa con éxito
   */
  revokeToken(options: {
    provider: string
    token: string
    backendUrl: string
  }): Promise<{
    success: boolean
  }>
}

/**
 * Plugin de Capacitor para OAuth 2.0 + PKCE en Android
 * 
 * Proporciona:
 * - Generación segura de PKCE con SecureRandom
 * - Comunicación con backend OAuth proxy
 * - Manejo de deep links para callbacks
 */
const AndroidOAuth = registerPlugin<AndroidOAuthPlugin>('AndroidOAuth', {
  web: () => import('./web').then((m) => new m.AndroidOAuthWeb()),
})

export default AndroidOAuth
