export const MARS_OVERVIEW_HEIGHT = 11000000
export const MARS_PREVIEW_HEIGHT = 8500000

export function createGlobeMotion({ rotate, zoom, resetCamera, now, reducedMotion, visible, onChange }) {
  let generation = 0
  let running = false
  let canZoom = false
  let previousTime = now()
  const report = () => onChange(running ? 'rotating' : 'paused')
  function freeze() {
    generation += 1
    running = false
    report()
  }
  function pause(zoomOnTouch = false) {
    freeze()
    if (canZoom && zoomOnTouch) zoom()
    canZoom = false
    report()
  }
  return {
    pause,
    freeze,
    restart(enabled, animate = true) {
      const ticket = ++generation
      running = false
      canZoom = enabled
      report()
      resetCamera(enabled, animate, () => {
        if (ticket !== generation) return
        previousTime = now()
        running = enabled && !reducedMotion()
        report()
      })
    },
    tick() {
      const time = now()
      const delta = Math.max(0, Math.min((time - previousTime) / 1000, 0.1))
      previousTime = time
      if (running && visible() && !reducedMotion()) rotate(-0.028 * delta)
    },
    dispose() { pause() },
  }
}
