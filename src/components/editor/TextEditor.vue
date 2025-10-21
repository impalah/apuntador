<template>
  <div class="text-editor">
    <v-textarea
      ref="textareaRef"
      v-model="localContent"
      variant="solo-filled"
      flat
      hide-details
      no-resize
      :class="['editor-textarea', { mobile: $vuetify.display.mobile }]"
      :placeholder="t('editor.placeholder')"
      @keydown="onKeyDown"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

// Props
interface Props {
  content: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:content': [content: string]
}>()

// Composables
const { t } = useI18n()

// Refs
const textareaRef = ref()
const localContent = ref(props.content)

// Watch for external content changes
watch(
  () => props.content,
  (newContent) => {
    if (newContent !== localContent.value) {
      localContent.value = newContent
    }
  }
)

// Watch for local content changes
watch(localContent, (newContent) => {
  emit('update:content', newContent)
})

// Handle keyboard shortcuts
function onKeyDown(event: KeyboardEvent) {
  // Tab indentation
  if (event.key === 'Tab') {
    event.preventDefault()
    const textarea = textareaRef.value?.$el?.querySelector('textarea')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    // Insert tab character
    const tabChar = '  ' // 2 spaces instead of tab
    localContent.value = 
      localContent.value.substring(0, start) + 
      tabChar + 
      localContent.value.substring(end)

    // Restore cursor position
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + tabChar.length
    })
  }
}

// Focus the editor
function focus() {
  nextTick(() => {
    const textarea = textareaRef.value?.$el?.querySelector('textarea')
    textarea?.focus()
  })
}

// Expose methods
defineExpose({
  focus
})
</script>

<style scoped>
.text-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-textarea {
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.editor-textarea.mobile {
  font-size: 16px; /* Prevent zoom on iOS */
}

:deep(.v-field__input) {
  padding: 16px !important;
  min-height: calc(100vh - 200px) !important;
  color: #000000 !important; /* Ensure text is visible */
}

:deep(.v-field__field) {
  height: 100% !important;
  background-color: #ffffff !important; /* White background */
}

:deep(textarea) {
  resize: none !important;
  height: 100% !important;
  color: #000000 !important; /* Dark text */
  background-color: #ffffff !important; /* White background */
}
</style>