// Test setup file
import { vi } from 'vitest'

// Mock all CSS imports globally
vi.mock('*.css', () => ({}))
vi.mock('*.scss', () => ({}))

// Mock specific Vuetify CSS imports
vi.mock('vuetify/lib/components/VBtn/VBtn.css', () => ({}))
vi.mock('vuetify/lib/components/VTextField/VTextField.css', () => ({}))
vi.mock('vuetify/lib/components/VCard/VCard.css', () => ({}))
vi.mock('vuetify/lib/components/VDialog/VDialog.css', () => ({}))

// Setup global CSS mocking for dynamic imports
const originalCreateElement = document.createElement
document.createElement = function (tagName: string) {
  if (tagName === 'style') {
    const style = originalCreateElement.call(this, tagName)
    style.textContent = ''
    return style
  }
  return originalCreateElement.call(this, tagName)
}

// Mock any dynamic CSS imports
Object.defineProperty(global, 'importCss', {
  value: () => Promise.resolve({}),
  writable: true,
})
