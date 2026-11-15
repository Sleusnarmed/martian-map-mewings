import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_SETTINGS, findPath, planMission, terrainSample } from '../src/features/route-planner/planner.js'
import { distanceBetween, buildRoute } from '../src/features/route-planner/routeGeometry.js'
import { initialMission, missionReducer, missionPresentation } from '../src/features/route-planner/missionState.js'

const terrain = { bounds: [77.39, 18.44, 77.42, 18.47], width: 101, height: 101, radius: 3396190, displayResolutionMeters: 18, heights: new Float32Array(101 * 101).fill(-2500) }
const a = { longitude: 77.4, latitude: 18.455 }, b = { longitude: 77.41, latitude: 18.455 }
const settings = { ...DEFAULT_SETTINGS, budgetSeconds: 7200, oxygenSeconds: 7200 }
const request = { start: a, goal: b, base: a, settings, hazards: [], surveys: [], remainingSeconds: 7200, oxygenSeconds: 7200, mode: 'outbound' }

test('A* connects the exact selected coordinates and respects a blocked area', () => {
  const hazard = { longitude: 77.405, latitude: 18.455, radius: 65, known: true }
  const result = findPath(terrain, a, b, settings, [hazard])
  assert.ok(result.route, result.error)
  assert.equal(result.route.waypoints[0].longitude, a.longitude)
  assert.equal(result.route.waypoints.at(-1).longitude, b.longitude)
  assert.ok(result.route.length > distanceBetween(a, b))
  for (const point of result.route.waypoints) assert.ok(distanceBetween(point, hazard) > 70)
})
test('unknown obstacles are not consulted before discovery', () => {
  const clear = findPath(terrain, a, b, settings)
  const hidden = findPath(terrain, a, b, settings, [{ ...a, radius: 2000, known: false }])
  assert.deepEqual(hidden.route.waypoints, clear.route.waypoints)
})
test('coverage, same point, distance and blocked endpoints fail explicitly', () => {
  assert.match(findPath(terrain, a, a, settings).error, /1 metre/)
  assert.match(findPath(terrain, a, { longitude: 78, latitude: 18.455 }, settings).error, /6 km/)
  assert.match(findPath(terrain, a, b, settings, [{ ...a, radius: 30 }]).error, /endpoint/)
  assert.equal(terrainSample(terrain, { longitude: 77, latitude: 18 }), null)
})
test('local slope sampling uses high resolution detail where reliable', () => {
  const detail = { ...terrain, bounds: [77.399, 18.454, 77.411, 18.456], displayResolutionMeters: 1, blendDegrees: 0.00001,
    heights: Float32Array.from({ length: 10201 }, (_, i) => -2500 + (i % 101) * 10) }
  assert.ok(terrainSample({ ...terrain, detail }, { longitude: 77.405, latitude: 18.455 }).slope > 40)
  assert.equal(findPath({ ...terrain, detail }, a, b, settings).route, undefined)
})
test('mission feasibility includes return, activity, oxygen and reserve', () => {
  assert.equal(planMission(terrain, request).status, 'ready')
  assert.equal(planMission(terrain, { ...request, oxygenSeconds: 600 }).status, 'resources')
  assert.equal(planMission(terrain, { ...request, remainingSeconds: 600 }).status, 'resources')
})
test('route durations distinguish uphill and downhill', () => {
  const route = buildRoute([{ ...a, height: 0 }, { ...b, height: 40 }])
  assert.ok(route.duration > route.reverseDuration)
})

function readyState() {
  let state = initialMission()
  state = missionReducer(state, { type: 'settings', values: settings })
  state = missionReducer(state, { type: 'endpoint', target: 'a', point: a })
  state = missionReducer(state, { type: 'endpoint', target: 'b', point: b })
  state = missionReducer(state, { type: 'plan' })
  return missionReducer(state, { type: 'planned', id: state.request.id, result: planMission(terrain, state.request) })
}
test('HUD, time and position follow traversal; delay triggers reserve alert', () => {
  const start = readyState(), next = missionReducer(start, { type: 'advance', metres: 25 })
  assert.ok(next.elapsed > start.elapsed)
  assert.ok(next.position.longitude > start.position.longitude)
  assert.ok(missionPresentation(next).remainingDistanceMeters < missionPresentation(start).remainingDistanceMeters)
  const delayed = missionReducer(next, { type: 'delay', seconds: 7100 })
  assert.equal(delayed.notice.title, 'Return reserve low')
  assert.equal(delayed.playing, false)
})
test('discovery pauses before crossing an obstacle and requests a new path', () => {
  const start = missionReducer(readyState(), { type: 'obstacle-ahead' })
  assert.ok(start.hazards.some(h => !h.known))
  const advanced = missionReducer(start, { type: 'advance', metres: 1000 })
  assert.equal(advanced.phase, 'calculating')
  assert.equal(advanced.playing, false)
  assert.ok(advanced.hazards[0].known)
  assert.ok(distanceBetween(advanced.position, advanced.hazards[0]) > advanced.hazards[0].radius + 5)
  assert.equal(advanced.request.hazards.length, 1)
  assert.equal(planMission(terrain, advanced.request).status, 'ready')
})
test('editing endpoints invalidates routes and stale worker replies', () => {
  const ready = readyState()
  const changed = missionReducer(ready, { type: 'endpoint', target: 'b', point: { ...b, latitude: 18.456 } })
  assert.equal(changed.result, null)
  assert.deepEqual(missionReducer(changed, { type: 'planned', id: 1, result: ready.result }), changed)
})
