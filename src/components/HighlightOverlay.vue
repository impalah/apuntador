<template>
    <div
      class="highlight-overlay"
      :style="{
        top: `${highlightPosition}%`,
        backgroundColor: highlightBackgroundColor
      }"
    >
      <font-awesome-icon
        icon="caret-right"
        class="left-arrow"
        :style="{
          color: highlightArrowColor,
          fontSize: highlightArrowSize
        }"
      />
      <font-awesome-icon
        icon="caret-left"
        class="right-arrow"
        :style="{
          color: highlightArrowColor,
          fontSize: highlightArrowSize
        }"
      />
    </div>
  </template>
  
<script setup lang="ts">


const props = defineProps({
    highlightPosition: {
        type: Number,
        required: true
    },
    highlightBackgroundColor: {
        type: String,
        required: true
    },
    highlightArrowColor: {
        type: String,
        required: true
    },
    highlightArrowSize: {
        type: String,
        required: true
    }
})



</script>
  
  <style scoped>
  .highlight-overlay {
    position: absolute;
    left: 0;
    width: 100%;
    height: calc(3 * 1em); /* Altura de tres líneas de texto */
    transform: translateY(-50%); /* Centrar verticalmente */
    pointer-events: none; /* Permitir clics a través de la overlay */
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px; /* Pequeña separación de los bordes verticales */
  }
  
  .left-arrow {
    margin-right: 0;
  }
  
  .right-arrow {
    margin-left: 0;
  }
  </style>