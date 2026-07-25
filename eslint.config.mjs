import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import * as parserVue from 'vue-eslint-parser'
import configTypescript from '@typescript-eslint/eslint-plugin'
import parserTypescript from '@typescript-eslint/parser'
import globals from 'globals'

export default [
  {
    // A config object with ONLY `ignores` acts as a global ignore applied to every
    // other config below, instead of just scoping the object it's declared on.
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      // Native project directories: entirely generated/synced by Capacitor and the
      // native build tools (gradle, xcodebuild) - no hand-written JS/TS/Vue source here.
      'android/**',
      'ios/**',
      'src-tauri/target/**',
      'docs/.vitepress/cache/**',
      'docs/.vitepress/dist/**',
    ],
  },
  {
    ...js.configs.recommended,
  },
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue', '**/*.ts'],
    languageOptions: {
      parser: parserVue,
      parserOptions: {
        parser: parserTypescript,
        project: './tsconfig.json',
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': configTypescript,
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      // Base rules don't understand TypeScript syntax (types, generics, ambient
      // global namespaces like NodeJS, etc.) and produce false positives on .ts/.vue
      // files - `npm run typecheck` (tsc) already covers this more accurately.
      'no-unused-vars': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    // App source runs in the browser.
    files: ['src/**/*.ts', 'src/**/*.vue', 'debug-hotkey.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
  },
  {
    // Tests run under Vitest/Node with a jsdom environment, so they see both
    // browser globals (window, document, ...) and Node ones (Buffer, global, ...).
    files: ['tests/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
  {
    // Build/tooling config files run under Node.
    files: [
      '*.config.ts',
      '*.config.mjs',
      '*.config.cjs',
      'config/**/*.ts',
      'scripts/**/*.js',
      'docs/.vitepress/**/*.ts',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
  },
]
