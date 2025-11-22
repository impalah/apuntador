import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'

// Import Vuetify styles
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

// Import main styles
import '@/styles/main.scss'

// Import components
import App from './App.vue'
import router from './router'

// Import i18n
import { i18n } from '@/utils/i18n'

// Import mobile functionality
import { initMobileApp } from '@/utils/capacitor'

// Import cloud store for initialization
import { useCloudStore } from '@/stores/useCloudStore'

// Create Vuetify instance
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          primary: '#2196F3',
          secondary: '#424242',
          accent: '#FF4081',
          error: '#F44336',
          warning: '#FF9800',
          info: '#2196F3',
          success: '#4CAF50',
          surface: '#121212',
          background: '#000000',
        },
      },
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#FF4081',
          error: '#F44336',
          warning: '#FF9800',
          info: '#2196F3',
          success: '#4CAF50',
          surface: '#FFFFFF',
          background: '#FFFFFF',
        },
      },
    },
  },
  defaults: {
    VBtn: {
      rounded: true,
    },
    VCard: {
      rounded: 'lg',
    },
    VSheet: {
      rounded: 'lg',
    },
  },
})

// Create Pinia store
const pinia = createPinia()

// Create and mount app
const app = createApp(App)

app.use(pinia)
app.use(vuetify)
app.use(router)
app.use(i18n)

app.mount('#app')

// Initialize mobile features after app is mounted
initMobileApp()

// Initialize cloud store to load saved provider
const cloudStore = useCloudStore()
await cloudStore.initialize().catch(err => {
  console.error('Error initializing cloud store:', err)
})
