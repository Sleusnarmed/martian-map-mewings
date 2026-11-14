import { useLayoutEffect, useState } from 'react'
import { animate } from 'animejs'
import { createFadeTransition } from './fadeTransition.js'

export default function useFadingView(initialValue, keyOf) {
  const [value, setValue] = useState(initialValue)
  const [transition] = useState(() => createFadeTransition({
    initialValue,
    commit: setValue,
    animate,
    reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    keyOf,
  }))
  useLayoutEffect(() => {
    transition.enter(value)
    return transition.dispose
  }, [transition, value])
  return { value, change: transition.request, ref: transition.attachTarget }
}
