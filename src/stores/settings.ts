import { defineStore } from 'pinia'
import { useDefaultsStore } from './defaults'

export const useSettingsStore = defineStore('settings', {
  state: () => {
    const defaultsStore = useDefaultsStore()
    return {
      fontSize: defaultsStore.fontSize.default,
      textColor: defaultsStore.textColor.default,
      scrollSpeed: defaultsStore.scrollSpeed.default,
      textAlign: defaultsStore.textAlignment.default,
      textContent: defaultsStore.textContent,
      isEditing: false,
      isPlaying: false,
      isMirrored: false, // Controls the horizontal flip of the text
      isReversed: false, // Controls the vertical flip of the text
      scrollPosition: 0, // Initial scroll position
      lateralMargin: 0, // New state for lateral margin
      highlightPosition: 0 // New state for highlight position
    }
  },
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
    },
    toggleReverse() {
      this.isReversed = !this.isReversed
    },
    stopScrolling() {
      this.isPlaying = false
      this.scrollPosition = 0
    },
    setTextAlign(align: string) {
      this.textAlign = align
    },
    setLateralMargin(margin: number) {
      this.lateralMargin = margin
    },

    setHighlightPosition(position: number) {
      this.highlightPosition = position
    },
    getLineHeight() {
      return this.fontSize * 1.2
    },
    scrollUp() {
      this.scrollPosition -= this.getLineHeight()
    },
    scrollDown() {
      this.scrollPosition += this.getLineHeight()
    }
  }
})
