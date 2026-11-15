import { detailWeight, sampleHeight, sampleRegionalHeight } from '../terrain/terrainData.js'
import { buildRoute, distanceBetween, interpolatePoint, segmentSeconds } from './routeGeometry.js'

export const DEFAULT_SETTINGS = Object.freeze({ maxSlope: 20, pace: 0.5, budgetSeconds: 3600,
  oxygenSeconds: 3600, reserveSeconds: 300, activitySeconds: 300, priority: 'terrain' })
export const MAX_ROUTE_SPAN = 6000
const RAD = Math.PI / 180
const MAX_SIDE = 161

export function terrainSample(data, point) {
  const grid = detailWeight(data.detail, point.longitude, point.latitude) >= 0.99 ? data.detail : data
  const dx = (grid.bounds[2] - grid.bounds[0]) / (grid.width - 1)
  const dy = (grid.bounds[3] - grid.bounds[1]) / (grid.height - 1)
  const heights = [[-dx, 0], [dx, 0], [0, -dy], [0, dy]].map(([x, y]) => sampleRegionalHeight(grid, point.longitude + x, point.latitude + y))
  const height = sampleHeight(data, point.longitude, point.latitude)
  if (height === null || !Number.isFinite(height) || heights.some(h => h === null || !Number.isFinite(h))) return null
  const east = (heights[1] - heights[0]) / (2 * dx * RAD * data.radius * Math.cos(point.latitude * RAD))
  const north = (heights[3] - heights[2]) / (2 * dy * RAD * data.radius)
  return { height, slope: Math.atan(Math.hypot(east, north)) / RAD, resolution: grid.displayResolutionMeters }
}

function blockedByHazard(point, hazards, radius) {
  return hazards.some(h => distanceBetween(point, h, radius) <= h.radius + 5)
}

// Binary heap: no full sort of the frontier on every A* iteration.
class Frontier {
  items = []
  push(node, cost, score) {
    const item = { node, cost, score }
    let i = this.items.length
    this.items.push(item)
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this.items[parent].score <= score) break
      this.items[i] = this.items[parent]; i = parent
    }
    this.items[i] = item
  }
  pop() {
    const first = this.items[0], last = this.items.pop()
    if (this.items.length) {
      let i = 0
      while (i * 2 + 1 < this.items.length) {
        let child = i * 2 + 1
        if (child + 1 < this.items.length && this.items[child + 1].score < this.items[child].score) child++
        if (this.items[child].score >= last.score) break
        this.items[i] = this.items[child]; i = child
      }
      this.items[i] = last
    }
    return first
  }
}

export function findPath(data, start, goal, settings, hazards = [], surveys = []) {
  if (![start, goal].every(p => p && Number.isFinite(p.longitude) && Number.isFinite(p.latitude))) return { error: 'Select valid start and destination coordinates.' }
  const span = distanceBetween(start, goal, data.radius)
  if (span > MAX_ROUTE_SPAN) return { error: 'Choose points within 6 km for local route planning. Zoom into Wildcat Ridge.' }
  if (span < 1) return { error: 'A and B must be at least 1 metre apart.' }
  const knownHazards = hazards.filter(h => h.known !== false)
  const sample = p => {
    const value = terrainSample(data, p)
    return value && value.slope <= settings.maxSlope && !blockedByHazard(p, knownHazards, data.radius) ? value : null
  }
  const a = sample(start), b = sample(goal)
  if (!a || !b) return { error: 'An endpoint is outside usable elevation coverage, blocked, or above the slope limit. Move it or review the limits.' }
  const local = [start, goal].every(p => detailWeight(data.detail, p.longitude, p.latitude) >= 0.99)
  const metresLat = RAD * data.radius, metresLon = metresLat * Math.cos((start.latitude + goal.latitude) / 2 * RAD)
  const pad = Math.max(120, span * 0.45)
  const bounds = [Math.max(data.bounds[0], Math.min(start.longitude, goal.longitude) - pad / metresLon),
    Math.max(data.bounds[1], Math.min(start.latitude, goal.latitude) - pad / metresLat),
    Math.min(data.bounds[2], Math.max(start.longitude, goal.longitude) + pad / metresLon),
    Math.min(data.bounds[3], Math.max(start.latitude, goal.latitude) + pad / metresLat)]
  const widthMetres = (bounds[2] - bounds[0]) * metresLon, heightMetres = (bounds[3] - bounds[1]) * metresLat
  const cellSize = Math.max(local ? 6 : data.displayResolutionMeters, widthMetres / (MAX_SIDE - 1), heightMetres / (MAX_SIDE - 1))
  const cols = Math.max(3, Math.ceil(widthMetres / cellSize) + 1), rows = Math.max(3, Math.ceil(heightMetres / cellSize) + 1)
  const pointAt = id => ({ longitude: bounds[0] + (id % cols) / (cols - 1) * (bounds[2] - bounds[0]),
    latitude: bounds[1] + Math.floor(id / cols) / (rows - 1) * (bounds[3] - bounds[1]) })
  const nodes = Array.from({ length: cols * rows }, (_, id) => { const point = pointAt(id); const value = sample(point); return value ? { ...point, ...value } : null })
  // Sample edges at source-aware intervals; a diagonal cannot jump a blocked corner.
  const edge = (from, to) => {
    const distance = distanceBetween(from, to, data.radius)
    const count = Math.max(1, Math.ceil(distance / (local ? 3 : 15)))
    let previous = from, maximum = Math.max(from.slope, to.slope), exposure = 0
    for (let i = 1; i <= count; i++) {
      const point = interpolatePoint(from, to, i / count)
      const value = i === count ? to : sample(point)
      if (!value) return null
      const grade = Math.abs(Math.atan2(value.height - previous.height, distance / count) / RAD)
      if (grade > settings.maxSlope || blockedByHazard(point, knownHazards, data.radius)) return null
      maximum = Math.max(maximum, value.slope, grade); exposure += value.slope / count
      previous = value
    }
    const seconds = segmentSeconds(distance, to.height - from.height, settings.pace)
    const observed = surveys.some(p => distanceBetween(to, p, data.radius) <= p.radius)
    // All factors >= 1, so surface distance/pace remains an admissible lower bound.
    const cost = settings.priority === 'distance' ? distance : seconds * (1 + (exposure / 15) ** 2 + (observed ? 0 : 0.15))
    return { distance, seconds, cost, maximum }
  }
  const endpointNode = (point, value) => {
    const x = Math.round((point.longitude - bounds[0]) / (bounds[2] - bounds[0]) * (cols - 1))
    const y = Math.round((point.latitude - bounds[1]) / (bounds[3] - bounds[1]) * (rows - 1))
    const candidates = []
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy, id = yy * cols + xx
      if (xx < 0 || yy < 0 || xx >= cols || yy >= rows || !nodes[id]) continue
      const connection = edge({ ...point, ...value }, nodes[id])
      if (connection) candidates.push({ id, connection })
    }
    return candidates
  }
  const first = endpointNode(start, a), last = endpointNode(goal, b)
  if (!first.length || !last.length) return { error: 'No traversable connection at an endpoint. Move it farther from the blocked terrain.' }
  const g = new Float64Array(nodes.length).fill(Infinity), parents = new Int32Array(nodes.length).fill(-1)
  const frontier = new Frontier()
  const estimate = id => distanceBetween(nodes[id], goal, data.radius) / (settings.priority === 'distance' ? 1 : settings.pace)
  const exits = new Map(last.map(({ id }) => [id, edge(nodes[id], { ...goal, ...b })]).filter(([, connection]) => connection))
  for (const { id, connection } of first) {
    g[id] = connection.cost; frontier.push(id, connection.cost, connection.cost + estimate(id))
  }
  let bestGoal = -1, bestCost = Infinity
  let visited = 0
  while (frontier.items.length) {
    const item = frontier.pop(), id = item.node
    if (item.cost > g[id]) continue
    if (item.score >= bestCost) break
    const exit = exits.get(id)
    if (exit && g[id] + exit.cost < bestCost) { bestCost = g[id] + exit.cost; bestGoal = id }
    visited++
    const x = id % cols, y = Math.floor(id / cols)
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue
      const xx = x + dx, yy = y + dy, next = yy * cols + xx
      if (xx < 0 || yy < 0 || xx >= cols || yy >= rows || !nodes[next]) continue
      if (dx && dy && (!nodes[y * cols + xx] || !nodes[yy * cols + x])) continue
      const connection = edge(nodes[id], nodes[next])
      if (!connection) continue
      const cost = g[id] + connection.cost
      if (cost >= g[next]) continue
      g[next] = cost; parents[next] = id; frontier.push(next, cost, cost + estimate(next))
    }
  }
  if (bestGoal !== -1) {
    const path = []
    for (let cursor = bestGoal; cursor !== -1; cursor = parents[cursor]) path.push(nodes[cursor])
    const points = [{ ...start, ...a }, ...path.reverse(), { ...goal, ...b }]
      .filter((p, i, all) => i === 0 || distanceBetween(all[i - 1], p, data.radius) > 0.001)
    // Remove grid zigzags only after checking the whole replacement corridor.
    // No splines: they can cut through slopes or blocked areas without validation.
    const clean = [points[0]]
    for (let i = 0; i < points.length - 1;) {
      let chosen = i + 1, originalCost = 0
      for (let j = i + 1; j <= Math.min(points.length - 1, i + 24); j++) {
        originalCost += edge(points[j - 1], points[j]).cost
        const direct = edge(points[i], points[j])
        if (direct && direct.cost <= originalCost * 1.01) chosen = j
      }
      clean.push(points[chosen]); i = chosen
    }
    // Retain sampled heights for directed timing, traversal and terrain-following display.
    const sampled = [clean[0]]
    for (let i = 1; i < clean.length; i++) {
      const count = Math.max(1, Math.ceil(distanceBetween(clean[i - 1], clean[i], data.radius) / (local ? 3 : 15)))
      for (let j = 1; j <= count; j++) {
        const point = interpolatePoint(clean[i - 1], clean[i], j / count)
        sampled.push({ ...point, ...sample(point) })
      }
    }
    const route = buildRoute(sampled, data.radius, settings.pace)
    const maximum = clean.slice(1).reduce((slope, p, i) => Math.max(slope, edge(clean[i], p).maximum), 0)
    return { route: { ...route, maxSlope: maximum, gridMetres: cellSize, bounds, visited, source: local ? 'HiRISE / CTX elevation' : 'CTX regional elevation', priority: settings.priority } }
  }
  return { error: 'No route found within this search area and slope limit. Move an endpoint or review blocked areas.' }
}

function pathOrHome(data, start, goal, settings, hazards, surveys) {
  if (distanceBetween(start, goal, data.radius) < 1) return { route: buildRoute([{ ...goal, ...terrainSample(data, goal) }], data.radius, settings.pace) }
  return findPath(data, start, goal, settings, hazards, surveys)
}

export function planMission(data, request) {
  const { start, goal, base, settings, hazards, surveys, remainingSeconds, oxygenSeconds, mode } = request
  if (!settings || ![settings.pace, settings.maxSlope, remainingSeconds, oxygenSeconds, settings.reserveSeconds, settings.activitySeconds].every(Number.isFinite) || settings.pace <= 0 || settings.maxSlope <= 0) return { status: 'error', message: 'Planning limits are invalid. Review the resource settings.' }
  const currentReturn = pathOrHome(data, start, base, settings, hazards, surveys)
  const outward = findPath(data, start, goal, settings, hazards, surveys)
  if (!outward.route) return { status: 'blocked', message: outward.error, currentReturn: currentReturn.route ?? null }
  const returnPlan = mode === 'return' ? { route: buildRoute([base], data.radius, settings.pace) } : pathOrHome(data, goal, base, settings, hazards, surveys)
  if (!returnPlan.route || !currentReturn.route) return { status: 'blocked', message: 'A return path could not be established under these limits.', currentReturn: currentReturn.route ?? null }
  // At every point, backtracking + the verified start return is available.
  // Budget against that conservative fallback as well as the destination return.
  const returnSeconds = Math.max(returnPlan.route.duration, outward.route.reverseDuration + currentReturn.route.duration)
  const activity = mode === 'return' ? 0 : settings.activitySeconds
  const required = outward.route.duration + (mode === 'return' ? 0 : returnSeconds) + activity + settings.reserveSeconds
  const available = Math.min(remainingSeconds, oxygenSeconds)
  const reserveWarning = mode === 'return' && required > available && outward.route.duration <= available
  const resources = [
    ['time', 'Mission time', remainingSeconds, settings.budgetSeconds],
    ['oxygen', 'O₂ autonomy', oxygenSeconds, settings.oxygenSeconds],
  ].map(([id, label, availableSeconds, total]) => ({ id, label, availableSeconds, requiredSeconds: required,
    minimumTotalSeconds: required + Math.max(0, total - availableSeconds), shortfallSeconds: Math.max(0, required - availableSeconds) }))
  const limited = required > available
  return { status: limited ? 'resources' : 'ready', route: outward.route, currentReturn: currentReturn.route, goalReturn: returnPlan.route,
    resources, executionAllowed: !limited, outboundSeconds: mode === 'return' ? 0 : outward.route.duration,
    returnSeconds: mode === 'return' ? outward.route.duration : returnPlan.route.duration, conservativeReturnSeconds: mode === 'return' ? outward.route.duration : returnSeconds,
    activitySeconds: activity, reserveSeconds: settings.reserveSeconds,
    message: limited ? 'Route calculated. Traversal is locked by insufficient resources. Open Route → Plan to review the minimums or shorten the route.' : undefined,
    requiredSeconds: required, availableSeconds: available, reserveWarning, explanation: reserveWarning
      ? 'Return is estimated to be reachable, but the required reserve cannot be maintained. Prioritize the return and monitor resources.'
      : `Route avoids known blocked areas and slopes above ${settings.maxSlope}°. Return and ${Math.round(settings.reserveSeconds / 60)} min reserve included.` }
}
