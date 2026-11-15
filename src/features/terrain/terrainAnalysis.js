import { detailWeight, sampleRegionalHeight } from './terrainData.js'

export function insideBounds(bounds, lon, lat) {
  return lon >= bounds[0] && lon <= bounds[2] && lat >= bounds[1] && lat <= bounds[3]
}

// Central differences on the actual display grid, with Mars radius and latitude correction.
// This estimates regional slope; it cannot resolve rocks or validate traversability.
export function slopeAt(data, lon, lat, local = false) {
  if (local && detailWeight(data.detail, lon, lat) >= 0.99) data = data.detail
  const dx = (data.bounds[2] - data.bounds[0]) / (data.width - 1)
  const dy = (data.bounds[3] - data.bounds[1]) / (data.height - 1)
  const heights = [sampleRegionalHeight(data, lon - dx, lat), sampleRegionalHeight(data, lon + dx, lat),
    sampleRegionalHeight(data, lon, lat - dy), sampleRegionalHeight(data, lon, lat + dy)]
  if (heights.some(value => value === null || !Number.isFinite(value))) return null
  const radians = Math.PI / 180
  const east = (heights[1] - heights[0]) / (2 * dx * radians * data.radius * Math.cos(lat * radians))
  const north = (heights[3] - heights[2]) / (2 * dy * radians * data.radius)
  return Math.atan(Math.hypot(east, north)) / radians
}

export function pitchForRange(range, mode) {
  if (mode === 'map') return -Math.PI / 2
  if (mode === 'relief') return -25 * Math.PI / 180
  const t = Math.max(0, Math.min(1, (Math.log(Math.max(range, 1)) - Math.log(1300)) / (Math.log(12000) - Math.log(1300))))
  const smooth = t * t * (3 - 2 * t)
  // An oblique mode stays oblique even in the regional overview.
  return -(35 + 20 * smooth) * Math.PI / 180
}

export function surfaceDistance(a, b, radius) {
  const lat = b.latitude - a.latitude, lon = b.longitude - a.longitude
  const hav = Math.sin(lat / 2) ** 2 + Math.cos(a.latitude) * Math.cos(b.latitude) * Math.sin(lon / 2) ** 2
  return 2 * radius * Math.asin(Math.sqrt(Math.max(0, Math.min(1, hav))))
}
