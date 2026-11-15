import { useLayoutEffect } from 'react'

// Keep the camera's focus beside the mission panel across viewport sizes.
export function useTerrainFraming({ container, viewerRef, controlsTarget }) {
  useLayoutEffect(() => {
    if (!controlsTarget) return
    const host = container.current
    const viewport = host.parentElement
    const panel = controlsTarget.parentElement
    const update = () => {
      const view = viewport.getBoundingClientRect()
      const overlay = panel.getBoundingClientRect()
      let left, right = 0, top = 0
      if (view.width >= 700 && view.width > view.height) left = -(view.width - Math.max(96, overlay.left - view.left))
      else {
        left = 0
        // On phones the perspective selector occupies the upper-left map area.
        // Keep the same canvas size, reserving the focus on its clear right side.
        right = view.width < 700 ? -Math.min(144, Math.max(0, view.width - 160)) : 0
        top = 2 * Math.max(80, Math.min(view.height / 2, overlay.top - view.top - 40)) - view.height
      }
      // Reserve the same focus area whether panels are open or closed. Only a
      // viewport resize changes this frame; toggling HUD panels never resizes the map.
      host.style.setProperty('left', `${left}px`)
      host.style.setProperty('right', `${right}px`)
      host.style.setProperty('top', `${top}px`)
      host.style.setProperty('--terrain-credit-offset', `${-left}px`)
      const context = viewerRef.current
      if (context && !context.viewer.isDestroyed()) {
        context.viewer.resize()
        context.viewer.scene.requestRender()
      }
    }
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    update()
    return () => { observer.disconnect(); host.style.removeProperty('left'); host.style.removeProperty('right'); host.style.removeProperty('top'); host.style.removeProperty('--terrain-credit-offset') }
  }, [container, viewerRef, controlsTarget])

}
