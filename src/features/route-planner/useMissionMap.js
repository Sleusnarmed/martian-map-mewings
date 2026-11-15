import { useEffect } from 'react'
import { ArcType, Cartesian2, Cartesian3, Color, Credit, LabelStyle, PolylineOutlineMaterialProperty, Rectangle, SingleTileImageryProvider } from 'cesium'
import { sampleHeight } from '../terrain/terrainData.js'
import { addOrderedImagery } from '../terrain/wildcatImagery.js'
import { interpolatePoint, moveAlongGround } from './routeGeometry.js'

const yellow = Color.fromCssColorString('#eafe07')
const blue = Color.fromCssColorString('#2e96f5')
function mapPosition(viewer, data, point, lift = 0.6) {
  const height = sampleHeight(data, point.longitude, point.latitude)
  return height === null ? null : Cartesian3.fromDegrees(point.longitude, point.latitude, height + lift, viewer.scene.globe.ellipsoid)
}
const label = text => ({ text, font: '14px sans-serif', style: LabelStyle.FILL_AND_OUTLINE,
  fillColor: Color.WHITE, outlineColor: Color.fromCssColorString('#07173f'), outlineWidth: 4,
  pixelOffset: new Cartesian2(0, -20), disableDepthTestDistance: Infinity })

export function useMissionMap(viewer, data, state, visibility) {
  const route = state.result?.route, { a, b, position, inspection, hazards, surveys, coverageBounds } = state
  const { route: showRoute, hazards: showHazards, coverage: showCoverage } = visibility
  useEffect(() => {
    if (!viewer || !data) return
    const entities = []
    const add = entity => entities.push(viewer.entities.add(entity))
    for (const [id, point] of [['A', a], ['B', b]]) {
      if (!point) continue
      const location = mapPosition(viewer, data, point, 4)
      if (!location) continue
      add({ position: location, properties: { routeEndpoint: id, longitude: point.longitude, latitude: point.latitude, name: point.name ?? `Point ${id}` },
        point: { pixelSize: 12, color: yellow, outlineColor: Color.fromCssColorString('#07173f'), outlineWidth: 2, disableDepthTestDistance: Infinity }, label: { ...label(id), pixelOffset: new Cartesian2(0, id === 'B' ? 22 : -20) } })
    }
    if (route && showRoute) {
      const positions = []
      for (const segment of route.segments) {
        const count = Math.max(1, Math.ceil(segment.distance / 4))
        for (let i = 0; i < count; i++) positions.push(mapPosition(viewer, data, interpolatePoint(segment.start, segment.end, i / count)))
      }
      positions.push(mapPosition(viewer, data, route.waypoints.at(-1)))
      add({ polyline: { positions: positions.filter(Boolean), width: 4, clampToGround: true, arcType: ArcType.GEODESIC, zIndex: 2,
        material: new PolylineOutlineMaterialProperty({ color: yellow, outlineColor: Color.fromCssColorString('#07173f'), outlineWidth: 1 }) } })
    }
    if (showHazards) for (const h of hazards.filter(h => h.known)) {
      const location = mapPosition(viewer, data, h, 3)
      if (!location) continue
      add({ position: location, properties: { longitude: h.longitude, latitude: h.latitude, name: 'Reported blocked area' },
        polyline: { positions: Array.from({ length: 65 }, (_, i) => mapPosition(viewer, data, moveAlongGround(h, i * Math.PI / 32, h.radius + 5, data.radius), 3)).filter(Boolean),
          width: 3, arcType: ArcType.NONE, material: yellow.withAlpha(0.8) }, label: label('Blocked') })
    }
    viewer.scene.requestRender()
    return () => { if (!viewer.isDestroyed()) { entities.forEach(entity => viewer.entities.remove(entity)); viewer.scene.requestRender() } }
  }, [viewer, data, a, b, route, showRoute, hazards, showHazards])

  useEffect(() => {
    if (!viewer || !data || !position) return
    const location = mapPosition(viewer, data, position, 6)
    if (!location) return
    const entity = viewer.entities.add({ position: location,
      properties: { longitude: position.longitude, latitude: position.latitude, name: 'Mission position' },
      point: { pixelSize: 13, color: blue, outlineColor: Color.WHITE, outlineWidth: 2, disableDepthTestDistance: Infinity }, label: { ...label('You'), pixelOffset: new Cartesian2(22, 12) } })
    viewer.scene.requestRender()
    return () => { if (!viewer.isDestroyed()) viewer.entities.remove(entity) }
  }, [viewer, data, position])

  useEffect(() => {
    if (!viewer || !data || !inspection || inspection.error) return
    const location = mapPosition(viewer, data, inspection, 5)
    if (!location) return
    const entity = viewer.entities.add({ position: location, point: { pixelSize: 7, color: Color.WHITE, outlineColor: blue, outlineWidth: 2, disableDepthTestDistance: Infinity } })
    viewer.scene.requestRender()
    return () => { if (!viewer.isDestroyed()) viewer.entities.remove(entity) }
  }, [viewer, data, inspection])

  useEffect(() => {
    if (!viewer || !data || !showCoverage || !surveys.length) return
    const bounds = coverageBounds ?? data.detail?.bounds
    if (!bounds) return
    let cancelled = false, layer
    const size = 256, canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'rgba(7, 23, 63, 0.55)'; ctx.fillRect(0, 0, size, size)
    ctx.globalCompositeOperation = 'destination-out'
    const metresLat = data.radius * Math.PI / 180
    const metresLon = metresLat * Math.cos((bounds[1] + bounds[3]) / 2 * Math.PI / 180)
    for (const point of surveys) {
      const x = (point.longitude - bounds[0]) / (bounds[2] - bounds[0]) * size
      const y = (bounds[3] - point.latitude) / (bounds[3] - bounds[1]) * size
      ctx.beginPath(); ctx.ellipse(x, y, point.radius / metresLon / (bounds[2] - bounds[0]) * size,
        point.radius / metresLat / (bounds[3] - bounds[1]) * size, 0, 0, 2 * Math.PI); ctx.fill()
    }
    SingleTileImageryProvider.fromUrl(canvas.toDataURL(), { rectangle: Rectangle.fromDegrees(...bounds), ellipsoid: viewer.scene.globe.ellipsoid,
      credit: new Credit('Local observation coverage · traversal scenario') }).then(provider => {
      if (cancelled || viewer.isDestroyed()) return
      layer = addOrderedImagery(viewer, provider, 6); viewer.scene.requestRender()
    }).catch(() => { /* Survey display is optional; mission observations remain authoritative. */ })
    return () => { cancelled = true; if (layer && !viewer.isDestroyed()) { viewer.imageryLayers.remove(layer, true); viewer.scene.requestRender() } }
  }, [viewer, data, surveys, coverageBounds, showCoverage])
}
