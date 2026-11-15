const RAD = Math.PI / 180
export const MARS_RADIUS = 3396190

export function distanceBetween(a, b, radius = MARS_RADIUS) {
  const lat = (b.latitude - a.latitude) * RAD
  const lon = (b.longitude - a.longitude) * RAD
  const h = Math.sin(lat / 2) ** 2 + Math.cos(a.latitude * RAD) * Math.cos(b.latitude * RAD) * Math.sin(lon / 2) ** 2
  return 2 * radius * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))))
}

export function interpolatePoint(a, b, fraction) {
  return { longitude: a.longitude + (b.longitude - a.longitude) * fraction,
    latitude: a.latitude + (b.latitude - a.latitude) * fraction }
}

export function bearingTo(a, b) {
  return Math.atan2((b.longitude - a.longitude) * Math.cos(a.latitude * RAD), b.latitude - a.latitude)
}

export function moveAlongGround(point, heading, distance, radius = MARS_RADIUS) {
  const degrees = distance / (radius * RAD)
  return { longitude: point.longitude + degrees * Math.sin(heading) / Math.cos(point.latitude * RAD),
    latitude: point.latitude + degrees * Math.cos(heading) }
}

// Direction-dependent walking assumption, not a suit/physiology measurement.
export function segmentSeconds(distance, rise, pace) {
  if (distance <= 0) return 0
  const grade = rise / distance
  return distance / pace * (1 + 3 * Math.max(0, grade) + Math.abs(grade))
}

export function buildRoute(points, radius = MARS_RADIUS, pace = 0.5) {
  let length = 0, duration = 0, reverseDuration = 0
  const waypoints = points.filter((point, i) => i === 0 || distanceBetween(points[i - 1], point, radius) > 0.001)
  const segments = waypoints.slice(1).map((end, i) => {
    const start = waypoints[i]
    const distance = distanceBetween(start, end, radius)
    const rise = (end.height ?? 0) - (start.height ?? 0)
    const seconds = segmentSeconds(distance, rise, pace)
    const reverseSeconds = segmentSeconds(distance, -rise, pace)
    const segment = { start, end, distance, offset: length, seconds, reverseSeconds, timeOffset: duration, reverseTimeOffset: reverseDuration }
    length += distance; duration += seconds; reverseDuration += reverseSeconds
    return segment
  })
  return { waypoints, segments, length, duration, reverseDuration, radius, pace }
}

export function pointOnRoute(route, distance) {
  const progress = Math.max(0, Math.min(route.length, distance))
  const segment = route.segments.find(item => item.offset + item.distance >= progress) ?? route.segments.at(-1)
  if (!segment) return { ...route.waypoints[0], seconds: 0, reverseSeconds: 0 }
  const t = (progress - segment.offset) / segment.distance
  return { ...interpolatePoint(segment.start, segment.end, t),
    seconds: segment.timeOffset + segment.seconds * t,
    reverseSeconds: segment.reverseTimeOffset + segment.reverseSeconds * t }
}

export function routePosition(route, point) {
  let nearest = { crossTrack: Infinity, progress: 0, index: 0 }
  for (const [index, segment] of route.segments.entries()) {
    const scale = Math.cos(point.latitude * RAD)
    const ex = (segment.end.longitude - segment.start.longitude) * scale
    const ey = segment.end.latitude - segment.start.latitude
    const px = (point.longitude - segment.start.longitude) * scale
    const py = point.latitude - segment.start.latitude
    const t = Math.max(0, Math.min(1, (ex * px + ey * py) / (ex * ex + ey * ey)))
    const crossTrack = distanceBetween(point, interpolatePoint(segment.start, segment.end, t), route.radius)
    if (crossTrack < nearest.crossTrack) nearest = { crossTrack, progress: segment.offset + segment.distance * t, index }
  }
  const segment = route.segments[nearest.index]
  const atEnd = segment && distanceBetween(point, segment.end, route.radius) < 2
  const next = route.waypoints[Math.min(route.waypoints.length - 1, nearest.index + (atEnd ? 2 : 1))]
  return { ...nearest, next, arrived: distanceBetween(point, route.waypoints.at(-1), route.radius) <= 2,
    bearing: bearingTo(point, next), distance: distanceBetween(point, next, route.radius), remaining: Math.max(0, route.length - nearest.progress) }
}

export function formatCoordinates(point) {
  if (!point || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) return 'No point selected'
  return `${Math.abs(point.latitude).toFixed(5)}° ${point.latitude >= 0 ? 'N' : 'S'} · ${Math.abs(point.longitude).toFixed(5)}° ${point.longitude >= 0 ? 'E' : 'W'}`
}
