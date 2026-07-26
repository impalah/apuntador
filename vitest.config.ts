import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/variables.scss',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
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
        'src/services/http/**',
        'src/services/certificate/**',
        // Exclude platform-specific config
        'src/config/api.ts',
        // Exclude plugins (native bridges)
        'src/plugins/**',
        // Exclude composables (UI-coupled, tested via e2e) - except
        // src/composables/speech/**, which has real Vitest unit coverage
        // (see the "include" list below) and isn't UI-coupled.
        'src/composables/useDeepLinks.ts',
        'src/composables/useNotification.ts',
        'src/composables/useSettingsActions.ts',
        'src/composables/useTheaterMode.ts',
        // Exclude cloud store (platform-specific, integration tested)
        'src/stores/useCloudStore.ts',
        // Exclude platform-specific utils
        'src/utils/input/gamepad.ts',
        'src/utils/display/webFullscreen.ts',
        'src/utils/display/fullscreen.ts',
        'src/utils/display/immersiveMode.ts',
      ],
      include: [
        'src/stores/useTeleprompterStore.ts',
        'src/stores/usePrefsStore.ts',
        'src/stores/useFileStore.ts',
        'src/stores/useI18nStore.ts',
        'src/utils/**/*.ts',
        'src/services/cloudProviderConfig.ts',
        'src/services/unifiedMTLSService.ts',
        'src/services/mtls/**/*.ts',
        'src/services/serviceErrorHandler.ts',
        'src/services/speech/**/*.ts',
        'src/composables/speech/**/*.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      reportsDirectory: './coverage',
      enabled: true,
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
})
