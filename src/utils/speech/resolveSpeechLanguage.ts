import type { SpeechLanguage } from '@/utils/constants'
import { DEFAULT_SPEECH_LANGUAGE } from '@/utils/constants'

/**
 * Speech recognition (Fase 1) only supports es-ES/en-US, while the app's i18n
 * supports 9 locales. Maps the app's current UI language to the closest
 * supported recognition language, so voice mode "just works" in the reader's
 * configured language without a separate, redundant setting.
 */
export function resolveSpeechLanguage(appLocale: string): SpeechLanguage {
  if (appLocale.toLowerCase().startsWith('es')) {
    return 'es-ES'
  }
  return DEFAULT_SPEECH_LANGUAGE
}
