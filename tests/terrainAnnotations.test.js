import test from 'node:test'
import assert from 'node:assert/strict'
import { Cartesian3, Ellipsoid } from 'cesium'
import { projectTerrainPoint } from '../src/features/terrain/projectTerrainPoint.js'

const camera = { positionWC: new Cartesian3(0, 0, 10), directionWC: new Cartesian3(0, 0, -1) }

test('front-facing annotations retain screen position across repeated frames without depth or GPU picking', () => {
  const position = new Cartesian3(1, 1, 0)
  const original = Cartesian3.clone(position)
  for (let frame = 0; frame < 100; frame++) {
    assert.deepEqual(projectTerrainPoint(camera, position, () => ({ x: 100 + frame, y: 200 }), 800, 600),
      { x: 100 + frame, y: 200 })
  }
  assert.deepEqual(position, original)
})

test('annotations hide behind the camera and outside the viewport, not on failed terrain picks', () => {
  const unexpected = () => { throw new Error('behind-camera points must not be projected') }
  assert.equal(projectTerrainPoint(camera, new Cartesian3(0, 0, 11), unexpected, 800, 600), null)
  const position = new Cartesian3(0, 0, 0)
  for (const screen of [undefined, { x: NaN, y: 5 }, { x: -1, y: 5 }, { x: 801, y: 5 }, { x: 1, y: 601 }]) {
    assert.equal(projectTerrainPoint(camera, position, () => screen, 800, 600), null)
  }
})

test('negative MOLA height does not hide a visible Jezero annotation', () => {
  const ellipsoid = new Ellipsoid(3396190, 3396190, 3396190)
  const position = Cartesian3.fromDegrees(77.40588851, 18.45863707, -2520, ellipsoid)
  const eye = Cartesian3.fromDegrees(77.40588851, 18.457, -2500, ellipsoid)
  const direction = Cartesian3.normalize(Cartesian3.subtract(position, eye, new Cartesian3()), new Cartesian3())
  assert.deepEqual(projectTerrainPoint({ positionWC: eye, directionWC: direction }, position,
    () => ({ x: 400, y: 300 }), 800, 600), { x: 400, y: 300 })
})

test('panel-shifted canvas coordinates align with the visible map rather than drifting right', async () => {
  const { canvasPointToOverlay } = await import('../src/features/terrain/projectTerrainPoint.js')
  const canvasSize = { width: 3200, height: 900 }
  const canvasRect = { left: -1280, top: 137, width: 3200, height: 900 }
  const overlaySize = { width: 1920, height: 900 }
  const overlayRect = { left: 0, top: 137, width: 1920, height: 900 }
  for (const [x, y] of [[1300, 200], [1800, 400], [2500, 600]]) {
    assert.deepEqual(canvasPointToOverlay({ x, y }, canvasSize, canvasRect, overlaySize, overlayRect), { x: x - 1280, y })
  }
  assert.equal(canvasPointToOverlay({ x: 1000, y: 200 }, canvasSize, canvasRect, overlaySize, overlayRect), null)
})

test('portrait top offset, parent scaling and viewport origin are accounted for exactly once', async () => {
  const { canvasPointToOverlay } = await import('../src/features/terrain/projectTerrainPoint.js')
  const size = { width: 400, height: 800 }
  // Both elements scaled 1.5x by their ancestor; canvas starts 200 CSS px above overlay.
  const canvasRect = { left: 30, top: -200, width: 600, height: 1200 }
  const overlayRect = { left: 30, top: 100, width: 600, height: 1200 }
  assert.deepEqual(canvasPointToOverlay({ x: 100, y: 300 }, size, canvasRect, size, overlayRect), { x: 100, y: 100 })
  assert.equal(canvasPointToOverlay({ x: 100, y: 100 }, size, canvasRect, size, overlayRect), null)
  assert.equal(canvasPointToOverlay({ x: 100, y: 300 }, { ...size, width: 0 }, canvasRect, size, overlayRect), null)
})
