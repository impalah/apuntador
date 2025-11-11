/**
 * OAuth Services
 * 
 * Servicios para autenticación OAuth a través de apuntador-backend
 */

export { BackendOAuthClient } from './backendOAuthClient'
export type { BackendOAuthConfig, OAuthTokens, AuthorizeResponse } from './backendOAuthClient'
export { getBackendUrl, getOAuthRedirectUri, OAUTH_URLS } from './config'
