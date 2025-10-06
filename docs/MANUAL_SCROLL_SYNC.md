# Manual Scroll Synchronization

## Descripción

Implementa la sincronización bidireccional entre el scroll manual del usuario (rueda del ratón, toque, barras de desplazamiento) y el estado interno del store del teleprompter.

## Problema Resuelto

Anteriormente, cuando el usuario hacía scroll manual, al pulsar "play" o usar comandos de navegación, el texto volvía a la posición anterior del store, ignorando el scroll manual. Ahora el sistema reconoce y mantiene la nueva posición.

## Implementación

### 1. Store - useTeleprompterStore.ts

```typescript
/**
 * Update scroll offset from manual scroll (e.g., mouse wheel, touch)
 * This is called when the user manually scrolls the content
 */
function syncScrollFromDOM(domScrollTop: number) {
  // Only sync if we're not currently playing (to avoid conflicts with auto-scroll)
  if (!isPlaying.value) {
    const clampedOffset = clampScrollOffset(
      domScrollTop,
      contentHeightPx.value,
      viewportHeightPx.value
    )
    
    // Update our internal state
    scrollOffset.value = clampedOffset
    
    // Save the new position
    saveScrollPosition()
  }
}
```

### 2. Componente - TeleprompterFrameV2.vue

- **Listener de scroll**: Se agrega en `onMounted` un listener pasivo al contenedor de scroll
- **Debounce**: Los eventos de scroll se procesan con un debounce de 50ms para optimizar rendimiento
- **Prevención de loops**: Se usa una bandera `isScrollingSynchronizing` para evitar loops infinitos
- **Cleanup**: Se limpia el listener en `onUnmounted`

```vue
function onManualScroll(event: Event) {
  if (isScrollingSynchronizing) return
  
  const scrollTop = target.scrollTop
  
  // Debounce scroll events
  if (scrollTimeout) clearTimeout(scrollTimeout)
  
  scrollTimeout = window.setTimeout(() => {
    emit('manual-scroll', scrollTop)
  }, SCROLL_DEBOUNCE_MS)
}
```

### 3. Tipos - component-interfaces.d.ts

```typescript
export interface TeleprompterEvents {
  // ... otros eventos
  'manual-scroll': [scrollTop: number]
}
```

### 4. Adaptadores - storeToComponent.ts

```typescript
onManualScroll: (scrollTop: number) => {
  // Sync manual scroll position with store
  teleprompterStore.syncScrollFromDOM(scrollTop)
}
```

## Comportamiento

### Cuando NO está reproduciendo (isPlaying = false)
- ✅ El scroll manual se sincroniza inmediatamente con el store
- ✅ La posición se guarda en localStorage
- ✅ Los comandos de navegación continúan desde la nueva posición

### Cuando SÍ está reproduciendo (isPlaying = true)  
- ❌ El scroll manual se ignora para evitar conflictos con el auto-scroll
- ✅ El auto-scroll continúa normalmente

### Flujo típico de usuario
1. Usuario pausa el teleprompter
2. Usuario hace scroll manual (rueda, toque, etc.)
3. Sistema detecta el scroll y actualiza el store
4. Usuario pulsa "play"
5. ✅ La reproducción continúa desde la nueva posición manual

## Características Técnicas

- **Performance**: Eventos pasivos y debounce de 50ms
- **Prevención de loops**: Bandera de sincronización para evitar loops infinitos
- **Límites**: La posición se clampea automáticamente a los límites válidos del contenido
- **Persistencia**: Las posiciones manuales se guardan en localStorage
- **Compatibilidad**: Funciona con mouse wheel, touch, barras de scroll, etc.

## Tests

Se incluyen 12 tests unitarios que cubren:

- ✅ Sincronización básica cuando no está reproduciendo
- ✅ Bloqueo de sincronización cuando está reproduciendo  
- ✅ Clampeo de posiciones fuera de límites
- ✅ Actualización de progreso y estado canScrollUp/canScrollDown
- ✅ Integración con play/pause
- ✅ Persistencia de posición
- ✅ Casos edge (contenido vacío, contenido = viewport, etc.)

## Cobertura

- **useTeleprompterStore.ts**: 76.57% (mejorado desde 74.16%)
- **Tests totales**: 357 (12 nuevos tests)
- **Cobertura general**: 85.4%