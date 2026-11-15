import test from 'node:test'
import assert from 'node:assert/strict'
import { formatMinutes, formatMeters, getReturnState } from '../src/features/mission-detail/missionPresentation.js'

test('display units round only at presentation and never replace unavailable values with zero', () => {
  assert.equal(formatMinutes(215.92650683737713), '3.6 min')
  assert.equal(formatMinutes(-120), '-2 min')
  assert.equal(formatMeters(382.2707267439096), '382 m')
  assert.equal(formatMinutes(0), '0 min')
  for (const value of [null, undefined, NaN, Infinity]) {
    assert.equal(formatMinutes(value), 'No data')
    assert.equal(formatMeters(value), 'No data')
  }
})

test('HUD shows the limiting return margin and compares unrounded values with reserve', () => {
  assert.deepEqual(getReturnState({ returnMarginSeconds: 900, oxygenReturnMarginSeconds: 299.9, reserveSeconds: 300 }),
    { known: true, margin: 299.9, belowReserve: true })
  assert.equal(getReturnState({ returnMarginSeconds: 300, oxygenReturnMarginSeconds: 400, reserveSeconds: 300 }).belowReserve, false)
  assert.equal(getReturnState({ returnMarginSeconds: null, oxygenReturnMarginSeconds: 300, reserveSeconds: 300 }).margin, null)
})
