<template>
  <v-bottom-sheet
    :model-value="modelValue"
    :persistent="false"
    :scrim="true"
    :z-index="10000"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card
      class="actions-menu"
      rounded="t-xl"
    >
      <!-- Handle bar para indicar que es arrastrable -->
      <div class="handle-bar">
        <div class="handle" />
      </div>

      <v-card-text class="menu-content">
        <!-- Navegación Section -->
        <div class="menu-section">
          <h3 class="section-title">{{ t('common.navigation') }}</h3>
          
          <!-- Primera fila: Retroceder 5, Home, Avanzar 5 -->
          <div class="button-grid">
            <button class="action-btn-frequent" @click="handleAction('stepLines', -5)">
              <v-icon icon="mdi-skip-backward" size="32" />
              <span class="btn-text">{{ t('toolbar.rewind') }} 5</span>
            </button>
            <button class="action-btn-frequent" @click="handleAction('goHome')">
              <v-icon icon="mdi-home" size="32" />
              <span class="btn-text">{{ t('toolbar.home') }}</span>
            </button>
            <button class="action-btn-frequent" @click="handleAction('stepLines', 5)">
              <v-icon icon="mdi-skip-forward" size="32" />
              <span class="btn-text">{{ t('toolbar.forward') }} 5</span>
            </button>
          </div>

          <!-- Segunda fila: Retroceder 1, Fin, Avanzar 1 -->
          <div class="button-grid">
            <button class="action-btn-frequent" @click="handleAction('stepLines', -1)">
              <v-icon icon="mdi-chevron-up" size="32" />
              <span class="btn-text">{{ t('toolbar.rewindLine') }}</span>
            </button>
            <button class="action-btn-frequent" @click="handleAction('goEnd')">
              <v-icon icon="mdi-format-vertical-align-bottom" size="32" />
              <span class="btn-text">{{ t('toolbar.end') }}</span>
            </button>
            <button class="action-btn-frequent" @click="handleAction('stepLines', 1)">
              <v-icon icon="mdi-chevron-down" size="32" />
              <span class="btn-text">{{ t('toolbar.forwardLine') }}</span>
            </button>
          </div>
        </div>

        <v-divider class="section-divider" />

        <!-- Apariencia Section -->
        <div class="menu-section">
          <h3 class="section-title">{{ t('settings.appearance') }}</h3>
          
          <!-- Primera fila: Espejo H, Modo Teatro, Espejo V -->
          <div class="button-grid">
            <button 
              class="action-btn-frequent" 
              :class="{ active: mirrorH }"
              @click="handleAction('mirrorToggle', 'horizontal')"
            >
              <v-icon icon="mdi-flip-horizontal" size="32" />
              <span class="btn-text">{{ t('toolbar.mirrorH') }}</span>
            </button>
            <button 
              class="action-btn-frequent"
              :class="{ active: isTheaterMode }"
              @click="handleAction('toggleTheater')"
            >
              <v-icon :icon="isTheaterMode ? 'mdi-fullscreen-exit' : 'mdi-television'" size="32" />
              <span class="btn-text">{{ isTheaterMode ? t('toolbar.exitTheater') : t('toolbar.theaterMode') }}</span>
            </button>
            <button 
              class="action-btn-frequent"
              :class="{ active: mirrorV }"
              @click="handleAction('mirrorToggle', 'vertical')"
            >
              <v-icon icon="mdi-flip-vertical" size="32" />
              <span class="btn-text">{{ t('toolbar.mirrorV') }}</span>
            </button>
          </div>

          <!-- Segunda fila: Alinear izquierda, centro, derecha -->
          <div class="button-grid">
            <button class="action-btn-frequent" @click="handleTextAlign('left')">
              <v-icon icon="mdi-format-align-left" size="32" />
              <span class="btn-text">{{ t('toolbar.alignLeft') }}</span>
            </button>
            <button class="action-btn-frequent" @click="handleTextAlign('center')">
              <v-icon icon="mdi-format-align-center" size="32" />
              <span class="btn-text">{{ t('toolbar.alignCenter') }}</span>
            </button>
            <button class="action-btn-frequent" @click="handleTextAlign('right')">
              <v-icon icon="mdi-format-align-right" size="32" />
              <span class="btn-text">{{ t('toolbar.alignRight') }}</span>
            </button>
          </div>
        </div>

        <v-divider class="section-divider" />

        <!-- Opciones Section -->
        <div class="menu-section">
          <h3 class="section-title">{{ t('settings.options') }}</h3>
          
          <!-- Botones opciones (grid 3 columnas con espacio en medio) -->
          <div class="options-grid">
            <button class="action-btn-frequent" @click="handleAction('openEditor')">
              <v-icon icon="mdi-pencil" size="32" />
              <span class="btn-text">{{ t('toolbar.openEditor') }}</span>
            </button>
            
            <!-- Espacio vacío en el centro -->
            <div></div>
            
            <button class="action-btn-frequent" @click="handleAction('openSettings')">
              <v-icon icon="mdi-cog" size="32" />
              <span class="btn-text">{{ t('settings.title') }}</span>
            </button>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePrefsStore } from '@/stores/usePrefsStore'

const { t } = useI18n()
const prefsStore = usePrefsStore()

// Props
interface Props {
  modelValue: boolean
  fontSize: number
  mirrorH: boolean
  mirrorV: boolean
  isImmersive?: boolean
  isImmersiveSupported?: boolean
  isTheaterMode?: boolean
  isTheaterLoading?: boolean
  isDesktop?: boolean
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'stepLines': [lines: number]
  'goHome': []
  'goEnd': []
  'fontSizeChange': [size: number]
  'mirrorToggle': [axis: string]
  'toggleImmersive': []
  'toggleTheater': []
  'openFile': []
  'openEditor': []
  'openSettings': []
  'minimizeWindow': []
  'maximizeWindow': []
  'toggleFullscreen': []
}>()

// Handle action and optionally close menu
const handleAction = (action: string, ...args: any[]) => {
  // Emit the action
  switch (action) {
    case 'stepLines':
      emit('stepLines', args[0])
      break
    case 'goHome':
      emit('goHome')
      break
    case 'goEnd':
      emit('goEnd')
      break
    case 'mirrorToggle':
      emit('mirrorToggle', args[0])
      break
    case 'toggleImmersive':
      emit('toggleImmersive')
      break
    case 'toggleTheater':
      emit('toggleTheater')
      break
    case 'openFile':
      emit('openFile')
      break
    case 'openEditor':
      emit('openEditor')
      // Close menu only for openEditor
      emit('update:modelValue', false)
      break
    case 'openSettings':
      emit('openSettings')
      // Close menu only for openSettings
      emit('update:modelValue', false)
      break
    case 'minimizeWindow':
      emit('minimizeWindow')
      break
    case 'maximizeWindow':
      emit('maximizeWindow')
      break
    case 'toggleFullscreen':
      emit('toggleFullscreen')
      break
  }
  
  // Don't close menu by default (only openEditor and openSettings close it)
}

// Handle text alignment
const handleTextAlign = (alignment: 'left' | 'center' | 'right') => {
  prefsStore.textAlignment = alignment
  // Don't close menu for text alignment changes
}
</script>

<style scoped lang="scss">
.actions-menu {
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgba(255, 255, 255, 0.12);
  max-height: 33vh;
  overflow-y: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.handle-bar {
  display: flex;
  justify-content: center;
  padding: 12px 0 8px 0;
}

.handle {
  width: 40px;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.menu-content {
  padding: 16px 24px calc(80px + env(safe-area-inset-bottom)) 24px;
  max-width: 500px;
  margin: 0 auto;
}

.menu-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 1px;
  margin-bottom: 16px;
  text-align: center;
}

.section-divider {
  margin: 24px 0;
  opacity: 0.3;
}

/* Botones frecuentes (3 por fila, icono + texto) */
.button-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.action-btn-frequent {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 16px 8px;
  border-radius: 12px;
  transition: all 0.2s ease;
  min-height: 90px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  &:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.12);
  }
  
  &.active {
    background: rgba(var(--v-theme-primary), 0.2);
    
    &:hover {
      background: rgba(var(--v-theme-primary), 0.25);
    }
  }
  
  .btn-text {
    font-size: 12px;
    text-align: center;
    line-height: 1.2;
    max-width: 100%;
    word-wrap: break-word;
  }
}

/* Botones extra (lista, icono a la izquierda + texto) */
.action-btn-extra {
  display: flex;
  align-items: center;
  gap: 16px;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 16px 20px;
  border-radius: 12px;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  margin-bottom: 8px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
  
  &:active {
    transform: scale(0.98);
    background: rgba(255, 255, 255, 0.12);
  }
  
  .extra-icon {
    flex-shrink: 0;
  }
  
  .extra-text {
    font-size: 15px;
    font-weight: 500;
    flex: 1;
  }
}

/* Responsive: móviles pequeños */
@media (max-width: 360px) {
  .menu-content {
    padding: 12px 16px 24px 16px;
  }
  
  .button-grid {
    gap: 8px;
  }
  
  .action-btn-frequent {
    padding: 12px 6px;
    min-height: 80px;
    
    .btn-text {
      font-size: 11px;
    }
  }
  
  .action-btn-extra {
    padding: 14px 16px;
    
    .extra-text {
      font-size: 14px;
    }
  }
}

/* Tablets y desktop */
@media (min-width: 600px) {
  .menu-content {
    padding: 20px 32px 40px 32px;
    max-width: 600px;
  }
  
  .button-grid {
    gap: 16px;
  }
  
  .action-btn-frequent {
    padding: 20px 12px;
    min-height: 100px;
    
    .btn-text {
      font-size: 13px;
    }
  }
  
  .action-btn-extra {
    padding: 18px 24px;
    
    .extra-text {
      font-size: 16px;
    }
  }
}

/* Custom scrollbar */
.actions-menu::-webkit-scrollbar {
  width: 6px;
}

.actions-menu::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.actions-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.actions-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
