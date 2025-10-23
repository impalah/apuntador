import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DropboxService } from '@/services/dropbox/dropboxService'
import { GoogleDriveService } from '@/services/googledrive/googleDriveService'
import { DROPBOX_CONFIG } from '@/services/dropbox/config'
import { GOOGLE_DRIVE_CONFIG } from '@/services/googledrive/config'
import { tauriService } from '@/services/tauriService'
import type { CloudFile, CloudProvider, CloudProviderId, CloudService } from '@/types/cloud'

/**
 * Store unificado para gestionar múltiples proveedores de almacenamiento en la nube
 * Solo un proveedor puede estar activo a la vez
 */
export const useCloudStore = defineStore('cloud', () => {
  // State
  const activeProviderId = ref<CloudProviderId | null>(null)
  const isConnecting = ref(false)
  const currentFiles = ref<CloudFile[]>([])
  const currentPath = ref<string>('')
  const error = ref<string | null>(null)
  
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
    googledrive: googleDriveService
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
      userInfo: userInfo || undefined
    }
  })

  const isConnected = computed(() => activeProvider.value?.isConnected || false)

  const availableProviders = computed<CloudProvider[]>(() => [
    {
      id: 'dropbox',
      name: 'Dropbox',
      isConnected: dropboxService.isConnected(),
      userInfo: dropboxUserInfo.value || undefined
    },
    {
      id: 'googledrive',
      name: 'Google Drive',
      isConnected: googleDriveService.isConnected(),
      userInfo: googleDriveUserInfo.value || undefined
    }
  ])

  // Actions
  
  /**
   * Inicializa el store cargando el proveedor activo guardado
   */
  const initialize = async (): Promise<void> => {
    // Cargar proveedor activo del localStorage
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
   * Conecta a un proveedor específico
   */
  const connect = async (providerId: CloudProviderId): Promise<void> => {
    if (isConnecting.value) return
    
    isConnecting.value = true
    error.value = null

    try {
      const service = services[providerId]
      
      // Detectar si estamos en Tauri
      const isTauri = await tauriService.isAvailable()
      
      if (isTauri && providerId === 'dropbox') {
        // Flujo especial para Dropbox en Tauri
        console.log('🖥️ Using Tauri OAuth flow for Dropbox')
        
        const callbackPromise = tauriService.listenForOAuthCallback()
        const authUrl = await tauriService.startDropboxOAuth()
        
        const callbackData = await callbackPromise
        const tokenResponse = await tauriService.exchangeOAuthCode(
          callbackData.code, 
          callbackData.state
        )
        
        dropboxService.setAccessToken!(tokenResponse.access_token)
        
      } else {
        // Flujo web estándar
        console.log('🌐 Using web OAuth flow')
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
  const handleOAuthCallback = async (code: string, providerId?: CloudProviderId): Promise<void> => {
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
        await service.handleOAuthCallback(code)
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
  const disconnect = async (): Promise<void> => {
    if (!activeProviderId.value) return

    try {
      const service = services[activeProviderId.value]
      await service.disconnect()
      
      // Limpiar estado
      if (activeProviderId.value === 'dropbox') {
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
  const loadFiles = async (path?: string): Promise<void> => {
    if (!activeProviderId.value) {
      throw new Error('No active cloud provider')
    }

    try {
      const service = services[activeProviderId.value]
      const targetPath = path !== undefined ? path : currentPath.value
      
      currentFiles.value = await service.listFiles(targetPath)
      currentPath.value = targetPath
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading files'
      console.error('Error loading files:', err)
      throw err
    }
  }

  /**
   * Navega a una carpeta
   */
  const navigateToFolder = async (path: string): Promise<void> => {
    await loadFiles(path)
  }

  /**
   * Descarga un archivo
   */
  const downloadFile = async (path: string): Promise<string> => {
    if (!activeProviderId.value) {
      throw new Error('No active cloud provider')
    }

    try {
      const service = services[activeProviderId.value]
      lastCloudPath.value = path
      lastCloudFileName.value = path.split('/').pop() || ''
      
      return await service.downloadFile(path)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error downloading file'
      console.error('Error downloading file:', err)
      throw err
    }
  }

  /**
   * Sube un archivo
   */
  const uploadFile = async (path: string, content: string): Promise<CloudFile> => {
    if (!activeProviderId.value) {
      throw new Error('No active cloud provider')
    }

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
    }
  }

  /**
   * Elimina un archivo
   */
  const deleteFile = async (fileId: string): Promise<void> => {
    if (!activeProviderId.value) {
      throw new Error('No active cloud provider')
    }

    try {
      const service = services[activeProviderId.value]
      await service.deleteFile(fileId)
      
      // Recargar archivos de la carpeta actual
      await loadFiles()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error deleting file'
      console.error('Error deleting file:', err)
      throw err
    }
  }

  return {
    // State
    activeProviderId,
    isConnecting,
    currentFiles,
    currentPath,
    error,
    lastCloudPath,
    lastCloudFileName,
    
    // Computed
    activeProvider,
    isConnected,
    availableProviders,
    
    // Actions
    initialize,
    connect,
    handleOAuthCallback,
    disconnect,
    refreshConnectionStatus,
    loadFiles,
    navigateToFolder,
    downloadFile,
    uploadFile,
    deleteFile,
  }
})
