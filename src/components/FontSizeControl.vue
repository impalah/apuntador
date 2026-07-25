<template>
  <div class="font-size-control">
    <v-btn
      icon="mdi-minus"
      size="small"
      variant="outlined"
      color="primary"
      @click="decreaseSize"
    />

    <div class="size-display">
      <span class="size-value">{{ size }}</span>
      <span class="size-unit">px</span>
    </div>

    <v-btn
      icon="mdi-plus"
      size="small"
      variant="outlined"
      color="primary"
      @click="increaseSize"
    />
  </div>
</template>

<script setup lang="ts">
// Props
interface Props {
  size: number
  min?: number
  max?: number
  step?: number
}

const props = withDefaults(defineProps<Props>(), {
  min: 12,
  max: 300,
  step: 2,
})

// Emits
const emit = defineEmits<{
  change: [delta: number]
}>()

// Actions
function increaseSize() {
  if (props.size < props.max) {
    emit('change', props.step)
  }
}

function decreaseSize() {
  if (props.size > props.min) {
    emit('change', -props.step)
  }
}
</script>

<style scoped>
.font-size-control {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  /* FIXED WIDTH - cannot be overridden */
  width: 140px !important;
  min-width: 140px !important;
  max-width: 140px !important;
  flex-shrink: 0 !important; /* Never allow shrinking */
  flex-grow: 0 !important; /* Never allow growing */
  /* Force visibility */
  position: relative !important;
  z-index: 9999 !important;
  overflow: visible !important;
  height: 48px !important;
  min-height: 48px !important;
}

.size-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40px; /* Fixed width for display area */
  font-size: 10px;
  line-height: 1;
}

.size-value {
  font-weight: 600;
  font-size: 12px;
}

.size-unit {
  font-size: 8px;
  opacity: 0.8;
}

/* Ensure buttons are visible and have fixed size */
:deep(.v-btn) {
  width: 36px !important;
  min-width: 36px !important;
  max-width: 36px !important;
  height: 36px !important;
  min-height: 36px !important;
  max-height: 36px !important;
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
  opacity: 1 !important;
  z-index: 10000 !important;
  position: relative !important;
  pointer-events: auto !important;
  visibility: visible !important;
  overflow: visible !important;
}

/* Tablet optimizations */
@media (min-width: 600px) and (max-width: 1263px) {
  .font-size-control {
    gap: 6px;
    padding: 3px 6px;
  }

  .size-display {
    min-width: 24px;
    font-size: 10px;
  }

  .size-value {
    font-size: 12px;
  }

  .size-unit {
    font-size: 8px;
  }
}
</style>
