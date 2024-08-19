import { defineStore } from 'pinia'

export const usePrompterStore = defineStore('prompter', {
  state: () => ({
    fontSize: 40,
    textColor: '#ffffff', // Text color white by default
    isEditing: false,
    textContent: `# Welcome to Apuntador!!!

Apuntador can be used to display text in a teleprompter-like fashion.
It is designed to be used in a secondary screen, while you are recording yourself with a camera in the main screen.

To start editing a text, first click on the "Advanced" button and then on the "Edit" button.

---

## Features

- **Text formatting**: You can use markdown to format the text.
- **Text alignment**: You can align the text to the left, center or right.
- **Scroll speed**: You can adjust the speed of the scrolling.
- **Mirror text**: You can mirror the text horizontally.
- **Reverse text**: You can reverse the text vertically.
- **Highlight text**: You can highlight the current line of text.
- **Lateral margin**: You can adjust the lateral margin of the text.


Brought to you by [Impalah](https://github.com/impalah)
    
    `,
    isPlaying: false,
    scrollSpeed: 20, // Initial scroll speed
    isMirrored: false, // Controls the horizontal flip of the text
    isReversed: false, // Controls the vertical flip of the text
    scrollPosition: 0, // Initial scroll position
    textAlign: 'center',
    lateralMargin: 0, // New state for lateral margin
    highlightPosition: 0 // New state for highlight position
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
