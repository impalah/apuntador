// File System Access API utilities
// Provides save functionality with proper fallbacks

interface SaveFileOptions {
  suggestedName?: string
  types?: Array<{
    description: string
    accept: Record<string, string[]>
  }>
}

interface OpenFileOptions {
  types?: Array<{
    description: string
    accept: Record<string, string[]>
  }>
  multiple?: boolean
}

const markdownFileTypes = [
  {
    description: 'Markdown files',
    accept: {
      'text/markdown': ['.md', '.markdown'],
      'text/plain': ['.txt'],
    },
  },
]

// Check if File System Access API is supported
export function isFileSystemAccessSupported(): boolean {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window
}

// Save file using File System Access API or fallback to download
export async function saveFile(content: string, options: SaveFileOptions = {}): Promise<any> {
  const { suggestedName = 'script.md', types = markdownFileTypes } = options

  if (isFileSystemAccessSupported()) {
    try {
      // Use File System Access API
      const fileHandle = await (globalThis as any).showSaveFilePicker({
        suggestedName,
        types,
      })

      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()

      return fileHandle
    } catch (error: any) {
      // User cancelled or error occurred
      if (error.name === 'AbortError') {
        return null // User cancelled
      }
      console.warn('File System Access API failed, falling back to download:', error)
    }
  }

  // Fallback: download file
  downloadFile(content, suggestedName)
  return null
}

// Save to existing file handle
export async function saveToFileHandle(handle: any, content: string): Promise<boolean> {
  if (!handle || !isFileSystemAccessSupported()) {
    return false
  }

  try {
    const writable = await handle.createWritable()
    await writable.write(content)
    await writable.close()
    return true
  } catch (error) {
    console.error('Failed to save to file handle:', error)
    return false
  }
}

// Check if file exists (for overwrite confirmation)
export async function checkFileExists(_fileName: string): Promise<boolean> {
  // Note: File System Access API doesn't provide a direct way to check existence
  // We'll handle this through the save dialog and let the browser handle conflicts
  return false
}

// Open file using File System Access API
export async function openFile(
  options: OpenFileOptions = {}
): Promise<{ handle: any; content: string; name: string } | null> {
  const { types = markdownFileTypes, multiple = false } = options

  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API not supported. Use the file input fallback.')
  }

  try {
    const [fileHandle] = await (globalThis as any).showOpenFilePicker({
      types,
      multiple,
    })

    const file = await fileHandle.getFile()
    const content = await file.text()

    return {
      handle: fileHandle,
      content,
      name: file.name,
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return null // User cancelled
    }
    throw error
  }
}

// Fallback: download file (traditional approach)
function downloadFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  link.remove()

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

// Confirm overwrite dialog
export async function confirmOverwrite(fileName: string): Promise<boolean> {
  return new Promise((resolve) => {
    const result = confirm(`The file "${fileName}" already exists. Do you want to overwrite it?`)
    resolve(result)
  })
}

// Get file extension from name
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  return lastDot > 0 ? fileName.substring(lastDot) : ''
}

// Ensure file has proper extension
export function ensureMarkdownExtension(fileName: string): string {
  const ext = getFileExtension(fileName).toLowerCase()
  if (ext === '.md' || ext === '.markdown' || ext === '.txt') {
    return fileName
  }
  return `${fileName}.md`
}
