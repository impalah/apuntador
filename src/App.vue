<template>
  <div class="general">
    <div> <!-- Header -->
      <Navbar />
    </div>
    <Prompter />
  </div>
</template>

<script setup lang="ts">
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue';

import Prompter from './components/Prompter.vue'
</script>

<style lang="scss">
$font-family: Arial, sans-serif;

html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: $font-family;
}
</style>
