import { defineStore } from 'pinia'

export const useDefaultsStore = defineStore('defaults', {
  state: () => ({
    margin: {
      min: 0,
      max: 50
    },
    highlightPosition: {
      min: 0,
      max: 100,
      default: 50
    },
    scrollSpeed: {
      min: 1,
      max: 30,
      default: 20,
      maxConstant: 31
    },
    fontSize: {
      values: [20, 40, 60, 80, 100, 120, 150, 200],
      default: 40
    },
    textColor: {
        default: "#ffffff"
    },
    textAlignment: {
        default: 'center'
    },
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
        
        `
  })
})