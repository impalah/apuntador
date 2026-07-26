import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import HotkeyControl from '@/components/HotkeyControl.vue'
import type { HotkeyDefinition } from '@/types'

// Mock CSS imports before anything else
vi.mock('vuetify/lib/components/VBtn/VBtn.css', () => ({}))

// Create a minimal Vuetify instance for tests
const vuetify = createVuetify({
  components: {},
  directives: {},
})

// Mock the hotkey manager
vi.mock('@/utils/input/hotkeys', () => ({
  hotkeyManager: {
    getKeyDisplayName: vi.fn((hotkey) => {
      if (hotkey.key === ' ') return 'Space'
      if (hotkey.key === 'ArrowUp') return '↑'
      if (hotkey.key.length === 1) return hotkey.key.toUpperCase()
      return hotkey.key
    }),
    isKeyInUse: vi.fn(() => false),
  },
}))

describe('HotkeyControl', () => {
  let wrapper: VueWrapper<any>

  const mockHotkey: HotkeyDefinition = {
    key: ' ',
    action: 'toggle-play',
    description: 'Play/Pause',
  }

  const mountComponent = (props = {}) => {
    return mount(HotkeyControl, {
      props: {
        hotkey: mockHotkey,
        action: 'toggle-play',
        ...props,
      },
      global: {
        plugins: [vuetify],
        stubs: {
          VTextField: {
            template: `
              <input 
                :value="modelValue" 
                :placeholder="placeholder"
                @focus="$emit('focus', $event)"
                @blur="$emit('blur', $event)"
                @keydown="$emit('keydown', $event)"
                data-testid="hotkey-input"
              />
            `,
            props: ['modelValue', 'placeholder', 'error', 'readonly'],
            emits: ['focus', 'blur', 'keydown'],
          },
          VBtn: {
            template:
              '<button @click="$emit(\'click\', $event)" data-testid="clear-btn"><slot /></button>',
            props: ['size', 'variant', 'color', 'disabled'],
            emits: ['click'],
          },
        },
      },
    })
  }

  beforeEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('renders correctly', () => {
    wrapper = mountComponent()

    expect(wrapper.exists()).toBe(true)
    const input = wrapper.find('[data-testid="hotkey-input-toggle-play"]')
    expect(input.exists()).toBe(true)
  })

  it('displays the current key', () => {
    wrapper = mountComponent()

    // The component should show the description "Play/Pause" in the function label
    expect(wrapper.text()).toContain('Play/Pause')
  })

  it('emits change event when key is recorded', async () => {
    wrapper = mountComponent()

    // Access the component's methods directly for testing
    const vm = wrapper.vm as any

    // Start recording
    vm.startRecording()
    expect(vm.isRecording).toBe(true)

    // Create a mock keydown event
    const mockEvent = {
      key: 'p',
      code: 'KeyP',
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    }

    // Call handleKeyDown directly
    vm.handleKeyDown(mockEvent)

    // Should emit change
    expect(wrapper.emitted('change')).toBeTruthy()
    const changeEvents = wrapper.emitted('change') as any[]
    expect(changeEvents[0][0]).toBe('toggle-play') // action
    expect(changeEvents[0][1].key).toBe('p') // new hotkey
  })

  it('handles modifier keys', async () => {
    wrapper = mountComponent()

    const vm = wrapper.vm as any
    vm.startRecording()

    const mockEvent = {
      key: 'p',
      code: 'KeyP',
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    }

    vm.handleKeyDown(mockEvent)

    const changeEvents = wrapper.emitted('change') as any[]
    expect(changeEvents).toBeTruthy()
    if (changeEvents) {
      expect(changeEvents[0][1].key).toBe('p')
      expect(changeEvents[0][1].ctrlKey).toBe(true)
    }
  })

  it('ignores modifier-only keys', async () => {
    wrapper = mountComponent()

    const vm = wrapper.vm as any
    vm.startRecording()

    const mockEvent = {
      key: 'Control',
      code: 'ControlLeft',
      ctrlKey: true,
      altKey: false,
      shiftKey: false,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    }

    vm.handleKeyDown(mockEvent)

    // Should not emit change for modifier-only keys
    expect(wrapper.emitted('change')).toBeFalsy()
  })
})
