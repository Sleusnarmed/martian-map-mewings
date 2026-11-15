import { useEffect, useRef } from 'react'
import { Cartesian3, Color, PointPrimitiveCollection } from 'cesium'

// Positions are camera-relative along Mars-fixed directions. Terrain occludes
// the markers normally, so ridges can rise above the geometric horizon.
const SKY_DISTANCE = 2_000_000
const STAR_COLOR = Color.fromCssColorString('#f5f9ff')
const STAR_OUTLINE = Color.fromCssColorString('#25344e').withAlpha(0.48)

export function useMarsSceneSky(viewer, enabled, sky) {
  const controllerRef = useRef(null)
  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !enabled) return
    const { scene, camera, ellipsoid } = viewer
    const points = scene.primitives.add(new PointPrimitiveCollection())
    let stars = []
    let dirty = true
    const lastPosition = new Cartesian3()
    const up = new Cartesian3()
    const position = new Cartesian3()

    function update() {
      const eye = camera.positionWC
      if (!dirty && Cartesian3.equalsEpsilon(eye, lastPosition, 0, 0.25)) return
      dirty = false
      Cartesian3.clone(eye, lastPosition)
      ellipsoid.geodeticSurfaceNormal(eye, up)
      for (let index = 0; index < stars.length; index++) {
        const point = points.get(index)
        const { direction } = stars[index]
        point.show = Cartesian3.dot(up, direction) > 0
        if (!point.show) continue
        Cartesian3.multiplyByScalar(direction, SKY_DISTANCE, position)
        Cartesian3.add(eye, position, position)
        point.position = position
      }
    }

    controllerRef.current = frame => {
      const next = frame?.stars ?? []
      if (points.length !== next.length) {
        points.removeAll()
        for (const { magnitude } of next) {
          points.add({
            position: Cartesian3.ZERO,
            pixelSize: Math.max(3, 6.8 - 0.78 * magnitude),
            color: STAR_COLOR.withAlpha(Math.min(1, 1.08 - 0.07 * Math.max(0, magnitude))),
            outlineColor: STAR_OUTLINE,
            outlineWidth: 0.75,
          })
        }
      }
      stars = next
      dirty = true
      scene.requestRender()
    }

    const removeListener = scene.preRender.addEventListener(update)
    return () => {
      removeListener()
      controllerRef.current = null
      if (!viewer.isDestroyed()) {
        scene.primitives.remove(points)
        scene.requestRender()
      }
    }
  }, [viewer, enabled])

  useEffect(() => {
    if (enabled) controllerRef.current?.(sky)
  }, [viewer, enabled, sky])
}
