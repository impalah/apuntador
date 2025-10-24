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

export const GOOGLE_DRIVE_CONFIG: OAuthConfig = {
  // Seleccionar Client ID según la plataforma
  clientId: isNative && import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID_ANDROID
    ? import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID_ANDROID  // Cliente Android para móvil
    : import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID || '',    // Cliente Web/Desktop para web
  
  // client_secret es OPCIONAL:
  // - Para clientes tipo "Android" o "iOS": NO se debe usar (más seguro)
  // - Para clientes tipo "Aplicación de escritorio": REQUERIDO (menos seguro)
  // Solo usar client_secret en web/desktop si está disponible
  clientSecret: !isNative && import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_SECRET
    ? import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_SECRET
    : undefined,
  
  redirectUri: getRedirectUri(),
  // Usar drive para acceso completo a lectura/escritura de todos los archivos
  // Alternativa: 'https://www.googleapis.com/auth/drive.readonly' solo para lectura
  scope: 'https://www.googleapis.com/auth/drive'
}

// URLs para diferentes entornos (referencia)
export const OAUTH_URLS = {
  development: import.meta.env.VITE_OAUTH_REDIRECT_URI_DEV || 'http://localhost:3000/oauth-callback',
  production: import.meta.env.VITE_OAUTH_REDIRECT_URI_PROD || 'https://app.apuntador.io/oauth-callback',
  native: import.meta.env.VITE_OAUTH_REDIRECT_URI_NATIVE || 'apuntador://oauth-callback'
}
