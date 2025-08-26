<template>
  <div class="speed-control">
    <v-btn
      icon="mdi-chevron-down"
      size="small"
      variant="outlined"
      color="primary"
      @click="decreaseSpeed"
    />

    <div class="speed-display">
      <span class="speed-value">{{ speed }}</span>
      <span class="speed-unit">px/s</span>
    </div>

    <v-btn
      icon="mdi-chevron-up"
      size="small"
      variant="outlined"
      color="primary"
      @click="increaseSpeed"
    />
  </div>
</template>

<script setup lang="ts">
// Props
interface Props {
  speed: number
  min: number
  max: number
  step?: number
}

const props = withDefaults(defineProps<Props>(), {
  step: 5,
})

// Emits
const emit = defineEmits<{
  change: [delta: number]
}>()

// Actions
function increaseSpeed() {
  if (props.speed < props.max) {
    emit('change', props.step)
  }
}

function decreaseSpeed() {
  if (props.speed > props.min) {
    emit('change', -props.step)
  }
}
</script>

<style scoped>
.speed-control {
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

.speed-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40px; /* Fixed width for display area */
  font-size: 10px;
  line-height: 1;
}

.speed-value {
  font-weight: 600;
  font-size: 12px;
}

.speed-unit {
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
  .speed-control {
    gap: 6px;
    padding: 3px 6px;
  }

  .speed-display {
    min-width: 28px;
    font-size: 10px;
  }

  .speed-value {
    font-size: 12px;
  }

  .speed-unit {
    font-size: 8px;
  }
}
</style>
