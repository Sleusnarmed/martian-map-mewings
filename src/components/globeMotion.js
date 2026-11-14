export const MARS_OVERVIEW_HEIGHT = 11000000
export const MARS_PREVIEW_HEIGHT = 8500000
export const OVERVIEW_IDLE_MS = 500

export function createGlobeMotion({ rotate, zoom, resetCamera, now, reducedMotion, visible, onChange, canResume = () => true }) {
  let generation = 0
  let running = false
  let canZoom = false
  let overview = false
  let held = false
  let resumeAt = Infinity
  let previousTime = now()
  const report = () => onChange(running ? 'rotating' : 'paused')
  function stop() {
    generation += 1
    running = false
    report()
  }
  function interact(zoomOnTouch = false) {
    stop()
    if (canZoom && zoomOnTouch) zoom()
    canZoom = false
    resumeAt = overview ? now() + OVERVIEW_IDLE_MS : Infinity
  }
  return {
    pause() {
      stop()
      overview = false
      canZoom = false
      resumeAt = Infinity
    },
    beginInteraction() { stop(); held = true; resumeAt = Infinity },
    endInteraction() { held = false; resumeAt = overview ? now() + OVERVIEW_IDLE_MS : Infinity },
    interact,
    restart(enabled, animate = true) {
      const ticket = ++generation
      running = false
      canZoom = enabled
      overview = enabled
      held = false
      resumeAt = Infinity
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
      if (overview && !held && time >= resumeAt && visible()) {
        overview = canResume()
        running = overview && !reducedMotion()
        resumeAt = Infinity
        report()
      }
      if (running && visible() && !reducedMotion()) rotate(-0.028 * delta)
    },
    dispose() { stop(); overview = false; resumeAt = Infinity },
  }
}
