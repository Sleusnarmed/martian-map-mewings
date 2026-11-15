import { JEZERO_POINTS } from './pointsOfInterest.js'
import { surfaceDistance } from './terrainAnalysis.js'
import { sampleHeight } from './terrainData.js'

const rad = Math.PI / 180

// The first three points are a simulated traversal; the final point is Hazeltop.
const waypoints = [
  { name: 'Simulated start', longitude: 77.4022, latitude: 18.4516 },
  { name: 'Delta floor', longitude: 77.4037, latitude: 18.4534 },
  { name: 'Wildcat approach', longitude: 77.4052, latitude: 18.4555 },
  JEZERO_POINTS[0],
]

function localOffset(from, to, radius) {
  const metresPerDegree = radius * rad
  return {
    east: (to.longitude - from.longitude) * metresPerDegree * Math.cos(from.latitude * rad),
    north: (to.latitude - from.latitude) * metresPerDegree,
  }
}

export function bearingTo(from, to, radius) {
  const { east, north } = localOffset(from, to, radius)
  return Math.atan2(east, north)
}

export function moveAlongGround(point, heading, distance, radius) {
  const degrees = distance / (radius * rad)
  return {
    longitude: point.longitude + degrees * Math.sin(heading) / Math.cos(point.latitude * rad),
    latitude: point.latitude + degrees * Math.cos(heading),
  }
}

export function buildWildcatRoute(data) {
  if (waypoints.some(point => sampleHeight(data, point.longitude, point.latitude) === null)) return null
  let length = 0
  const segments = waypoints.slice(1).map((end, index) => {
    const start = waypoints[index]
    const distance = surfaceDistance(
      { longitude: start.longitude * rad, latitude: start.latitude * rad },
      { longitude: end.longitude * rad, latitude: end.latitude * rad }, data.radius,
    )
    const segment = { start, end, distance, offset: length }
    length += distance
    return segment
  })
  return { waypoints, segments, length, radius: data.radius }
}

export function routePosition(route, position) {
  let nearest
  for (const [index, segment] of route.segments.entries()) {
    const edge = localOffset(segment.start, segment.end, route.radius)
    const offset = localOffset(segment.start, position, route.radius)
    const t = Math.max(0, Math.min(1, (offset.east * edge.east + offset.north * edge.north) /
      (edge.east ** 2 + edge.north ** 2)))
    const crossTrack = Math.hypot(offset.east - edge.east * t, offset.north - edge.north * t)
    if (!nearest || crossTrack < nearest.crossTrack) {
      nearest = { index, crossTrack, progress: segment.offset + segment.distance * t }
    }
  }
  const final = route.waypoints.at(-1)
  const destination = localOffset(position, final, route.radius)
  const arrived = Math.hypot(destination.east, destination.north) <= 12
  const upcoming = route.segments[nearest.index]
  const startOffset = localOffset(position, upcoming.start, route.radius)
  const endOffset = localOffset(position, upcoming.end, route.radius)
  const targetIndex = nearest.crossTrack > 30
    ? (Math.hypot(startOffset.east, startOffset.north) < Math.hypot(endOffset.east, endOffset.north) ? nearest.index : nearest.index + 1)
    : Math.min(route.waypoints.length - 1, nearest.index + (Math.hypot(endOffset.east, endOffset.north) < 12 ? 2 : 1))
  const next = route.waypoints[targetIndex]
  const target = localOffset(position, next, route.radius)
  return {
    ...nearest, next, arrived,
    bearing: bearingTo(position, next, route.radius),
    distance: Math.hypot(target.east, target.north),
    remaining: Math.max(0, route.length - nearest.progress),
  }
}
