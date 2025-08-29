import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.apuntador.app',
  appName: 'Apuntador',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
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
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#000000',
  },
}

export default config
