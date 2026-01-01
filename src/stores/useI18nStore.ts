import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { setLanguage, getCurrentLanguage, getAvailableLanguages } from '@/utils/i18n'

export const useI18nStore = defineStore('i18n', () => {
  // Estado
  const currentLanguage = ref(getCurrentLanguage())
  const isAutoDetect = ref(
    localStorage.getItem('apuntador-language') === 'auto' ||
      !localStorage.getItem('apuntador-language')
  )

  // Getters
  const availableLanguages = computed(() => getAvailableLanguages())

  const currentLanguageLabel = computed(() => {
    if (isAutoDetect.value) {
      return 'Auto'
    }
    return (
      availableLanguages.value.find((lang) => lang.value === currentLanguage.value)?.label ||
      'Unknown'
    )
  })

  // Actions
  function changeLanguage(locale: string) {
    setLanguage(locale)
    currentLanguage.value = getCurrentLanguage()
    isAutoDetect.value = locale === 'auto'
  }

  function toggleLanguage() {
    // Alternar entre los idiomas disponibles (sin auto)
    const languages = ['es-ES', 'en-US']
    const currentIndex = languages.indexOf(currentLanguage.value)
    const nextIndex = (currentIndex + 1) % languages.length
    const nextLang = languages[nextIndex]
    if (nextLang) {
      changeLanguage(nextLang)
    }
  }

  function detectBrowserLanguage() {
    changeLanguage('auto')
  }

  return {
    // Estado
    currentLanguage,
    isAutoDetect,

    // Getters
    availableLanguages,
    currentLanguageLabel,

    // Actions
    changeLanguage,
    toggleLanguage,
    detectBrowserLanguage,
  }
})
