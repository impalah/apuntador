import type { OAuthConfig } from '@/types/cloud'

/**
 * Google Drive OAuth Configuration
 * 
 * IMPORTANTE: Como usamos backend OAuth proxy, el frontend NO necesita
 * el client_id ni client_secret de Google Drive. El backend maneja
 * toda la comunicación OAuth con Google.
 * 
 * El frontend solo necesita:
 * - El redirect_uri donde recibirá el código de autorización
 * - Este redirect_uri se envía al backend en cada petición OAuth
 */

export const GOOGLE_DRIVE_CONFIG: OAuthConfig = {
  // No usado con backend proxy - el backend tiene sus propias credenciales
  clientId: '',
  clientSecret: undefined,
  
  // El redirect URI es usado por la app para recibir el callback
  // El backend redirigirá aquí después de obtener el código de Google
  redirectUri: 'apuntador://oauth-callback',
  
  // Scope para acceso completo a Google Drive
  scope: 'https://www.googleapis.com/auth/drive'
}

// Debug logs para verificar configuración
console.log('🔍 Google Drive Config (Backend Proxy Mode):')
console.log('  - Redirect URI:', GOOGLE_DRIVE_CONFIG.redirectUri)
console.log('  - Scope:', GOOGLE_DRIVE_CONFIG.scope)

// URLs para diferentes entornos (referencia)
export const OAUTH_URLS = {
  development: import.meta.env.VITE_OAUTH_REDIRECT_URI_DEV || 'http://localhost:3000/oauth-callback',
  production: import.meta.env.VITE_OAUTH_REDIRECT_URI_PROD || 'https://app.apuntador.io/oauth-callback',
  native: import.meta.env.VITE_OAUTH_REDIRECT_URI_NATIVE || 'apuntador://oauth-callback'
}
