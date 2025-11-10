/**
 * API Configuration
 * 
 * Centraliza todas las URLs de APIs externas en variables de entorno
 * para facilitar la configuración y evitar URLs hardcodeadas en el código.
 */

/**
 * Google APIs
 */
export const GOOGLE_API_URLS = {
  drive: import.meta.env.VITE_GOOGLE_API_DRIVE_BASE_URL || 'https://www.googleapis.com/drive/v3',
  upload: import.meta.env.VITE_GOOGLE_API_UPLOAD_BASE_URL || 'https://www.googleapis.com/upload/drive/v3',
  content: import.meta.env.VITE_GOOGLE_API_CONTENT_BASE_URL || 'https://content.googleapis.com',
} as const

/**
 * Dropbox APIs
 */
export const DROPBOX_API_URLS = {
  auth: import.meta.env.VITE_DROPBOX_AUTH_URL || 'https://www.dropbox.com/oauth2/authorize',
  token: import.meta.env.VITE_DROPBOX_TOKEN_URL || 'https://api.dropboxapi.com/oauth2/token',
  api: import.meta.env.VITE_DROPBOX_API_URL || 'https://api.dropboxapi.com/2',
  content: import.meta.env.VITE_DROPBOX_CONTENT_URL || 'https://content.dropboxapi.com/2',
} as const

/**
 * Backend OAuth URL
 */
export const BACKEND_OAUTH_URL = 
  import.meta.env.VITE_BACKEND_OAUTH_URL_PROD || 
  'https://api.apuntador.io'
