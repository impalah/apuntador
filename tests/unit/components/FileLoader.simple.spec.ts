import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FileLoader from '@/components/FileLoader.vue'

// Mock markdown utils
vi.mock('@/utils/markdown', () => ({
  sanitizeMarkdown: vi.fn((content: string) => content),
}))

describe('FileLoader Component Logic', () => {
  let wrapper: any

  const createWrapper = (props = {}) => {
    return mount(FileLoader, {
      props: {
        modelValue: true,
        autoImport: false,
        ...props,
      },
      global: {
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
  })

  describe('File Processing Logic', () => {
    it('should process markdown file correctly', async () => {
      const mockFile = new File(['# Test Content'], 'test.md', { type: 'text/markdown' })
      const fileReader = {
        readAsText: vi.fn(),
        result: '# Test Content',
        onload: null as any,
        onerror: null as any,
      }

      vi.stubGlobal(
        'FileReader',
        vi.fn(() => fileReader)
      )

      await wrapper.vm.processFile(mockFile)

      expect(fileReader.readAsText).toHaveBeenCalledWith(mockFile, 'utf-8')
    })

    it('should emit fileImported event with correct data', async () => {
      const mockFile = new File(['# Test Content'], 'test.md', { type: 'text/markdown' })
      const content = '# Test Content'

      await wrapper.vm.emitFileImported(content, mockFile.name)

      expect(wrapper.emitted('fileImported')).toBeTruthy()
      expect(wrapper.emitted('fileImported')[0]).toEqual([
        {
          content,
          filename: mockFile.name,
        },
      ])
    })

    it('should validate file types correctly', () => {
      const mdFile = new File(['content'], 'test.md', { type: 'text/markdown' })
      const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      expect(wrapper.vm.isValidFileType(mdFile)).toBe(true)
      expect(wrapper.vm.isValidFileType(txtFile)).toBe(true)
      expect(wrapper.vm.isValidFileType(pdfFile)).toBe(false)
    })
  })

  describe('File Selection Watcher', () => {
    it('should process file when autoImport is true and file is selected', async () => {
      const wrapper = createWrapper({ autoImport: true })
      const mockFile = new File(['# Test'], 'test.md', { type: 'text/markdown' })

      const processFileSpy = vi.spyOn(wrapper.vm, 'processFile')

      // Simulate file selection
      wrapper.vm.selectedFile = mockFile
      await wrapper.vm.$nextTick()

      expect(processFileSpy).toHaveBeenCalledWith(mockFile)
    })

    it('should not auto-process when autoImport is false', async () => {
      const wrapper = createWrapper({ autoImport: false })
      const mockFile = new File(['# Test'], 'test.md', { type: 'text/markdown' })

      const processFileSpy = vi.spyOn(wrapper.vm, 'processFile')

      wrapper.vm.selectedFile = mockFile
      await wrapper.vm.$nextTick()

      expect(processFileSpy).not.toHaveBeenCalled()
    })
  })

  describe('Manual Import', () => {
    it('should process selected file when import button is clicked', async () => {
      const mockFile = new File(['# Test'], 'test.md', { type: 'text/markdown' })
      wrapper.vm.selectedFile = mockFile

      const processFileSpy = vi.spyOn(wrapper.vm, 'processFile')

      await wrapper.vm.handleImport()

      expect(processFileSpy).toHaveBeenCalledWith(mockFile)
    })

    it('should not process if no file is selected', async () => {
      wrapper.vm.selectedFile = null

      const processFileSpy = vi.spyOn(wrapper.vm, 'processFile')

      await wrapper.vm.handleImport()

      expect(processFileSpy).not.toHaveBeenCalled()
    })
  })

  describe('File Type Validation', () => {
    it('should accept .md files', () => {
      const mdFile = new File(['content'], 'test.md', { type: 'text/markdown' })
      expect(wrapper.vm.isValidFileType(mdFile)).toBe(true)
    })

    it('should accept .txt files', () => {
      const txtFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      expect(wrapper.vm.isValidFileType(txtFile)).toBe(true)
    })

    it('should accept .markdown files', () => {
      const markdownFile = new File(['content'], 'test.markdown', { type: 'text/markdown' })
      expect(wrapper.vm.isValidFileType(markdownFile)).toBe(true)
    })

    it('should reject unsupported file types', () => {
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const docFile = new File(['content'], 'test.doc', { type: 'application/msword' })

      expect(wrapper.vm.isValidFileType(pdfFile)).toBe(false)
      expect(wrapper.vm.isValidFileType(docFile)).toBe(false)
    })
  })

  describe('State Management', () => {
    it('should set isProcessing to true during file processing', async () => {
      const mockFile = new File(['# Test'], 'test.md', { type: 'text/markdown' })

      // Mock FileReader to control the flow
      const fileReader = {
        readAsText: vi.fn(),
        result: '# Test Content',
        onload: null as any,
        onerror: null as any,
      }
      vi.stubGlobal(
        'FileReader',
        vi.fn(() => fileReader)
      )

      const processPromise = wrapper.vm.processFile(mockFile)

      // Should be processing
      expect(wrapper.vm.isProcessing).toBe(true)

      // Simulate successful read
      fileReader.onload()
      await processPromise

      // Should be done processing
      expect(wrapper.vm.isProcessing).toBe(false)
    })

    it('should handle file reading errors gracefully', async () => {
      const mockFile = new File(['# Test'], 'test.md', { type: 'text/markdown' })

      const fileReader = {
        readAsText: vi.fn(),
        result: null,
        onload: null as any,
        onerror: null as any,
        error: new Error('File read error'),
      }
      vi.stubGlobal(
        'FileReader',
        vi.fn(() => fileReader)
      )

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const processPromise = wrapper.vm.processFile(mockFile)

      // Simulate error
      fileReader.onerror()
      await processPromise

      expect(consoleSpy).toHaveBeenCalled()
      expect(wrapper.vm.isProcessing).toBe(false)

      consoleSpy.mockRestore()
    })
  })

  describe('Computed Properties', () => {
    it('should compute importDisabled correctly when no file selected', () => {
      wrapper.vm.selectedFile = null
      wrapper.vm.isProcessing = false

      expect(wrapper.vm.importDisabled).toBe(true)
    })

    it('should compute importDisabled correctly when file is processing', () => {
      wrapper.vm.selectedFile = new File(['test'], 'test.md', { type: 'text/markdown' })
      wrapper.vm.isProcessing = true

      expect(wrapper.vm.importDisabled).toBe(true)
    })

    it('should compute importDisabled as false when file is selected and not processing', () => {
      wrapper.vm.selectedFile = new File(['test'], 'test.md', { type: 'text/markdown' })
      wrapper.vm.isProcessing = false

      expect(wrapper.vm.importDisabled).toBe(false)
    })
  })
})
