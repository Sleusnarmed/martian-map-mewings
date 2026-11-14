// Keep the outgoing view mounted until its fade completes. Latest input wins.
export function createFadeTransition({ initialValue, commit, getTarget: resolveTarget, animate, reducedMotion, keyOf = (value) => value }) {
  let boundTarget = null
  const getTarget = () => resolveTarget ? resolveTarget() : boundTarget
  let displayed = initialValue
  let requested = initialValue
  let animation = null
  let generation = 0

  function cancel() {
    generation += 1
    animation?.cancel()
    animation = null
  }

  function enter(value, fromCurrent = false) {
    cancel()
    const target = getTarget()
    if (value === null || !target || !target.getBoundingClientRect().height) return
    animation = animate(target, {
      opacity: fromCurrent ? 1 : [0, 1],
      duration: reducedMotion() ? 60 : 140,
      ease: 'outExpo',
    })
  }

  return {
    attachTarget(node) { boundTarget = node },
    request(update) {
      const next = typeof update === 'function' ? update(requested) : update
      if (Object.is(keyOf(next), keyOf(requested))) return
      requested = next
      cancel()
      if (Object.is(keyOf(next), keyOf(displayed))) { enter(displayed, true); return }
      const target = getTarget()
      const ticket = generation
      function finish() {
        if (ticket !== generation) return
        animation = null
        displayed = requested
        commit(displayed)
      }
      if (displayed === null || !target || !target.getBoundingClientRect().height || reducedMotion()) {
        finish()
      } else {
        animation = animate(target, { opacity: 0, duration: 90, ease: 'inQuad', onComplete: finish })
      }
    },
    enter,
    dispose() {
      cancel()
      getTarget()?.style.removeProperty('opacity')
    },
  }
}
