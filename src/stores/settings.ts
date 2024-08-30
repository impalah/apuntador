import { defineStore } from 'pinia'
import { useDefaultsStore } from './defaults'
import logger from '@/core/logger'

export const useSettingsStore = defineStore('settings', {
  state: () => {
    const defaultsStore = useDefaultsStore()
    return {
      fontSize: defaultsStore.fontSize.default,
      textColor: defaultsStore.textColor.default,
      backgroundColor: defaultsStore.backgroundColor.default,
      scrollSpeed: defaultsStore.scrollSpeed.default,
      textAlign: defaultsStore.textAlignment.default,
      textContent: defaultsStore.textContent,
      isEditing: false,
      isPlaying: false,
      isMirrored: false, // Controls the horizontal flip of the text
      isReversed: false, // Controls the vertical flip of the text
      scrollPosition: 0, // Initial scroll position
      lateralMargin: 0, // New state for lateral margin
      highlightPosition: defaultsStore.highlightPosition.default,
      highlightBackgroundColor: defaultsStore.highlightBackgroundColor,
      highlightArrowColor: defaultsStore.highlightArrowColor.default,
      highlightArrowSize: defaultsStore.highlightArrowSize.default,
      maxTop: 0
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
      logger.debug(`store.setEditingMode: Setting isEditing to, ${isEditing}`)
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
    scrollBegin() {
      logger.debug('Scrolling to the beginning')
      logger.debug(`- Max top is, ${this.maxTop}`)
      logger.debug(`- scrollPosition is, ${this.scrollPosition}`)
      this.isPlaying = false
      this.scrollPosition = 0
    },
    scrollEnd() {
      logger.debug('Scrolling to the end')
      logger.debug(`- Max top is, ${this.maxTop}`)
      logger.debug(`- scrollPosition is, ${this.scrollPosition}`)
      this.scrollPosition = this.maxTop - 1
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
    // setHighlightBackgroundColor(color: string) {
    //   this.highlightBackgroundColor = color
    // },
    setHighlightArrowColor(color: string) {
      this.highlightArrowColor = color
    },
    setHighlightArrowSize(size: string) {
      this.highlightArrowSize = size
    },
    getLineHeight() {
      return this.fontSize * 1.2
    },
    scrollUp() {
      logger.debug('store.Scrolling up')
      this.scrollPosition -= this.getLineHeight()
      if (this.scrollPosition < 0) {
        this.scrollPosition = 0
      }
    },
    scrollDown() {
      logger.debug('store.Scrolling down')
      if (this.scrollPosition + this.getLineHeight() > this.maxTop) {
        this.scrollPosition = this.maxTop
        return
      }
      this.scrollPosition += this.getLineHeight()
    },
    setMaxTop(position: number) {
      logger.debug(`store.setMaxTop: Setting maxTop to, ${position}`)
      this.maxTop = position
    },

  }
})
