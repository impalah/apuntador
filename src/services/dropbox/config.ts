import type { OAuthConfig } from '@/types/cloud'
import { getBackendUrl, getOAuthRedirectUri } from '@/services/oauth/config'

/**
 * Dropbox OAuth Configuration
 *
 * IMPORTANTE: Esta app usa Backend OAuth Proxy Mode, lo que significa que NO expone
 * el client_id ni client_secret de Dropbox. El backend maneja
 * todas las credenciales de forma segura.
 *
 * Flujo:
 * 1. Cliente solicita URL de autorización al backend
 * 2. Backend genera URL con sus credenciales
 * 3. Usuario autoriza en Dropbox
 * 4. Dropbox redirige al backend
 * 5. Backend intercambia código por token
 * 6. Backend devuelve token al cliente
 */

export const DROPBOX_CONFIG: OAuthConfig = {
  clientId: '', // No se usa, el backend maneja esto
  redirectUri: getOAuthRedirectUri(),
  scope: 'files.metadata.read files.content.read files.content.write',
}

console.log('Dropbox Config (Backend Proxy Mode):')
console.log('  Backend URL:', getBackendUrl())
console.log('  Redirect URI:', getOAuthRedirectUri())
console.log('  Using Backend OAuth Proxy: [OK]')
