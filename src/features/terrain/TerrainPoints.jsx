import { useEffect, useRef, useState } from 'react'
import { ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium'
import { sampleHeight } from './terrainData'
import { visibleTerrainPoints } from './visibleTerrainPoints.js'
import TerrainPointDetails from './TerrainPointDetails.jsx'
import region from './region.json'

// Marker positions and drawing belong to Cesium; React owns only the detail card.
export default function TerrainPoints({ viewer, data, points, mode }) {
  const [selection, setSelection] = useState(null)
  const [pinned, setPinned] = useState(false)
  const pinnedRef = useRef(false)
  const clearTimer = useRef(null)
  const cancelClear = () => clearTimeout(clearTimer.current)
  const clearHover = () => {
    cancelClear()
    if (!pinnedRef.current) clearTimer.current = setTimeout(() => setSelection(null), 180)
  }

  useEffect(() => {
    if (mode !== 'walk') return
    const handler = new ScreenSpaceEventHandler(viewer.canvas)
    const visible = visibleTerrainPoints([
      ...points, { ...region.center, id: 'jezero', name: 'Jezero crater · published center' },
    ], mode)
    function pick(position) {
      const id = viewer.scene.pick(position)?.id?.properties?.poiId?.getValue()
      const point = visible.find(item => item.id === id)
      return point ? { ...point, elevation: sampleHeight(data, point.longitude, point.latitude) } : null
    }
    handler.setInputAction(event => {
      if (pinnedRef.current) return
      const point = pick(event.endPosition)
      clearTimeout(clearTimer.current)
      if (point) setSelection(point)
      else clearTimer.current = setTimeout(() => setSelection(null), 180)
    }, ScreenSpaceEventType.MOUSE_MOVE)
    handler.setInputAction(event => {
      const point = pick(event.position)
      if (!point) return
      clearTimeout(clearTimer.current)
      pinnedRef.current = true
      setPinned(true)
      setSelection(point)
    }, ScreenSpaceEventType.LEFT_CLICK)
    return () => { clearTimeout(clearTimer.current); handler.destroy() }
  }, [viewer, data, points, mode])

  if (mode !== 'walk' || !selection) return null
  return <TerrainPointDetails selection={selection} pinned={pinned}
    onPointerEnter={cancelClear} onPointerLeave={clearHover}
    onClose={() => { cancelClear(); pinnedRef.current = false; setPinned(false); setSelection(null) }} />
}
