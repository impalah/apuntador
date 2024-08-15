import { defineStore } from 'pinia'

export const usePrompterStore = defineStore('prompter', {
  state: () => ({
    fontSize: 40,
    textColor: '#ffffff', // Color de texto claro por defecto
    isEditing: false,
    textContent: 'This is the initial prompter text.',
    isPlaying: false,
    scrollSpeed: 10, // Velocidad inicial del scroll
    isMirrored: false, // Controla el espejo horizontal
    isReversed: false, // Controla el volteo vertical y dirección del scroll4
    scrollPosition: 0 // Posición inicial del scroll
  }),
  actions: {
    setFontSize(size: number) {
      this.fontSize = size
    },
    setTextColor(color: string) {
      this.textColor = color
    },
    setEditingMode(isEditing: boolean) {
      this.isEditing = isEditing
    },
    setTextContent(content: string) {
      this.textContent = content
    },
    togglePlay() {
      this.isPlaying = !this.isPlaying
    },
    setScrollSpeed(speed: number) {
      this.scrollSpeed = speed
    },
    toggleMirror() {
      this.isMirrored = !this.isMirrored
      console.log('ToggleMirrored: ', this.isMirrored)
    },
    toggleReverse() {
      this.isReversed = !this.isReversed
      console.log('ToggleReversed: ', this.isReversed)
    },
    resetScrollPosition() {
      this.scrollPosition = 0
      console.log('Scroll position reset to:', this.scrollPosition)
    }
  }
})
