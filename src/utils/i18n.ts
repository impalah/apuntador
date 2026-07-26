import { createI18n } from 'vue-i18n'
import { STORAGE_KEYS } from '@/utils/constants'
import esES from '@/locales/es-ES.json'
import enUS from '@/locales/en-US.json'
import caES from '@/locales/ca-ES.json'
import glES from '@/locales/gl-ES.json'
import ptBR from '@/locales/pt-BR.json'
import ptPT from '@/locales/pt-PT.json'
import frFR from '@/locales/fr-FR.json'
import deDE from '@/locales/de-DE.json'
import itIT from '@/locales/it-IT.json'

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
  if (browserLang.startsWith('ca')) {
    return 'ca-ES'
  }
  if (browserLang.startsWith('gl')) {
    return 'gl-ES'
  }
  if (browserLang === 'pt-BR' || browserLang.startsWith('pt-BR')) {
    return 'pt-BR'
  }
  if (browserLang === 'pt-PT' || browserLang.startsWith('pt-PT') || browserLang.startsWith('pt')) {
    return 'pt-PT'
  }
  if (browserLang.startsWith('fr')) {
    return 'fr-FR'
  }
  if (browserLang.startsWith('de')) {
    return 'de-DE'
  }
  if (browserLang.startsWith('it')) {
    return 'it-IT'
  }

  // Por defecto, español (idioma principal)
  return 'es-ES'
}

// Obtener idioma guardado o detectar automáticamente
function getStoredLanguage(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE)
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
    'ca-ES': caES,
    'gl-ES': glES,
    'pt-BR': ptBR,
    'pt-PT': ptPT,
    'fr-FR': frFR,
    'de-DE': deDE,
    'it-IT': itIT,
  },
})

// Función para cambiar idioma
export function setLanguage(locale: string) {
  if (locale === 'auto') {
    locale = getBrowserLanguage()
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'auto')
  } else {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, locale)
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
    { value: 'ca-ES', label: 'Català' },
    { value: 'gl-ES', label: 'Galego' },
    { value: 'pt-BR', label: 'Português (Brasil)' },
    { value: 'pt-PT', label: 'Português (Portugal)' },
    { value: 'fr-FR', label: 'Français' },
    { value: 'de-DE', label: 'Deutsch' },
    { value: 'it-IT', label: 'Italiano' },
  ]
}
