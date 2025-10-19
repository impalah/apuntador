import type { OAuthConfig } from '@/types/cloud'

// Configuración de Dropbox según el entorno
const isDevelopment = import.meta.env.DEV
const baseUrl = isDevelopment 
  ? 'http://localhost:3000' 
  : 'https://app.apuntador.io'

export const DROPBOX_CONFIG: OAuthConfig = {
  clientId: 'qej36t232go21e8',
  redirectUri: `${baseUrl}/oauth-callback`,
  scope: 'files.metadata.read files.content.read files.content.write'
}

// URLs para diferentes entornos
export const OAUTH_URLS = {
  development: 'http://localhost:3000/oauth-callback',
  production: 'https://app.apuntador.io/oauth-callback'
}