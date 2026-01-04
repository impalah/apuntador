import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DropboxService } from '@/services/dropbox/dropboxService'
import { GoogleDriveService } from '@/services/googledrive/googleDriveService'
import { DROPBOX_CONFIG } from '@/services/dropbox/config'
import { GOOGLE_DRIVE_CONFIG } from '@/services/googledrive/config'
import { tauriService } from '@/services/tauriService'
import { CertificateValidator } from '@/services/certificate/certificateValidator'
import { cloudProviderConfig, type CloudProviderConfig } from '@/services/cloudProviderConfig'
import type { CloudFile, CloudProvider, CloudProviderId, CloudService } from '@/types/cloud'

/**
 * Store unificado para gestionar múltiples proveedores de almacenamiento en la nube
 * Solo un proveedor puede estar activo a la vez
 */
export const useCloudStore = defineStore('cloud', () => {
  // State
  const activeProviderId = ref<CloudProviderId | null>(null)
  const isConnecting = ref(false)
  const isLoadingFiles = ref(false)
  const isDownloading = ref(false)
  const isUploading = ref(false)
  const isDeleting = ref(false)
  const currentFiles = ref<CloudFile[]>([])
  const currentPath = ref<string>('')
  const currentFolderName = ref<string>('') // Nombre de la carpeta actual
  const error = ref<string | null>(null)
  const providerConfig = ref<CloudProviderConfig | null>(null) // Backend provider config

  // Provider-specific state
  const dropboxUserInfo = ref<{ name: string; email: string } | null>(null)
  const googleDriveUserInfo = ref<{ name: string; email: string } | null>(null)

  // State to remember last cloud file
  const lastCloudPath = ref<string>('')
  const lastCloudFileName = ref<string>('')

  // Services instances
  const dropboxService = new DropboxService(DROPBOX_CONFIG)
  const googleDriveService = new GoogleDriveService(GOOGLE_DRIVE_CONFIG)

  // Map of services
  const services: Record<CloudProviderId, CloudService> = {
    dropbox: dropboxService,
    googledrive: googleDriveService,
  }

  // Computed
  const activeProvider = computed<CloudProvider | null>(() => {
    if (!activeProviderId.value) return null

    const providerId = activeProviderId.value
    const service = services[providerId]
    const userInfo = providerId === 'dropbox' ? dropboxUserInfo.value : googleDriveUserInfo.value

    return {
      id: providerId,
      name: providerId === 'dropbox' ? 'Dropbox' : 'Google Drive',
      isConnected: service.isConnected(),
      userInfo: userInfo || undefined,
    }
  })

  const isConnected = computed(() => {
    const connected = activeProvider.value?.isConnected || false
    console.log('CloudStore isConnected computed:', {
      hasActiveProvider: !!activeProvider.value,
      activeProviderId: activeProviderId.value,
      providerIsConnected: activeProvider.value?.isConnected,
      result: connected,
    })
    return connected
  })

  const availableProviders = computed<CloudProvider[]>(() => {
    const allProviders: CloudProvider[] = [
      {
        id: 'dropbox',
        name: 'Dropbox',
        isConnected: dropboxService.isConnected(),
        userInfo: dropboxUserInfo.value || undefined,
      },
      {
        id: 'googledrive',
        name: 'Google Drive',
        isConnected: googleDriveService.isConnected(),
        userInfo: googleDriveUserInfo.value || undefined,
      },
    ]

    // Si no hay configuración cargada, mostrar todos (fallback)
    if (!providerConfig.value) {
      return allProviders
    }

    // Filtrar solo providers habilitados según configuración del backend
    return allProviders.filter((provider) => {
      const config = providerConfig.value?.providers[provider.id]
      return config?.enabled ?? true // Default to enabled if config missing
    })
  })

  // Actions

  /**
   * Inicializa el store cargando el proveedor activo guardado
   * y la configuración de providers del backend
   */
  const initialize = async (): Promise<void> => {
    // STEP 1: Cargar configuración de providers del backend
    try {
      console.log('[CloudStore] Loading provider configuration from backend...')
      providerConfig.value = await cloudProviderConfig.getConfig()
      console.log('[CloudStore] Provider configuration loaded:', providerConfig.value)
    } catch (error) {
      console.error('[ERROR] [CloudStore] Failed to load provider configuration:', error)
      // Continue without config (all providers will be shown by default)
    }

    // STEP 2: Cargar proveedor activo del localStorage
    const savedProviderId = localStorage.getItem('cloud_active_provider') as CloudProviderId | null

    if (savedProviderId && services[savedProviderId]) {
      activeProviderId.value = savedProviderId

      // Inicializar servicio si tiene método initialize
      const service = services[savedProviderId]
      if (service.initialize) {
        await service.initialize()
      }

      // Refrescar estado de conexión
      await refreshConnectionStatus()
    }
  }

  /**
   * Cambia el proveedor activo sin re-autenticar si ya hay credenciales
   */
  const setActiveProvider = async (providerId: CloudProviderId): Promise<void> => {
    console.log('Store: Changing active provider to:', providerId)

    // Si ya es el proveedor activo, no hacer nada
    if (activeProviderId.value === providerId) {
      console.log('Store: Provider already active, skipping')
      return
    }

    isConnecting.value = true
    error.value = null

    try {
      const service = services[providerId]

      // Intentar restaurar sesión existente
      console.log('Store: Checking for existing credentials...')

      // Verificar si el servicio soporta restoreSession
      if (!service.restoreSession) {
        console.log('[WARNING] Store: Service does not support session restoration, starting OAuth')
        await connect(providerId)
        return
      }

      const sessionRestored = await service.restoreSession()

      if (sessionRestored) {
        // Ya hay credenciales válidas, solo cambiar el proveedor activo
        console.log('Store: Session restored successfully, switching provider')
        activeProviderId.value = providerId
        localStorage.setItem('cloud_active_provider', providerId)

        // Cargar información del usuario
        await refreshConnectionStatus()

        console.log('[SUCCESS] Store: Provider switched successfully without re-authentication')
      } else {
        // No hay credenciales o están expiradas, iniciar OAuth
        console.log('[WARNING] Store: No valid credentials found, starting OAuth flow')
        await connect(providerId)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error switching cloud provider'
      console.error('[ERROR] Store: Error switching provider:', err)
      throw err
    } finally {
      isConnecting.value = false
    }
  }

  /**
   * Conecta a un proveedor específico
   */
  const connect = async (providerId: CloudProviderId): Promise<void> => {
    if (isConnecting.value) return

    isConnecting.value = true
    error.value = null

    try {
      // STEP 1: Ensure valid certificate AND fetch provider config
      console.log('Ensuring device has valid certificate and fetching provider config...')
      const { certStatus, providerConfig } =
        await CertificateValidator.ensureValidCertificateAndConfig()

      // Check if certificate is valid (for mobile/desktop)
      if (!certStatus.isValid) {
        const message = CertificateValidator.getStatusMessage(certStatus)
        console.error('[ERROR] Certificate validation/enrollment failed:', message)
        error.value = message

        // Throw error to prevent OAuth flow
        throw new Error(`Certificate required: ${message}`)
      }

      console.log('Certificate ready for OAuth')
      if (certStatus.daysUntilExpiry) {
        console.log(`Certificate valid for ${certStatus.daysUntilExpiry} more days`)
      }

      // STEP 2: Validate provider is enabled
      const providerInfo = providerConfig.providers[providerId]
      if (!providerInfo?.enabled) {
        const message = `Provider ${providerId} is not enabled on the backend`
        console.error('[ERROR]', message)
        error.value = message
        throw new Error(message)
      }

      console.log(`Provider ${providerId} is enabled`)

      // STEP 3: Proceed with OAuth flow
      const service = services[providerId]
      if (!service) {
        throw new Error(`Service not found for provider: ${providerId}`)
      }

      // Detectar si estamos en Tauri
      const isTauri = await tauriService.isAvailable()

      if (isTauri && (providerId === 'dropbox' || providerId === 'googledrive')) {
        // Flujo para Dropbox/Google Drive en Tauri usando backend proxy
        console.log(`Using Tauri OAuth flow for ${providerId} (via backend proxy)`)

        // STEP 1: Start OAuth callback server
        console.log('Starting OAuth callback server...')
        await tauriService.startOAuthCallbackServer()

        // STEP 2: Set up listener for oauth-callback event
        console.log('[LISTEN] Setting up OAuth callback listener...')
        const callbackPromise = tauriService.listenForOAuthCallback()

        // STEP 3: Start OAuth flow (opens browser with backend URL)
        console.log('Opening browser for OAuth (backend proxy)...')
        await service.connect() // This opens browser to backend URL

        // STEP 4: Wait for callback from localhost:8080
        console.log('⏳ Waiting for OAuth callback from browser...')
        const callbackData = await callbackPromise
        console.log('[CALL] OAuth callback received:', callbackData)

        // STEP 5: Exchange code for token via backend
        if ('handleOAuthCallback' in service && typeof service.handleOAuthCallback === 'function') {
          await service.handleOAuthCallback(callbackData.code, callbackData.state)
        } else {
          throw new Error(`Service ${providerId} does not support OAuth callback`)
        }
      } else {
        // Flujo web estándar
        console.log('Using web OAuth flow')
        await service.connect()
        // Connection completes in handleOAuthCallback
        return // No continuar aquí, el callback completará la conexión
      }

      // Establecer como proveedor activo
      activeProviderId.value = providerId
      localStorage.setItem('cloud_active_provider', providerId)

      await refreshConnectionStatus()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error connecting to cloud provider'
      console.error('Cloud connection error:', err)
    } finally {
      isConnecting.value = false
    }
  }

  /**
   * Maneja el callback de OAuth
   */
  const handleOAuthCallback = async (
    code: string,
    state: string,
    providerId?: CloudProviderId
  ): Promise<void> => {
    // Si no se especifica proveedor, intentar detectarlo
    const targetProviderId = providerId || activeProviderId.value

    if (!targetProviderId) {
      throw new Error('No provider specified for OAuth callback')
    }

    isConnecting.value = true
    error.value = null

    try {
      const service = services[targetProviderId]

      if (service.handleOAuthCallback) {
        await service.handleOAuthCallback(code, state)
      }

      // Establecer como proveedor activo
      activeProviderId.value = targetProviderId
      localStorage.setItem('cloud_active_provider', targetProviderId)

      await refreshConnectionStatus()
    } catch (err) {
      console.error('OAuth callback error:', err)
      error.value = err instanceof Error ? err.message : 'Error completing authentication'
      throw err
    } finally {
      isConnecting.value = false
    }
  }

  /**
   * Desconecta del proveedor activo
   */
  /**
   * Desconecta del proveedor activo
   * @param clearCredentials - Si es true, borra las credenciales del proveedor (requiere re-autenticación)
   *                          Si es false, solo lo desactiva pero mantiene las credenciales
   */
  const disconnect = async (clearCredentials: boolean = false): Promise<void> => {
    if (!activeProviderId.value) return

    try {
      const providerId = activeProviderId.value
      const service = services[providerId]

      if (clearCredentials) {
        // Borrar credenciales completamente (requiere re-autenticación)
        console.log(`🔴 Disconnecting and clearing credentials for ${providerId}`)
        await service.disconnect()
      } else {
        // Solo desactivar pero mantener credenciales guardadas
        console.log(`[PAUSE] Deactivating ${providerId} but keeping credentials`)
        // No llamar a service.disconnect() para mantener tokens en localStorage
      }

      // Limpiar estado en memoria
      if (providerId === 'dropbox') {
        dropboxUserInfo.value = null
      } else {
        googleDriveUserInfo.value = null
      }

      activeProviderId.value = null
      localStorage.removeItem('cloud_active_provider')
      currentFiles.value = []
      currentPath.value = ''
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error disconnecting'
      console.error('Disconnect error:', err)
    }
  }

  /**
   * Revoca el acceso de un proveedor específico (borra credenciales)
   */
  const revokeProvider = async (providerId: CloudProviderId): Promise<void> => {
    try {
      console.log(`🔴 Revoking access for provider: ${providerId}`)

      const service = services[providerId]
      await service.disconnect()

      // Si era el proveedor activo, limpiarlo
      if (activeProviderId.value === providerId) {
        if (providerId === 'dropbox') {
          dropboxUserInfo.value = null
        } else {
          googleDriveUserInfo.value = null
        }

        activeProviderId.value = null
        localStorage.removeItem('cloud_active_provider')
        currentFiles.value = []
        currentPath.value = ''
      }

      console.log(`Provider ${providerId} access revoked successfully`)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error revoking provider access'
      console.error('Revoke provider error:', err)
      throw err
    }
  }

  /**
   * Refresca el estado de conexión del proveedor activo
   */
  const refreshConnectionStatus = async (): Promise<void> => {
    if (!activeProviderId.value) return

    try {
      const service = services[activeProviderId.value]

      if (service.isConnected()) {
        const userInfo = await service.getUserInfo()

        if (activeProviderId.value === 'dropbox') {
          dropboxUserInfo.value = userInfo
        } else {
          googleDriveUserInfo.value = userInfo
        }
      }
    } catch (err) {
      console.error('Error refreshing connection status:', err)
    }
  }

  /**
   * Carga archivos del proveedor activo
   */
  const loadFiles = async (path?: string, folderName?: string): Promise<void> => {
    if (!activeProviderId.value) {
      throw new Error('No active cloud provider')
    }

    isLoadingFiles.value = true
    error.value = null

    try {
      const service = services[activeProviderId.value]
      const targetPath = path ?? currentPath.value

      currentFiles.value = await service.listFiles(targetPath)
      currentPath.value = targetPath

      // Actualizar el nombre de la carpeta
      if (targetPath === '' || targetPath === 'root') {
        currentFolderName.value = '' // Root no tiene nombre específico
      } else if (folderName !== undefined) {
        currentFolderName.value = folderName
      }
      // Si no se proporciona folderName y no es root, mantener el valor actual
      // (útil cuando se recarga la misma carpeta)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading files'
      console.error('Error loading files:', err)
      throw err
    } finally {
      isLoadingFiles.value = false
    }
  }

  /**
   * Navega a una carpeta
   */
  const navigateToFolder = async (path: string, folderName?: string): Promise<void> => {
    await loadFiles(path, folderName)
  }

  /**
   * Descarga un archivo
   */
  const downloadFile = async (path: string, fileName?: string): Promise<string> => {
    if (!activeProviderId.value) {
      throw new Error('No active cloud provider')
    }

    isDownloading.value = true
    error.value = null

    try {
      const service = services[activeProviderId.value]
      lastCloudPath.value = path
      // Use provided fileName or extract from path (for Dropbox compatibility)
      lastCloudFileName.value = fileName || path.split('/').pop() || ''

      return await service.downloadFile(path)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error downloading file'
      console.error('Error downloading file:', err)
      throw err
    } finally {
      isDownloading.value = false
    }
  }

  /**
   * Sube un archivo
   */
  const uploadFile = async (path: string, content: string): Promise<CloudFile> => {
    if (!activeProviderId.value) {
      throw new Error('No active cloud provider')
    }

    isUploading.value = true
    error.value = null

    try {
      const service = services[activeProviderId.value]
      const file = await service.uploadFile(path, content)

      // Recargar archivos de la carpeta actual
      await loadFiles()

      return file
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error uploading file'
      console.error('Error uploading file:', err)
      throw err
    } finally {
      isUploading.value = false
    }
  }

  /**
   * Elimina un archivo
   */
  const deleteFile = async (fileId: string): Promise<void> => {
    if (!activeProviderId.value) {
      throw new Error('No active cloud provider')
    }

    isDeleting.value = true
    error.value = null

    try {
      const service = services[activeProviderId.value]
      await service.deleteFile(fileId)

      // Recargar archivos de la carpeta actual
      await loadFiles()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error deleting file'
      console.error('Error deleting file:', err)
      throw err
    } finally {
      isDeleting.value = false
    }
  }

  return {
    // State
    activeProviderId,
    isConnecting,
    isLoadingFiles,
    isDownloading,
    isUploading,
    isDeleting,
    currentFiles,
    currentPath,
    currentFolderName,
    error,
    lastCloudPath,
    lastCloudFileName,

    // Computed
    activeProvider,
    isConnected,
    availableProviders,

    // Actions
    initialize,
    setActiveProvider,
    connect,
    handleOAuthCallback,
    disconnect,
    revokeProvider,
    refreshConnectionStatus,
    loadFiles,
    navigateToFolder,
    downloadFile,
    uploadFile,
    deleteFile,
  }
})
