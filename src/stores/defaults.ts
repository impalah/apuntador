import { defineStore } from 'pinia'

export const useDefaultsStore = defineStore('defaults', {
  state: () => ({
    prompter: {
      textLinesExtra: 5
    },
    margin: {
      min: 0,
      max: 50
    },
    highlightPosition: {
      min: 4,
      max: 94,
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
    backgroundColor: {
      default: "#000000"
    },
    highlightBackgroundColor: {
      default: "rgba(147, 159, 123, 0.3)"
    },
    highlightArrowColor: {
      default: "#007bff"
    },
    highlightArrowSize: {
      default: "2em"
    },
    textAlignment: {
        default: 'center'
    },
    paragraphLabel: 'h3',
    textContent: `# Welcome to Apuntador!!!

Apuntador can be used to display text in a teleprompter-like fashion.
It is designed to be used in a secondary screen, while you are recording yourself with a camera in the main screen.

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

---

### Text example 1

1. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec at nunc erat. Praesent suscipit, urna sed aliquet auctor, neque dui porta odio, in tincidunt diam nisl ut lectus. Duis non nisi ex. Ut consequat rutrum risus vel pharetra. Suspendisse aliquam ac quam eget ullamcorper. Morbi lobortis eu turpis et scelerisque. Mauris hendrerit nibh ac lectus fermentum pulvinar.

2. Quisque consectetur ante a erat interdum pulvinar. Fusce sed accumsan nunc, in laoreet ipsum. Sed id magna consequat, suscipit leo nec, placerat lectus. Maecenas iaculis vehicula mauris. Ut velit quam, iaculis eget justo a, porttitor scelerisque tellus. Nam vulputate lorem neque, id tristique dolor efficitur at. Nunc posuere arcu sem, ac ullamcorper orci mattis vel. Etiam ac ultrices metus. Phasellus eget ex sit amet lorem molestie maximus et et enim. Quisque molestie ligula enim, non faucibus enim laoreet vitae. Nullam finibus quam purus, vestibulum aliquam sapien scelerisque sit amet. Donec a lacus pretium, rutrum neque suscipit, egestas justo. Quisque euismod nisl nisl, ac aliquam sem congue in. In ut malesuada erat. Maecenas nec nisi ipsum.

### Text example 2

3. Suspendisse at risus pharetra, pharetra nibh sed, maximus massa. Quisque scelerisque rutrum erat, non semper neque feugiat sit amet. Quisque sit amet lorem iaculis risus pretium cursus ac at ex. Nullam ornare sem vel lorem sollicitudin pharetra. Quisque varius vehicula neque quis commodo. Integer aliquam tristique diam. Fusce accumsan nec augue nec vulputate. Nunc eget mauris erat. Nam nisi lorem, ultricies at elementum faucibus, posuere nec sapien. Curabitur bibendum porttitor tellus sed vestibulum. Vestibulum et augue et ipsum commodo dapibus sit amet sed nulla. Sed arcu dolor, volutpat non aliquet non, lobortis eget ante. Sed tellus purus, congue eu lobortis feugiat, luctus non urna.

4. Ut blandit tempus porttitor. Praesent varius ligula eu neque vestibulum, at rhoncus diam viverra. Duis convallis vulputate urna quis consectetur. Maecenas commodo pharetra gravida. Cras a eros sit amet magna laoreet pellentesque vel non orci. Quisque feugiat condimentum aliquam. Phasellus ullamcorper velit velit, viverra fermentum mauris aliquam quis. Suspendisse lacus leo, feugiat in lectus vel, congue elementum sapien. Morbi sit amet cursus ex. Cras convallis magna sit amet eros maximus, et scelerisque nulla porta.

### Text example 3

5. Nam ac odio nunc. Vestibulum porta nulla eu sem auctor scelerisque. Donec ultricies vitae mi ut aliquam. Curabitur quis dui magna. Ut sollicitudin justo sit amet mi vulputate, a venenatis sapien mattis. In ligula nibh, tempus nec ultricies ut, placerat sed tortor. Maecenas eu auctor orci. Integer porttitor ligula a feugiat eleifend. Phasellus tristique venenatis urna, a auctor nisl. Curabitur maximus libero a eleifend aliquet. Duis pulvinar ac arcu et ullamcorper. Maecenas tristique urna id vehicula luctus. Mauris venenatis sagittis laoreet.

---

`
  })
})