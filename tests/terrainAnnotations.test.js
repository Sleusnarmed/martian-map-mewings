import test from 'node:test'
import assert from 'node:assert/strict'
import { Camera, Cartesian3, Ellipsoid, GeographicProjection, HeadingPitchRange, Matrix4, SceneMode, SceneTransforms } from 'cesium'
import { JEZERO_POINTS } from '../src/features/terrain/pointsOfInterest.js'
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


test('real Cesium camera projects the geographic target to its canvas center at different viewport sizes', () => {
  const ellipsoid = new Ellipsoid(3396190, 3396190, 3396190)
  for (const [width, height] of [[3200, 900], [1600, 900], [600, 1200]]) {
    const canvas = { clientWidth: width, clientHeight: height }
    const scene = { ellipsoid, globe: { ellipsoid }, canvas,
      drawingBufferWidth: width * 2, drawingBufferHeight: height * 2,
      mapProjection: new GeographicProjection(ellipsoid), frameState: { mode: SceneMode.SCENE3D },
      screenSpaceCameraController: { minimumZoomDistance: 1, maximumZoomDistance: 90000 } }
    const camera = scene.camera = new Camera(scene)
    camera.frustum.aspectRatio = width / height
    for (const point of [...JEZERO_POINTS, { longitude: 77.69, latitude: 18.41 }]) {
      const target = Cartesian3.fromDegrees(point.longitude, point.latitude, -2500, ellipsoid)
      for (const [heading, pitch, range] of [[0, -Math.PI / 2, 75000], [1, -.8, 3500], [2, -.2, 500]]) {
        camera.lookAt(target, new HeadingPitchRange(heading, pitch, range))
        camera.lookAtTransform(Matrix4.IDENTITY)
        const screen = projectTerrainPoint(camera, target,
          position => SceneTransforms.worldToWindowCoordinates(scene, position), width, height)
        assert.ok(screen)
        assert.ok(Math.abs(screen.x - width / 2) < 1e-5)
        assert.ok(Math.abs(screen.y - height / 2) < 1e-5)
        const ray = camera.getPickRay(screen)
        const difference = Cartesian3.subtract(target, ray.origin, new Cartesian3())
        const distance = Cartesian3.dot(difference, ray.direction)
        const recovered = Cartesian3.add(ray.origin, Cartesian3.multiplyByScalar(ray.direction, distance, new Cartesian3()), new Cartesian3())
        assert.ok(Cartesian3.distance(recovered, target) < 1e-5)
      }
    }
  }
})
