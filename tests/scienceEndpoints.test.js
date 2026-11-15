import test from 'node:test'
import assert from 'node:assert/strict'
import { JEZERO_POINTS } from '../src/features/terrain/pointsOfInterest.js'
import { initialMission, missionReducer } from '../src/features/route-planner/missionState.js'

test('every published science point can fill either requested route endpoint', () => {
  for (const point of JEZERO_POINTS) {
    for (const target of ['a', 'b']) {
      const other = target === 'a' ? 'b' : 'a'
      const existing = JEZERO_POINTS.find(item => item.id !== point.id)
      let state = missionReducer(initialMission(), { type: 'endpoint', target: other, point: existing })
      state = missionReducer(state, { type: 'pick', target })
      state = missionReducer(state, { type: 'inspect', point })
      // Opening Route dismisses the inspector, without losing the selected site.
      state = missionReducer(state, { type: 'dismiss-inspection' })
      assert.deepEqual(state[target], point)
      assert.deepEqual(state[other], existing)
      assert.equal(state.pickTarget, null)
      assert.equal(state.inspection, null)
      assert.equal(state.notice.title, 'Endpoints ready')
    }
  }
})

test('assigning a science point explicitly replaces only that endpoint and invalidates the prior route', () => {
  let state = missionReducer(initialMission(), { type: 'endpoint', target: 'a', point: JEZERO_POINTS[0] })
  state = missionReducer(state, { type: 'endpoint', target: 'b', point: JEZERO_POINTS[1] })
  state = { ...state, result: { route: { length: 200 } }, phase: 'ready' }
  const next = missionReducer(state, { type: 'endpoint', target: 'b', point: JEZERO_POINTS.at(-1) })
  assert.deepEqual(next.a, state.a)
  assert.deepEqual(next.b, JEZERO_POINTS.at(-1))
  assert.equal(next.result, null)
  assert.equal(next.phase, 'selecting')
})
