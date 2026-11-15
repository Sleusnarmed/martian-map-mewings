import { useEffect, useMemo, useRef, useState } from 'react'
import { Cartesian3, SceneTransforms } from 'cesium'
import { createPortal } from 'react-dom'
import { sampleHeight } from './terrainData'
import { visibleTerrainPoints } from './visibleTerrainPoints.js'
import { projectTerrainPoint } from './projectTerrainPoint.js'
import TerrainPointDetails from './TerrainPointDetails.jsx'
import region from './region.json'

export default function TerrainPoints({ viewer, data, points, mode, onInspect }) {
  const buttons = useRef(new Map())
  const clearTimer = useRef(null)
  const [selection, setSelection] = useState(null)
  const [pinned, setPinned] = useState(false)
  const markers = useMemo(() => visibleTerrainPoints([
    ...points, { ...region.center, id: 'jezero', name: 'Jezero crater · published center' },
  ], mode).flatMap(point => {
    if (!point.source || !Number.isFinite(point.longitude) || !Number.isFinite(point.latitude)) return []
    const elevation = sampleHeight(data, point.longitude, point.latitude)
    if (!Number.isFinite(elevation)) return []
    return [{ ...point, elevation,
      position: Cartesian3.fromDegrees(point.longitude, point.latitude, elevation, viewer.scene.globe.ellipsoid) }]
  }), [points, mode, data, viewer])

  useEffect(() => {
    function update() {
      const { scene, camera, canvas } = viewer
      const project = position => SceneTransforms.worldToWindowCoordinates(scene, position)
      for (const marker of markers) {
        const button = buttons.current.get(marker.id)
        if (!button) continue
        const screen = projectTerrainPoint(camera, marker.position, project, canvas.clientWidth, canvas.clientHeight)
        button.hidden = !screen
        if (screen) button.style.transform = `translate(${screen.x}px, ${screen.y}px)`
      }
    }
    const remove = viewer.scene.postRender.addEventListener(update)
    viewer.scene.requestRender()
    return remove
  }, [viewer, markers])

  useEffect(() => () => clearTimeout(clearTimer.current), [])
  const cancelClear = () => clearTimeout(clearTimer.current)
  const clearHover = () => {
    cancelClear()
    if (!pinned) clearTimer.current = setTimeout(() => setSelection(null), 180)
  }
  const hover = marker => {
    cancelClear()
    if (mode === 'walk' && !pinned) setSelection(marker)
  }
  const active = mode === 'walk' && markers.some(marker => marker.id === selection?.id) ? selection : null
  return <>
    {/* Share the canvas coordinate origin, including panel framing and ancestor transforms. */}
    {createPortal(<div className="terrain-poi-overlay" aria-label="Map points of interest">
      {markers.map(marker => <button key={marker.id} type="button" className="terrain-poi-marker"
        ref={element => { if (element) buttons.current.set(marker.id, element); else buttons.current.delete(marker.id) }}
        hidden aria-label={marker.name}
        onPointerEnter={() => hover(marker)} onPointerLeave={clearHover}
        onFocus={() => hover(marker)} onBlur={clearHover}
        onClick={() => {
          cancelClear()
          if (mode === 'walk') { setSelection(marker); setPinned(true) }
          const point = { ...marker }
          delete point.position
          onInspect({ ...point, lon: point.longitude, lat: point.latitude })
        }}>
        <span className="terrain-poi-dot" aria-hidden="true" />
        <span className="terrain-poi-name">{marker.name}</span>
      </button>)}
    </div>, viewer.canvas.parentElement)}
    {active && <TerrainPointDetails selection={active} pinned={pinned}
      onPointerEnter={cancelClear} onPointerLeave={clearHover}
      onClose={() => { cancelClear(); setPinned(false); setSelection(null) }} />}
  </>
}
