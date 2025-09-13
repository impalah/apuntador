# File Synchronization Functionality

This new functionality allows keeping files edited in Apuntador synchronized with their source files, similar to a version control system like Git.

## Implemented Features

### 🔄 Automatic Change Detection

- The system maintains a reference to the original file content
- Automatically detects when the source file has been modified by another process
- Compares local content with the source file to identify conflicts

### 💾 Smart Saving

- **Conflict detection**: When saving, verifies if the source file has changed
- **Overwrite confirmation**: If there are conflicts, requests confirmation before overwriting
- **Message**: "Changes have been detected in the source file. Do you want to overwrite them with the new content?"

### 🔄 Refresh from Source

- **Dedicated button**: "Refresh" icon in the editor toolbar
- **Visual indicator**: The button is marked in yellow when it detects changes in the source
- **Smart confirmations**:
  - If there are local changes: "Local content has been modified. Do you want to discard the edit and load the source data?"
  - If there are changes in both: "Both local content and source file have changed. Do you want to discard the edit and load the source data?"
  - Only source changes: "Source file has been modified. Do you want to load the new source data?"

## Workflow

### Use Case: Collaborative Team

1. **Content editor** saves the script to a network drive from their PC
2. **Teleprompter operator** opens the file from the same network drive in Apuntador
3. **Automatic synchronization**:
   - If the editor modifies the file, the refresh button becomes available
   - When clicking "Refresh from source", the new content is loaded
   - When saving local changes, conflicts are automatically detected

### Handled Scenarios

#### 📝 Editing Without Conflicts

```
1. Open file → Load original content
2. Edit in Apuntador → Mark as modified
3. Save → Check source → Save successfully
```

#### ⚠️ Save Conflict

```
1. Source file changes externally
2. User attempts to save in Apuntador
3. System detects conflict → Requests confirmation
4. User decides whether to overwrite or cancel
```

#### 🔄 Refresh from Source

```
1. Source file changes externally
2. "Refresh" button is marked in yellow
3. User clicks → System detects local changes
4. Requests confirmation → Loads updated content
```

## Technical Components

### 📦 New Files

- `src/utils/fileSync.ts` - Synchronization utilities
- Comparison and conflict handling functions

### 🔧 Modifications

- `src/stores/useFileStore.ts` - Source content tracking
- `src/components/MarkdownEditor.vue` - Button and refresh logic
- `src/locales/*.json` - i18n strings for messages

### 🎛️ New UI

- "Refresh from source" button with `mdi-refresh` icon
- Visual indicator (yellow color) when there are changes
- Contextual confirmation dialogs

## Main API

### FileStore

```typescript
// New computed properties
canRefreshFromSource: boolean
hasSourceContentChanged: boolean

// New actions
updateSourceContent(content: string)
markAsSaved(newContent?: string)
```

### FileSync Utils

```typescript
// Content comparison
compareWithSource(editorContent, originalContent, sourceContent): SyncStatus

// Save with conflict checking
saveWithConflictCheck(fileHandle, currentContent, editorContent, originalContent): Promise<Result>

// Refresh from source
refreshFromSource(fileHandle): Promise<SyncResult>
```

## Test Cases

### ✅ Basic Functionality

- [ ] Open file → maintains source reference
- [ ] Edit content → marks as modified
- [ ] Save without conflicts → success
- [ ] Create new file → ignores synchronization

### ⚠️ Conflict Management

- [ ] Source file modified externally → detects change
- [ ] Save with conflict → requests confirmation
- [ ] Refresh with local changes → requests confirmation
- [ ] Refresh without local changes → loads directly

### 🌍 Internationalization

- [ ] All messages in Spanish
- [ ] All messages in English
- [ ] Dynamic language switching

## Current Limitations

1. **File System Access API only**: Works only with local/network files accessible via File System Access API
2. **Manual confirmations**: Requires user intervention for conflict resolution
3. **No auto-refresh**: Does not automatically check for changes in the background

## Future Improvements

1. **Auto-detection**: Automatic polling to detect changes in the source file
2. **Visual diff**: Show side-by-side differences before confirming changes
3. **History**: Maintain a version history to be able to revert
4. **Cloud storage**: Extend functionality to Google Drive, Dropbox, etc.
5. **Merge conflicts**: More sophisticated tools to resolve conflicts

## Compatibility

- ✅ **Chrome/Edge**: Native File System Access API
- ✅ **Firefox**: Via polyfill where available
- ❌ **Safari**: Limited by File System Access API support
- ✅ **Electron**: Full functionality

---

This functionality turns Apuntador into a more robust tool for collaborative workflows, maintaining synchronization between editing and presentation teams.
