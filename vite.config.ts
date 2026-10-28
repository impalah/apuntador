import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'
import { versionSync } from './config/vite-plugin-version-sync.ts'

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
    // Vuetify 4 stacks overlay z-index through a shared singleton; pre-bundle
    // the overlay modules together so dev mode does not end up with two copies.
    include: [
      'vuetify/components/VOverlay',
      'vuetify/components/VDialog',
      'vuetify/components/VMenu',
      'vuetify/components/VSelect',
      'vuetify/components/VTooltip',
    ],
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
    // Tauri APIs are not externalized: the desktop app ships this same bundle.
    // Shared code keeps them out of web/mobile paths with dynamic import().
    rolldownOptions: {
      // Production bundles drop console.log/info/debug (warn/error stay);
      // `npm run build:debug` (VITE_DEBUG_MODE=true) keeps them
      treeshake: {
        manualPureFunctions:
          process.env.VITE_DEBUG_MODE === 'true'
            ? []
            : ['console.log', 'console.info', 'console.debug'],
      },
      output: {
        // Vendor chunk groups to improve bundle splitting
        codeSplitting: {
          groups: [
            { name: 'vue', test: /[\\/]node_modules[\\/](@vue|vue|vue-router)[\\/]/ },
            { name: 'vuetify', test: /[\\/]node_modules[\\/]vuetify[\\/]/ },
            { name: 'capacitor', test: /[\\/]node_modules[\\/]@capacitor[\\/]/ },
            { name: 'stores', test: /[\\/]node_modules[\\/]pinia[\\/]/ },
            { name: 'markdown', test: /[\\/]node_modules[\\/]markdown-it[\\/]/ },
          ],
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
