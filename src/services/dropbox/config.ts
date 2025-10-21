import type { OAuthConfig } from '@/types/cloud'
import { Capacitor } from '@capacitor/core'

// Detectar entorno y plataforma
const isDevelopment = import.meta.env.DEV
const isNative = Capacitor.isNativePlatform()

// Función para obtener la redirect URI apropiada
function getRedirectUri(): string {
  if (isNative) {
    // En aplicaciones nativas usar custom URL scheme
    return 'apuntador://oauth-callback'
  } else if (isDevelopment) {
    // En desarrollo web usar localhost
    return 'http://localhost:3000/oauth-callback'
  } else {
    // En producción web usar dominio principal
    return 'https://app.apuntador.io/oauth-callback'
  }
}

export const DROPBOX_CONFIG: OAuthConfig = {
  clientId: 'qej36t232go21e8',
  redirectUri: getRedirectUri(),
  scope: 'files.metadata.read files.content.read files.content.write'
}

// URLs para diferentes entornos (referencia)
export const OAUTH_URLS = {
  development: 'http://localhost:3000/oauth-callback',
  production: 'https://app.apuntador.io/oauth-callback',
  native: 'apuntador://oauth-callback'
}