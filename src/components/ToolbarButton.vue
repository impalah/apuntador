<template>
    <div class="control">
        <button
        :class="buttonClass"
        @click="handleClick"
        :title="title"
        tabindex="-1"
        >
            <font-awesome-icon :icon="icon" :class="iconClass" />
        </button>
    </div>
</template>
  
<script setup lang="ts">

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
    buttonClass: {
        type: String,
        default: 'standard-btn'
    },
    iconClass: {
        type: String,
        default: 'icon-color'
    },
    icon: {
        type: [String, Array],
        required: true
    },
    title: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['click'])

const handleClick = (event: Event) => {
emit('click', event)
}

// Destructuring props
const { buttonClass, iconClass, icon, title } = props
</script>
  
<style lang="scss" scoped>
$control-margin: 10px;
$control-margin-bottom: 10px;
$control-margin-top: 10px;

.control {
display: flex;
align-items: center;
margin-left: $control-margin;
margin-right: $control-margin;
margin-bottom: $control-margin-bottom;
margin-top: $control-margin-top;
}
</style>
