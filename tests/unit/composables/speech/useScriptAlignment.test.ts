import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useScriptAlignment } from '@/composables/speech/useScriptAlignment'

const SCRIPT = 'uno dos tres cuatro cinco seis siete ocho nueve diez'

describe('useScriptAlignment', () => {
  it('commits on an exact final match and advances the cursor past the matched phrase', () => {
    const { cursorIndex, processTranscript } = useScriptAlignment(ref(SCRIPT))

    const match = processTranscript('uno dos tres', true)

    expect(match).not.toBeNull()
    expect(match?.confidence).toBeCloseTo(1, 5)
    expect(match?.sourceIndex).toBe(2) // last token of "uno dos tres" (index 2)
    expect(cursorIndex.value).toBe(2)
  })

  it('keeps advancing forward across consecutive final matches', () => {
    const { cursorIndex, processTranscript } = useScriptAlignment(ref(SCRIPT))

    processTranscript('uno dos tres', true)
    const second = processTranscript('cuatro cinco seis', true)

    expect(second?.sourceIndex).toBe(5) // "seis" is token index 5
    expect(cursorIndex.value).toBe(5)
  })

  it('tolerates a mispronounced/noisy word within the confidence threshold', () => {
    const { processTranscript } = useScriptAlignment(ref(SCRIPT))

    // "does" instead of "dos" - one substituted character, should still match
    const match = processTranscript('uno does tres', true)

    expect(match).not.toBeNull()
    expect(match?.sourceIndex).toBe(2)
  })

  it('returns null and does not move the cursor when nothing matches confidently', () => {
    const { cursorIndex, processTranscript } = useScriptAlignment(ref(SCRIPT))

    const match = processTranscript('completely unrelated words here', true)

    expect(match).toBeNull()
    expect(cursorIndex.value).toBe(0)
  })

  it('breaks ties between equally-good matches in favor of the closer one', () => {
    const { processTranscript } = useScriptAlignment(ref('rojo azul rojo azul verde'))

    // "rojo azul" appears at token 0-1 and again at 2-3; both are exact
    // matches (tied score) - should prefer the earlier (closer) one.
    const match = processTranscript('rojo azul', true)

    expect(match?.sourceIndex).toBe(1)
  })

  it('requires a commit streak before advancing on interim (non-final) results', () => {
    const { cursorIndex, processTranscript } = useScriptAlignment(ref(SCRIPT))

    const first = processTranscript('uno dos tres', false)
    expect(first).toBeNull()
    expect(cursorIndex.value).toBe(0)

    const second = processTranscript('uno dos tres', false)
    expect(second).not.toBeNull()
    expect(cursorIndex.value).toBe(2)
  })

  it('resets the cursor and pending state', () => {
    const { cursorIndex, processTranscript, reset } = useScriptAlignment(ref(SCRIPT))

    processTranscript('uno dos tres', true)
    expect(cursorIndex.value).toBe(2)

    reset()
    expect(cursorIndex.value).toBe(0)

    // After reset, an interim match should require a fresh streak again.
    const first = processTranscript('uno dos tres', false)
    expect(first).toBeNull()
  })

  it('returns null when the script is empty', () => {
    const { processTranscript } = useScriptAlignment(ref(''))
    expect(processTranscript('uno dos tres', true)).toBeNull()
  })

  it('seek() resyncs the cursor so previously-rejected earlier matches work again', () => {
    const { cursorIndex, processTranscript, seek } = useScriptAlignment(ref(SCRIPT))

    processTranscript('siete ocho nueve', true)
    expect(cursorIndex.value).toBe(8)

    // Manually scrolled back to the middle - without seek(), any real match
    // here would be rejected forever by the monotonic-forward guard.
    seek(2)
    expect(cursorIndex.value).toBe(2)

    const match = processTranscript('tres cuatro cinco', true)
    expect(match?.sourceIndex).toBe(4)
    expect(cursorIndex.value).toBe(4)
  })

  it('seek() clamps to the valid token range', () => {
    const { cursorIndex, seek } = useScriptAlignment(ref(SCRIPT))

    seek(-5)
    expect(cursorIndex.value).toBe(0)

    seek(9999)
    expect(cursorIndex.value).toBe(9) // last token index (10 tokens, 0-9)
  })

  it('keeps matching right up to the last word of the script (no silent stall near the end)', () => {
    const { cursorIndex, processTranscript, seek } = useScriptAlignment(ref(SCRIPT))

    // Fewer than SPEECH_ALIGNMENT_QUERY_WORDS (5) tokens remain from here -
    // buildCandidates used to return zero candidates in this situation,
    // silently blocking any further commit for the rest of the script.
    seek(6) // "siete" - 3 tokens remain (siete, ocho, nueve... wait diez is 10th)
    const match = processTranscript('ocho nueve diez', true)

    expect(match).not.toBeNull()
    expect(match?.sourceIndex).toBe(9)
    expect(cursorIndex.value).toBe(9)
  })
})
