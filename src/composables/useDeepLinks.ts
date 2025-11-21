import { onMounted, onUnmounted } from 'vue'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useRouter } from 'vue-router'

export function useDeepLinks() {
  const router = useRouter()

  /**
   * Extract OAuth parameters from URL query string
   */
  const extractOAuthParams = (urlString: string): Record<string, string> => {
    const queryStart = urlString.indexOf('?')
    if (queryStart === -1) return {}
    
    const queryString = urlString.substring(queryStart + 1)
    const params = new URLSearchParams(queryString)
    
    const query: Record<string, string> = {}
    const code = params.get('code')
    const error = params.get('error')
    const state = params.get('state')
    
    if (code) query.code = code
    if (error) query.error = error
    if (state) query.state = state
    
    return query
  }

  /**
   * Navigate to OAuth callback with extracted parameters
   */
  const navigateToOAuthCallback = async (
    provider: string,
    query: Record<string, string>,
    platform: string
  ) => {
    const codeStatus = query.code ? 'PRESENT' : 'MISSING'
    console.log(`📋 [${platform}] ${provider} OAuth params - code:`, codeStatus, 'error:', query.error, 'state:', query.state)
    console.log(`🧭 [${platform}] Navigating to oauth-callback with query:`, query)
    
    await router.push({ name: 'oauth-callback', query })
    
    console.log(`✅ [${platform}] Navigated to ${provider} OAuth callback page`)
  }

  /**
   * Process OAuth callback deep link
   */
  const processOAuthCallback = async (urlString: string, provider: string, platform: string) => {
    console.log(`🚀 [${platform}] Processing ${provider} OAuth deep link`)
    
    const query = extractOAuthParams(urlString)
    await navigateToOAuthCallback(provider, query, platform)
  }

  const handleAppUrl = async (data: { url: string }) => {
    const platform = Capacitor.getPlatform().toUpperCase()
    console.log(`🔗 [${platform}] Deep link received:`, data.url)
    
    try {
      const urlString = data.url
      
      // Detect OAuth callback type
      const isDropboxCallback = urlString.startsWith('apuntador://oauth-callback')
      const isGoogleCallback = urlString.includes('com.googleusercontent.apps') && urlString.includes('/oauth2redirect')
      
      if (isDropboxCallback) {
        await processOAuthCallback(urlString, 'Dropbox', platform)
      } else if (isGoogleCallback) {
        await processOAuthCallback(urlString, 'Google Drive', platform)
      } else {
        console.log(`🔍 [${platform}] Unknown deep link format, ignoring. URL:`, urlString)
      }
    } catch (error) {
      console.error(`❌ [${platform}] Error processing deep link:`, error)
    }
  }

  const setupDeepLinks = async () => {
    // Solo configurar deep links en plataformas nativas
    if (!Capacitor.isNativePlatform()) {
      console.log('🌐 Web platform detected, skipping deep link setup')
      return
    }

    console.log('📱 Native platform detected, setting up deep links')
    
    try {
      // Listener para deep links cuando la app está activa
      App.addListener('appUrlOpen', handleAppUrl)
      
      // Verificar si la app se abrió con un deep link
      const initialUrl = await App.getLaunchUrl()
      if (initialUrl?.url) {
        console.log('🚀 App launched with deep link:', initialUrl.url)
        await handleAppUrl(initialUrl)
      }
      
      // console.log('✅ Deep links configured successfully')
    } catch (error) {
      console.error('❌ Error setting up deep links:', error)
    }
  }

  const cleanupDeepLinks = () => {
    if (Capacitor.isNativePlatform()) {
      App.removeAllListeners()
      console.log('🧹 Deep link listeners cleaned up')
    }
  }

  // Configurar en el montaje del componente
  onMounted(setupDeepLinks)
  onUnmounted(cleanupDeepLinks)

  return {
    setupDeepLinks,
    cleanupDeepLinks
  }
}