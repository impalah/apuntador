import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useI18nStore } from '@/stores/useI18nStore'

// Mock de i18n utils
vi.mock('@/utils/i18n', () => ({
  getCurrentLanguage: vi.fn(() => 'es-ES'),
  setLanguage: vi.fn(),
  getAvailableLanguages: vi.fn(() => [
    { value: 'es-ES', label: 'Español' },
    { value: 'en-US', label: 'English' },
    { value: 'auto', label: 'Auto' },
  ]),
}))

// Mock de localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe('useI18nStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with current language', () => {
      const store = useI18nStore()
      expect(store.currentLanguage).toBe('es-ES')
    })

    it('should detect auto mode when no language stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      const store = useI18nStore()
      expect(store.isAutoDetect).toBe(true)
    })

    it('should detect auto mode when auto language stored', () => {
      mockLocalStorage.getItem.mockReturnValue('auto')
      const store = useI18nStore()
      expect(store.isAutoDetect).toBe(true)
    })

    it('should not be in auto mode when specific language stored', () => {
      mockLocalStorage.getItem.mockReturnValue('es-ES')
      const store = useI18nStore()
      expect(store.isAutoDetect).toBe(false)
    })
  })

  describe('computed properties', () => {
    it('should return available languages', () => {
      const store = useI18nStore()
      expect(store.availableLanguages).toEqual([
        { value: 'es-ES', label: 'Español' },
        { value: 'en-US', label: 'English' },
        { value: 'auto', label: 'Auto' },
      ])
    })

    it('should return "Auto" label when in auto detect mode', () => {
      mockLocalStorage.getItem.mockReturnValue('auto')
      const store = useI18nStore()
      expect(store.currentLanguageLabel).toBe('Auto')
    })

    it('should return correct language label when not in auto mode', () => {
      mockLocalStorage.getItem.mockReturnValue('es-ES')
      const store = useI18nStore()
      store.isAutoDetect = false
      store.currentLanguage = 'es-ES'
      expect(store.currentLanguageLabel).toBe('Español')
    })

    it('should return "Unknown" for unrecognized language', () => {
      mockLocalStorage.getItem.mockReturnValue('fr-FR')
      const store = useI18nStore()
      store.isAutoDetect = false
      store.currentLanguage = 'fr-FR'
      expect(store.currentLanguageLabel).toBe('Unknown')
    })
  })

  describe('actions', () => {
    it('should change language correctly', async () => {
      const { setLanguage, getCurrentLanguage } = await import('@/utils/i18n')
      const store = useI18nStore()

      // Mock de getCurrentLanguage para devolver el nuevo idioma
      vi.mocked(getCurrentLanguage).mockReturnValue('en-US')

      store.changeLanguage('en-US')

      expect(setLanguage).toHaveBeenCalledWith('en-US')
      expect(store.currentLanguage).toBe('en-US')
      expect(store.isAutoDetect).toBe(false)
    })

    it('should set auto detect mode when changing to auto', async () => {
      const { setLanguage } = await import('@/utils/i18n')
      const store = useI18nStore()

      store.changeLanguage('auto')

      expect(setLanguage).toHaveBeenCalledWith('auto')
      expect(store.isAutoDetect).toBe(true)
    })

    it('should toggle between languages', async () => {
      const { setLanguage, getCurrentLanguage } = await import('@/utils/i18n')
      const store = useI18nStore()

      // Iniciar con español
      store.currentLanguage = 'es-ES'
      vi.mocked(getCurrentLanguage).mockReturnValue('en-US')

      store.toggleLanguage()

      expect(setLanguage).toHaveBeenCalledWith('en-US')
      expect(store.currentLanguage).toBe('en-US')
    })

    it('should toggle from English to Spanish', async () => {
      const { setLanguage, getCurrentLanguage } = await import('@/utils/i18n')
      const store = useI18nStore()

      // Iniciar con inglés
      store.currentLanguage = 'en-US'
      vi.mocked(getCurrentLanguage).mockReturnValue('es-ES')

      store.toggleLanguage()

      expect(setLanguage).toHaveBeenCalledWith('es-ES')
      expect(store.currentLanguage).toBe('es-ES')
    })

    it('should detect browser language', async () => {
      const { setLanguage } = await import('@/utils/i18n')
      const store = useI18nStore()

      store.detectBrowserLanguage()

      expect(setLanguage).toHaveBeenCalledWith('auto')
      expect(store.isAutoDetect).toBe(true)
    })

    it('should handle unknown current language in toggle', async () => {
      const { setLanguage, getCurrentLanguage } = await import('@/utils/i18n')
      const store = useI18nStore()

      // Idioma desconocido debería ir al primero de la lista (es-ES)
      store.currentLanguage = 'fr-FR'
      vi.mocked(getCurrentLanguage).mockReturnValue('es-ES')

      store.toggleLanguage()

      expect(setLanguage).toHaveBeenCalledWith('es-ES')
    })
  })
})
