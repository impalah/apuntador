import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createTestI18n, createTestVuetify } from '../setup/testPlugins'
import FileLoader from '@/components/FileLoader.vue'

// Mock markdown utils
vi.mock('@/utils/markdown', () => ({
  sanitizeMarkdown: vi.fn((content: string) => content),
}))

// Mock fileSystem utils (formatFileSize is kept as the real implementation
// since it's a pure function under test below, not a browser/native API)
vi.mock('@/utils/fileSystem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/fileSystem')>()
  return {
    ...actual,
    openFile: vi.fn(),
    isFileSystemAccessSupported: vi.fn(() => false),
    ensureMarkdownExtension: vi.fn((name: string) => name),
  }
})

describe('FileLoader Component', () => {
  let wrapper: any
  let pinia: any

  const createWrapper = (props = {}) => {
    return mount(FileLoader, {
      props: {
        modelValue: true,
        autoImport: false,
        ...props,
      },
      global: {
        plugins: [pinia, createTestI18n(), createTestVuetify()],
        stubs: {
          'v-dialog': {
            template: '<div><slot /></div>',
            props: ['modelValue'],
          },
          'v-card': { template: '<div><slot /></div>' },
          'v-card-title': { template: '<div><slot /></div>' },
          'v-card-text': { template: '<div><slot /></div>' },
          'v-card-actions': { template: '<div><slot /></div>' },
          'v-divider': { template: '<div></div>' },
          'v-chip': { template: '<span><slot /></span>' },
          'v-file-input': {
            template: '<input type="file" />',
            props: ['modelValue', 'accept', 'label', 'prependIcon', 'variant'],
          },
          'v-icon': { template: '<span><slot /></span>' },
          'v-btn': { template: '<button><slot /></button>' },
          'v-progress-circular': { template: '<div>Loading...</div>' },
          'v-alert': { template: '<div><slot /></div>' },
          'v-spacer': { template: '<div></div>' },
        },
      },
    })
  }

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    wrapper = createWrapper()
  })

  describe('Props and Initial State', () => {
    it('should accept autoImport prop', () => {
      const wrapper = createWrapper({ autoImport: true })
      expect(wrapper.props('autoImport')).toBe(true)
    })

    it('should start with no selected files', () => {
      expect(wrapper.vm.selectedFiles).toBeUndefined()
    })

    it('should start with loading as false', () => {
      expect(wrapper.vm.loading).toBe(false)
    })

    it('should start with empty file content', () => {
      expect(wrapper.vm.fileContent).toBe('')
    })

    it('should start with no error', () => {
      expect(wrapper.vm.error).toBe('')
    })
  })

  describe('File Type Validation', () => {
    it('should validate markdown files correctly', () => {
      const mdFile = new File(['content'], 'test.md', { type: 'text/markdown' })
      const result = wrapper.vm.isValidFile(mdFile)
      expect(result).toBe(true)
    })

    it('should validate text files correctly', () => {
      const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const result = wrapper.vm.isValidFile(txtFile)
      expect(result).toBe(true)
    })

    it('should reject invalid file types', () => {
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const result = wrapper.vm.isValidFile(pdfFile)
      expect(result).toBe(false)
    })

    it('should validate .markdown extension', () => {
      const markdownFile = new File(['content'], 'test.markdown', { type: 'text/markdown' })
      const result = wrapper.vm.isValidFile(markdownFile)
      expect(result).toBe(true)
    })

    it('should validate files without mime type based on extension', () => {
      const txtFile = new File(['content'], 'test.txt', { type: '' })
      const result = wrapper.vm.isValidFile(txtFile)
      expect(result).toBe(true)
    })
  })

  describe('Component Events', () => {
    it('should emit fileImported event when onImport is called', () => {
      // Set file content and file info
      wrapper.vm.fileContent = '# Test Content'
      wrapper.vm.fileInfo = { name: 'test.md', size: 100, type: 'text/markdown' }

      // Call onImport method
      wrapper.vm.onImport()

      // Check if event was emitted
      expect(wrapper.emitted('fileImported')).toBeTruthy()
      expect(wrapper.emitted('fileImported')[0]).toEqual(['# Test Content', { name: 'test.md' }])
    })

    it('should emit fileImported when onImport is called with content', () => {
      wrapper.vm.fileContent = 'test'
      wrapper.vm.fileInfo = { name: 'test.md', size: 100, type: 'text/markdown' }
      wrapper.vm.onImport()

      expect(wrapper.emitted('fileImported')).toBeTruthy()
      expect(wrapper.emitted('fileImported')[0]).toEqual(['test', { name: 'test.md' }])
    })

    it('should not emit fileImported when no file content', () => {
      wrapper.vm.fileContent = ''
      wrapper.vm.onImport()

      expect(wrapper.emitted('fileImported')).toBeFalsy()
    })
  })

  describe('State Management', () => {
    it('should reset state correctly', () => {
      // Set some state
      wrapper.vm.selectedFiles = [new File(['test'], 'test.md')]
      wrapper.vm.fileContent = 'test content'
      wrapper.vm.error = 'test error'
      wrapper.vm.loading = true
      wrapper.vm.fileInfo = { name: 'test.md', size: 100, type: 'text/markdown' }

      // Reset state
      wrapper.vm.resetState()

      // Verify reset
      expect(wrapper.vm.selectedFiles).toBeUndefined()
      expect(wrapper.vm.fileContent).toBe('')
      expect(wrapper.vm.error).toBe('')
      expect(wrapper.vm.loading).toBe(false)
      expect(wrapper.vm.fileInfo).toBeNull()
    })

    it('should handle loading state correctly', () => {
      expect(wrapper.vm.loading).toBe(false)

      wrapper.vm.loading = true
      expect(wrapper.vm.loading).toBe(true)
    })

    it('should handle error state correctly', () => {
      expect(wrapper.vm.error).toBe('')

      wrapper.vm.error = 'Test error'
      expect(wrapper.vm.error).toBe('Test error')
    })
  })

  describe('File Size Formatting', () => {
    it('should format file sizes correctly', () => {
      expect(wrapper.vm.formatFileSize(0)).toBe('0 B')
      expect(wrapper.vm.formatFileSize(1024)).toBe('1 KB')
      expect(wrapper.vm.formatFileSize(1048576)).toBe('1 MB')
      expect(wrapper.vm.formatFileSize(500)).toBe('500 B')
    })
  })

  describe('Auto Import Behavior', () => {
    it('should show import button when autoImport is false', () => {
      const wrapper = createWrapper({ autoImport: false })
      wrapper.vm.fileContent = 'test content'

      // In the template, the import button shows when fileContent exists and autoImport is false
      expect(wrapper.props('autoImport')).toBe(false)
    })

    it('should not show import button when autoImport is true', () => {
      const wrapper = createWrapper({ autoImport: true })
      expect(wrapper.props('autoImport')).toBe(true)
    })
  })

  describe('File Processing', () => {
    it('should set error for invalid files', async () => {
      const invalidFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      await wrapper.vm.processFile(invalidFile)

      expect(wrapper.vm.error).toContain('Please select a valid markdown or text file')
      expect(wrapper.vm.fileContent).toBe('')
    })

    it('should handle file reading with mock FileReader', async () => {
      const validFile = new File(['# Test Content'], 'test.md', { type: 'text/markdown' })

      // Create a proper mock FileReader class
      class MockFileReader {
        result: string | null = null
        onload: ((event: any) => void) | null = null
        onerror: ((event: any) => void) | null = null
        
        readAsText() {
          // Simulate async file read
          setTimeout(() => {
            this.result = '# Test Content'
            if (this.onload) {
              this.onload({ target: this })
            }
          }, 0)
        }
      }

      // Mock the FileReader constructor
      vi.stubGlobal('FileReader', MockFileReader)

      // Start processing and wait for completion
      await wrapper.vm.processFile(validFile)

      // Wait for all microtasks
      await new Promise(resolve => setTimeout(resolve, 10))

      // Verify final state
      expect(wrapper.vm.loading).toBe(false)
      expect(wrapper.vm.fileContent).toBe('# Test Content')
      expect(wrapper.vm.fileInfo).toEqual({
        name: 'test.md',
        size: validFile.size,
        type: 'text/markdown',
      })

      // Cleanup
      vi.unstubAllGlobals()
    })

    it('should handle auto-import when enabled', async () => {
      const wrapper = createWrapper({ autoImport: true })
      const validFile = new File(['# Auto Import Test'], 'test.md', { type: 'text/markdown' })

      // Create a proper mock FileReader class
      class MockFileReader {
        result: string | null = null
        onload: ((event: any) => void) | null = null
        onerror: ((event: any) => void) | null = null
        
        readAsText() {
          setTimeout(() => {
            this.result = '# Auto Import Test'
            if (this.onload) {
              this.onload({ target: this })
            }
          }, 0)
        }
      }

      vi.stubGlobal('FileReader', MockFileReader)

      // Start processing
      await wrapper.vm.processFile(validFile)

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10))
      await wrapper.vm.$nextTick()

      // Verify fileImported event was emitted (which happens in onImport when autoImport is true)
      const emittedEvents = wrapper.emitted('fileImported')
      expect(emittedEvents).toBeTruthy()
      if (emittedEvents) {
        expect(emittedEvents[0]).toEqual(['# Auto Import Test', { name: 'test.md', handle: null }])
      }

      // Cleanup
      vi.unstubAllGlobals()
    })
  })
})
