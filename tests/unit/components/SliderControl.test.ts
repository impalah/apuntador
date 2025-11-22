import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SliderControl from '@/components/SliderControl.vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
})

describe('SliderControl', () => {
  it('renders with basic props', () => {
    const wrapper = mount(SliderControl, {
      props: {
        modelValue: 50,
        label: 'Test Slider',
        min: 0,
        max: 100,
        step: 1
      },
      global: {
        plugins: [vuetify]
      }
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('emits update:modelValue when slider changes', async () => {
    const wrapper = mount(SliderControl, {
      props: {
        modelValue: 50,
        label: 'Test Slider',
        min: 0,
        max: 100
      },
      global: {
        plugins: [vuetify]
      }
    })

    // Encontrar el v-slider y emitir cambio
    const slider = wrapper.findComponent({ name: 'VSlider' })
    await slider.vm.$emit('update:modelValue', 75)

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([75])
  })

  it('shows input field when showInput is true', () => {
    const wrapper = mount(SliderControl, {
      props: {
        modelValue: 50,
        label: 'Test Slider',
        showInput: true
      },
      global: {
        plugins: [vuetify]
      }
    })

    const textField = wrapper.findComponent({ name: 'VTextField' })
    expect(textField.exists()).toBe(true)
  })

  it('does not show input field when showInput is false', () => {
    const wrapper = mount(SliderControl, {
      props: {
        modelValue: 50,
        label: 'Test Slider',
        showInput: false
      },
      global: {
        plugins: [vuetify]
      }
    })

    const textField = wrapper.findComponent({ name: 'VTextField' })
    expect(textField.exists()).toBe(false)
  })

  it('applies suffix to slider', () => {
    const wrapper = mount(SliderControl, {
      props: {
        modelValue: 50,
        label: 'Test Slider',
        suffix: '%'
      },
      global: {
        plugins: [vuetify]
      }
    })

    const slider = wrapper.findComponent({ name: 'VSlider' })
    expect(slider.exists()).toBe(true)
    // Verificar que el componente recibe el prop
    expect(wrapper.props('suffix')).toBe('%')
  })

  it('emits change event on slider end', async () => {
    const wrapper = mount(SliderControl, {
      props: {
        modelValue: 50,
        label: 'Test Slider'
      },
      global: {
        plugins: [vuetify]
      }
    })

    const slider = wrapper.findComponent({ name: 'VSlider' })
    await slider.vm.$emit('end')

    expect(wrapper.emitted('change')).toBeTruthy()
  })
})
