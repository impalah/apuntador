/**
 * Configuración de Backend OAuth para Android
 * 
 * IMPORTANTE: Ahora usa la API de producción desplegada en AWS
 * - Producción: https://api.apuntador.io
 * - Desarrollo local: Solo si tienes el backend corriendo localmente
 */

import { Capacitor } from '@capacitor/core'

export function getAndroidBackendUrl(): string {
  // Siempre usar la API de producción desplegada
  // Solo usar DEV si explícitamente estás desarrollando el backend localmente
  return (
    import.meta.env.VITE_BACKEND_OAUTH_URL_DEV ||
    import.meta.env.VITE_BACKEND_OAUTH_URL_PROD ||
    'https://api.apuntador.io'
  )
}

export function getAndroidRedirectUri(): string {
  // Deep link configurado en AndroidManifest.xml
  return 'apuntador://oauth-callback'
}

/**
 * Obtiene la URL del backend según la plataforma
 */
export function getPlatformBackendUrl(): string {
  if (Capacitor.getPlatform() === 'android') {
    return getAndroidBackendUrl()
  }
  
  // Web: usar variable de entorno
  return (
    import.meta.env.VITE_BACKEND_OAUTH_URL_DEV ||
    import.meta.env.VITE_BACKEND_OAUTH_URL_PROD ||
    'https://api.apuntador.io'
  )
}

/**
 * Obtiene el redirect URI según la plataforma
 */
export function getPlatformRedirectUri(): string {
  if (Capacitor.getPlatform() === 'android') {
    return getAndroidRedirectUri()
  }
  
  // Web: URL de la app
  return window.location.origin + '/oauth-callback'
}
