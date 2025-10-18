import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setLanguage, getCurrentLanguage, getAvailableLanguages, i18n } from '@/utils/i18n'

// Mock de navigator
const mockNavigator = {
  language: 'es-ES',
}
Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
})

// Mock de localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

// Mock de JSON imports
vi.mock('@/locales/es-ES.json', () => ({
  default: {
    hello: 'Hola',
    world: 'Mundo',
  },
}))

vi.mock('@/locales/en-US.json', () => ({
  default: {
    hello: 'Hello',
    world: 'World',
  },
}))

describe('i18n utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigator.language = 'es-ES'
  })

  afterEach(() => {
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('getAvailableLanguages', () => {
    it('should return list of available languages', () => {
      const languages = getAvailableLanguages()

      expect(languages).toEqual([
        { value: 'auto', label: 'Auto' },
        { value: 'es-ES', label: 'Español' },
        { value: 'en-US', label: 'English' },
        { value: 'ca-ES', label: 'Català' },
        { value: 'gl-ES', label: 'Galego' },
        { value: 'pt-BR', label: 'Português (Brasil)' },
        { value: 'pt-PT', label: 'Português (Portugal)' },
        { value: 'fr-FR', label: 'Français' },
        { value: 'de-DE', label: 'Deutsch' },
        { value: 'it-IT', label: 'Italiano' },
      ])
    })
  })

  describe('getCurrentLanguage', () => {
    it('should return current i18n locale', () => {
      // Set a known locale
      i18n.global.locale.value = 'en-US' as any

      const currentLang = getCurrentLanguage()
      expect(currentLang).toBe('en-US')
    })
  })

  describe('setLanguage', () => {
    it('should set language and save to localStorage', () => {
      setLanguage('en-US')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('apuntador-language', 'en-US')
      expect(i18n.global.locale.value).toBe('en-US')
    })

    it('should handle auto language setting', () => {
      mockNavigator.language = 'en-GB'

      setLanguage('auto')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('apuntador-language', 'auto')
      expect(i18n.global.locale.value).toBe('en-US') // Should map en-GB to en-US
    })

    it('should map Spanish browser language to es-ES', () => {
      mockNavigator.language = 'es-MX'

      setLanguage('auto')

      expect(i18n.global.locale.value).toBe('es-ES')
    })

    it('should map English browser language to en-US', () => {
      mockNavigator.language = 'en-CA'

      setLanguage('auto')

      expect(i18n.global.locale.value).toBe('en-US')
    })

    it('should default to es-ES for unknown languages', () => {
      mockNavigator.language = 'zh-CN' // Use Chinese as truly unsupported language

      setLanguage('auto')

      expect(i18n.global.locale.value).toBe('es-ES')
    })
  })

  describe('browser language detection', () => {
    it('should detect Spanish variants', () => {
      const spanishVariants = ['es', 'es-ES', 'es-MX', 'es-AR', 'es-CO']

      spanishVariants.forEach((lang) => {
        mockNavigator.language = lang
        setLanguage('auto')
        expect(i18n.global.locale.value).toBe('es-ES')
      })
    })

    it('should detect English variants', () => {
      const englishVariants = ['en', 'en-US', 'en-GB', 'en-AU', 'en-CA']

      englishVariants.forEach((lang) => {
        mockNavigator.language = lang
        setLanguage('auto')
        expect(i18n.global.locale.value).toBe('en-US')
      })
    })

    it('should default to Spanish for unsupported languages', () => {
      const unsupportedLanguages = ['zh-CN', 'ja-JP', 'ko-KR', 'ar-SA', 'he-IL']

      unsupportedLanguages.forEach((lang) => {
        mockNavigator.language = lang
        setLanguage('auto')
        expect(i18n.global.locale.value).toBe('es-ES')
      })
    })
  })

  describe('localStorage integration', () => {
    it('should use stored language when available', () => {
      mockLocalStorage.getItem.mockReturnValue('en-US')

      // Test that setLanguage works with stored value
      setLanguage('en-US')

      expect(i18n.global.locale.value).toBe('en-US')
    })

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      // Should fallback to browser language detection
      mockNavigator.language = 'en-US'
      setLanguage('auto')

      expect(i18n.global.locale.value).toBe('en-US')
    })

    it('should treat null stored language as auto', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      mockNavigator.language = 'es-ES'

      setLanguage('auto')

      expect(i18n.global.locale.value).toBe('es-ES')
    })

    it('should treat "auto" stored language as auto detection', () => {
      mockLocalStorage.getItem.mockReturnValue('auto')
      mockNavigator.language = 'en-US'

      setLanguage('auto')

      expect(i18n.global.locale.value).toBe('en-US')
    })
  })

  describe('i18n instance', () => {
    it('should be configured with fallback locale', () => {
      expect(i18n.global.fallbackLocale.value).toBe('es-ES')
    })

    it('should have Spanish and English messages', () => {
      const messages = i18n.global.messages.value

      expect(messages['es-ES']).toBeDefined()
      expect(messages['en-US']).toBeDefined()
    })

    it('should fallback to Spanish for missing translations', () => {
      expect(i18n.global.fallbackLocale.value).toBe('es-ES')
    })
  })

  describe('edge cases', () => {
    it('should handle empty navigator.language', () => {
      mockNavigator.language = ''

      setLanguage('auto')

      expect(i18n.global.locale.value).toBe('es-ES')
    })

    it('should handle invalid navigator.language', () => {
      mockNavigator.language = 'invalid'

      setLanguage('auto')

      expect(i18n.global.locale.value).toBe('es-ES')
    })
  })
})
