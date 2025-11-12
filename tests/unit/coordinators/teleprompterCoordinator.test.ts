/**
 * Tests for Teleprompter Coordinator
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTeleprompterCoordinator, useAppCoordinator } from '@/coordinators/teleprompterCoordinator'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'

// Mock vuetify's useDisplay
vi.mock('vuetify', () => ({
  useDisplay: () => ({
    mobile: { value: false },
  }),
}))

describe('teleprompterCoordinator', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('useTeleprompterCoordinator', () => {
    it('should provide reactive component props', () => {
      const coordinator = useTeleprompterCoordinator()

      expect(coordinator.teleprompterFrameProps).toBeDefined()
      expect(coordinator.toolbarProps).toBeDefined()
    })

    it('should provide event handlers', () => {
      const coordinator = useTeleprompterCoordinator()

      expect(coordinator.teleprompterFrameHandlers).toBeDefined()
      expect(coordinator.toolbarHandlers).toBeDefined()
      expect(coordinator.highlightBandHandlers).toBeDefined()
    })

    it('should provide UI state refs', () => {
      const coordinator = useTeleprompterCoordinator()

      expect(coordinator.editorOpen.value).toBe(false)
      expect(coordinator.settingsOpen.value).toBe(false)
      expect(coordinator.fileLoaderOpen.value).toBe(false)
      expect(coordinator.toolbarVisible.value).toBe(false)
    })

    describe('toolbar visibility management', () => {
      it('should show toolbar', () => {
        const coordinator = useTeleprompterCoordinator()

        coordinator.showToolbar()

        expect(coordinator.toolbarVisible.value).toBe(true)
      })

      it('should hide toolbar', () => {
        const coordinator = useTeleprompterCoordinator()
        coordinator.showToolbar()

        coordinator.hideToolbar()

        expect(coordinator.toolbarVisible.value).toBe(false)
      })

      it('should toggle toolbar', () => {
        const coordinator = useTeleprompterCoordinator()

        expect(coordinator.toolbarVisible.value).toBe(false)

        coordinator.toggleToolbar()
        expect(coordinator.toolbarVisible.value).toBe(true)

        coordinator.toggleToolbar()
        expect(coordinator.toolbarVisible.value).toBe(false)
      })

      it('should auto-hide toolbar after 3 seconds when paused', () => {
        const coordinator = useTeleprompterCoordinator()

        coordinator.showToolbar()
        expect(coordinator.toolbarVisible.value).toBe(true)

        vi.advanceTimersByTime(3000)

        expect(coordinator.toolbarVisible.value).toBe(false)
      })

      it('should not auto-hide toolbar when playing', () => {
        const coordinator = useTeleprompterCoordinator()
        const teleprompterStore = useTeleprompterStore()

        teleprompterStore.play()
        coordinator.showToolbar()

        vi.advanceTimersByTime(3000)

        // Should still be visible during playback
        expect(coordinator.toolbarVisible.value).toBe(true)
      })
    })

    describe('enhanced teleprompter handlers', () => {
      it('should toggle toolbar on tap when paused', () => {
        const coordinator = useTeleprompterCoordinator()

        coordinator.teleprompterFrameHandlers.onTap()

        expect(coordinator.toolbarVisible.value).toBe(true)

        coordinator.teleprompterFrameHandlers.onTap()

        expect(coordinator.toolbarVisible.value).toBe(false)
      })

      it('should not toggle toolbar on tap when playing', () => {
        const coordinator = useTeleprompterCoordinator()
        const teleprompterStore = useTeleprompterStore()

        teleprompterStore.play()
        coordinator.teleprompterFrameHandlers.onTap()

        expect(coordinator.toolbarVisible.value).toBe(false)
      })

      it('should show toolbar on press and hold', () => {
        const coordinator = useTeleprompterCoordinator()

        coordinator.teleprompterFrameHandlers.onPressHold()

        expect(coordinator.toolbarVisible.value).toBe(true)
      })
    })

    describe('enhanced toolbar handlers', () => {
      it('should hide toolbar when playing', () => {
        const coordinator = useTeleprompterCoordinator()
        const teleprompterStore = useTeleprompterStore()

        coordinator.showToolbar()
        coordinator.toolbarHandlers.onPlay()

        expect(teleprompterStore.isPlaying).toBe(true)
        expect(coordinator.toolbarVisible.value).toBe(false)
      })

      it('should show toolbar when pausing', () => {
        const coordinator = useTeleprompterCoordinator()
        const teleprompterStore = useTeleprompterStore()

        teleprompterStore.play()
        coordinator.toolbarHandlers.onPause()

        expect(teleprompterStore.isPlaying).toBe(false)
        expect(coordinator.toolbarVisible.value).toBe(true)
      })

      it('should open editor and hide toolbar', () => {
        const coordinator = useTeleprompterCoordinator()

        coordinator.showToolbar()
        coordinator.toolbarHandlers.onOpenEditor()

        expect(coordinator.editorOpen.value).toBe(true)
        expect(coordinator.toolbarVisible.value).toBe(false)
      })

      it('should open settings and hide toolbar', () => {
        const coordinator = useTeleprompterCoordinator()

        coordinator.showToolbar()
        coordinator.toolbarHandlers.onOpenSettings()

        expect(coordinator.settingsOpen.value).toBe(true)
        expect(coordinator.toolbarVisible.value).toBe(false)
      })

      it('should open file loader and hide toolbar', () => {
        const coordinator = useTeleprompterCoordinator()

        coordinator.showToolbar()
        coordinator.toolbarHandlers.onOpenFile()

        expect(coordinator.fileLoaderOpen.value).toBe(true)
        expect(coordinator.toolbarVisible.value).toBe(false)
      })
    })

    describe('toolbar props computation', () => {
      it('should include visibility state in toolbar props', () => {
        const coordinator = useTeleprompterCoordinator()

        expect(coordinator.toolbarProps.value.isVisible).toBe(false)

        coordinator.showToolbar()

        expect(coordinator.toolbarProps.value.isVisible).toBe(true)
      })

      it('should include minimal state from display', () => {
        const coordinator = useTeleprompterCoordinator()

        // Default from mock is false
        expect(coordinator.toolbarProps.value.isMinimal).toBe(false)
      })
    })
  })

  describe('useAppCoordinator', () => {
    it('should extend teleprompter coordinator', () => {
      const appCoordinator = useAppCoordinator()

      expect(appCoordinator.teleprompterFrameProps).toBeDefined()
      expect(appCoordinator.toolbarHandlers).toBeDefined()
      expect(appCoordinator.handleKeyboardShortcuts).toBeDefined()
    })

    describe('keyboard shortcuts', () => {
      it('should toggle play/pause on Space key', () => {
        const appCoordinator = useAppCoordinator()
        const teleprompterStore = useTeleprompterStore()
        const event = new KeyboardEvent('keydown', { key: ' ' })
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

        expect(teleprompterStore.isPlaying).toBe(false)

        appCoordinator.handleKeyboardShortcuts(event)
        expect(preventDefaultSpy).toHaveBeenCalled()
        expect(teleprompterStore.isPlaying).toBe(true)

        appCoordinator.handleKeyboardShortcuts(event)
        expect(teleprompterStore.isPlaying).toBe(false)
      })

      it('should step up on ArrowUp', () => {
        const appCoordinator = useAppCoordinator()
        const teleprompterStore = useTeleprompterStore()
        const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

        teleprompterStore.scrollOffset = 100

        appCoordinator.handleKeyboardShortcuts(event)

        expect(preventDefaultSpy).toHaveBeenCalled()
        expect(teleprompterStore.scrollOffset).toBeLessThan(100)
      })

      it('should step down on ArrowDown', () => {
        const appCoordinator = useAppCoordinator()
        const teleprompterStore = useTeleprompterStore()
        const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

        teleprompterStore.setViewportHeight(500)
        teleprompterStore.setContentHeight(1000)
        const initialOffset = teleprompterStore.scrollOffset

        appCoordinator.handleKeyboardShortcuts(event)

        expect(preventDefaultSpy).toHaveBeenCalled()
        expect(teleprompterStore.scrollOffset).toBeGreaterThan(initialOffset)
      })

      it('should go home on Home key', () => {
        const appCoordinator = useAppCoordinator()
        const teleprompterStore = useTeleprompterStore()
        const event = new KeyboardEvent('keydown', { key: 'Home' })
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

        teleprompterStore.scrollOffset = 500

        appCoordinator.handleKeyboardShortcuts(event)

        expect(preventDefaultSpy).toHaveBeenCalled()
        expect(teleprompterStore.scrollOffset).toBe(0)
      })

      it('should go end on End key', () => {
        const appCoordinator = useAppCoordinator()
        const teleprompterStore = useTeleprompterStore()
        const event = new KeyboardEvent('keydown', { key: 'End' })
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

        teleprompterStore.setContentHeight(1000)
        teleprompterStore.setViewportHeight(500)

        appCoordinator.handleKeyboardShortcuts(event)

        expect(preventDefaultSpy).toHaveBeenCalled()
        expect(teleprompterStore.scrollOffset).toBe(500)
      })

      it('should open editor on Ctrl+E', () => {
        const appCoordinator = useAppCoordinator()
        const event = new KeyboardEvent('keydown', { key: 'e', ctrlKey: true })
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

        appCoordinator.handleKeyboardShortcuts(event)

        expect(preventDefaultSpy).toHaveBeenCalled()
        expect(appCoordinator.editorOpen.value).toBe(true)
      })

      it('should open editor on Meta+E (Mac)', () => {
        const appCoordinator = useAppCoordinator()
        const event = new KeyboardEvent('keydown', { key: 'E', metaKey: true })
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

        appCoordinator.handleKeyboardShortcuts(event)

        expect(preventDefaultSpy).toHaveBeenCalled()
        expect(appCoordinator.editorOpen.value).toBe(true)
      })

      it('should open settings on Ctrl+S', () => {
        const appCoordinator = useAppCoordinator()
        const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

        appCoordinator.handleKeyboardShortcuts(event)

        expect(preventDefaultSpy).toHaveBeenCalled()
        expect(appCoordinator.settingsOpen.value).toBe(true)
      })

      it('should open settings on Meta+S (Mac)', () => {
        const appCoordinator = useAppCoordinator()
        const event = new KeyboardEvent('keydown', { key: 'S', metaKey: true })
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

        appCoordinator.handleKeyboardShortcuts(event)

        expect(preventDefaultSpy).toHaveBeenCalled()
        expect(appCoordinator.settingsOpen.value).toBe(true)
      })

      it('should not handle non-registered keys', () => {
        const appCoordinator = useAppCoordinator()
        const event = new KeyboardEvent('keydown', { key: 'x' })
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

        appCoordinator.handleKeyboardShortcuts(event)

        expect(preventDefaultSpy).not.toHaveBeenCalled()
      })
    })
  })
})
