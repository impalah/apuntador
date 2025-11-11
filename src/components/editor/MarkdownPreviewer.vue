<template>
  <div 
    class="markdown-previewer" 
    :style="previewPanelStyle"
  >
    <div 
      class="preview-content" 
      :style="previewStyle" 
      v-html="compiledHtml" 
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { compileMarkdown } from '@/utils/markdown'

// Props
interface Props {
  content: string
  displayPrefs: {
    textAlignment: string
    bgColor: string
    fgColor: string
  }
}

const props = defineProps<Props>()

// Computed
const compiledHtml = computed(() => {
  if (!props.content.trim()) {
    return '<p style="color: #666; font-style: italic;">Escribe algo para ver la vista previa...</p>'
  }
  return compileMarkdown(props.content)
})

const previewPanelStyle = computed(() => ({
  backgroundColor: props.displayPrefs.bgColor,
  color: props.displayPrefs.fgColor,
}))

const previewStyle = computed(() => ({
  textAlign: props.displayPrefs.textAlignment as any,
  fontFamily: 'inherit',
  lineHeight: '1.6',
}))
</script>

<style scoped>
.markdown-previewer {
  height: 100%;
  overflow-y: auto;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.preview-content {
  width: 100%;
  min-height: 100%;
  padding: 16px;
}

/* Preview markdown styling */
:deep(.preview-content) {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  word-wrap: break-word;
}

/* Remove top margin from first element */
:deep(.preview-content > *:first-child) {
  margin-top: 0;
}

/* Remove bottom margin from last element */
:deep(.preview-content > *:last-child) {
  margin-bottom: 0;
}

:deep(.preview-content h1) {
  font-size: 2em;
  font-weight: 600;
  margin: 0.67em 0;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

:deep(.preview-content h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 0.83em 0;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

:deep(.preview-content h3) {
  font-size: 1.17em;
  font-weight: 600;
  margin: 1em 0;
}

:deep(.preview-content h4) {
  font-size: 1em;
  font-weight: 600;
  margin: 1.33em 0;
}

:deep(.preview-content h5) {
  font-size: 0.83em;
  font-weight: 600;
  margin: 1.67em 0;
}

:deep(.preview-content h6) {
  font-size: 0.67em;
  font-weight: 600;
  margin: 2.33em 0;
}

:deep(.preview-content p) {
  margin: 1em 0;
}

:deep(.preview-content blockquote) {
  margin: 0 0 16px 0;
  padding: 0 16px;
  border-left: 4px solid #dfe2e5;
  color: #6a737d;
}

:deep(.preview-content ul),
:deep(.preview-content ol) {
  margin: 1em 0;
  padding-left: 2em;
}

:deep(.preview-content li) {
  margin: 0.25em 0;
}

:deep(.preview-content code) {
  background: rgba(175, 184, 193, 0.2);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85em;
}

:deep(.preview-content pre) {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow: auto;
  margin: 1em 0;
}

:deep(.preview-content pre code) {
  background: none;
  padding: 0;
}

:deep(.preview-content a) {
  color: #0366d6;
  text-decoration: none;
}

:deep(.preview-content a:hover) {
  text-decoration: underline;
}

:deep(.preview-content mark) {
  background-color: #fff3cd;
  padding: 2px 4px;
}

:deep(.preview-content sup) {
  font-size: 0.75em;
  vertical-align: super;
}

:deep(.preview-content sub) {
  font-size: 0.75em;
  vertical-align: sub;
}

:deep(.preview-content table) {
  border-collapse: collapse;
  margin: 1em 0;
  width: 100%;
}

:deep(.preview-content th),
:deep(.preview-content td) {
  border: 1px solid #dfe2e5;
  padding: 6px 13px;
}

:deep(.preview-content th) {
  font-weight: 600;
  background-color: #f6f8fa;
}
</style>