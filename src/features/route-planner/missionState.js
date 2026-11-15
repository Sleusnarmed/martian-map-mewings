import { DEFAULT_SETTINGS } from './planner.js'
import { distanceBetween, pointOnRoute } from './routeGeometry.js'

export const OBSERVATION_RADIUS = 65
const notice = (id, title, text, level = 'info') => ({ id: String(id), title, text, level, provenance: 'computed' })
export function initialMission() {
  return { a: null, b: null, inspection: null, pickTarget: null, position: null, mode: 'outbound', phase: 'selecting',
    settings: { ...DEFAULT_SETTINGS }, elapsed: 0, delay: 0, legDistance: 0, completedDistance: 0,
    result: null, request: null, revision: 0, hazards: [], surveys: [], coverageBounds: null, event: 0, playing: false, rate: 10, returnOrigin: 1,
    notice: notice('select', 'Select your route', 'Tap the map to inspect coordinates, then set point A and point B.') }
}

function alert(state, title, text, level = 'info') {
  const event = state.event + 1
  return { ...state, event, notice: notice(event, title, text, level) }
}

function survey(surveys, point) {
  if (surveys.some(p => distanceBetween(point, p) < 20)) return surveys
  // Bounded mission history; existing coverage is retained for this local excursion.
  return [...surveys, { ...point, radius: OBSERVATION_RADIUS }].slice(-512)
}

function requestPlan(state, reason = 'calculate', mode = state.mode) {
  if (!state.a || !state.b) return state
  const start = state.position ?? state.a, goal = mode === 'return' ? state.a : state.b
  if (distanceBetween(start, goal) < 1) return alert({ ...state, phase: 'arrived', mode, playing: false, result: mode === 'return' ? null : state.result }, 'Destination reached', mode === 'return' ? 'You are back at point A.' : 'You have reached point B.')
  const id = state.revision + 1
  const returnOrigin = mode === 'return' ? missionPresentation(state).routeProgress ?? state.returnOrigin : state.returnOrigin
  return { ...state, revision: id, phase: 'calculating', playing: false, mode, returnOrigin,
    completedDistance: state.completedDistance + state.legDistance, legDistance: 0,
    request: { id, reason, start, goal, base: state.a, mode, settings: state.settings,
      hazards: state.hazards.filter(h => h.known), surveys: state.surveys,
      remainingSeconds: state.settings.budgetSeconds - state.elapsed,
      oxygenSeconds: state.settings.oxygenSeconds - state.elapsed }, result: null }
}

export function returnEstimate(state) {
  if (state.phase === 'arrived' && state.mode === 'return') return 0
  if (!state.result?.route || !state.result.currentReturn) return state.result?.currentReturn?.duration ?? null
  const route = state.result.route
  if (state.mode === 'return') return Math.max(0, route.duration - pointOnRoute(route, state.legDistance).seconds)
  const progress = pointOnRoute(route, state.legDistance)
  const backward = progress.reverseSeconds + state.result.currentReturn.duration
  const forward = route.duration - progress.seconds + state.result.goalReturn.duration
  return Math.min(backward, forward)
}

function checkResources(state) {
  const seconds = returnEstimate(state)
  if (seconds === null) return state
  const margin = Math.min(state.settings.budgetSeconds, state.settings.oxygenSeconds) - state.elapsed - seconds
  if (margin < state.settings.reserveSeconds && state.notice.title !== 'Return reserve low') {
    return alert({ ...state, playing: false }, 'Return reserve low', 'Time or oxygen return margin is below the required reserve. Pause and review the route back to point A.', 'warning')
  }
  return state
}

function advance(state, amount, units) {
  if (state.phase !== 'ready' || !state.result?.route) return state
  const available = Math.min(state.settings.budgetSeconds, state.settings.oxygenSeconds) - state.elapsed
  if (available <= 0) return alert({ ...state, playing: false }, 'Resources exhausted', 'No time or oxygen autonomy remains in the current planning assumptions. Stop the traverse and review mission data.', 'warning')
  if (state.mode !== 'return' && available - returnEstimate(state) < state.settings.reserveSeconds) {
    return alert({ ...state, playing: false }, 'Return reserve low', 'Outbound movement is paused. Review the return route and remaining resources.', 'warning')
  }
  const route = state.result.route
  let next = state, remaining = amount
  // Survey at short intervals even during accelerated playback; never teleport past a hidden obstacle.
  while (remaining > 0.001 && next.legDistance < route.length) {
    const before = pointOnRoute(route, next.legDistance)
    let step = Math.min(5, route.length - next.legDistance)
    let after = pointOnRoute(route, next.legDistance + step)
    if (units === 'metres' && step > remaining) { step = remaining; after = pointOnRoute(route, next.legDistance + step) }
    if (units === 'seconds' && after.seconds - before.seconds > remaining) {
      step *= remaining / (after.seconds - before.seconds)
      after = pointOnRoute(route, next.legDistance + step)
    }
    const delta = after.seconds - before.seconds
    const point = { longitude: after.longitude, latitude: after.latitude }
    next = { ...next, position: point, legDistance: next.legDistance + step, elapsed: next.elapsed + delta, surveys: survey(next.surveys, point) }
    const discovered = next.hazards.filter(h => !h.known && distanceBetween(point, h) <= OBSERVATION_RADIUS + h.radius)
    if (discovered.length) {
      next = { ...next, hazards: next.hazards.map(h => discovered.includes(h) ? { ...h, known: true } : h) }
      next = alert(next, 'Obstacle observed', 'A newly observed blocked area affects the terrain ahead. Movement paused while the route is recalculated.', 'warning')
      return requestPlan(next, 'obstacle')
    }
    remaining -= units === 'metres' ? step : delta
    const checked = checkResources(next)
    if (checked !== next && next.mode !== 'return') return checked
    next = checked
  }
  if (route.length - next.legDistance <= 0.01) {
    return alert({ ...next, phase: 'arrived', playing: false }, 'Destination reached', next.mode === 'return'
      ? 'You have returned to point A. Review your remaining time and oxygen.'
      : 'You have reached point B. Review the science information and your return margin.')
  }
  return next
}

export function missionReducer(state, action) {
  switch (action.type) {
    case 'inspect': {
      const inspected = { ...state, inspection: action.point }
      return state.pickTarget && action.point && !action.point.error
        ? missionReducer(inspected, { type: 'endpoint', target: state.pickTarget, point: action.point }) : inspected
    }
    case 'dismiss-inspection': return { ...state, inspection: null }
    case 'pick': return { ...state, pickTarget: action.target, playing: false }
    case 'endpoint': {
      if (!['a', 'b'].includes(action.target) || !action.point || !Number.isFinite(action.point.longitude) || !Number.isFinite(action.point.latitude)) return state
      const next = { ...initialMission(), settings: state.settings, revision: state.revision + 1, event: state.event,
        a: state.a, b: state.b, inspection: action.point, hazards: state.hazards.filter(h => h.known), [action.target]: action.point }
      next.position = next.a
      next.surveys = next.a ? survey([], next.a) : []
      return alert(next, next.a && next.b ? 'Endpoints ready' : 'Select the other endpoint', next.a && next.b
        ? 'Point A and point B are selected. Calculate the route to review terrain and return resources.'
        : `Point ${action.target.toUpperCase()} selected. Select the other endpoint on the map.`)
    }
    case 'settings': {
      if (state.elapsed > 0 || state.playing) return state
      return { ...state, settings: { ...state.settings, ...action.values }, phase: 'selecting', result: null, request: null, revision: state.revision + 1 }
    }
    case 'plan': return requestPlan(state, 'calculate')
    case 'return': return requestPlan(state, 'return', 'return')
    case 'planned': {
      if (action.id !== state.request?.id) return state
      const ready = action.result.status === 'ready'
      const bounds = action.result.route?.bounds
      const coverageBounds = bounds && state.coverageBounds ? [Math.min(bounds[0], state.coverageBounds[0]), Math.min(bounds[1], state.coverageBounds[1]), Math.max(bounds[2], state.coverageBounds[2]), Math.max(bounds[3], state.coverageBounds[3])] : bounds ?? state.coverageBounds
      const preview = action.result.status === 'resources' && Boolean(action.result.route)
      const updated = { ...state, result: action.result, request: null, phase: ready ? 'ready' : preview ? 'preview' : 'blocked', position: state.position ?? state.a, coverageBounds }
      const obstacle = state.request.reason === 'obstacle'
      const warning = !ready || obstacle || action.result.reserveWarning
      return alert(updated, ready ? obstacle ? 'Route updated after obstacle' : state.mode === 'return' ? 'Return route ready' : 'Route ready' : preview ? 'Route needs more resources' : 'Route unavailable',
        ready ? (obstacle ? 'Blocked area observed. The updated route avoids it. ' : '') + action.result.explanation + ' Review before continuing.' : action.result.message, warning ? 'warning' : 'info')
    }
    case 'advance': return advance(state, action.metres ?? 25, 'metres')
    case 'tick': return state.playing ? advance(state, action.seconds, 'seconds') : state
    case 'play': return state.phase === 'ready' ? { ...state, playing: !state.playing } : state
    case 'rate': return [1, 10, 30].includes(action.rate) ? { ...state, rate: action.rate } : state
    case 'delay': {
      if (!state.a || !state.result || state.phase === 'calculating') return state
      const seconds = action.seconds ?? 480
      const changed = { ...state, elapsed: state.elapsed + seconds, delay: state.delay + seconds, playing: false }
      return requestPlan(checkResources(alert(changed, 'Mission delay', `${Math.round(seconds / 60)} minutes added. Rechecking the route and return margin.`)), 'delay')
    }
    case 'hazard': {
      if (!action.point || state.hazards.length >= 32) return state
      const id = `hazard-${state.event + 1}-${state.hazards.length}`
      const hazard = { ...action.point, id, radius: 20, known: true, provenance: 'operator-reported' }
      const next = alert({ ...state, hazards: [...state.hazards, hazard], playing: false }, 'Blocked area reported', 'The selected area is excluded from planning. Rechecking the route and return.', 'warning')
      return state.a && state.b ? requestPlan(next, 'obstacle') : next
    }
    case 'obstacle-ahead': {
      const route = state.result?.route
      if (!route || state.phase !== 'ready' || route.length - state.legDistance < 160 || state.hazards.some(h => !h.known)) return state
      const point = pointOnRoute(route, state.legDistance + Math.max(130, (route.length - state.legDistance) * 0.65))
      return { ...state, hazards: [...state.hazards, { longitude: point.longitude, latitude: point.latitude,
        id: `unobserved-${state.event}-${state.hazards.length}`, radius: 20, known: false, provenance: 'scenario' }] }
    }
    case 'remove-hazard': {
      const next = { ...state, hazards: state.hazards.filter(h => h.id !== action.id), playing: false }
      return state.a && state.b ? requestPlan(next, 'obstacle-removed') : next
    }
    case 'reset': return { ...initialMission(), settings: state.settings, hazards: state.hazards.filter(h => h.known), revision: state.revision + 1, event: state.event + 1 }
    default: return state
  }
}

export function missionPresentation(state) {
  const route = state.result?.route
  const remaining = state.phase === 'arrived' ? 0 : route ? Math.max(0, route.length - state.legDistance) : null
  const seconds = returnEstimate(state)
  const fraction = route ? state.mode === 'return' ? state.legDistance / Math.max(1, route.length)
    : (state.completedDistance + state.legDistance) / Math.max(1, state.completedDistance + route.length) : null
  return { id: 'planned-mission', mode: state.mode, status: state.phase === 'arrived' ? 'arrived' : 'in-progress',
    nextWaypointName: state.mode === 'return' ? state.a?.name ?? 'Point A' : state.b?.name ?? (state.b ? 'Point B' : 'Select point B'),
    startName: state.a?.name ?? 'Start', destinationName: state.b?.name ?? 'Destination',
    routeProgress: state.phase === 'arrived' ? state.mode === 'return' ? 0 : 1 : fraction === null ? null : state.mode === 'return' ? state.returnOrigin * (1 - fraction) : fraction,
    remainingDistanceMeters: remaining, returnDurationSeconds: seconds,
    returnMarginSeconds: seconds === null ? null : state.settings.budgetSeconds - state.elapsed - seconds,
    oxygenRemainingSeconds: Math.max(0, state.settings.oxygenSeconds - state.elapsed),
    oxygenReturnMarginSeconds: seconds === null ? null : state.settings.oxygenSeconds - state.elapsed - seconds,
    reserveSeconds: state.settings.reserveSeconds, budgetSeconds: state.settings.budgetSeconds,
    elapsedSeconds: state.elapsed, delaySeconds: state.delay, notice: state.notice,
    telemetryNote: 'Estimates from the selected pace and terrain. Autonomy decreases with traversal time and added delays; no suit sensor is connected.' }
}
