import test from 'node:test'
import assert from 'node:assert/strict'
import { Ellipsoid, Matrix4 } from 'cesium'
import { focusTerrain } from '../src/features/terrain/focusTerrain.js'

function fixture() {
  const calls = []
  const ellipsoid = new Ellipsoid(3396190, 3396190, 3396190)
  const viewer = {
    isDestroyed: () => false,
    camera: {
      cancelFlight: () => calls.push('cancel'),
      lookAt: (target, pose) => calls.push({ target, pose }),
      lookAtTransform: transform => calls.push(transform),
    },
    scene: { requestRender: () => calls.push('render') },
  }
  return { calls, viewer, ellipsoid, data: { bounds: [77, 18, 78, 19], width: 2, height: 2, heights: new Float32Array(4).fill(-2500) } }
}

test('terrain focus cancels a pending flight and frames the DEM height before rendering', () => {
  const context = fixture()
  focusTerrain(context, 77.5, 18.5, 3500)
  const [cancel, frame, transform, render] = context.calls
  assert.equal(cancel, 'cancel')
  assert.ok(Math.abs(context.ellipsoid.cartesianToCartographic(frame.target).height + 2500) < 0.001)
  assert.equal(frame.pose.range, 3500)
  assert.ok(Math.abs(frame.pose.pitch + 48 * Math.PI / 180) < 1e-12)
  assert.equal(transform, Matrix4.IDENTITY)
  assert.equal(render, 'render')
})

test('missing, destroyed and out-of-coverage terrain do not move the camera', () => {
  focusTerrain(null, 77.5, 18.5, 3500)
  const context = fixture()
  focusTerrain(context, 80, 18.5, 3500)
  context.viewer.isDestroyed = () => true
  focusTerrain(context, 77.5, 18.5, 3500)
  assert.deepEqual(context.calls, [])
})
