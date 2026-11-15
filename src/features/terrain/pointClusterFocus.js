import { Cartesian3, SceneTransforms, Math as CesiumMath, BoundingSphere, HeadingPitchRange } from 'cesium'
import { distanceBetween, interpolatePoint } from '../route-planner/routeGeometry.js'
import { sampleHeight } from './terrainData.js'

// Screen proximity decides whether disambiguation is needed; geographic distance
// sets the camera range. Scientific positions are never spread or displaced.
export function nearbyPointFocus(selected, projected, cameraRange, radius) {
  const origin = projected.find(point => point.id === selected.id)
  if (!origin) return null
  const nearby = projected.filter(point => point.id !== selected.id && Math.hypot(point.x - origin.x, point.y - origin.y) <= 32)
    .map(point => ({ point, distance: distanceBetween(selected, point, radius) }))
    .filter(item => item.distance > 1)
    .sort((a, b) => a.distance - b.distance)
  if (!nearby.length) return null
  const closest = nearby[0]
  // Keep the oblique view above the regional camera floor and avoid excessive
  // magnification of the orbital texture while separating touch-sized symbols.
  const range = Math.max(450, closest.distance * 5)
  if (range >= cameraRange * 0.9) return null
  return { ...interpolatePoint(selected, closest.point, 0.5), range }
}

export function pointClusterFocus(context, selected) {
  if (!context || context.viewer.isDestroyed()) return null
  const { viewer, data } = context
  const projected = []
  let cameraRange
  for (const entity of viewer.entities.values) {
    const id = entity.properties?.poiId?.getValue()
    if (!id || !entity.isShowing) continue
    const world = entity.position?.getValue(viewer.clock.currentTime)
    if (!world || Cartesian3.dot(viewer.camera.directionWC, Cartesian3.subtract(world, viewer.camera.positionWC, new Cartesian3())) <= 0) continue
    const screen = SceneTransforms.worldToWindowCoordinates(viewer.scene, world)
    if (!screen) continue
    const cartographic = context.ellipsoid.cartesianToCartographic(world)
    projected.push({ id, x: screen.x, y: screen.y, longitude: CesiumMath.toDegrees(cartographic.longitude), latitude: CesiumMath.toDegrees(cartographic.latitude) })
    if (id === selected.id) cameraRange = Cartesian3.distance(viewer.camera.positionWC, world)
  }
  return nearbyPointFocus(selected, projected, cameraRange ?? 0, data.radius)
}

export function applyPointClusterFocus(context, target, overhead) {
  const height = sampleHeight(context.data, target.longitude, target.latitude)
  if (height === null) return
  const { viewer, ellipsoid } = context
  viewer.camera.cancelFlight()
  viewer.camera.flyToBoundingSphere(new BoundingSphere(Cartesian3.fromDegrees(target.longitude, target.latitude, height, ellipsoid), 1), {
    offset: new HeadingPitchRange(viewer.camera.heading, CesiumMath.toRadians(overhead ? -90 : -48), target.range),
    duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.5,
  })
  viewer.scene.requestRender()
}
