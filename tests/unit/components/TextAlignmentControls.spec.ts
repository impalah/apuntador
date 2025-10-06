import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { createPinia, setActivePinia } from 'pinia'
import TextAlignmentControls from '@/components/TextAlignmentControls.vue'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { createTestI18n } from '../../utils/i18n-helper'

// Mock the pinia store
vi.mock('@/stores/usePrefsStore')

describe('TextAlignmentControls', () => {
  let wrapper: any
  let mockPrefsStore: any

  beforeEach(() => {
    // Create a new pinia instance for each test
    setActivePinia(createPinia())

    // Mock the preferences store
    mockPrefsStore = {
      textAlignment: 'center',
      setTextAlignment: vi.fn(),
    }

    vi.mocked(usePrefsStore).mockReturnValue(mockPrefsStore)

    // Create component
    wrapper = mount(TextAlignmentControls, {
      global: {
        plugins: [createVuetify(), createTestI18n()],
        stubs: {
          'v-btn-toggle': {
            template:
              '<div class="v-btn-toggle" :model-value="modelValue" @update:model-value="$emit(\'update:model-value\', $event)"><slot /></div>',
            props: ['modelValue'],
            emits: ['update:model-value'],
          },
          'v-btn': {
            template:
              '<button :value="value" @click="$emit(\'click\')" :data-testid="$attrs[\'data-testid\']"><slot /></button>',
            props: ['value'],
            emits: ['click'],
          },
          'v-icon': { template: '<span><slot /></span>' },
        },
      },
    })
  })

  describe('Component Rendering', () => {
    it('should render all alignment buttons', () => {
      expect(wrapper.find('[data-testid="align-left-button"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="align-center-button"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="align-right-button"]').exists()).toBe(true)
    })

    it('should show current alignment from store', () => {
      const btnToggle = wrapper.find('.v-btn-toggle')
      expect(btnToggle.attributes('model-value')).toBe('center')
    })
  })

  describe('Alignment Changes', () => {
    it('should call setTextAlignment when alignment changes to left', async () => {
      await wrapper.vm.updateAlignment('left')
      expect(mockPrefsStore.setTextAlignment).toHaveBeenCalledWith('left')
    })

    it('should call setTextAlignment when alignment changes to center', async () => {
      await wrapper.vm.updateAlignment('center')
      expect(mockPrefsStore.setTextAlignment).toHaveBeenCalledWith('center')
    })

    it('should call setTextAlignment when alignment changes to right', async () => {
      await wrapper.vm.updateAlignment('right')
      expect(mockPrefsStore.setTextAlignment).toHaveBeenCalledWith('right')
    })

    it('should not call setTextAlignment when alignment is null/undefined', async () => {
      await wrapper.vm.updateAlignment(null)
      expect(mockPrefsStore.setTextAlignment).not.toHaveBeenCalled()

      await wrapper.vm.updateAlignment(undefined)
      expect(mockPrefsStore.setTextAlignment).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria labels', () => {
      const leftBtn = wrapper.find('[data-testid="align-left-button"]')
      const centerBtn = wrapper.find('[data-testid="align-center-button"]')
      const rightBtn = wrapper.find('[data-testid="align-right-button"]')

      expect(leftBtn.attributes('aria-label')).toBe('Align Left')
      expect(centerBtn.attributes('aria-label')).toBe('Align Center')
      expect(rightBtn.attributes('aria-label')).toBe('Align Right')
    })
  })

  describe('Button Values', () => {
    it('should have correct values for each button', () => {
      const leftBtn = wrapper.find('[data-testid="align-left-button"]')
      const centerBtn = wrapper.find('[data-testid="align-center-button"]')
      const rightBtn = wrapper.find('[data-testid="align-right-button"]')

      expect(leftBtn.attributes('value')).toBe('left')
      expect(centerBtn.attributes('value')).toBe('center')
      expect(rightBtn.attributes('value')).toBe('right')
    })
  })
})
