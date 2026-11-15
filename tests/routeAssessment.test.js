import test from 'node:test'
import assert from 'node:assert/strict'
import { currentRouteAssessment } from '../src/features/route-planner/routeAssessment.js'
import { buildRoute, MARS_RADIUS } from '../src/features/route-planner/routeGeometry.js'

const a = { latitude: 0, longitude: 0, height: 0 }
const b = { latitude: 0, longitude: 100 / MARS_RADIUS * 180 / Math.PI, height: 0 }
const route = buildRoute([a, b], MARS_RADIUS, 0.5)
const state = { mode: 'outbound', legDistance: 25, elapsed: 150, settings: { budgetSeconds: 1000, oxygenSeconds: 900 },
  result: { route, requiredSeconds: 500, outboundSeconds: 200, returnSeconds: 200, conservativeReturnSeconds: 200,
    resources: [{ id: 'time' }, { id: 'oxygen' }] } }

test('route assessment uses the same current availability as telemetry without mutating the plan', () => {
  const original = structuredClone(state)
  const result = currentRouteAssessment(state)
  assert.equal(result.outboundSeconds, 150)
  assert.equal(result.returnSeconds, 200)
  assert.equal(result.requiredSeconds, 450)
  assert.deepEqual(result.resources.map(r => r.availableSeconds), [850, 750])
  assert.deepEqual(result.resources.map(r => r.minimumTotalSeconds), [600, 600])
  assert.equal(result.status, 'ready')
  assert.deepEqual(state, original)
})

test('return assessment counts the remaining return once and retains the reserve', () => {
  const result = currentRouteAssessment({ ...state, mode: 'return', result: { ...state.result, requiredSeconds: 250 } })
  assert.equal(result.outboundSeconds, 0)
  assert.equal(result.returnSeconds, 150)
  assert.equal(result.conservativeReturnSeconds, 150)
  assert.equal(result.requiredSeconds, 200)
})

test('current shortages remain visible after time has passed', () => {
  const result = currentRouteAssessment({ ...state, elapsed: 500 })
  assert.equal(result.status, 'resources')
  assert.equal(result.resources[0].shortfallSeconds, 0)
  assert.equal(result.resources[1].shortfallSeconds, 50)
})

test('exhausted autonomy displays zero while its total-budget deficit stays explicit', () => {
  const result = currentRouteAssessment({ ...state, elapsed: 950 })
  assert.equal(result.resources[1].availableSeconds, 0)
  assert.equal(result.resources[1].shortfallSeconds, 500)
  assert.equal(result.resources[1].minimumTotalSeconds, 1400)
})
