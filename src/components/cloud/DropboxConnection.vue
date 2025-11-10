<template>
  <v-card class="dropbox-connection">
    <v-card-title class="d-flex align-center">
      <v-icon color="primary" class="me-2">mdi-dropbox</v-icon>
      Dropbox
    </v-card-title>

    <v-card-text>
      <!-- Estado desconectado -->
      <div v-if="!dropboxStore.isConnected && !dropboxStore.isConnecting">
        <p class="text-body-2 mb-4">
          {{ $t('dropbox.connection.description') }}
        </p>
        
        <v-btn
          color="primary"
          variant="elevated"
          :loading="dropboxStore.isConnecting"
          @click="handleConnect"
          block
        >
          <v-icon start>mdi-link</v-icon>
          {{ $t('dropbox.connection.connect') }}
        </v-btn>
      </div>

      <!-- Estado conectando -->
      <div v-else-if="dropboxStore.isConnecting" class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
          size="48"
          class="mb-4"
        />
        <p class="text-body-2">
          {{ $t('dropbox.connection.connecting') }}
        </p>
      </div>

      <!-- Estado conectado -->
      <div v-else class="d-flex flex-column">
        <!-- Información del usuario -->
        <div class="d-flex align-center mb-4">
          <v-avatar color="primary" class="me-3">
            <v-icon>mdi-account</v-icon>
          </v-avatar>
          <div>
            <p class="text-subtitle-2 mb-0">{{ dropboxStore.userInfo?.name }}</p>
            <p class="text-caption text-medium-emphasis">{{ dropboxStore.userInfo?.email }}</p>
          </div>
        </div>

        <!-- Estado de conexión -->
        <v-chip
          color="success"
          variant="tonal"
          size="small"
          class="mb-4"
        >
          <v-icon start size="16">mdi-check-circle</v-icon>
          {{ $t('dropbox.connection.connected') }}
        </v-chip>

        <!-- Botón desconectar -->
        <v-btn
          color="error"
          variant="outlined"
          size="small"
          @click="handleDisconnect"
          block
        >
          <v-icon start>mdi-link-off</v-icon>
          {{ $t('dropbox.connection.disconnect') }}
        </v-btn>
      </div>

      <!-- Error -->
      <v-alert
        v-if="dropboxStore.error"
        type="error"
        variant="tonal"
        class="mt-4"
        closable
        @click:close="dropboxStore.clearError"
      >
        {{ dropboxStore.error }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useDropboxStore } from '@/stores/useDropboxStore'
import { useI18n } from 'vue-i18n'
import { useNotification } from '@/composables/useNotification'

// Composables
const { t } = useI18n()
const dropboxStore = useDropboxStore()
const { showError } = useNotification()

// Métodos
const handleConnect = async (): Promise<void> => {
  try {
    await dropboxStore.connect()
  } catch (error) {
    showError(t('errors.services.cloud.connectionFailed'))
    console.error('Error connecting to Dropbox:', error)
  }
}

const handleDisconnect = async (): Promise<void> => {
  try {
    await dropboxStore.disconnect()
  } catch (error) {
    showError(t('errors.services.cloud.disconnectionFailed'))
    console.error('Error disconnecting from Dropbox:', error)
  }
}
</script>

<style scoped>
.dropbox-connection {
  max-width: 400px;
}
</style>