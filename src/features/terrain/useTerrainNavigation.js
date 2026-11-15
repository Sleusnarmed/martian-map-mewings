import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import { insideBounds, pitchForRange, slopeAt, surfaceDistance } from './terrainAnalysis'
import { orbitalDetailLayer } from './wildcatImagery'
import { detailWeight, sampleHeight } from './terrainData'
import { pickTerrainRay } from './pickTerrain'
import { cameraGroundPoint, LOWERED_PITCH, placeExplorer, useExplorerControls } from './useExplorerControls'
import { bearingTo, routePosition } from '../route-planner/routeGeometry.js'

function screenPoint(viewer, data, x, y) {
  const ray = viewer.camera.getPickRay(new Cesium.Cartesian2(x, y))
  return pickTerrainRay(ray, data)
}

function viewTarget(viewer, data) {
  return screenPoint(viewer, data, viewer.canvas.clientWidth / 2, viewer.canvas.clientHeight / 2)
}

export function useTerrainNavigation(viewer, data, route) {
  const [mode, setMode] = useState('auto')
  const [context, setContext] = useState(null)
  const modeRef = useRef(mode)
  const flight = useRef(false)
  const explorer = useExplorerControls(viewer, data, mode === 'walk')

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return
    // Refine visible close-up terrain; keep the regional overview inexpensive.
    // Cesium's mutable scene is owned by this synchronization effect.
    // eslint-disable-next-line react-hooks/immutability
    viewer.scene.globe.maximumScreenSpaceError = mode === 'walk' ? 1 : 2
    viewer.scene.requestRender()
  }, [viewer, mode])

  function reframe(nextMode, factor = 1, heading, exitExplorer = false) {
    if (!viewer || viewer.isDestroyed()) return
    viewer.camera.cancelFlight()
    let target = exitExplorer ? null : viewTarget(viewer, data)
    if (exitExplorer) {
      const { longitude, latitude } = cameraGroundPoint(viewer)
      const height = sampleHeight(data, longitude, latitude)
      if (height !== null) target = Cesium.Cartesian3.fromDegrees(longitude, latitude, height, viewer.scene.globe.ellipsoid)
    }
    if (!target) return
    const center = viewer.scene.globe.ellipsoid.cartesianToCartographic(target)
    const weight = detailWeight(data.detail, Cesium.Math.toDegrees(center.longitude), Cesium.Math.toDegrees(center.latitude))
    const range = exitExplorer ? 1600
      : Math.min(80000, Math.max(weight >= 0.99 ? 250 : 1100, Cesium.Cartesian3.distance(viewer.camera.positionWC, target) * factor))
    const pitch = pitchForRange(range, nextMode)
    flight.current = true
    viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 1), {
      offset: new Cesium.HeadingPitchRange(heading ?? viewer.camera.heading, pitch, range),
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.65,
      complete: () => { flight.current = false; viewer.scene.requestRender() },
      cancel: () => { flight.current = false },
    })
    viewer.scene.requestRender()
  }

  function startRoute() {
    if (!viewer || viewer.isDestroyed()) return
    const target = viewTarget(viewer, data)
    const start = route?.waypoints[0] ?? (target && cameraGroundPointForTarget(viewer.scene.globe.ellipsoid, target))
    if (!start) return
    const first = route?.waypoints[1]
    modeRef.current = 'walk'
    setMode('walk')
    viewer.camera.cancelFlight()
    placeExplorer(viewer, data, start, first ? bearingTo(start, first) : viewer.camera.heading, LOWERED_PITCH)
  }

  function aimAtWaypoint() {
    if (!viewer || viewer.isDestroyed() || !route || modeRef.current !== 'walk') return
    const point = cameraGroundPoint(viewer)
    const guidance = routePosition(route, point)
    placeExplorer(viewer, data, point, guidance.bearing, LOWERED_PITCH)
  }

  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !data) return
    let lastUpdate = 0, trailingFrame
    const update = () => {
      const now = performance.now()
      if (now - lastUpdate < 250) {
        if (!trailingFrame) trailingFrame = setTimeout(() => { trailingFrame = null; if (!viewer.isDestroyed()) viewer.scene.requestRender() }, 260)
        return
      }
      lastUpdate = now
      const ellipsoid = viewer.scene.globe.ellipsoid
      const walking = modeRef.current === 'walk'
      const target = walking ? null : viewTarget(viewer, data)
      if (!walking && !target) { setContext({ outside: true }); return }
      const coords = walking ? cameraGroundPoint(viewer) : cameraGroundPointForTarget(ellipsoid, target)
      const { longitude: lon, latitude: lat } = coords
      const elevation = sampleHeight(data, lon, lat)
      if (elevation === null) { setContext({ outside: true }); return }
      let scale = null
      if (!walking) {
        const width = viewer.canvas.clientWidth, height = viewer.canvas.clientHeight
        const left = screenPoint(viewer, data, width / 2 - 50, height / 2)
        const right = screenPoint(viewer, data, width / 2 + 50, height / 2)
        if (left && right) scale = surfaceDistance(ellipsoid.cartesianToCartographic(left), ellipsoid.cartesianToCartographic(right), data.radius)
      }
      const cameraHeight = viewer.camera.positionCartographic.height
      setContext({ lon, lat, elevation, scale, slope: slopeAt(data, lon, lat, true), localSlope: detailWeight(data.detail, lon, lat) >= 0.99,
        detail: insideBounds(orbitalDetailLayer.bounds, lon, lat),
        hirise: detailWeight(data.detail, lon, lat) > 0,
        range: walking ? cameraHeight - elevation : Cesium.Cartesian3.distance(viewer.camera.positionWC, target),
        guidance: walking && route ? routePosition(route, coords) : null,
        heading: Cesium.Math.zeroToTwoPi(viewer.camera.heading) * 180 / Math.PI,
        pitch: viewer.camera.pitch * 180 / Math.PI,
      })
    }
    const removeRender = viewer.scene.postRender.addEventListener(update)
    const removeEnd = viewer.camera.moveEnd.addEventListener(() => {
      // Preserve the user's orbit/tilt in 2.5D; only 2D enforces a nadir view.
      if (flight.current || modeRef.current !== 'map') return
      const target = viewTarget(viewer, data)
      if (!target) return
      const range = Cesium.Cartesian3.distance(viewer.camera.positionWC, target)
      const desired = pitchForRange(range, modeRef.current)
      if (Math.abs(viewer.camera.pitch - desired) < 0.025) return
      flight.current = true
      viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(target, 1), {
        offset: new Cesium.HeadingPitchRange(viewer.camera.heading, desired, range),
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.65,
        complete: () => { flight.current = false }, cancel: () => { flight.current = false },
      })
    })
    viewer.scene.requestRender()
    return () => { clearTimeout(trailingFrame); removeRender(); removeEnd() }
  }, [viewer, data, route])

  return { context, mode, modeRef, route, explorer, startRoute, aimAtWaypoint,
    chooseMode: next => {
      if (modeRef.current === next) return
      if (next === 'walk') { startRoute(); return }
      const exitExplorer = modeRef.current === 'walk'
      modeRef.current = next
      setMode(next)
      reframe(next, 1, undefined, exitExplorer)
    },
    zoom: factor => reframe(modeRef.current, factor),
    north: () => {
      if (modeRef.current === 'walk' && viewer && !viewer.isDestroyed()) {
        placeExplorer(viewer, data, cameraGroundPoint(viewer), 0)
      } else reframe(modeRef.current, 1, 0)
    },
  }
}

function cameraGroundPointForTarget(ellipsoid, target) {
  const point = ellipsoid.cartesianToCartographic(target)
  return { longitude: Cesium.Math.toDegrees(point.longitude), latitude: Cesium.Math.toDegrees(point.latitude) }
}
