/**
 * Interfaz formal para componentes de edición intercambiables.
 */

export interface EditorDisplayPrefs {
  textAlignment: string
  bgColor: string
  fgColor: string
}

export interface EditorFileState {
  displayName: string
  originalContent: string
  hasUnsavedChanges: boolean
  canSave: boolean
  canSaveAsNewCopy: boolean
  isNewFile: boolean
  fileName: string
}

export interface EditorFileActions {
  createNew: () => void
  markAsModified: () => void
  markAsSaved: (content: string) => void
  setContent: (content: string) => void
  setFileHandle: (handle: any, name: string) => void
}

export interface EditorProps {
  /** Controla la visibilidad del editor (modal, diálogo, etc.) */
  modelValue: boolean
  /** Contenido a editar (por ejemplo, markdown) */
  content: string
  /** Preferencias de visualización */
  displayPrefs: EditorDisplayPrefs
  /** Estado del archivo */
  fileState: EditorFileState
  /** Acciones sobre el archivo */
  fileActions: EditorFileActions
}

export interface EditorEmits {
  /** Se emite al cerrar el editor */
  (e: 'update:modelValue', value: boolean): void
  /** Se emite al guardar el contenido */
  (e: 'save', content: string): void
  /** Se emite al cargar un archivo externo */
  (e: 'open-file'): void
}
