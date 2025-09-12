import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import type { App } from 'vue'

// Mensajes mínimos para pruebas
const messages = {
  'en-US': {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      close: 'Close',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
    },
    fileLoader: {
      title: 'Import File',
      dragDrop: 'Drag and drop a file here',
      dropZone: 'Drop your file here or click to browse',
      supportedFormats: 'Supported formats: .md, .txt',
      selectFile: 'Select File',
      browseFiles: 'Browse Files',
      import: 'Import',
      processing: 'Processing file...',
      readingFile: 'Reading file...',
      invalidType: 'Invalid file type. Please select a .md or .txt file.',
      readError: 'Error reading file',
      empty: 'File is empty',
      tooLarge: 'File is too large',
      autoImportEnabled: 'Auto-import is enabled',
      autoImportNote: 'Files will be imported automatically when selected',
    },
    toolbar: {
      play: 'Play',
      pause: 'Pause',
      playPause: 'Play/Pause',
    },
    settings: {
      title: 'Settings',
      language: 'Language',
      selectFile: 'Select File',
    },
    editor: {
      title: 'Editor',
      placeholder: 'Enter your script here...',
    },
  },
  'es-ES': {
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      cancel: 'Cancelar',
      save: 'Guardar',
      close: 'Cerrar',
      confirm: 'Confirmar',
      yes: 'Sí',
      no: 'No',
    },
    fileLoader: {
      title: 'Importar Archivo',
      dragDrop: 'Arrastra y suelta un archivo aquí',
      dropZone: 'Suelta tu archivo aquí o haz clic para navegar',
      supportedFormats: 'Formatos soportados: .md, .txt',
      selectFile: 'Seleccionar Archivo',
      browseFiles: 'Explorar Archivos',
      import: 'Importar',
      processing: 'Procesando archivo...',
      readingFile: 'Leyendo archivo...',
      invalidType: 'Tipo de archivo inválido. Por favor selecciona un archivo .md o .txt.',
      readError: 'Error leyendo archivo',
      empty: 'El archivo está vacío',
      tooLarge: 'El archivo es demasiado grande',
      autoImportEnabled: 'Auto-importación habilitada',
      autoImportNote: 'Los archivos se importarán automáticamente cuando se seleccionen',
    },
    toolbar: {
      play: 'Reproducir',
      pause: 'Pausar',
      playPause: 'Reproducir/Pausar',
    },
    settings: {
      title: 'Configuración',
      language: 'Idioma',
      selectFile: 'Seleccionar Archivo',
    },
    editor: {
      title: 'Editor',
      placeholder: 'Ingresa tu guión aquí...',
    },
  },
}

export function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en-US',
    fallbackLocale: 'en-US',
    messages,
  })
}

export function createTestVuetify() {
  return createVuetify({
    theme: {
      defaultTheme: 'light',
    },
  })
}

export function installTestPlugins(app: App) {
  app.use(createTestI18n())
  app.use(createTestVuetify())
}
