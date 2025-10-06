<template>
  <v-btn-toggle
    :model-value="prefsStore.textAlignment"
    @update:model-value="updateAlignment"
    mandatory
    density="comfortable"
    :class="['text-alignment-controls', { 'menu-layout': props.isMenuLayout }]"
    data-testid="text-alignment-controls"
  >
    <v-btn
      value="left"
      :aria-label="t('toolbar.alignLeft')"
      data-testid="align-left-button"
      size="small"
      :class="props.isMenuLayout ? 'flex-btn' : ''"
      :icon="!props.isMenuLayout"
      :prepend-icon="props.isMenuLayout ? 'mdi-format-align-left' : undefined"
    >
      <v-icon v-if="!props.isMenuLayout">mdi-format-align-left</v-icon>
      <span v-if="props.isMenuLayout">{{ t('common.left') }}</span>
    </v-btn>

    <v-btn
      value="center"
      :aria-label="t('toolbar.alignCenter')"
      data-testid="align-center-button"
      size="small"
      :class="props.isMenuLayout ? 'flex-btn' : ''"
      :icon="!props.isMenuLayout"
      :prepend-icon="props.isMenuLayout ? 'mdi-format-align-center' : undefined"
    >
      <v-icon v-if="!props.isMenuLayout">mdi-format-align-center</v-icon>
      <span v-if="props.isMenuLayout">{{ t('common.center') }}</span>
    </v-btn>

    <v-btn
      value="right"
      :aria-label="t('toolbar.alignRight')"
      data-testid="align-right-button"
      size="small"
      :class="props.isMenuLayout ? 'flex-btn' : ''"
      :icon="!props.isMenuLayout"
      :prepend-icon="props.isMenuLayout ? 'mdi-format-align-right' : undefined"
    >
      <v-icon v-if="!props.isMenuLayout">mdi-format-align-right</v-icon>
      <span v-if="props.isMenuLayout">{{ t('common.right') }}</span>
    </v-btn>
  </v-btn-toggle>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePrefsStore } from '@/stores/usePrefsStore'
import type { TextAlignment } from '@/utils/constants'

interface Props {
  isMenuLayout?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isMenuLayout: false,
})

const { t } = useI18n()
const prefsStore = usePrefsStore()

function updateAlignment(alignment: TextAlignment) {
  if (alignment) {
    prefsStore.setTextAlignment(alignment)
  }
}
</script>

<style scoped>
.text-alignment-controls {
  border-radius: 4px;
  flex-shrink: 0;
  /* Ensure proper spacing in different layouts */
  margin: 0 1px;
  /* Prevent overflow */
  max-width: 132px; /* 3 buttons × 40px + borders */
}

.text-alignment-controls .v-btn {
  min-width: 36px !important;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
}

/* For expanded menu layout */
.text-alignment-controls.menu-layout {
  width: 100%;
  margin: 0;
  max-width: none;
}

.text-alignment-controls.menu-layout .v-btn {
  flex: 1;
  min-width: 0 !important;
  width: auto;
  height: 40px;
}
</style>
