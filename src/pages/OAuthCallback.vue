<template>
  <div class="oauth-callback d-flex align-center justify-center min-vh-100">
    <v-card max-width="500" class="mx-auto">
      <v-card-text class="text-center py-8">
        <!-- Estado de procesamiento -->
        <div v-if="isProcessing">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            class="mb-4"
          />
          <h2 class="text-h5 mb-2">{{ $t('dropbox.connection.connecting') }}</h2>
          <p class="text-body-2 text-medium-emphasis">
            {{ $t('dropbox.oauth.processing') }}
          </p>
        </div>

        <!-- Estado de éxito -->
        <div v-else-if="isSuccess">
          <v-icon
            size="64"
            color="success"
            class="mb-4"
          >
            mdi-check-circle
          </v-icon>
          <h2 class="text-h5 mb-2">{{ $t('dropbox.oauth.successTitle') }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ $t('dropbox.oauth.successMessage') }}
          </p>
          <v-btn
            color="primary"
            variant="elevated"
            @click="redirectToApp"
          >
            {{ $t('dropbox.oauth.continueButton') }}
          </v-btn>
        </div>

        <!-- Estado de error -->
        <div v-else-if="error">
          <v-icon
            size="64"
            color="error"
            class="mb-4"
          >
            mdi-alert-circle
          </v-icon>
          <h2 class="text-h5 mb-2">{{ $t('dropbox.oauth.errorTitle') }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ error }}
          </p>
          <div class="d-flex flex-column gap-2">
            <v-btn
              color="primary"
              variant="outlined"
              @click="retryConnection"
            >
              {{ $t('dropbox.oauth.retryButton') }}
            </v-btn>
            <v-btn
              color="grey"
              variant="text"
              @click="redirectToApp"
            >
              {{ $t('dropbox.oauth.backButton') }}
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
import { useDropboxStore } from '@/stores/useDropboxStore'

// Composables
const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const dropboxStore = useDropboxStore()

// Estado
const isProcessing = ref(true)
const isSuccess = ref(false)
const error = ref<string | null>(null)

// Métodos
const processOAuthCallback = async (): Promise<void> => {
  try {
    console.log('🔄 Processing OAuth callback...')
    console.log('📍 Current URL:', window.location.href)
    console.log('📋 Route query:', route.query)

    // Obtener parámetros de la URL
    const code = route.query.code as string
    const errorParam = route.query.error as string
    const state = route.query.state as string

    console.log('🔑 Code:', code ? 'RECEIVED' : 'MISSING')
    console.log('❌ Error:', errorParam || 'NONE')

    // Verificar si hay error de OAuth
    if (errorParam) {
      throw new Error(`OAuth error: ${errorParam}`)
    }

    // Check that we have the authorization code
    if (!code) {
      throw new Error(t('dropbox.oauth.noAuthCode'))
    }

    console.log('🚀 Calling dropboxStore.handleOAuthCallback...')
    // Procesar el callback con Dropbox
    await dropboxStore.handleOAuthCallback(code)
    console.log('✅ OAuth callback completed successfully')

    // Éxito
    isProcessing.value = false
    isSuccess.value = true

    // Redirigir automáticamente después de 3 segundos
    setTimeout(() => {
      redirectToApp()
    }, 3000)

  } catch (err) {
    console.error('OAuth callback error:', err)
    error.value = err instanceof Error ? err.message : t('errors.unknownError')
    isProcessing.value = false
  }
}

const retryConnection = async (): Promise<void> => {
  error.value = null
  isProcessing.value = true
  isSuccess.value = false
  
  try {
    await dropboxStore.connect()
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('errors.reconnectError')
    isProcessing.value = false
  }
}

const redirectToApp = (): void => {
  // Redirigir a la página principal con hash para abrir opciones en pestaña cloud
  router.push('/#options/cloud')
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