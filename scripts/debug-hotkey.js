// Debug script to check hotkey persistence manually
;(async () => {
  // Wait for page to load
  await new Promise((resolve) => setTimeout(resolve, 1000))

  console.log('=== HOTKEY DEBUG ===')

  // Check if preferences are loaded in localStorage
  const prefs = localStorage.getItem('preferences')
  console.log('Stored preferences:', prefs)

  if (prefs) {
    const parsed = JSON.parse(prefs)
    console.log('Parsed customHotkeys:', parsed.customHotkeys)
    console.log('toggle-play hotkey:', parsed.customHotkeys?.['toggle-play'])
  }

  // Check if the store has the right values
  if (window.Vue && window.Vue.usePrefsStore) {
    const store = window.Vue.usePrefsStore()
    console.log('Store customHotkeys:', store.customHotkeys)
    console.log('Store toggle-play:', store.customHotkeys['toggle-play'])
  }

  console.log('=== END DEBUG ===')
})()
