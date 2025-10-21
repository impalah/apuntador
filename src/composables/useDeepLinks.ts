import { onMounted, onUnmounted } from 'vue'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useRouter } from 'vue-router'

export function useDeepLinks() {
  const router = useRouter()

  const handleAppUrl = async (data: { url: string }) => {
    console.log('🔗 [ANDROID DEBUG] Deep link received:', data.url)
    
    try {
      // En Android, las URLs con esquemas personalizados pueden no parsear correctamente con new URL()
      // Vamos a hacer parsing manual para URLs de apuntador
      const urlString = data.url
      
      if (urlString.startsWith('apuntador://oauth-callback')) {
        console.log('🚀 [ANDROID DEBUG] Processing Dropbox OAuth deep link')
        
        // Extraer parámetros manualmente
        const queryStart = urlString.indexOf('?')
        let queryString = ''
        if (queryStart !== -1) {
          queryString = urlString.substring(queryStart + 1)
        }
        
        const params = new URLSearchParams(queryString)
        const code = params.get('code')
        const error = params.get('error')
        const state = params.get('state')
        
        console.log('📋 [ANDROID DEBUG] OAuth params - code:', code ? 'PRESENT' : 'MISSING', 'error:', error, 'state:', state)
        
        // Navegar al callback con los parámetros
        const query: Record<string, string> = {}
        if (code) query.code = code
        if (error) query.error = error
        if (state) query.state = state
        
        console.log('🧭 [ANDROID DEBUG] Navigating to oauth-callback with query:', query)
        
        await router.push({
          name: 'oauth-callback',
          query
        })
        
        console.log('✅ [ANDROID DEBUG] Navigated to OAuth callback page')
      } else {
        console.log('🔍 [ANDROID DEBUG] Unknown deep link format, ignoring. URL:', urlString)
      }
    } catch (error) {
      console.error('❌ [ANDROID DEBUG] Error processing deep link:', error)
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
      
      console.log('✅ Deep links configured successfully')
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