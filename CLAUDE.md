# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Apuntador — a Vue 3 + TypeScript + Vite + Vuetify teleprompter app that ships to **three targets** from one `src/`: web (Vite), mobile (Capacitor, `android/` + `ios/`), and desktop (Tauri, `src-tauri/`, Rust). Single project, npm, Node `>=22`.

## Hard rules

- **No emojis or Unicode icons anywhere** — code, comments, logs, docs, YAML, shell. Use text markers instead (`ERROR:`, `SUCCESS:`, `[Service]`). This is actively enforced.
- **Never hand-edit `src/utils/version.ts`** — it is regenerated from `package.json` on every build and dev start by `config/vite-plugin-version-sync.ts`.

## Commands

- Dev server: `npm run dev` (Vite, port **3000**, host exposed)
- Build: `npm run build` runs `check:env` first and **fails without** `VITE_GOOGLE_DRIVE_CLIENT_ID`, `VITE_GOOGLE_DRIVE_CLIENT_SECRET`, `VITE_DROPBOX_CLIENT_ID` (copy `.env.example` to `.env`). Bypass with `npm run build:skip-check`.
- Checks (all separate — run the relevant ones before considering a change done):
  - `npm run typecheck` (`vue-tsc --noEmit`)
  - `npm run lint` (ESLint)
  - `npm run stylelint` (SCSS/Vue styles — not covered by ESLint)
  - `npm run format` (Prettier, write)
- Tests: `npm run test` (Vitest, unit), `npm run test:e2e` (Playwright, auto-starts dev on :3000), `npm run coverage`
- Coverage thresholds (`vitest.config.ts`): 80% statements/branches/functions/lines, enforced only over the curated `include` scope (stores, utils, adapters, coordinators, `cloudProviderConfig.ts`, `component-services.ts`) — Vue components/pages/composables/plugins/native-bridge services are intentionally excluded and covered via Playwright e2e instead.
- `Makefile` mirrors the npm scripts (`make lint`, `make test`, ...) and adds platform build targets.

## Code style (differs from defaults)

- Prettier: **no semicolons**, single quotes, 2-space, `printWidth: 100`, `trailingComma: es5`, LF.
- Vue: Composition API with `<script setup lang="ts">`. `vue/multi-word-component-names` and `vue/no-v-html` are off.
- TS: unused vars are an error, but args prefixed `_` are ignored. Import via the `@/` alias (`@/` → `src/`).

## Architecture

`src/` is layered: `components`/`pages` (UI) talk to `coordinators` + `adapters`, which wrap `stores` (Pinia, persisted via localforage) and `services` (oauth, dropbox, googledrive, http, certificate). Also `composables`, `plugins` (native bridges), `locales` (vue-i18n, 9 locales), `config`, `types`, `utils`. Keep UI components decoupled from stores through the coordinator/adapter layer.

Component contracts are typed in `src/types/component-interfaces.d.ts` so implementations can be swapped without touching the coordinator layer.

Device (m)TLS authentication is platform-specific: Android (Keystore/StrongBox), iOS (Secure Enclave), Desktop (encrypted file storage), Web (OAuth 2.0 + PKCE, no mTLS). Core logic is in `src/services/unifiedMTLSService.ts` and `src/services/certificate/`.

Tauri APIs (`@tauri-apps/api`) are desktop-only and externalized from the web bundle — do not import them into shared/web code paths.

## Coding conventions

Centralize magic numbers/constants in `src/utils/constants.ts` rather than inlining them.

## Versioning & release

`package.json` is the source of truth. Release commits are bare version strings (e.g. `1.1.102`), patch-bumped per release. `scripts/sync-version.sh` derives the Android `versionName`/`versionCode` from it. **The Tauri desktop version (`src-tauri/tauri.conf.json`) is intentionally separate** and not synced.
