export const MARS_OVERVIEW_HEIGHT = 11000000
export const MARS_PREVIEW_HEIGHT = 8500000
export const OVERVIEW_IDLE_MS = 500

export function createGlobeMotion({ rotate, resetCamera, now, reducedMotion, visible, onChange, canResume = () => true }) {
  let generation = 0
  let running = false
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
  function interact() {
    stop()
    resumeAt = overview ? now() + OVERVIEW_IDLE_MS : Infinity
  }
  return {
    pause() {
      stop()
      overview = false
      resumeAt = Infinity
    },
    beginInteraction() { stop(); held = true; resumeAt = Infinity },
    endInteraction() { held = false; resumeAt = overview ? now() + OVERVIEW_IDLE_MS : Infinity },
    interact,
    restart(expanded, animate = true) {
      const ticket = ++generation
      running = false
      overview = true
      held = false
      resumeAt = Infinity
      report()
      resetCamera(expanded, animate, () => {
        if (ticket !== generation) return
        previousTime = now()
        running = !reducedMotion()
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
