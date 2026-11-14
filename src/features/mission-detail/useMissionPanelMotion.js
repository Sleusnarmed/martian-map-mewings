import { useEffect } from 'react'
import { animate, createScope } from 'animejs'

export default function useMissionPanelMotion(root, panel, noticeId) {
  useEffect(() => {
    if (!panel) return
    const scope = createScope({ root, mediaQueries: { reduceMotion: '(prefers-reduced-motion: reduce)' } }).add((self) => {
      const target = panel === 'alerts' ? '.field-alerts' : '.field-deck'
      // Reveal an alert from its control edge without shifting targets or readouts.
      const reveal = panel === 'alerts' && !self.matches.reduceMotion
      animate(target, {
        opacity: [0.85, 1],
        ...(reveal ? { clipPath: ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'] } : {}),
        duration: self.matches.reduceMotion ? 80 : reveal ? 180 : 120,
        ease: 'outExpo',
      })
    })
    return () => scope.revert()
  }, [root, panel, noticeId])
}
