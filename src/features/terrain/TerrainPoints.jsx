import { useEffect, useRef, useState } from 'react'
import { ScreenSpaceEventHandler, ScreenSpaceEventType, SceneTransforms, Cartesian3 } from 'cesium'
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
    let moving = false
    const stopHover = viewer.camera.moveStart.addEventListener(() => { moving = true })
    const resumeHover = viewer.camera.moveEnd.addEventListener(() => { moving = false })
    const measure = document.createElement('canvas').getContext('2d')
    function pick(position) {
      // Hit-test only: native Cesium entities still own all drawing/placement.
      let nearest = null
      let nearestDistance = Infinity
      for (const entity of viewer.entities.values) {
        const id = entity.properties?.poiId?.getValue()
        const point = visible.find(item => item.id === id)
        if (!point || !entity.isShowing) continue
        const world = entity.position?.getValue(viewer.clock.currentTime)
        if (!world || Cartesian3.dot(viewer.camera.directionWC,
          Cartesian3.subtract(world, viewer.camera.positionWC, new Cartesian3())) <= 0) continue
        const screen = SceneTransforms.worldToWindowCoordinates(viewer.scene, world)
        if (!screen) continue
        const dx = position.x - screen.x, dy = position.y - screen.y
        const label = entity.label
        const offset = label?.pixelOffset?.getValue(viewer.clock.currentTime)
        measure.font = label?.font?.getValue(viewer.clock.currentTime) || '14px sans-serif'
        const lines = (label?.text?.getValue(viewer.clock.currentTime) || '').split('\n')
        const halfWidth = Math.max(...lines.map(line => measure.measureText(line).width)) / 2 + 10
        const halfHeight = lines.length * 10 + 8
        const onLabel = offset && Math.abs(dx - offset.x) <= halfWidth && Math.abs(dy - offset.y) <= halfHeight
        const distance = dx * dx + dy * dy
        if ((distance <= 144 || onLabel) && distance < nearestDistance) {
          nearest = point
          nearestDistance = distance
        }
      }
      return nearest ? { ...nearest, elevation: sampleHeight(data, nearest.longitude, nearest.latitude) } : null
    }
    handler.setInputAction(event => {
      if (pinnedRef.current || moving) return
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
    return () => { clearTimeout(clearTimer.current); stopHover(); resumeHover(); handler.destroy() }
  }, [viewer, data, points, mode])

  if (mode !== 'walk' || !selection) return null
  return <TerrainPointDetails selection={selection} pinned={pinned}
    onPointerEnter={cancelClear} onPointerLeave={clearHover}
    onClose={() => { cancelClear(); pinnedRef.current = false; setPinned(false); setSelection(null) }} />
}
