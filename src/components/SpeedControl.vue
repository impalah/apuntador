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
  padding: 4px 6px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  width: 140px;
  min-width: 140px;
  max-width: 140px;
  flex-shrink: 0;
  flex-grow: 0;
  height: 44px;
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
  width: 32px !important;
  min-width: 32px !important;
  max-width: 32px !important;
  height: 32px !important;
  min-height: 32px !important;
  max-height: 32px !important;
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
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
