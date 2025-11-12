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
      updateInDev: true
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Prevent pre-bundling of Tauri packages in development
  optimizeDeps: {
    exclude: [
      '@tauri-apps/api',
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
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['tests/e2e/**/*', 'node_modules/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'coverage/**',
        'dist/**',
        '**/*.d.ts',
        'test{,s}/**',
        'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
        '**/__tests__/**',
        'src/main.ts',
        'src/app/main.ts',
        'tests/**',
        'node_modules/**',
        // Exclude Vue components and pages (tested via e2e)
        '**/*.vue',
        'src/pages/**',
        'src/components/**',
        // Exclude platform-specific and hard-to-test services
        'src/services/oauth/**',
        'src/services/dropbox/**',
        'src/services/googledrive/**',
        'src/services/tauriService.ts',
        'src/services/desktopEnrollmentService.ts',
        'src/services/iosSecureEnclaveService.ts',
        'src/services/secureEnclaveNativeBridge.ts',
        'src/services/unifiedMTLSService.ts',
        'src/services/http/**',
        'src/services/certificate/**',
        // Exclude platform-specific config
        'src/config/api.ts',
        'src/config/app-configuration.ts',
        // Exclude plugins (native bridges)
        'src/plugins/**',
        // Exclude composables (UI-coupled, tested via e2e)
        'src/composables/**',
      ],
      include: [
        'src/stores/**/*.ts',
        'src/utils/**/*.ts',
        'src/adapters/**/*.ts',
        'src/coordinators/**/*.ts',
        'src/services/cloudProviderConfig.ts',
        'src/services/component-services.ts',
        'src/config/component-configurations.ts',
      ],
      thresholds: {
        statements: 50,
        branches: 75,
        functions: 55,
        lines: 50,
      },
      reportsDirectory: './coverage',
      enabled: true,
      ignoreEmptyLines: true,
    },
    // Handle CSS and Vuetify styles in tests
    setupFiles: ['tests/setup.ts'],
    server: {
      deps: {
        // Inline all dependencies in tests to avoid CSS import issues
        inline: ['vuetify'],
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
  },
})
