import test from 'node:test'
import assert from 'node:assert/strict'
import { buildRoute, pointOnRoute, MARS_RADIUS } from '../src/features/route-planner/routeGeometry.js'
import { initialMission, missionReducer, missionPresentation } from '../src/features/route-planner/missionState.js'

const point = (metres, height = 0) => ({ longitude: metres / MARS_RADIUS * 180 / Math.PI, latitude: 0, height })
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`)
function fixture() {
  const route = buildRoute([point(0), point(2), point(5, 1), point(12, 1)], MARS_RADIUS, 0.5)
  return { ...initialMission(), a: point(0), b: point(12, 1), position: point(0), phase: 'ready', playing: true,
    settings: { ...initialMission().settings, budgetSeconds: 1000, oxygenSeconds: 900, reserveSeconds: 10 },
    result: { route, currentReturn: { duration: 0 }, goalReturn: { duration: route.reverseDuration } } }
}

test('playback spends exactly the requested seconds across a change of slope', () => {
  const state = fixture()
  const next = missionReducer(state, { type: 'tick', seconds: 5 })
  // First 2 m: 4 s. Next segment: (3 / .5) * (1 + 4/3) = 14 s.
  close(next.elapsed, 5)
  close(next.legDistance, 2 + 3 / 14)
  close(pointOnRoute(state.result.route, next.legDistance).seconds, next.elapsed)
})

test('one long tick and many short ticks give the same time, distance and margins', () => {
  const start = fixture()
  const long = missionReducer(start, { type: 'tick', seconds: 19 })
  let short = start
  for (let i = 0; i < 190; i++) short = missionReducer(short, { type: 'tick', seconds: 0.1 })
  close(long.elapsed, short.elapsed)
  close(long.legDistance, short.legDistance)
  close(missionPresentation(long).oxygenReturnMarginSeconds, missionPresentation(short).oxygenReturnMarginSeconds)
})

test('movement cannot overspend the remaining mission or oxygen time', () => {
  const start = { ...fixture(), mode: 'return', elapsed: 899.5 }
  const next = missionReducer(start, { type: 'tick', seconds: 30 })
  close(next.elapsed, 900)
  close(next.legDistance, 0.25)
  assert.equal(next.playing, false)
})

test('outbound movement stops at the reserve boundary rather than overshooting a five-metre step', () => {
  const start = fixture()
  start.settings.oxygenSeconds = 11
  const next = missionReducer(start, { type: 'advance', metres: 25 })
  const display = missionPresentation(next)
  close(display.oxygenReturnMarginSeconds, 10)
  close(next.legDistance, 0.25)
  assert.equal(next.playing, false)
})

test('telemetry uses directed return time and subtracts elapsed time exactly once', () => {
  const start = fixture()
  const next = missionReducer(start, { type: 'advance', metres: 5 })
  const display = missionPresentation(next)
  close(next.elapsed, 18)
  close(display.returnDurationSeconds, 12) // downhill: 4 + (3/.5)*(1+1/3)
  close(display.returnMarginSeconds, 970)
  close(display.oxygenRemainingSeconds, 882)
  close(display.oxygenReturnMarginSeconds, 870)
  const delayed = missionReducer(next, { type: 'delay', seconds: 480 })
  close(delayed.elapsed, 498)
  close(delayed.delay, 480)
  assert.equal(missionPresentation(delayed).returnMarginSeconds, null)
  close(missionPresentation(delayed).oxygenRemainingSeconds, 402)
})

test('invalid traversal and delay inputs cannot corrupt telemetry or add autonomy', () => {
  const state = fixture()
  for (const value of [NaN, Infinity, -10, 0]) {
    assert.equal(missionReducer(state, { type: 'advance', metres: value }), state)
    assert.equal(missionReducer(state, { type: 'tick', seconds: value }), state)
    assert.equal(missionReducer(state, { type: 'delay', seconds: value }), state)
  }
})

test('arrival uses only travel time left, and the return countdown reaches zero at A', () => {
  let state = fixture()
  const duration = state.result.route.duration
  state = missionReducer(state, { type: 'tick', seconds: 1000 })
  close(state.elapsed, duration)
  assert.equal(state.phase, 'arrived')
  close(missionPresentation(state).remainingDistanceMeters, 0)
  close(missionPresentation(state).returnDurationSeconds, state.result.route.reverseDuration)
  const route = buildRoute([...state.result.route.waypoints].reverse(), MARS_RADIUS, 0.5)
  state = { ...state, mode: 'return', phase: 'ready', playing: true, legDistance: 0,
    result: { route, currentReturn: { duration: route.duration }, goalReturn: { duration: 0 } } }
  state = missionReducer(state, { type: 'tick', seconds: 1000 })
  close(state.elapsed, duration + route.duration)
  close(missionPresentation(state).returnDurationSeconds, 0)
  close(missionPresentation(state).remainingDistanceMeters, 0)
})
