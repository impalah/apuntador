import { defineStore } from 'pinia'

export const usePrompterStore = defineStore('prompter', {
  state: () => ({
    fontSize: 40,
    textColor: '#ffffff', // Text color white by default
    isEditing: false,
    textContent: `# I am a big title
This is the initial prompter text.
This is another line of text for multiline testing.
This is a third _line of text_ for **multiline** testing with *some effects*.
This is a fourth __line of text for multiline__ testing combining effects.

---
This is a line of text with a line break.

## This is a subtitle

> This is a quote

- Element 1
- Element 2
- Element 3

1. Element 1
2. Element 2
3. Element 3

This is the final line of text
    
    `,
    isPlaying: false,
    scrollSpeed: 10, // Initial scroll speed
    isMirrored: false, // Controls the horizontal flip of the text
    isReversed: false, // Controls the vertical flip of the text
    scrollPosition: 0, // Initial scroll position
    textAlign: 'center'
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
    stopScrolling() {
      console.log('Stop scrolling: ', this.scrollPosition)
      this.isPlaying = false
      this.scrollPosition = 0
    },
    setTextAlign(align: string) {
      this.textAlign = align
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
