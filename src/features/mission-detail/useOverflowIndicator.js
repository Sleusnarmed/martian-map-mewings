import { useLayoutEffect } from 'react'

export default function useOverflowIndicator(panelRef, contentKey) {
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const measure = () => { panel.dataset.overflowing = String(panel.scrollHeight > panel.clientHeight + 1) }
    const observer = new ResizeObserver(measure)
    observer.observe(panel)
    if (panel.firstElementChild) observer.observe(panel.firstElementChild)
    measure()
    return () => observer.disconnect()
  }, [panelRef, contentKey])
}
