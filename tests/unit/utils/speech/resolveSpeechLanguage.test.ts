import { describe, it, expect } from 'vitest'
import { resolveSpeechLanguage } from '@/utils/speech/resolveSpeechLanguage'

describe('resolveSpeechLanguage', () => {
  it('maps Spanish-family locales to es-ES', () => {
    expect(resolveSpeechLanguage('es-ES')).toBe('es-ES')
    expect(resolveSpeechLanguage('es-MX')).toBe('es-ES')
    expect(resolveSpeechLanguage('ES-es')).toBe('es-ES')
  })

  it('falls back to en-US for locales without speech recognition support', () => {
    expect(resolveSpeechLanguage('en-US')).toBe('en-US')
    expect(resolveSpeechLanguage('fr-FR')).toBe('en-US')
    expect(resolveSpeechLanguage('de-DE')).toBe('en-US')
    expect(resolveSpeechLanguage('ca-ES')).toBe('en-US')
    expect(resolveSpeechLanguage('pt-BR')).toBe('en-US')
  })
})
