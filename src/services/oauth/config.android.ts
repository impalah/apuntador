/**
 * Configuración de Backend OAuth para Android
 * 
 * IMPORTANTE: Ahora usa la API de producción desplegada en AWS
 * URLs centralizadas en @/config/api.ts
 */

import { Capacitor } from '@capacitor/core'
import { BACKEND_OAUTH_URL } from '@/config/api'

export function getAndroidBackendUrl(): string {
  // Siempre usar la API de producción desplegada
  // Solo usar DEV si explícitamente estás desarrollando el backend localmente
  return (
    import.meta.env.VITE_BACKEND_OAUTH_URL_DEV ||
    import.meta.env.VITE_BACKEND_OAUTH_URL_PROD ||
    BACKEND_OAUTH_URL
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
    BACKEND_OAUTH_URL
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
  return globalThis.location.origin + '/oauth-callback'
}
