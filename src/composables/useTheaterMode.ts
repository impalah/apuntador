import { ref, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

export function useTheaterMode() {
  const isTheaterMode = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Detectar si estamos en Tauri
  const isTauri = ref(false)
  
  onMounted(async () => {
    // Verificar si estamos en Tauri
    try {
      const window = getCurrentWebviewWindow()
      if (window) {
        isTauri.value = true
        await updateTheaterStatus()
      }
    } catch (e) {
      // No estamos en Tauri (modo web)
      isTauri.value = false
    }
  })
  
  const updateTheaterStatus = async () => {
    if (!isTauri.value) return
    
    try {
      const window = getCurrentWebviewWindow()
      const result = await invoke<boolean>('is_theater_mode', { window })
      isTheaterMode.value = result
    } catch (e) {
      console.error('Error checking theater mode:', e)
      error.value = e as string
    }
  }
  
  const toggleTheaterMode = async () => {
    if (!isTauri.value) {
      // Fallback para modo web - usar fullscreen API del navegador
      toggleWebFullscreen()
      return
    }
    
    isLoading.value = true
    error.value = null
    
    try {
      const window = getCurrentWebviewWindow()
      const result = await invoke<boolean>('toggle_theater_mode', { window })
      isTheaterMode.value = result
    } catch (e) {
      console.error('Error toggling theater mode:', e)
      error.value = e as string
    } finally {
      isLoading.value = false
    }
  }
  
  const toggleWebFullscreen = () => {
    if (!document.fullscreenElement) {
      // Entrar en fullscreen
      document.documentElement.requestFullscreen().then(() => {
        isTheaterMode.value = true
      }).catch((e) => {
        console.error('Error entering fullscreen:', e)
        error.value = 'No se pudo entrar en modo fullscreen'
      })
    } else {
      // Salir de fullscreen
      document.exitFullscreen().then(() => {
        isTheaterMode.value = false
      }).catch((e) => {
        console.error('Error exiting fullscreen:', e)
        error.value = 'No se pudo salir del modo fullscreen'
      })
    }
  }
  
  // Escuchar cambios en el fullscreen del navegador (solo en web)
  const handleFullscreenChange = () => {
    if (!isTauri.value) {
      isTheaterMode.value = !!document.fullscreenElement
    }
  }
  
  onMounted(() => {
    if (!isTauri.value) {
      document.addEventListener('fullscreenchange', handleFullscreenChange)
    }
  })
  
  return {
    isTheaterMode,
    isLoading,
    error,
    isTauri,
    toggleTheaterMode,
    updateTheaterStatus
  }
}