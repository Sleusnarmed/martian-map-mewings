import { useEffect, useRef, useState } from 'react'
import { ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium'
import { visibleTerrainPoints } from './visibleTerrainPoints.js'
import { formatCoordinates } from '../route-planner/routeGeometry.js'
import region from './region.json'

// Mounted only in immersive 3D. Picking never changes terrain, mission time or routes.
export default function TerrainPointDetails({ viewer, points }) {
  const [selection, setSelection] = useState(null)
  const pinned = useRef(false)
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return
    const available = [...visibleTerrainPoints(points, 'walk'), { ...region.center, id: 'jezero', name: 'Jezero crater · published center' }]
    const findPoint = position => {
      const entity = viewer.scene.pick(position)?.id
      const id = entity?.properties?.poiId?.getValue()
      return available.find(point => point.id === id) ?? null
    }
    const handler = new ScreenSpaceEventHandler(viewer.canvas)
    handler.setInputAction(event => {
      if (!pinned.current) setSelection(findPoint(event.endPosition))
    }, ScreenSpaceEventType.MOUSE_MOVE)
    handler.setInputAction(event => {
      const point = findPoint(event.position)
      pinned.current = Boolean(point)
      setSelection(point)
    }, ScreenSpaceEventType.LEFT_CLICK)
    const clearHover = () => { if (!pinned.current) setSelection(null) }
    viewer.canvas.addEventListener('mouseleave', clearHover)
    return () => {
      handler.destroy()
      viewer.canvas.removeEventListener('mouseleave', clearHover)
    }
  }, [viewer, points])

  if (!selection) return null
  return <aside className="terrain-poi-details" aria-label="Science point of interest">
    <div><strong>{selection.name}</strong><button aria-label="Close point details" onClick={() => {
      pinned.current = false
      setSelection(null)
    }}>×</button></div>
    {selection.summary && <p>{selection.summary}</p>}
    <p>{formatCoordinates(selection)}</p>
    {selection.positionNote && <p>{selection.positionNote}</p>}
    {selection.reference && <small>{selection.reference}</small>}
    <a href={selection.source} target="_blank" rel="noreferrer">Published source ↗</a>
    {selection.contextSource && <a href={selection.contextSource} target="_blank" rel="noreferrer">NASA science context ↗</a>}
    <small>Click the marker to keep these details open.</small>
  </aside>
}
