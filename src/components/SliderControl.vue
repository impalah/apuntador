<template>
  <v-slider
    :model-value="modelValue"
    :label="label"
    :min="min"
    :max="max"
    :step="step"
    :thumb-label="thumbLabel"
    :suffix="suffix"
    @update:model-value="$emit('update:modelValue', $event)"
    @end="$emit('change')"
  >
    <template
      v-if="showInput"
      #append
    >
      <v-text-field
        :model-value="modelValue"
        type="number"
        style="width: 80px"
        density="compact"
        :suffix="inputSuffix || suffix"
        @update:model-value="$emit('update:modelValue', Number($event))"
        @change="$emit('change')"
      />
    </template>
  </v-slider>
</template>

<script setup lang="ts">
/**
 * SliderControl - Componente reutilizable para sliders de configuración
 * Proporciona un slider con etiqueta, rango configurable y campo de entrada opcional
 */

interface Props {
  modelValue: number
  label: string
  min?: number
  max?: number
  step?: number
  thumbLabel?: boolean | 'always'
  suffix?: string
  showInput?: boolean
  inputSuffix?: string
}

withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  thumbLabel: 'always',
  suffix: '',
  showInput: false,
  inputSuffix: ''
})

defineEmits<{
  'update:modelValue': [value: number]
  'change': []
}>()
</script>
