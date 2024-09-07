<template>

    <div class="control">
        <font-awesome-icon
            :icon="icon"
            class="icon-label icon-color"
            :title="title"
        />
        <slot></slot>
    </div>

</template>
  
<script setup lang="ts">

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
    icon: {
        type: [String, Array],
        required: true
    },
    title: {
        type: String,
        default: ''
    }
})


// Destructuring props
const { icon, title } = props
</script>
  
<style lang="scss" scoped>

$button-font-size: 24px; /* Aumenta el tamaño de la fuente de los botones */
$button-padding: 10px; /* Añade padding a los botones para hacerlos más grandes */

.icon-label {
  background: none;
  border: none;
  font-size: $button-font-size;
  padding: $button-padding;
}

</style>
