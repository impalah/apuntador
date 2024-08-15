import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import Navbar from '@/components/Navbar.vue'

describe('Navbar', () => {
  it('renders correctly', () => {
    const wrapper = mount(Navbar)
    expect(wrapper.exists()).toBe(true)
  })

  // it('updates font size when selected', async () => {
  //   const wrapper = mount(Navbar)
  //   const select = wrapper.find('#fontSize')
  //   await select.setValue('80')
  //   expect(select.element.value).toBe('80')
  // })

  // it('updates text color when input changes', async () => {
  //   const wrapper = mount(Navbar)
  //   const input = wrapper.find('#textColor')
  //   await input.setValue('#ff0000')
  //   expect(input.element.value).toBe('#ff0000')
  // })

  // it('updates scroll speed when range input changes', async () => {
  //   const wrapper = mount(Navbar)
  //   const rangeInput = wrapper.find('#scrollSpeed')
  //   await rangeInput.setValue('25')
  //   expect(rangeInput.element.value).toBe('25')
  // })

  // it('toggles edit mode when edit button is clicked', async () => {
  //   const wrapper = mount(Navbar)
  //   const editButton = wrapper.find('#editButton')
  //   await editButton.trigger('click')
  //   expect(wrapper.vm.isEditing).toBe(true)
  // })

  // it('toggles play mode when play button is clicked', async () => {
  //   const wrapper = mount(Navbar)
  //   const playButton = wrapper.find('.play-btn')
  //   await playButton.trigger('click')
  //   expect(wrapper.vm.isPlayingComputed).toBe(true)
  // })

  // it('stops scrolling when stop button is clicked', async () => {
  //   const wrapper = mount(Navbar)
  //   const stopButton = wrapper.find('.stop-btn')
  //   await stopButton.trigger('click')
  //   expect(wrapper.vm.isPlayingComputed).toBe(false)
  // })

  // it('toggles mirror mode when mirror button is clicked', async () => {
  //   const wrapper = mount(Navbar)
  //   const mirrorButton = wrapper.find('#mirrorButton')
  //   await mirrorButton.trigger('click')
  //   expect(wrapper.vm.isMirrored).toBe(true)
  // })

  // it('toggles reverse mode when reverse button is clicked', async () => {
  //   const wrapper = mount(Navbar)
  //   const reverseButton = wrapper.find('#reverseButton')
  //   await reverseButton.trigger('click')
  //   expect(wrapper.vm.isReversed).toBe(true)
  // })
})
