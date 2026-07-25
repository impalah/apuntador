import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'
import { versionSync } from './config/vite-plugin-version-sync'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/variables.scss',
      },
    }),
    versionSync({
      packageJsonPath: './package.json',
      versionFilePath: './src/utils/version.ts',
      updateInDev: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Prevent pre-bundling of Tauri packages in development
  optimizeDeps: {
    exclude: ['@tauri-apps/api'],
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Basic configuration to minimize deprecation warnings
        quietDeps: true,
      },
    },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit
    rollupOptions: {
      external: [
        // Externalize Tauri modules (only for desktop, not web)
        '@tauri-apps/api',
      ],
      output: {
        // Manual chunks to improve bundle splitting
        manualChunks: {
          // Vendor chunks
          vue: ['vue', 'vue-router'],
          vuetify: ['vuetify', 'vuetify/components', 'vuetify/directives'],
          capacitor: [
            '@capacitor/core',
            '@capacitor/status-bar',
            '@capacitor/haptics',
            '@capacitor/keyboard',
            '@capacitor/screen-orientation',
          ],
          // Utils and stores
          stores: ['pinia'],
          markdown: ['markdown-it'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 3000,
    allowedHosts: [
      'apuntador.ngrok.app',
      '.ngrok.app', // Allow all ngrok subdomains
      '.ngrok-free.app', // Allow free ngrok domains
    ],
  },
})
