<template>
    <div :class="['sidebar', { 'sidebar-visible': isSidebarVisible }]">
      <div class="sidebar-content">
        <div class="accordion">
          <!-- File management -->
          <div class="accordion-item">
            <h3 @click="toggleAccordion('fileManagement')">File Management</h3>
            <div v-if="activeAccordion === 'fileManagement'" class="accordion-content">
              <div class="control-group">
                <div class="control">
                  <button
                    id="openFile"
                    class="align-btn"
                    @click="invoker.addCommand(new OpenLocalFileCommand(store)); invoker.executeCommands();"
                    title="Open Local File"
                    tabindex="-1"
                  >
                    <font-awesome-icon icon="file-arrow-down" class="icon-color" />
                  </button>
                  <button
                    id="openCloudFile"
                    class="align-btn"
                    @click="invoker.addCommand(new OpenCloudFileCommand(store)); invoker.executeCommands();"
                    title="Open Cloud File"
                    tabindex="-1"
                  >
                    <font-awesome-icon icon="cloud-arrow-down" class="icon-color" />
                  </button>
                  <button
                    id="saveFile"
                    class="align-btn"
                    @click="invoker.addCommand(new SaveLocalFileCommand(store)); invoker.executeCommands();"
                    title="Save File"
                    tabindex="-1"
                  >
                    <font-awesome-icon icon="file-arrow-up" class="icon-color" />
                  </button>
                </div>
              </div>
            </div>
          </div>
  
          <!-- Settings -->
          <div class="accordion-item">
            <h3 @click="toggleAccordion('settings')">Settings</h3>
            <div v-if="activeAccordion === 'settings'" class="accordion-content">
              <!-- Text Configuration -->
              <h3>Text Configuration</h3>
              <div class="control-group">
                <div class="control">
                  <font-awesome-icon icon="palette" class="icon-label icon-color" title="Text color" />
                  <input
                    type="color"
                    id="textColor"
                    v-model="textColor"
                    @change="invoker.addCommand(new UpdateTextColorCommand(store, textColor)); invoker.executeCommands();"
                    tabindex="-1"
                  >
                </div>
                <div class="control">
                  <font-awesome-icon icon="text-height" class="icon-label icon-color" title="Text size" />
                  <select
                    id="fontSize"
                    v-model="fontSize"
                    @change="invoker.addCommand(new UpdateFontSizeCommand(store, fontSize)); invoker.executeCommands();"
                    tabindex="-1">
                    <option v-for="size in fontSizes" :key="size" :value="size">{{ size }} px</option>
                  </select>
                </div>
              </div>
  
              <hr class="separator">
  
              <!-- Alignment and Margin -->
              <h3>Alignment and Margin</h3>
              <div class="control-group">
                <div class="control">
                  <button
                    id="alignLeftButton"
                    class="align-btn"
                    @click="invoker.addCommand(new SetTextAlignCommand(store, 'left')); invoker.executeCommands();"
                    title="Align Left"
                    tabindex="-1"
                  >
                    <font-awesome-icon icon="align-left" class="icon-color" />
                  </button>
                  <button
                    id="alignCenterButton"
                    class="align-btn"
                    @click="invoker.addCommand(new SetTextAlignCommand(store, 'center')); invoker.executeCommands();"
                    title="Align Center"
                    tabindex="-1"
                  >
                    <font-awesome-icon icon="align-center" class="icon-color" />
                  </button>
                  <button
                    id="alignRightButton"
                    class="align-btn"
                    @click="invoker.addCommand(new SetTextAlignCommand(store, 'right')); invoker.executeCommands();"
                    title="Align Right"
                    tabindex="-1"
                  >
                    <font-awesome-icon icon="align-right" class="icon-color" />
                  </button>
                </div>
                <div class="control">
                  <font-awesome-icon
                    icon="arrows-alt-h"
                    class="icon-label icon-color"
                    title="Margin"
                  />
                  <input
                    type="range"
                    id="margin"
                    :min="defaults.margin.min"
                    :max="defaults.margin.max"
                    v-model="lateralMargin"
                    @input="invoker.addCommand(new UpdateLateralMarginCommand(store, lateralMargin)); invoker.executeCommands();"
                    tabindex="-1"
                  />      
                </div>
              </div>
  
              <hr class="separator">
  
              <!-- Highlight -->
              <h3>Highlight</h3>
              <div class="control-group">
                <div class="control">
                  <font-awesome-icon
                    icon="highlighter"
                    class="icon-label icon-color"
                    title="Highlight position"
                  />
                  <input
                    type="range"
                    id="highlightPosition"
                    :min="defaults.highlightPosition.min"
                    :max="defaults.highlightPosition.max"
                    v-model="highlightPosition"
                    @input="invoker.addCommand(new UpdateHighlightPositionCommand(store, highlightPosition)); invoker.executeCommands();"
                    tabindex="-1"
                  />
                </div>
              </div>
  
              <hr class="separator">
  
              <!-- View Mode -->
              <h3>View Mode</h3>
              <div class="control-group">
                <div class="control">
                  <button
                    id="mirrorButton"
                    class="mirror-btn"
                    @click="invoker.addCommand(new ToggleMirrorCommand(store)); invoker.executeCommands();"
                    title="Toggle Mirror Mode"
                    tabindex="-1"
                  >
                    <font-awesome-icon :icon="isMirrored ? 'redo' : 'sync'" class="icon-color" />
                  </button>
                  <button
                    id="reverseButton"
                    class="reverse-btn"
                    @click="invoker.addCommand(new ToggleReverseCommand(store)); invoker.executeCommands();"
                    title="Toggle Reverse Mode"
                    tabindex="-1"
                  >
                    <font-awesome-icon :icon="isReversed ? 'angles-up' : 'angles-down'" class="icon-color" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';

  import { defineProps, watch } from 'vue'
  import logger from '@/core/logger'


  import { useSettingsStore } from '@/stores/settings';
  import { useDefaultsStore } from '@/stores/defaults';
  import { CommandInvoker } from '@/commands/CommandInvoker';
  import { OpenLocalFileCommand } from '@/commands/OpenLocalFileCommand';
  import { SaveLocalFileCommand } from '@/commands/SaveLocalFileCommand';
  import { OpenCloudFileCommand } from '@/commands/OpenCloudFileCommand';
  import { UpdateFontSizeCommand } from '@/commands/UpdateFontSizeCommand';
  import { UpdateTextColorCommand } from '@/commands/UpdateTextColorCommand';
  import { SetTextAlignCommand } from '@/commands/SetTextAlignCommand';
  import { UpdateLateralMarginCommand } from '@/commands/UpdateLateralMarginCommand';
  import { UpdateHighlightPositionCommand } from '@/commands/UpdateHighlightPositionCommand';
  import { ToggleMirrorCommand } from '@/commands/ToggleMirrorCommand';
  import { ToggleReverseCommand } from '@/commands/ToggleReverseCommand';
  
  const store = useSettingsStore();
  const defaults = useDefaultsStore();
  const invoker = new CommandInvoker();
  
  const activeAccordion = ref<string | null>(null);
  const fontSize = ref(store.fontSize);
  const textColor = ref(store.textColor);
  const lateralMargin = ref(store.lateralMargin);
  const highlightPosition = ref(store.highlightPosition);
  const isMirrored = ref(store.isMirrored);
  const isReversed = ref(store.isReversed);
//   const isSidebarVisible = ref(false);
  
  const fontSizes = defaults.fontSize.values;
  
  const toggleAccordion = (section: string) => {
    activeAccordion.value = activeAccordion.value === section ? null : section;
  };

  const props = defineProps({
    isSidebarVisible: Boolean
  })

  
  // Watch for changes in isSidebarVisible and log to console
  watch(() => props.isSidebarVisible, (newValue) => {
    logger.debug('Sidebar.isSidebarVisible:', newValue)
  })



 </script>
  
<style lang="scss" scoped>

$navbar-height: 45px;
$navbar-bg-color: #191818;
$navbar-padding: 15px;
$button-gap: 1px;
$label-margin-right: 3px;
$input-padding: 5px;
$input-font-size: 14px;
$button-font-size: 24px; /* Aumenta el tamaño de la fuente de los botones */
$button-padding: 10px; /* Añade padding a los botones para hacerlos más grandes */
$icon-color: #ffffff; /* Cambia este valor al color deseado */
$border-color: #ffffff; /* Color del borde */
$control-margin: 10px;
$icon-hover-color: hsla(160, 100%, 37%, 0.2);
$icon-padding: 5px;
$active-button-color: hsla(160, 100%, 37%, 0.2);
$active-button-text-color: white;
$control-margin-bottom: 10px;
$control-margin-top: 10px;

.icon-color {
  color: $icon-color;
  padding: $button-padding;
}

@media (hover: hover) {
  .icon-color:hover {
    background-color: $icon-hover-color
    // background-color: $navbar-bg-color;
  }
}

.control {
  display: flex;
  align-items: center;
  margin-left: $control-margin;
  margin-right: $control-margin;
  margin-bottom: $control-margin-bottom;
  margin-top: $control-margin-top;

}

.link-with-margin {
  margin-right: $control-margin;
}

.align-group,
.mirror-reverse-group,
.play-stop-group,
.scroll-group {
  display: flex;
  gap: $button-gap; /* Ajusta el espacio entre los botones */
}

label {
  margin-right: $label-margin-right;
}

select,
input[type='range'],
input[type='color'] {
  padding: $input-padding;
  font-size: $input-font-size;
}

.icon-label {
  background: none;
  border: none;
  font-size: $button-font-size;
  padding: $button-padding;
}

.edit-btn,
.play-btn,
.stop-btn,
.mirror-btn,
.reverse-btn,
.scroll-btn,
.align-btn,
.fullscreen-btn,
.sidebar-toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: $button-font-size;
  padding: $button-padding;
}

.advanced-options {
  position: absolute;
  top: $navbar-height;
  width: 90%; /* Hace que el div de opciones avanzadas sea más estrecho que el navbar */
  background-color: $navbar-bg-color;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  padding: 10px;
  z-index: 1001; /* Asegura que las opciones avanzadas estén por encima del navbar */
  border: 2px solid $border-color; /* Añade un borde al div de opciones avanzadas */
  left: 50%;
  transform: translateX(-50%); /* Centra horizontalmente el div */
}

.edit-mode-label {
  color: $icon-color;
  font-size: $input-font-size;
  margin-left: 10px;
  font-weight: bold;
}

.advanced-mode-label {
  color: $icon-color;
  font-size: $input-font-size;
  margin-left: 10px;
  font-weight: bold;
}

.active-btn {
  background-color: $active-button-color;
  color: $active-button-text-color;
}







  .sidebar {
    position: fixed;
    top: 45px; /* Adjust this value to match your navbar height */
    left: -250px; /* Oculta la sidebar fuera de la vista */
    width: 250px;
    height: 100%;
    background-color: #191818;
    overflow-x: hidden;
    transition: 0.3s;
    z-index: 1002; /* Asegura que la sidebar esté por encima del navbar */
  }
  
  .sidebar-visible {
    left: 0; /* Muestra la sidebar */
  }
  
  .sidebar-content {
    padding: 15px;
    color: #ffffff;
  }
  
  .control-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px; /* Espacio entre grupos */
  }
  
  h3 {
    text-align: left;
    width: 100%;
    padding-left: 15px; /* Alinea el título a la izquierda */
    color: #ffffff;
  }
  
  .separator {
    border: 0;
    height: 1px;
    background: #ffffff;
    margin: 20px 0; /* Espacio alrededor del separador */
  }
  
  .accordion {
    .accordion-item {
      margin-bottom: 10px;
  
      h3 {
        cursor: pointer;
        padding: 10px;
        background-color: #191818;
        color: #ffffff;
        border: 1px solid #ffffff;
        border-radius: 5px;
        margin: 0;
      }
  
      .accordion-content {
        padding: 10px;
        border: 1px solid #ffffff;
        border-top: none;
        background-color: darken(#191818, 5%);
      }
  
      button {
        display: block;
        width: 100%;
        padding: 10px;
        margin: 5px 0;
        background-color: transparent; // Fondo transparente
        color: #ffffff;
        border: none; // Sin borde
        cursor: pointer;
        text-align: left; // Alinear texto a la izquierda
      }
    }
  }
  </style>
