import { createI18n } from 'vue-i18n'
import esES from '@/locales/es-ES.json'
import enUS from '@/locales/en-US.json'

// Detectar idioma del navegador
function getBrowserLanguage(): string {
  const browserLang = navigator.language

  // Mapear códigos de idioma comunes
  if (browserLang.startsWith('es')) {
    return 'es-ES'
  }
  if (browserLang.startsWith('en')) {
    return 'en-US'
  }

  // Por defecto, español (idioma principal)
  return 'es-ES'
}

// Obtener idioma guardado o detectar automáticamente
function getStoredLanguage(): string {
  try {
    const stored = localStorage.getItem('apuntador-language')
    if (stored === 'auto' || !stored) {
      return getBrowserLanguage()
    }
    return stored
  } catch {
    return getBrowserLanguage()
  }
}

// Crear instancia de i18n
export const i18n = createI18n({
  legacy: false, // Usar Composition API
  locale: getStoredLanguage(),
  fallbackLocale: 'es-ES',
  messages: {
    'es-ES': esES,
    'en-US': enUS,
  },
})

// Función para cambiar idioma
export function setLanguage(locale: string) {
  if (locale === 'auto') {
    locale = getBrowserLanguage()
    localStorage.setItem('apuntador-language', 'auto')
  } else {
    localStorage.setItem('apuntador-language', locale)
  }

  i18n.global.locale.value = locale as any
}

// Función para obtener idioma actual
export function getCurrentLanguage(): string {
  return i18n.global.locale.value
}

// Función para obtener idiomas disponibles
export function getAvailableLanguages() {
  return [
    { value: 'auto', label: 'Auto' },
    { value: 'es-ES', label: 'Español' },
    { value: 'en-US', label: 'English' },
  ]
}
