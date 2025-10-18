# About Tab Implementation

This document describes the implementation of the new "About" tab in the settings dialog.

## 📋 Overview

A new "About" tab has been added to the settings dialog that displays application information including version, copyright, and repository link. The tab appears after the "Data" tab and includes full internationalization support.

## 🗂️ Files Modified/Created

### New Files
- `src/utils/version.ts` - Version management utility

### Modified Files
- `src/components/SettingsDialog.vue` - Added About tab
- All 9 translation files in `src/locales/`:
  - `en-US.json`, `es-ES.json`, `ca-ES.json`, `gl-ES.json`
  - `pt-BR.json`, `pt-PT.json`, `fr-FR.json`, `de-DE.json`, `it-IT.json`

## 🏗️ Implementation Details

### Version Management (`src/utils/version.ts`)

```typescript
export const APP_VERSION = '1.1.1'
export const APP_NAME = 'Apuntador'
export const COPYRIGHT_YEAR = '2025'
export const COPYRIGHT_OWNER = 'Impalah'
export const REPOSITORY_URL = 'https://github.com/impalah/apuntador'

export function getVersionInfo() {
  return {
    name: APP_NAME,
    version: APP_VERSION,
    copyright: COPYRIGHT_TEXT,
    repositoryUrl: REPOSITORY_URL,
  }
}
```

### Translation Keys Added

Each language file now includes:

```json
{
  "settings": {
    "about": "[About/Acerca de/À propos/etc.]",
    "subtitle": "[Professional Teleprompter in each language]",
    "version": "[Version/Versión/Versione/etc.]", 
    "copyright": "[Copyright/Derechos de autor/etc.]"
  }
}
```

### UI Implementation

The About tab displays:
- **Application Title**: "Apuntador - [Translated Subtitle]"
- **Version**: "Version: X.X.X"
- **Copyright**: "(c) 2025 by Impalah (https://github.com/impalah/apuntador)"
- **GitHub Link**: Button linking to repository

## 🌍 Language Support

### Subtitles by Language:
- **English**: "Professional Teleprompter"  
- **Spanish**: "Teleprompter profesional"
- **Catalan**: "Teleprompter professional"
- **Galician**: "Teleprompter profesional"
- **Portuguese (BR)**: "Teleprompter profissional"
- **Portuguese (PT)**: "Teleprompter profissional"
- **French**: "Télésouffleur professionnel"
- **German**: "Professioneller Teleprompter"
- **Italian**: "Teleprompter professionale"

## 🔧 Usage

1. Open settings dialog (gear icon)
2. Navigate to the "About" tab (last tab)
3. View application information
4. Click GitHub button to open repository

## 📝 Version Management

Currently uses manual version synchronization:
- Update `APP_VERSION` in `src/utils/version.ts` when releasing
- Keep in sync with `package.json` version field
- Consider automation in future builds

## 🧪 Testing

Run the verification script:
```bash
./test-about-tab.sh
```

Or test manually:
```bash
npm run dev
# Navigate to http://localhost:3000
# Open settings → About tab
```

## 🔮 Future Enhancements

- **Automated Version Sync**: Vite plugin to auto-sync with package.json
- **Build Info**: Add build date, commit hash, etc.
- **Release Notes**: Link to changelog or release notes
- **License Info**: Display license information
- **Contributors**: List of project contributors

## ✅ Verification Checklist

- [x] About tab appears after Data tab
- [x] Version displays correctly (1.1.1)
- [x] Copyright information shows
- [x] GitHub link works
- [x] All 9 languages have translations
- [x] Responsive design works
- [x] Build completes without errors
- [x] TypeScript compilation passes