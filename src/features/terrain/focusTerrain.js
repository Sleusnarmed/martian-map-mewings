import * as Cesium from 'cesium'
import { sampleHeight } from './terrainData.js'

export function focusTerrain(context, longitude, latitude, range) {
  if (!context || context.viewer.isDestroyed()) return
  const height = sampleHeight(context.data, longitude, latitude)
  if (height === null) return
  const target = Cesium.Cartesian3.fromDegrees(longitude, latitude, height, context.ellipsoid)
  context.viewer.camera.cancelFlight()
  context.viewer.camera.lookAt(target, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-48), range))
  context.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
  context.viewer.scene.requestRender()
}

