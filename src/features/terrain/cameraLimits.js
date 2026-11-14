import { sampleHeight } from './terrainData.js'

export const MIN_CLEARANCE = 300
export const MAX_CAMERA_HEIGHT = 90000
export const MIN_PITCH = -Math.PI / 2
export const MAX_PITCH = -Math.PI / 9 // keep the regional view at least 20° downward
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

// This guard uses the loaded DEM, even when visible Cesium tiles are still refining.
// Longitude/latitude are degrees; heights are source metres; pitch is radians.
export function constrainCamera(data, pose) {
  if (![pose.longitude, pose.latitude, pose.height, pose.pitch].every(Number.isFinite)) return null
  const [west, south, east, north] = data.bounds
  // Allow the camera to stand outside the crop while looking obliquely into it.
  const margin = MAX_CAMERA_HEIGHT / data.radius * 180 / Math.PI
  const longitude = clamp(pose.longitude, west - margin, east + margin)
  const latitude = clamp(pose.latitude, south - margin, north + margin)
  const terrainHeight = sampleHeight(data, longitude, latitude)
  const minimum = (terrainHeight ?? data.maximumHeight) + MIN_CLEARANCE
  return {
    longitude, latitude,
    height: clamp(pose.height, minimum, MAX_CAMERA_HEIGHT),
    pitch: clamp(pose.pitch, MIN_PITCH, MAX_PITCH),
  }
}
