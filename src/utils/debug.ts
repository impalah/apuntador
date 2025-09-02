// Debug utility for Android edge-to-edge issues
// Add this to localStorage to enable debug mode: localStorage.setItem('DEBUG_EDGE_TO_EDGE', 'true')

export function debugEdgeToEdge() {
  if (typeof window === 'undefined') return

  const debug = localStorage.getItem('DEBUG_EDGE_TO_EDGE') === 'true'
  if (!debug) return

  console.log('=== Android Edge-to-Edge Debug Info ===')

  // Device info
  console.log('User Agent:', navigator.userAgent)
  console.log('Is Android:', /Android/i.test(navigator.userAgent))

  // Screen dimensions
  console.log('Screen dimensions:', {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
  })

  // Viewport dimensions
  console.log('Viewport dimensions:', {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
  })

  // Visual viewport (if supported)
  if (window.visualViewport) {
    console.log('Visual Viewport:', {
      width: window.visualViewport.width,
      height: window.visualViewport.height,
      offsetTop: window.visualViewport.offsetTop,
      offsetLeft: window.visualViewport.offsetLeft,
      pageTop: window.visualViewport.pageTop,
      pageLeft: window.visualViewport.pageLeft,
      scale: window.visualViewport.scale,
    })
  }

  // CSS environment variables
  const computedStyle = getComputedStyle(document.documentElement)
  console.log('CSS Environment Variables:', {
    'safe-area-inset-top': computedStyle.getPropertyValue('env(safe-area-inset-top)'),
    'safe-area-inset-bottom': computedStyle.getPropertyValue('env(safe-area-inset-bottom)'),
    'safe-area-inset-left': computedStyle.getPropertyValue('env(safe-area-inset-left)'),
    'safe-area-inset-right': computedStyle.getPropertyValue('env(safe-area-inset-right)'),
  })

  // Custom CSS properties
  console.log('Custom CSS Properties:', {
    '--safe-area-inset-top': computedStyle.getPropertyValue('--safe-area-inset-top'),
    '--safe-area-inset-bottom': computedStyle.getPropertyValue('--safe-area-inset-bottom'),
    '--safe-area-inset-left': computedStyle.getPropertyValue('--safe-area-inset-left'),
    '--safe-area-inset-right': computedStyle.getPropertyValue('--safe-area-inset-right'),
  })

  // Body and HTML classes
  console.log('HTML classes:', document.documentElement.className)
  console.log('Body classes:', document.body.className)

  console.log('=== End Debug Info ===')
}

export function showDebugOverlay() {
  if (typeof window === 'undefined') return

  const debug = localStorage.getItem('DEBUG_EDGE_TO_EDGE') === 'true'
  if (!debug) return

  // Remove existing overlay
  const existing = document.getElementById('debug-overlay')
  if (existing) existing.remove()

  // Create debug overlay
  const overlay = document.createElement('div')
  overlay.id = 'debug-overlay'
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: rgba(255, 0, 0, 0.2);
    height: var(--safe-area-inset-top, 0px);
    z-index: 9999;
    pointer-events: none;
    border-bottom: 2px solid red;
  `

  const bottomOverlay = document.createElement('div')
  bottomOverlay.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 255, 0, 0.2);
    height: var(--safe-area-inset-bottom, 48px);
    z-index: 9999;
    pointer-events: none;
    border-top: 2px solid green;
  `

  const info = document.createElement('div')
  info.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 10000;
    font-family: monospace;
    font-size: 12px;
    max-width: 90vw;
    overflow: auto;
  `

  const computedStyle = getComputedStyle(document.documentElement)
  info.innerHTML = `
    <strong>Debug Info:</strong><br>
    Top inset: ${computedStyle.getPropertyValue('--safe-area-inset-top') || 'N/A'}<br>
    Bottom inset: ${computedStyle.getPropertyValue('--safe-area-inset-bottom') || 'N/A'}<br>
    Screen: ${window.screen.width}x${window.screen.height}<br>
    Viewport: ${window.innerWidth}x${window.innerHeight}<br>
    Android: ${/Android/i.test(navigator.userAgent) ? 'Yes' : 'No'}<br>
    <br>
    <small>Red = top safe area, Green = bottom safe area</small><br>
    <small>Tap anywhere to close</small>
  `

  document.body.appendChild(overlay)
  document.body.appendChild(bottomOverlay)
  document.body.appendChild(info)

  // Close on tap
  setTimeout(() => {
    document.addEventListener(
      'click',
      () => {
        overlay.remove()
        bottomOverlay.remove()
        info.remove()
      },
      { once: true }
    )
  }, 100)
}
