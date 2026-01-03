<template>
  <div class="cloud-provider-selector">
    <v-card-subtitle class="px-0 text-medium-emphasis">
      {{ t('settings.cloudProvidersDescription') }}
    </v-card-subtitle>

    <!-- Active Provider Info -->
    <v-card
      v-if="cloudStore.activeProvider"
      class="mb-6"
      variant="tonal"
      color="primary"
    >
      <v-card-text>
        <div class="d-flex align-center">
          <v-icon size="large" class="me-3">
            {{ getProviderIcon(cloudStore.activeProvider.id) }}
          </v-icon>
          <div class="flex-grow-1">
            <div class="text-subtitle-1 font-weight-medium">
              {{ t('cloud.activeProvider') }}
            </div>
            <div class="text-body-2">
              {{ cloudStore.activeProvider.name }}
            </div>
            <div v-if="cloudStore.activeProvider.userInfo" class="text-caption text-medium-emphasis">
              {{ cloudStore.activeProvider.userInfo.email }}
            </div>
          </div>
          <v-btn
            variant="text"
            color="error"
            @click="onDisconnect"
            :loading="isDisconnecting"
          >
            {{ t('cloud.disconnect') }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Available Providers -->
    <div class="text-subtitle-2 mb-3">
      {{ t('cloud.availableProviders') }}
    </div>

    <v-row>
      <v-col
        v-for="provider in cloudStore.availableProviders"
        :key="provider.id"
        cols="12"
        md="6"
      >
        <v-card
          :variant="provider.isConnected ? 'tonal' : 'outlined'"
          :color="provider.isConnected ? 'success' : undefined"
          class="provider-card"
        >
          <v-card-text>
            <div class="d-flex align-center">
              <v-avatar
                :color="provider.isConnected ? 'success' : 'surface-variant'"
                size="48"
                class="me-3"
              >
                <v-icon size="large">
                  {{ getProviderIcon(provider.id) }}
                </v-icon>
              </v-avatar>
              
              <div class="flex-grow-1">
                <div class="text-subtitle-1 font-weight-medium">
                  {{ provider.name }}
                </div>
                <div
                  v-if="provider.isConnected"
                  class="text-caption text-success"
                >
                  <v-icon size="small" class="me-1">mdi-check-circle</v-icon>
                  {{ t('cloud.connected') }}
                </div>
                <div v-else class="text-caption text-medium-emphasis">
                  {{ t('cloud.notConnected') }}
                </div>
              </div>
            </div>

            <div v-if="provider.userInfo" class="mt-3 text-caption">
              <div>{{ provider.userInfo.name }}</div>
              <div class="text-medium-emphasis">{{ provider.userInfo.email }}</div>
            </div>

            <v-btn
              :color="cloudStore.activeProviderId === provider.id ? 'success' : 'primary'"
              :variant="cloudStore.activeProviderId === provider.id ? 'tonal' : 'flat'"
              block
              class="mt-4"
              :loading="isConnecting && connectingProviderId === provider.id"
              :disabled="isConnecting || isDisconnecting || (provider.isConnected && cloudStore.activeProviderId === provider.id)"
              @click="onConnect(provider.id)"
            >
              <v-icon v-if="cloudStore.activeProviderId === provider.id" start>
                mdi-check-circle
              </v-icon>
              {{
                cloudStore.activeProviderId === provider.id
                  ? t('cloud.activeProvider')
                  : provider.isConnected
                  ? t('cloud.setAsActive')
                  : t('cloud.connect')
              }}
            </v-btn>
            
            <!-- Botón para revocar acceso (solo si está conectado pero no es el activo) -->
            <v-btn
              v-if="provider.isConnected && cloudStore.activeProviderId !== provider.id"
              variant="text"
              color="error"
              size="small"
              block
              class="mt-2"
              :loading="isRevokingProvider === provider.id"
              :disabled="isConnecting || isDisconnecting"
              @click="onRevokeProvider(provider.id)"
            >
              {{ t('cloud.revokeAccess') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Error message -->
    <v-alert
      v-if="cloudStore.error"
      type="error"
      variant="tonal"
      closable
      class="mt-4"
      @click:close="cloudStore.error = null"
    >
      {{ cloudStore.error }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCloudStore } from '@/stores/useCloudStore'
import type { CloudProviderId } from '@/types/cloud'

const { t } = useI18n()
const cloudStore = useCloudStore()

// State
const isConnecting = ref(false)
const isDisconnecting = ref(false)
const connectingProviderId = ref<CloudProviderId | null>(null)
const isRevokingProvider = ref<CloudProviderId | null>(null)

// Methods
function getProviderIcon(providerId: CloudProviderId): string {
  const icons: Record<CloudProviderId, string> = {
    dropbox: 'mdi-dropbox',
    googledrive: 'mdi-google-drive'
  }
  return icons[providerId] || 'mdi-cloud'
}

async function onConnect(providerId: CloudProviderId) {
  isConnecting.value = true
  connectingProviderId.value = providerId
  
  try {
    // Obtener información del proveedor
    const provider = cloudStore.availableProviders.find(p => p.id === providerId)
    
    // Si el proveedor ya está conectado, solo cambiar el activo
    // Si no está conectado, iniciar flujo OAuth
    if (provider?.isConnected && cloudStore.activeProviderId !== providerId) {
      console.log(`[REFRESH] Provider ${providerId} already connected, switching active provider...`)
      await cloudStore.setActiveProvider(providerId)
    } else {
      console.log(`[LINK] Provider ${providerId} not connected, starting OAuth flow...`)
      await cloudStore.connect(providerId)
    }
  } catch (error) {
    console.error('Error connecting to provider:', error)
  } finally {
    isConnecting.value = false
    connectingProviderId.value = null
  }
}

async function onDisconnect() {
  console.log('🔴 [CloudProviderSelector] Disconnect button clicked')
  
  // TODO: Fix confirm dialog in Tauri
  // if (!confirm(t('cloud.disconnectConfirm'))) {
  //   console.log('🔴 [CloudProviderSelector] Disconnect cancelled by user')
  //   return
  // }
  
  console.log('🔴 [CloudProviderSelector] Starting disconnect (keeping credentials)...')
  isDisconnecting.value = true
  
  try {
    // Desconectar sin borrar credenciales (por defecto clearCredentials=false)
    await cloudStore.disconnect()
    console.log('[OK] [CloudProviderSelector] Disconnect successful, credentials preserved')
  } catch (error) {
    console.error('[ERROR] [CloudProviderSelector] Error disconnecting:', error)
  } finally {
    isDisconnecting.value = false
  }
}

async function onRevokeProvider(providerId: CloudProviderId) {
  console.log('🔴 [CloudProviderSelector] Revoke access button clicked for:', providerId)
  
  isRevokingProvider.value = providerId
  
  try {
    await cloudStore.revokeProvider(providerId)
    console.log('[OK] [CloudProviderSelector] Provider access revoked successfully')
  } catch (error) {
    console.error('[ERROR] [CloudProviderSelector] Error revoking provider:', error)
  } finally {
    isRevokingProvider.value = null
  }
}
</script>

<style scoped>
.provider-card {
  transition: all 0.2s ease;
}

.provider-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
