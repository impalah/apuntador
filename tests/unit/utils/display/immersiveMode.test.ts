import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { defineComponent } from 'vue'

// Mock Capacitor first, before any imports
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => 'android'),
  },
  registerPlugin: vi.fn(() => ({
    setImmersiveMode: vi.fn().mockResolvedValue({ success: true }),
  })),
}))

vi.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    hide: vi.fn().mockResolvedValue(undefined),
    show: vi.fn().mockResolvedValue(undefined),
  },
}))

// Now import the composable after mocking
import { useImmersiveMode } from '@/utils/immersiveMode'

// Test component to wrap the composable
const TestComponent = defineComponent({
  setup() {
    const composableResult = useImmersiveMode()
    return composableResult
  },
  template: '<div>Test</div>',
})

describe('useImmersiveMode', () => {
  let vuetify: any

  beforeEach(() => {
    // Create Vuetify instance for testing
    vuetify = createVuetify({
      components,
      directives,
    })

    // Reset mocks
    vi.clearAllMocks()

    // Mock document methods
    document.documentElement.classList.add = vi.fn()
    document.documentElement.classList.remove = vi.fn()
    document.documentElement.style.setProperty = vi.fn()

    // Mock querySelector
    document.querySelector = vi.fn(() => ({
      content: 'initial-content',
    })) as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default values', async () => {
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [vuetify],
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isImmersive).toBe(false)
    expect(wrapper.vm.isSupported).toBe(true) // Android platform by default

    wrapper.unmount()
  })

  it('should enable immersive mode', async () => {
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [vuetify],
      },
    })

    await wrapper.vm.$nextTick()

    await wrapper.vm.enableImmersiveMode()

    expect(wrapper.vm.isImmersive).toBe(true)

    wrapper.unmount()
  })

  it('should disable immersive mode', async () => {
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [vuetify],
      },
    })

    await wrapper.vm.$nextTick()

    // First enable it
    await wrapper.vm.enableImmersiveMode()
    expect(wrapper.vm.isImmersive).toBe(true)

    // Then disable it
    await wrapper.vm.disableImmersiveMode()
    expect(wrapper.vm.isImmersive).toBe(false)

    wrapper.unmount()
  })

  it('should toggle immersive mode', async () => {
    const wrapper = mount(TestComponent, {
      global: {
        plugins: [vuetify],
      },
    })

    await wrapper.vm.$nextTick()

    // Start disabled
    expect(wrapper.vm.isImmersive).toBe(false)

    // Toggle to enable
    await wrapper.vm.toggleImmersiveMode()
    expect(wrapper.vm.isImmersive).toBe(true)

    // Toggle to disable
    await wrapper.vm.toggleImmersiveMode()
    expect(wrapper.vm.isImmersive).toBe(false)

    wrapper.unmount()
  })
})
