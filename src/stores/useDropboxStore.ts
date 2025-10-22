import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DropboxService } from '@/services/dropbox/dropboxService'
import { DROPBOX_CONFIG } from '@/services/dropbox/config'
import { tauriService } from '@/services/tauriService'
import type { CloudFile, CloudProvider } from '@/types/cloud'

export const useDropboxStore = defineStore('dropbox', () => {
  // State
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const userInfo = ref<{ name: string; email: string } | null>(null)
  const currentFiles = ref<CloudFile[]>([])
  const currentPath = ref<string>('')
  const error = ref<string | null>(null)
  
  // State to remember last cloud file
  const lastCloudPath = ref<string>('')
  const lastCloudFileName = ref<string>('')

  // Dropbox Service
  const dropboxService = new DropboxService(DROPBOX_CONFIG)

  // Computed
  const provider = computed<CloudProvider>(() => ({
    id: 'dropbox',
    name: 'Dropbox',
    isConnected: isConnected.value,
    userInfo: userInfo.value || undefined
  }))

  // Actions
  const connect = async (): Promise<void> => {
    if (isConnecting.value) return
    
    isConnecting.value = true
    error.value = null

    try {
      // Detect if we are in Tauri
      const isTauri = await tauriService.isAvailable()
      
      if (isTauri) {
        console.log('🖥️ Using Tauri OAuth flow')
        
        // FIRST: Configure listener BEFORE opening browser
        console.log('👂 Setting up OAuth listener...')
        const callbackPromise = tauriService.listenForOAuthCallback()
        console.log('✅ OAuth listener configured')
        
        // SECOND: Start OAuth (this will open browser)
        console.log('🚀 Starting OAuth flow...')
        const authUrl = await tauriService.startDropboxOAuth()
        console.log('🔗 Auth URL generated:', authUrl)
        console.log('⏳ Waiting for OAuth callback...')
        
        // THIRD: Wait for callback
        const callbackData = await callbackPromise
        console.log('📞 OAuth callback received:', callbackData)
        
        // Exchange code for token
        const tokenResponse = await tauriService.exchangeOAuthCode(
          callbackData.code, 
          callbackData.state
        )
        
        // Save token and complete connection
        dropboxService.setAccessToken(tokenResponse.access_token)
        await refreshConnectionStatus()
        
      } else {
        console.log('🌐 Using web OAuth flow')
        await dropboxService.connect()
        // Connection completes in handleOAuthCallback
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error connecting to Dropbox'
      console.error('Dropbox connection error:', err)
    } finally {
      isConnecting.value = false
    }
  }

  const handleOAuthCallback = async (code: string): Promise<void> => {
    console.log('🏪 Store: Starting handleOAuthCallback with code:', code ? 'PRESENT' : 'MISSING')
    isConnecting.value = true
    error.value = null

    try {
      console.log('📞 Store: Calling dropboxService.handleOAuthCallback...')
      await dropboxService.handleOAuthCallback(code)
      console.log('✅ Store: Service callback completed, refreshing status...')
      await refreshConnectionStatus()
      console.log('✅ Store: All done successfully!')
    } catch (err) {
      console.error('❌ Store: OAuth callback error:', err)
      error.value = err instanceof Error ? err.message : 'Error completing Dropbox authentication'
      console.error('OAuth callback error:', err)
      throw err // Re-throw so callback page can catch it
    } finally {
      isConnecting.value = false
    }
  }

  const disconnect = async (): Promise<void> => {
    try {
      await dropboxService.disconnect()
      isConnected.value = false
      userInfo.value = null
      currentFiles.value = []
      currentPath.value = ''
      error.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error disconnecting from Dropbox'
      console.error('Dropbox disconnect error:', err)
    }
  }

    const refreshConnectionStatus = async () => {
    console.log('🔄 Store: Refreshing connection status...')
    try {
      const isSessionRestored = await dropboxService.restoreSession()
      console.log('📊 Store: Connection status result:', isSessionRestored)
      
      if (isSessionRestored) {
        // Obtener info del usuario para confirmar conexión
        const userData = await dropboxService.getUserInfo()
        console.log('👤 Store: User info retrieved:', userData?.name || 'Unknown')
        
        isConnected.value = true
        userInfo.value = userData
        error.value = null
        console.log('✅ Store: Status updated - CONNECTED')
      } else {
        isConnected.value = false
        userInfo.value = null
        console.log('❌ Store: Status updated - DISCONNECTED')
      }
    } catch (err) {
      console.error('❌ Store: Error refreshing status:', err)
      isConnected.value = false
      userInfo.value = null
      error.value = err instanceof Error ? err.message : 'Unknown error'
    }
  }

  const loadFiles = async (path?: string): Promise<void> => {
    if (!isConnected.value) {
      throw new Error('Not connected to Dropbox')
    }

    try {
      error.value = null
      
      // Si no se especifica path, usar la última ruta guardada o raíz
      const targetPath = path !== undefined ? path : (lastCloudPath.value || '')
      
      // Detectar si estamos en Tauri
      const isTauri = await tauriService.isAvailable()
      let files: CloudFile[]
      
      if (isTauri) {
        console.log('🖥️ Using Tauri list files')
        const token = await dropboxService.getAccessToken()
        const rawFiles = await tauriService.listDropboxFiles(token, targetPath)
        
        // Convertir respuesta de Tauri a CloudFile[]
        files = rawFiles.map((file: any) => ({
          id: file.id || file.path_lower,
          name: file.name,
          path: file.path_display || file.path_lower,
          size: file.size || 0,
          modified: new Date(file.server_modified || Date.now()),
          isFolder: file['.tag'] === 'folder'
        }))
      } else {
        console.log('🌐 Using web list files')
        files = await dropboxService.listFiles(targetPath)
      }
      
      currentFiles.value = files
      currentPath.value = targetPath
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error loading files'
      console.error('Error loading files:', err)
      throw err
    }
  }

  const downloadFile = async (filePath: string): Promise<string> => {
    if (!isConnected.value) {
      throw new Error('Not connected to Dropbox')
    }

    try {
      error.value = null
      
      // Detectar si estamos en Tauri
      const isTauri = await tauriService.isAvailable()
      let content: string
      
      if (isTauri) {
        console.log('🖥️ Using Tauri download')
        const token = await dropboxService.getAccessToken()
        const fileData = await tauriService.downloadDropboxFile(token, filePath)
        content = fileData.content
      } else {
        console.log('🌐 Using web download')
        content = await dropboxService.downloadFile(filePath)
      }
      
      // Save last opened cloud file info
      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1)
      await saveLastCloudFile(filePath, fileName)
      
      return content
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error downloading file'
      console.error('Error downloading file:', err)
      throw err
    }
  }

  const uploadFile = async (path: string, content: string): Promise<CloudFile> => {
    if (!isConnected.value) {
      throw new Error('Not connected to Dropbox')
    }

    try {
      error.value = null
      
      // Detect if we are in Tauri
      const isTauri = await tauriService.isAvailable()
      let file: CloudFile
      
      if (isTauri) {
        console.log('🖥️ Using Tauri upload')
        const token = await dropboxService.getAccessToken()
        const result = await tauriService.uploadDropboxFile(token, path, content)
        
        // Convert Tauri response to CloudFile
        file = {
          id: result.id || path,
          name: result.name,
          path: result.path_display || path,
          size: content.length,
          modified: new Date(result.server_modified || Date.now()),
          isFolder: false
        }
      } else {
        console.log('🌐 Using web upload')
        file = await dropboxService.uploadFile(path, content)
      }
      
      // Actualizar lista de archivos si estamos en la misma carpeta
      const fileDir = path.substring(0, path.lastIndexOf('/'))
      if (fileDir === currentPath.value) {
        await loadFiles(currentPath.value)
      }
      
      return file
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error uploading file'
      console.error('Error uploading file:', err)
      throw err
    }
  }

  const deleteFile = async (filePath: string): Promise<void> => {
    if (!isConnected.value) {
      throw new Error('Not connected to Dropbox')
    }

    try {
      error.value = null
      await dropboxService.deleteFile(filePath)
      
      // Actualizar lista de archivos
      await loadFiles(currentPath.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error deleting file'
      console.error('Error deleting file:', err)
      throw err
    }
  }

  const navigateToFolder = async (folderPath: string): Promise<void> => {
    await loadFiles(folderPath)
  }

  const navigateUp = async (): Promise<void> => {
    if (currentPath.value) {
      const parentPath = currentPath.value.substring(0, currentPath.value.lastIndexOf('/'))
      await loadFiles(parentPath)
    }
  }

  const clearError = (): void => {
    error.value = null
  }

  // Funciones para recordar último archivo cloud
  const saveLastCloudFile = async (filePath: string, fileName: string): Promise<void> => {
    lastCloudPath.value = filePath.substring(0, filePath.lastIndexOf('/')) || ''
    lastCloudFileName.value = fileName
    
    // Persistir en localStorage
    try {
      localStorage.setItem('apuntador:dropbox:lastPath', lastCloudPath.value)
      localStorage.setItem('apuntador:dropbox:lastFileName', lastCloudFileName.value)
    } catch (err) {
      console.warn('Could not save last cloud file info:', err)
    }
  }

  const loadLastCloudFile = async (): Promise<void> => {
    try {
      const savedPath = localStorage.getItem('apuntador:dropbox:lastPath')
      const savedFileName = localStorage.getItem('apuntador:dropbox:lastFileName')
      
      if (savedPath !== null) {
        lastCloudPath.value = savedPath
      }
      if (savedFileName !== null) {
        lastCloudFileName.value = savedFileName
      }
    } catch (err) {
      console.warn('Could not load last cloud file info:', err)
    }
  }

  const getLastCloudPath = (): string => {
    return lastCloudPath.value || ''
  }

  const getLastCloudFileName = (): string => {
    return lastCloudFileName.value || ''
  }

  // Inicialización automática
  const initialize = async (): Promise<void> => {
    await loadLastCloudFile()
    await refreshConnectionStatus()
  }

  return {
    // Estado
    isConnected,
    isConnecting,
    userInfo,
    currentFiles,
    currentPath,
    error,
    provider,

    // Acciones
    connect,
    disconnect,
    handleOAuthCallback,
    refreshConnectionStatus,
    loadFiles,
    downloadFile,
    uploadFile,
    deleteFile,
    navigateToFolder,
    navigateUp,
    clearError,
    initialize,

    // Funciones para recordar último archivo cloud
    saveLastCloudFile,
    getLastCloudPath,
    getLastCloudFileName
  }
})