import { pointOnRoute } from './routeGeometry.js'

// Integrate within one constant-speed segment before crossing a grade change.
// Distance and time limits are applied before mutating mission telemetry.
export function traversalStep(route, distance, { metres, seconds, returnAllowance, returnTimeAt }) {
  const segment = route.segments.find(item => item.offset + item.distance > distance + 1e-9)
  if (!segment) return { distance: 0, seconds: 0, point: pointOnRoute(route, distance) }
  const secondsPerMetre = segment.seconds / segment.distance
  let step = Math.max(0, Math.min(5, segment.offset + segment.distance - distance, metres, seconds / secondsPerMetre))
  let reserveLimited = false
  if (returnTimeAt && step * secondsPerMetre + returnTimeAt(distance + step) > returnAllowance) {
    let low = 0, high = step
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2
      if (mid * secondsPerMetre + returnTimeAt(distance + mid) <= returnAllowance) low = mid
      else high = mid
    }
    step = low
    reserveLimited = true
  }
  return { distance: step, seconds: step * secondsPerMetre,
    point: pointOnRoute(route, distance + step), reserveLimited }
}
