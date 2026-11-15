import assert from 'node:assert/strict'
import test from 'node:test'
import { Cartesian3, Matrix3, Math as CesiumMath } from 'cesium'
import {
  buildMarsSky, horizontalSkyDirection, inertialStarDirection, inertialToMarsFixed,
  localSkyFrame, missionSkyInstant,
} from '../src/features/mars-sky/marsSkyModel.js'

test('both MEDA sols map LMST to their own verified dates and advance at Mars time', () => {
  assert.equal(new Date(missionSkyInstant(312, 0.201 / 60)).toISOString(), '2022-01-04T18:15:32.142Z')
  assert.equal(new Date(missionSkyInstant(518, 3.019 / 60)).toISOString(), '2022-08-04T10:10:35.302Z')
  const hour = missionSkyInstant(518, 60) - missionSkyInstant(518, 0)
  assert.ok(Math.abs(hour - 3_698_968.5) < 1)
  assert.equal(missionSkyInstant(999, 720), null)
  assert.equal(missionSkyInstant(518, 1440), null)
})

test('the two MEDA label end times agree with replay converted from the last CSV samples', () => {
  const end312 = missionSkyInstant(312, 23 * 60 + 59 + 59.671 / 60)
  const end518 = missionSkyInstant(518, 23 * 60 + 5 + 37.229 / 60)
  assert.ok(Math.abs(end312 - Date.parse('2022-01-05T18:55:06.841Z')) < 2_000)
  assert.ok(Math.abs(end518 - Date.parse('2022-08-05T09:54:14.976Z')) < 2_000)
})

test('Mars rotation and local horizon agree with independent JPL Horizons observations', () => {
  // Horizons observer table for Sun (10), topocentric coord@499 (77.4059 E,
  // 18.4586 N, 0 km), quantities 1 and 4. Use its astrometric ICRF direction
  // as an input and its airless apparent azimuth/elevation as the reference.
  // The tolerance allows for aberration and the rounded reference coordinates.
  const cases = [
    ['2022-08-04T22:45:00Z', (12 + 17 / 60 + 35.09 / 3600) * 15, -(28 / 60 + 25.8 / 3600), 177.184277, 46.642484],
    ['2022-08-04T22:46:00Z', (12 + 17 / 60 + 35.19 / 3600) * 15, -(28 / 60 + 26.4 / 3600), 177.505375, 46.653203],
    ['2022-01-05T07:45:00Z', (3 + 42 / 60 + 14.50 / 3600) * 15, 19 + 57 / 60 + 6.7 / 3600, 257.058610, 64.457921],
  ]
  for (const [utc, ra, dec, az, alt] of cases) {
    const direction = Matrix3.multiplyByVector(inertialToMarsFixed(Date.parse(utc)), inertialStarDirection(ra, dec), new Cartesian3())
    const { azimuth, altitude } = horizontalSkyDirection(direction, localSkyFrame(77.4059, 18.4586))
    assert.ok(Math.abs(CesiumMath.toDegrees(azimuth) - az) < 0.05, `${utc}: azimuth ${CesiumMath.toDegrees(azimuth)}`)
    assert.ok(Math.abs(CesiumMath.toDegrees(altitude) - alt) < 0.05, `${utc}: altitude ${CesiumMath.toDegrees(altitude)}`)
  }
})

test('the same star changes direction with both the hour and the active sol', () => {
  const observe = (sol, minute) => buildMarsSky(sol, minute).stars.find(star => star.id === 32349).direction
  const initial = observe(518, 735)
  assert.ok(Cartesian3.angleBetween(initial, observe(518, 1095)) > 0.2)
  assert.ok(Cartesian3.angleBetween(initial, observe(312, 735)) > 0.2)
})
