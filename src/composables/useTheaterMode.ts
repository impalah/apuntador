import { ref, onMounted, onUnmounted } from 'vue'
import { THEATER_MODE_POLL_MS } from '@/utils/constants'
import { isTauri as detectTauri } from '@/utils/tauri'

// Loaded lazily so this shared module never pulls Tauri APIs into web/mobile paths
async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core')
  return tauriInvoke<T>(cmd, args)
}

export function useTheaterMode() {
  const isTheaterMode = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isTauri = detectTauri()

  // Polling interval para detectar cambios externos
  let pollInterval: ReturnType<typeof setInterval> | null = null

  onMounted(async () => {
    if (isTauri) {
      try {
        await updateTheaterStatus()

        // Poll to detect external changes (e.g. the macOS menu)
        pollInterval = setInterval(() => {
          updateTheaterStatus()
        }, THEATER_MODE_POLL_MS)
      } catch (e) {
        console.error('[useTheaterMode] Error in onMounted:', e)
      }
    } else {
      // Listener para cambios de fullscreen en web
      document.addEventListener('fullscreenchange', handleFullscreenChange)
    }
  })

  onUnmounted(() => {
    if (pollInterval !== null) {
      clearInterval(pollInterval)
      pollInterval = null
    }
    if (!isTauri) {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  })

  const updateTheaterStatus = async () => {
    if (!isTauri) return

    try {
      const result = await invoke<boolean>('is_theater_mode')
      isTheaterMode.value = result
    } catch (e) {
      console.error('[useTheaterMode] Error checking theater mode:', e)
      error.value = e as string
    }
  }

  const toggleTheaterMode = async () => {
    if (!isTauri) {
      // Fallback para modo web - usar fullscreen API del navegador
      toggleWebFullscreen()
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const result = await invoke<boolean>('toggle_theater_mode')
      isTheaterMode.value = result
    } catch (e) {
      console.error('[useTheaterMode] Error toggling theater mode:', e)
      error.value = e as string
    } finally {
      isLoading.value = false
    }
  }

  const toggleWebFullscreen = () => {
    if (!document.fullscreenElement) {
      // Entrar en fullscreen
      document.documentElement
        .requestFullscreen()
        .then(() => {
          isTheaterMode.value = true
        })
        .catch((e) => {
          console.error('Error entering fullscreen:', e)
          error.value = 'No se pudo entrar en modo fullscreen'
        })
    } else {
      // Salir de fullscreen
      document
        .exitFullscreen()
        .then(() => {
          isTheaterMode.value = false
        })
        .catch((e) => {
          console.error('Error exiting fullscreen:', e)
          error.value = 'No se pudo salir del modo fullscreen'
        })
    }
  }

  // Escuchar cambios en el fullscreen del navegador (solo en web)
  const handleFullscreenChange = () => {
    if (!isTauri) {
      isTheaterMode.value = !!document.fullscreenElement
    }
  }

  return {
    isTheaterMode,
    isLoading,
    error,
    isTauri: ref(isTauri),
    toggleTheaterMode,
    updateTheaterStatus,
  }
}
