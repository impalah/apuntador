import type { OAuthConfig } from '@/types/cloud'
import { Capacitor } from '@capacitor/core'

// Detectar entorno y plataforma
const isDevelopment = import.meta.env.DEV
const isNative = Capacitor.isNativePlatform()

// Función para obtener la redirect URI apropiada
function getRedirectUri(): string {
  if (isNative) {
    // En aplicaciones nativas usar custom URL scheme
    return import.meta.env.VITE_OAUTH_REDIRECT_URI_NATIVE || 'apuntador://oauth-callback'
  } else if (isDevelopment) {
    // En desarrollo web usar localhost
    return import.meta.env.VITE_OAUTH_REDIRECT_URI_DEV || 'http://localhost:3000/oauth-callback'
  } else {
    // En producción web usar dominio principal
    return import.meta.env.VITE_OAUTH_REDIRECT_URI_PROD || 'https://app.apuntador.io/oauth-callback'
  }
}

export const DROPBOX_CONFIG: OAuthConfig = {
  clientId: import.meta.env.VITE_DROPBOX_CLIENT_ID || '',
  redirectUri: getRedirectUri(),
  scope: 'files.metadata.read files.content.read files.content.write'
}

// URLs para diferentes entornos (referencia)
export const OAUTH_URLS = {
  development: import.meta.env.VITE_OAUTH_REDIRECT_URI_DEV || 'http://localhost:3000/oauth-callback',
  production: import.meta.env.VITE_OAUTH_REDIRECT_URI_PROD || 'https://app.apuntador.io/oauth-callback',
  native: import.meta.env.VITE_OAUTH_REDIRECT_URI_NATIVE || 'apuntador://oauth-callback'
}