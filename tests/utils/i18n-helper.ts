import { createI18n } from 'vue-i18n'

// Minimal translations for testing
const messages = {
  'en-US': {
    common: {
      left: 'Left',
      center: 'Center', 
      right: 'Right',
      home: 'Home',
      end: 'End',
      play: 'Play',
      pause: 'Pause'
    },
    toolbar: {
      alignLeft: 'Align Left',
      alignCenter: 'Align Center',
      alignRight: 'Align Right',
      mirrorHorizontal: 'Mirror Horizontal',
      mirrorVertical: 'Mirror Vertical',
      fullscreen: 'Fullscreen',
      exitFullscreen: 'Exit Fullscreen'
    }
  },
  'es-ES': {
    common: {
      left: 'Izquierda',
      center: 'Centro',
      right: 'Derecha', 
      home: 'Inicio',
      end: 'Final',
      play: 'Reproducir',
      pause: 'Pausar'
    },
    toolbar: {
      alignLeft: 'Alinear a la izquierda',
      alignCenter: 'Alinear al centro',
      alignRight: 'Alinear a la derecha',
      mirrorHorizontal: 'Espejo horizontal',
      mirrorVertical: 'Espejo vertical',
      fullscreen: 'Pantalla completa',
      exitFullscreen: 'Salir de pantalla completa'
    }
  }
}

export function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en-US',
    fallbackLocale: 'en-US',
    messages
  })
}