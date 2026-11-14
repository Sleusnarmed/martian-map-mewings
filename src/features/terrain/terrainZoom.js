import { Cartesian3, Cartographic, Math as CesiumMath } from 'cesium'
import { constrainCamera, MIN_CLEARANCE } from './cameraLimits.js'
import { sampleHeight } from './terrainData.js'

// Stop along the requested ray before hitting a DEM/camera boundary. Never
// overshoot and correct backwards: a blocked input moves zero, reverse works immediately.
export function boundedZoomDistance(data, ellipsoid, position, direction, pitch, delta) {
  if (!Number.isFinite(delta) || delta === 0) return 0
  const cartographic = ellipsoid.cartesianToCartographic(position)
  const longitude = CesiumMath.toDegrees(cartographic.longitude)
  const latitude = CesiumMath.toDegrees(cartographic.latitude)
  const ground = sampleHeight(data, longitude, latitude) ?? data.maximumHeight
  const normal = ellipsoid.geodeticSurfaceNormal(position, new Cartesian3())
  const incidence = Math.max(0.2, -Cartesian3.dot(normal, direction))
  const distance = Math.max(MIN_CLEARANCE, cartographic.height - ground) *
    (1 - Math.exp(-Math.max(-240, Math.min(240, delta)) / 600)) / incidence
  const point = new Cartesian3(), coordinate = new Cartographic()
  function allowed(fraction) {
    Cartesian3.multiplyByScalar(direction, distance * fraction, point)
    Cartesian3.add(position, point, point)
    ellipsoid.cartesianToCartographic(point, coordinate)
    const pose = { longitude: CesiumMath.toDegrees(coordinate.longitude), latitude: CesiumMath.toDegrees(coordinate.latitude), height: coordinate.height, pitch }
    const safe = constrainCamera(data, pose)
    return safe && Math.abs(safe.longitude - pose.longitude) < 1e-9 &&
      Math.abs(safe.latitude - pose.latitude) < 1e-9 && Math.abs(safe.height - pose.height) < 1e-6
  }
  let low = 0
  for (let sample = 1; sample <= 16; sample++) {
    let high = sample / 16
    if (allowed(high)) { low = high; continue }
    for (let i = 0; i < 28; i++) {
      const middle = (low + high) / 2
      if (allowed(middle)) low = middle
      else high = middle
    }
    break
  }
  return Math.abs(distance * low) < 0.01 ? 0 : distance * low
}
