import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.apuntador.app',
  appName: 'Apuntador',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'ionic',
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
      resize: 'body',
      style: 'dark',
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
