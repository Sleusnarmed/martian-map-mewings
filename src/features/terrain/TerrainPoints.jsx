import { useEffect } from 'react'
import { ScreenSpaceEventHandler, ScreenSpaceEventType, SceneTransforms, Cartesian3 } from 'cesium'
import { sampleHeight } from './terrainData'
import region from './region.json'
import { updatePointLabels, wrapPointName } from './terrainPointLabels.js'

// Native Cesium entities own symbols and labels in every camera perspective.
export default function TerrainPoints({ viewer, data, points, selection, onClose }) {
  useEffect(() => {
    if (viewer.isDestroyed()) return
    const canvas = viewer.canvas
    const handler = new ScreenSpaceEventHandler(canvas)
    const candidates = [...points, { ...region.center, id: 'jezero', name: 'Jezero crater · published center' }]
    const measure = document.createElement('canvas').getContext('2d')
    const viewport = canvas.closest('.map-shell') ?? canvas
    const formatLabels = () => {
      if (viewer.isDestroyed()) return
      let changed = false
      measure.font = '14px Mission Public Sans, sans-serif'
      for (const entity of viewer.entities.values) {
        const point = candidates.find(item => item.id === entity.properties?.poiId?.getValue())
        if (!point || !entity.label) continue
        const text = viewport.clientWidth < 700 ? wrapPointName(point.name, 144, text => measure.measureText(text).width) : point.name
        if (entity.label.text.getValue(viewer.clock.currentTime) !== text) { entity.label.text = text; changed = true }
      }
      if (changed) viewer.scene.requestRender()
    }
    let moving = false, hoverId = null
    const labels = id => { hoverId = id; updatePointLabels(viewer, id, selection?.id) }
    // Parent marker creation finishes after this child effect. Synchronize once
    // after render; never mutate entities from their collection-change callback.
    const markersAdded = viewer.scene.postRender.addEventListener(() => {
      formatLabels()
      updatePointLabels(viewer, hoverId, selection?.id)
      markersAdded()
    })
    const stopHover = viewer.camera.moveStart.addEventListener(() => { moving = true; labels(null) })
    const resumeHover = viewer.camera.moveEnd.addEventListener(() => { moving = false })
    const resize = new ResizeObserver(formatLabels)
    resize.observe(viewport)
    function pick(position) {
      let nearest = null, nearestDistance = Infinity
      for (const entity of viewer.entities.values) {
        const point = candidates.find(item => item.id === entity.properties?.poiId?.getValue())
        if (!point || !entity.isShowing) continue
        const time = viewer.clock.currentTime
        const world = entity.position?.getValue(time)
        if (!world || Cartesian3.dot(viewer.camera.directionWC,
          Cartesian3.subtract(world, viewer.camera.positionWC, new Cartesian3())) <= 0) continue
        const screen = SceneTransforms.worldToWindowCoordinates(viewer.scene, world)
        if (!screen) continue
        const dx = position.x - screen.x, dy = position.y - screen.y
        const label = entity.label, offset = label?.pixelOffset?.getValue(time)
        measure.font = label?.font?.getValue(time) || '14px sans-serif'
        const lines = (label?.text?.getValue(time) || point.name).split('\n')
        const halfWidth = Math.max(...lines.map(line => measure.measureText(line).width)) / 2 + 10
        const halfHeight = lines.length * 9 + 8
        const onLabel = label?.show?.getValue(time) && offset && Math.abs(dx - offset.x) <= halfWidth && Math.abs(dy - offset.y) <= halfHeight
        const distance = dx * dx + dy * dy
        if ((distance <= 196 || onLabel) && distance < nearestDistance) { nearest = point; nearestDistance = distance }
      }
      return nearest ? { ...nearest, elevation: sampleHeight(data, nearest.longitude, nearest.latitude) } : null
    }
    handler.setInputAction(event => {
      if (moving) return
      const id = pick(event.endPosition)?.id ?? null
      if (id !== hoverId) labels(id)
    }, ScreenSpaceEventType.MOUSE_MOVE)
    const leave = () => labels(null)
    canvas.addEventListener('pointerleave', leave)
    labels(null)
    return () => { resize.disconnect(); canvas.removeEventListener('pointerleave', leave); markersAdded(); stopHover(); resumeHover(); handler.destroy() }
  }, [viewer, data, points, selection?.id])

  useEffect(() => {
    const close = event => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])

  return null
}
