/**
 * Backend OAuth Configuration
 * 
 * Configuración para conectar con apuntador-backend OAuth proxy
 */

import { Capacitor } from '@capacitor/core'
import { isTauri } from '@/utils/tauri'

// Detectar entorno y plataforma
const isDevelopment = import.meta.env.DEV
const isNative = Capacitor.isNativePlatform()

/**
 * URL del backend OAuth (apuntador-backend)
 * 
 * Prioridad:
 * 1. VITE_BACKEND_OAUTH_URL_IOS_DEV si es iOS (siempre, no depende de isDevelopment)
 * 2. VITE_BACKEND_OAUTH_URL_DEV si está definida (para testing con backend local)
 * 3. VITE_BACKEND_OAUTH_URL_PROD si está definida
 * 4. Fallback a producción (https://api.apuntador.io)
 */
export function getBackendUrl(): string {
  const platform = Capacitor.getPlatform()
  
  // iOS: usar IP específica si está configurada (localhost no funciona en dispositivos iOS)
  // No depende de isDevelopment porque en iOS siempre necesitamos la IP, incluso en builds de producción para testing
  if (platform === 'ios' && import.meta.env.VITE_BACKEND_OAUTH_URL_IOS_DEV) {
    return import.meta.env.VITE_BACKEND_OAUTH_URL_IOS_DEV
  }
  
  // Si hay URL de desarrollo configurada explícitamente, usarla
  // (útil para testing con backend local corriendo en localhost:8000)
  if (import.meta.env.VITE_BACKEND_OAUTH_URL_DEV) {
    return import.meta.env.VITE_BACKEND_OAUTH_URL_DEV
  }
  
  // Si hay URL de producción configurada, usarla
  if (import.meta.env.VITE_BACKEND_OAUTH_URL_PROD) {
    return import.meta.env.VITE_BACKEND_OAUTH_URL_PROD
  }
  
  // Fallback: siempre usar API de producción
  return 'https://api.apuntador.io'
}

/**
 * Redirect URI para OAuth callback
 * 
 * IMPORTANTE: Esta debe coincidir con la configurada en:
 * - apuntador-backend ALLOWED_ORIGINS
 * - Consola de desarrolladores de Google/Dropbox
 */
export function getOAuthRedirectUri(): string {
  // Desktop (Tauri): usar servidor local HTTP
  if (isTauri()) {
    return 'http://localhost:8080/oauth/callback'
  }
  
  if (isNative) {
    // Aplicaciones nativas (Android/iOS)
    return import.meta.env.VITE_OAUTH_REDIRECT_URI_NATIVE || 'apuntador://oauth-callback'
  } else if (isDevelopment) {
    // Desarrollo web: localhost
    return import.meta.env.VITE_OAUTH_REDIRECT_URI_DEV || 'http://localhost:3000/oauth-callback'
  } else {
    // Producción web
    return import.meta.env.VITE_OAUTH_REDIRECT_URI_PROD || 'https://app.apuntador.io/oauth-callback'
  }
}

/**
 * URLs de referencia para documentación
 */
export const OAUTH_URLS = {
  development: {
    backend: 'http://localhost:8000', // Backend local (si estás desarrollando el backend)
    redirect: 'http://localhost:3000/oauth-callback'
  },
  production: {
    backend: 'https://api.apuntador.io',
    redirect: 'https://app.apuntador.io/oauth-callback'
  },
  native: {
    backend: 'https://api.apuntador.io', // Siempre producción para native
    redirect: 'apuntador://oauth-callback'
  }
}
