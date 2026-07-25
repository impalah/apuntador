import type { CapacitorConfig } from '@capacitor/cli'
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard'

const config: CapacitorConfig = {
  appId: 'io.apuntador.app',
  appName: 'Apuntador',
  webDir: 'dist',
  server: {
    // DESARROLLO: Usar HTTP para permitir conexiones al backend local
    // PRODUCCIÓN: Cambiar a HTTPS
    androidScheme: 'http',
    iosScheme: 'https', // Usar https para permitir peticiones HTTP/HTTPS desde el WebView
    // Permitir mixed content (HTTP desde HTTPS) para desarrollo
    cleartext: true,
    // Permitir conexiones a estos dominios externos desde iOS
    allowNavigation: [
      'https://api.apuntador.io',
      'https://accounts.google.com',
      'https://www.googleapis.com',
      'https://oauth2.googleapis.com',
      'https://www.dropbox.com',
      'https://api.dropboxapi.com',
    ],
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#000000',
    },
    ScreenOrientation: {
      // Allow all orientations - the app will handle adaptation
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
    Haptics: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#000000',
    webContentsDebuggingEnabled: false,
    // Configuración para edge-to-edge y safe areas
    appendUserAgent: 'Apuntador/1.1.5',
    captureInput: true,
  },
  ios: {
    scheme: 'Apuntador',
    backgroundColor: '#000000',
    webContentsDebuggingEnabled: false,
    scrollEnabled: false,
    // Configuración para orientaciones
    contentInset: 'automatic',
  },
}

export default config
