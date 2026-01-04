<template>
  <div class="oauth-callback d-flex align-center justify-center min-vh-100">
    <v-card max-width="500" class="mx-auto">
      <v-card-text class="text-center py-8">
        <!-- Estado de procesamiento -->
        <div v-if="isProcessing">
          <v-progress-circular indeterminate color="primary" size="64" class="mb-4" />
          <h2 class="text-h5 mb-2">{{ $t('cloud.oauth.connecting') }}</h2>
          <p class="text-body-2 text-medium-emphasis">
            {{ $t('cloud.oauth.processing') }}
          </p>
        </div>

        <!-- Estado de éxito -->
        <div v-else-if="isSuccess">
          <v-icon size="64" color="success" class="mb-4"> mdi-check-circle </v-icon>
          <h2 class="text-h5 mb-2">{{ $t('cloud.oauth.successTitle') }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ $t('cloud.oauth.successMessage') }}
          </p>
          <v-btn color="primary" variant="elevated" @click="redirectToApp">
            {{ $t('cloud.oauth.continueButton') }}
          </v-btn>
        </div>

        <!-- Estado de error -->
        <div v-else-if="error">
          <v-icon size="64" color="error" class="mb-4"> mdi-alert-circle </v-icon>
          <h2 class="text-h5 mb-2">{{ $t('cloud.oauth.errorTitle') }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ error }}
          </p>
          <div class="d-flex flex-column gap-2">
            <v-btn color="primary" variant="outlined" @click="retryConnection">
              {{ $t('cloud.oauth.retryButton') }}
            </v-btn>
            <v-btn color="grey" variant="text" @click="redirectToApp">
              {{ $t('cloud.oauth.backButton') }}
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { useCloudStore } from '@/stores/useCloudStore'
import type { CloudProviderId } from '@/types/cloud'

// Composables
const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const cloudStore = useCloudStore()

// Estado
const isProcessing = ref(true)
const isSuccess = ref(false)
const error = ref<string | null>(null)

// Métodos
const processOAuthCallback = async (): Promise<void> => {
  try {
    console.log('Processing OAuth callback...')
    console.log('📍 Current URL:', globalThis.location.href)
    console.log('Route query:', route.query)

    // Obtener parámetros de la URL
    const code = route.query.code as string
    const errorParam = route.query.error as string
    const state = route.query.state as string
    let provider = route.query.provider as CloudProviderId | undefined

    // Si no se especificó provider en el query, intentar obtenerlo de localStorage
    // (guardado durante el inicio del flujo OAuth)
    if (!provider) {
      const savedProvider = localStorage.getItem('oauth_current_provider')
      if (savedProvider === 'dropbox' || savedProvider === 'googledrive') {
        provider = savedProvider as CloudProviderId
        console.log(`Provider detected from localStorage: ${provider}`)
      }
    }

    console.log('[KEY] Code:', code ? 'RECEIVED' : 'MISSING')
    console.log('[TAG] State:', state || 'NONE')
    console.log('🏢 Provider:', provider || 'NOT SPECIFIED')
    console.log('[ERROR] Error:', errorParam || 'NONE')

    // Verificar si hay error de OAuth
    if (errorParam) {
      throw new Error(`OAuth error: ${errorParam}`)
    }

    // Check that we have the authorization code
    if (!code) {
      throw new Error(t('cloud.oauth.noAuthCode'))
    }

    console.log('Calling cloudStore.handleOAuthCallback...')
    // Procesar el callback con el proveedor apropiado
    await cloudStore.handleOAuthCallback(code, state || '', provider)
    console.log('OAuth callback completed successfully')

    // Cerrar el navegador en iOS/Android (solo en plataformas nativas)
    if (Capacitor.isNativePlatform()) {
      console.log('Closing browser window...')
      try {
        await Browser.close()
        console.log('Browser closed')
      } catch (err) {
        console.warn('[WARNING] Failed to close browser:', err)
        // No es crítico si falla, continuar de todos modos
      }
    }

    // Limpiar provider de localStorage
    localStorage.removeItem('oauth_current_provider')

    // Éxito
    isProcessing.value = false
    isSuccess.value = true

    // Redirigir automáticamente después de 1 segundo (más rápido)
    setTimeout(() => {
      redirectToApp()
    }, 1000)
  } catch (err) {
    console.error('OAuth callback error:', err)
    error.value = err instanceof Error ? err.message : t('errors.unknownError')
    isProcessing.value = false

    // Limpiar provider de localStorage en caso de error
    localStorage.removeItem('oauth_current_provider')
  }
}

const retryConnection = async (): Promise<void> => {
  error.value = null
  isProcessing.value = true
  isSuccess.value = false

  // Redirect to home page
  router.push('/')
}

const redirectToApp = (): void => {
  // Obtener la ruta de retorno guardada antes de iniciar OAuth
  const returnTo = localStorage.getItem('oauth_return_to')

  // Limpiar el localStorage
  localStorage.removeItem('oauth_return_to')

  // Redirigir a la ruta guardada o al prompter por defecto
  const targetPath = returnTo || '/'
  console.log('🔙 Redirecting to:', targetPath)
  router.push(targetPath)
}

// Lifecycle
onMounted(() => {
  processOAuthCallback()
})
</script>

<style scoped>
.oauth-callback {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}
</style>
