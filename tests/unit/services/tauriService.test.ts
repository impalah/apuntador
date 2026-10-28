import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type EventHandler = (event: { payload: unknown }) => void

const handlers: EventHandler[] = []
const unlistenFns: ReturnType<typeof vi.fn>[] = []

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(async (_name: string, handler: EventHandler) => {
    handlers.push(handler)
    const unlisten = vi.fn()
    unlistenFns.push(unlisten)
    return unlisten
  }),
}))

import { TauriService } from '@/services/tauriService'
import { OAUTH_CALLBACK_TIMEOUT_MS } from '@/utils/constants'

describe('TauriService OAuth callback wait', () => {
  beforeEach(() => {
    handlers.length = 0
    unlistenFns.length = 0
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves with the callback payload and removes the listener', async () => {
    const service = new TauriService()
    const promise = service.listenForOAuthCallback()
    await vi.advanceTimersByTimeAsync(0)

    handlers[0]!({ payload: { code: 'c', state: 's' } })

    await expect(promise).resolves.toEqual({ code: 'c', state: 's' })
    expect(unlistenFns[0]).toHaveBeenCalledTimes(1)
  })

  it("does not let a previous flow's timeout tear down a newer flow", async () => {
    const service = new TauriService()
    void service.listenForOAuthCallback()
    await vi.advanceTimersByTimeAsync(OAUTH_CALLBACK_TIMEOUT_MS / 2)

    const second = service.listenForOAuthCallback()
    await vi.advanceTimersByTimeAsync(OAUTH_CALLBACK_TIMEOUT_MS / 2 + 1)

    // The first flow's deadline has passed; the second listener must survive it
    expect(unlistenFns[1]).not.toHaveBeenCalled()
    handlers[1]!({ payload: { code: 'c2', state: 's2' } })
    await expect(second).resolves.toEqual({ code: 'c2', state: 's2' })
  })

  it('cancel stops the timeout so no rejection fires later', async () => {
    const service = new TauriService()
    const promise = service.listenForOAuthCallback()
    const onRejected = vi.fn()
    promise.catch(onRejected)
    await vi.advanceTimersByTimeAsync(0)

    service.cancelOAuthCallback()
    await vi.advanceTimersByTimeAsync(OAUTH_CALLBACK_TIMEOUT_MS + 1)

    expect(onRejected).not.toHaveBeenCalled()
    expect(unlistenFns[0]).toHaveBeenCalledTimes(1)
  })

  it('rejects after the timeout when no callback arrives', async () => {
    const service = new TauriService()
    const promise = service.listenForOAuthCallback()
    const assertion = expect(promise).rejects.toThrow('OAuth timeout')

    await vi.advanceTimersByTimeAsync(OAUTH_CALLBACK_TIMEOUT_MS + 1)

    await assertion
    expect(unlistenFns[0]).toHaveBeenCalledTimes(1)
  })
})
