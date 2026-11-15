import { Cartesian3, Ray, IntersectionTests, Ellipsoid, Math as CesiumMath } from 'cesium'
import { sampleHeight } from './terrainData.js'

// Intersect the loaded DEM independently of Cesium's asynchronously refined mesh.
// In particular this handles negative MOLA elevations on a custom Mars sphere.
export function pickTerrainRay(ray, data) {
  if (!ray || !data) return null
  const outer = new Ellipsoid(...Array(3).fill(data.radius + data.maximumHeight + 1))
  const interval = IntersectionTests.rayEllipsoid(ray, outer)
  if (!interval) return null
  const ellipsoid = new Ellipsoid(data.radius, data.radius, data.radius)
  const point = new Cartesian3()
  function clearance(t) {
    Ray.getPoint(ray, t, point)
    const carto = ellipsoid.cartesianToCartographic(point)
    if (!carto) return null
    const elevation = sampleHeight(data, CesiumMath.toDegrees(carto.longitude), CesiumMath.toDegrees(carto.latitude))
    return elevation === null ? null : carto.height - elevation
  }
  const start = Math.max(0, interval.start)
  // The near intersection with the inner sphere bounds the visible terrain shell.
  const inner = new Ellipsoid(...Array(3).fill(data.radius + data.minimumHeight - 1))
  const innerHit = IntersectionTests.rayEllipsoid(ray, inner)
  const end = innerHit && innerHit.start > start ? innerHit.start : Math.min(interval.stop, start + 200000)
  const step = data.detail ? 12 : Math.max(10, Math.min(50, data.displayResolutionMeters ?? 50))
  let previousT = start, previous = clearance(start)
  for (let t = start + step; previousT < end; t += step) {
    const currentT = Math.min(t, end)
    const current = clearance(currentT)
    if (previous !== null && current !== null && previous >= 0 && current <= 0) {
      let lo = previousT, hi = currentT
      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2
        const value = clearance(mid)
        if (value === null) return null
        if (value > 0) lo = mid
        else hi = mid
      }
      return Ray.getPoint(ray, (lo + hi) / 2, new Cartesian3())
    }
    previousT = currentT
    previous = current
  }
  return null
}
