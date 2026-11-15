import { useEffect } from 'react'
import * as Cesium from 'cesium'
import { loadTerrain, sampleHeight } from './terrainData'
import { createTerrainProvider } from './createTerrainProvider'
import { constrainCamera, MIN_CLEARANCE, MAX_CAMERA_HEIGHT } from './cameraLimits'
import { boundedZoomDistance } from './terrainZoom'
import { pickTerrainRay } from './pickTerrain'
import region from './region.json'
import { configureOfflineCesiumCredit } from '../globe/offlineCesiumCredit.js'

export function useTerrainScene({ container, viewerRef, selectCallback, clusterFocusRef, terrainUrl, attempt, initialPointId, pointsOfInterest, modeRef, setState, setInspection, setRefining }) {
  useEffect(() => {
    const controller = new AbortController()
    let viewer
    const cleanups = []
    async function start() {
      try {
        const data = await loadTerrain(terrainUrl, controller.signal)
        if (controller.signal.aborted) return
        window.CESIUM_BASE_URL = `${import.meta.env.BASE_URL}cesium/`
        const terrainProvider = createTerrainProvider(data)
        const { ellipsoid, rectangle } = terrainProvider.tilingScheme
        configureOfflineCesiumCredit()
        viewer = new Cesium.Viewer(container.current, {
          ellipsoid, depthPlaneEllipsoidOffset: -10000,
          globe: new Cesium.Globe(ellipsoid), terrainProvider, baseLayer: false,
          animation: false, timeline: false, geocoder: false, homeButton: false,
          baseLayerPicker: false, sceneModePicker: false, navigationHelpButton: false,
          fullscreenButton: false, selectionIndicator: false, infoBox: false,
          skyBox: false, skyAtmosphere: false, scene3DOnly: true,
          mapProjection: new Cesium.GeographicProjection(ellipsoid), requestRenderMode: true,
          maximumRenderTimeChange: Infinity, msaaSamples: 1,
          useBrowserRecommendedResolution: false,
        })
        configureOfflineCesiumCredit(viewer)
        viewer.scene.globe.cartographicLimitRectangle = rectangle
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#88553b')
        viewer.scene.globe.showGroundAtmosphere = false
        viewer.scene.globe.enableLighting = false
        viewer.scene.globe.depthTestAgainstTerrain = true
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#07173f')
        const controls = viewer.scene.screenSpaceCameraController
        controls.minimumZoomDistance = MIN_CLEARANCE
        controls.maximumZoomDistance = MAX_CAMERA_HEIGHT
        controls.maximumMovementRatio = 0.035
        controls.inertiaSpin = 0.2
        controls.inertiaTranslate = 0.2
        controls.inertiaZoom = 0
        controls.maximumTiltAngle = Cesium.Math.toRadians(65)
        // One source of camera limits: the complete local DEM, not still-refining tiles.
        controls.enableCollisionDetection = false
        controls.enableZoom = false
        controls.tiltEventTypes = [Cesium.CameraEventType.RIGHT_DRAG, Cesium.CameraEventType.MIDDLE_DRAG, { eventType: Cesium.CameraEventType.LEFT_DRAG, modifier: Cesium.KeyboardEventModifier.CTRL }]
        viewer.scene.globe.maximumScreenSpaceError = 2
        viewer.scene.globe.tileCacheSize = 160
        // Load and display each coarse level before requesting finer descendants.
        // Parent coverage remains visible while individual child tiles refine.
        viewer.scene.globe.loadingDescendantLimit = 0
        viewer.scene.globe.preloadAncestors = true
        viewer.scene.globe.preloadSiblings = false
        viewer.resolutionScale = Math.min(1, 2 / (window.devicePixelRatio || 1))
        viewerRef.current = { viewer, data, ellipsoid }
        const zoomHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
        const zoom = delta => {
          if (modeRef.current === 'walk') return
          const distance = boundedZoomDistance(data, ellipsoid, viewer.camera.position, viewer.camera.direction, viewer.camera.pitch, delta)
          if (distance === 0) return
          viewer.camera.move(viewer.camera.direction, distance)
          viewer.scene.requestRender()
        }
        zoomHandler.setInputAction(zoom, Cesium.ScreenSpaceEventType.WHEEL)
        zoomHandler.setInputAction(event => zoom((event.distance.endPosition.y - event.distance.startPosition.y) * 4), Cesium.ScreenSpaceEventType.PINCH_MOVE)
        cleanups.push(() => zoomHandler.destroy())
        // Set the regional camera immediately; never render an initial global/flat view.
        const initial = initialPointId === 'wildcat-ridge' ? pointsOfInterest.find(point => point.id === initialPointId) ?? region.center : region.center
        const centerHeight = sampleHeight(data, initial.longitude, initial.latitude)
        viewer.camera.lookAt(Cesium.Cartesian3.fromDegrees(initial.longitude, initial.latitude, centerHeight, ellipsoid), new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-48), initialPointId === 'wildcat-ridge' ? 3500 : 75000))
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
        cleanups.push(viewer.scene.postUpdate.addEventListener(() => {
          const position = viewer.camera.positionCartographic
          const pose = {
            longitude: Cesium.Math.toDegrees(position.longitude),
            latitude: Cesium.Math.toDegrees(position.latitude),
            height: position.height, pitch: viewer.camera.pitch,
          }
          const safe = constrainCamera(data, pose, modeRef.current === 'walk')
          if (!safe) return
          if (Math.abs(safe.longitude - pose.longitude) > 1e-7 || Math.abs(safe.latitude - pose.latitude) > 1e-7 ||
              Math.abs(safe.height - pose.height) > 0.1 || Math.abs(safe.pitch - pose.pitch) > 1e-5) {
            viewer.camera.setView({
              destination: Cesium.Cartesian3.fromDegrees(safe.longitude, safe.latitude, safe.height, ellipsoid),
              orientation: { heading: viewer.camera.heading, pitch: safe.pitch, roll: 0 },
            })
            viewer.scene.requestRender()
          }
          container.current.dataset.cameraHeight = String(viewer.camera.positionCartographic.height)
          container.current.dataset.cameraLongitude = String(viewer.camera.positionCartographic.longitude)
          container.current.dataset.cameraLatitude = String(viewer.camera.positionCartographic.latitude)
        }))
        cleanups.push(viewer.scene.globe.tileLoadProgressEvent.addEventListener(pending => setRefining(pending > 0)))
        cleanups.push(viewer.scene.renderError.addEventListener(() => {
          setState({ status: 'error', message: 'The map renderer stopped. Reload the terrain to resume exploring.' })
        }))
        viewer.screenSpaceEventHandler.setInputAction((click) => {
          const picked = viewer.scene.pick(click.position)
          const properties = picked?.id?.properties
          if (properties?.poiId) {
            const id = properties.poiId.getValue()
            const poi = id === 'jezero' ? { ...region.center, name: 'Jezero crater', id } : pointsOfInterest.find(point => point.id === id)
            if (poi) {
              const elevation = sampleHeight(data, poi.longitude, poi.latitude)
              setInspection({ ...poi, elevation, lon: poi.longitude, lat: poi.latitude })
              clusterFocusRef.current?.(poi)
              return
            }
          }
          if (properties?.longitude && properties?.latitude) {
            const longitude = properties.longitude.getValue(), latitude = properties.latitude.getValue()
            setInspection({ longitude, latitude, lon: longitude, lat: latitude, elevation: sampleHeight(data, longitude, latitude), name: properties.name?.getValue() })
            return
          }
          const ray = viewer.camera.getPickRay(click.position)
          const position = pickTerrainRay(ray, data)
          if (!position) { setInspection({ error: 'No mapped terrain at this point. Select a location inside the elevation coverage.' }); return }
          const cartographic = ellipsoid.cartesianToCartographic(position)
          const lon = Cesium.Math.toDegrees(cartographic.longitude)
          const lat = Cesium.Math.toDegrees(cartographic.latitude)
          const elevation = sampleHeight(data, lon, lat)
          setInspection(elevation === null ? { error: 'No elevation data at this point.' } : { longitude: lon, latitude: lat, lon, lat, elevation })
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        setState({ status: 'ready', data, viewer })
      } catch (error) {
        if (controller.signal.aborted) return
        if (viewer && !viewer.isDestroyed()) viewer.destroy()
        viewerRef.current = null
        setState({ status: 'error', message: error.message })
      }
    }
    start()
    return () => { controller.abort(); cleanups.forEach(remove => remove()); viewerRef.current = null; if (viewer && !viewer.isDestroyed()) viewer.destroy() }
  }, [container, viewerRef, selectCallback, clusterFocusRef, terrainUrl, attempt, initialPointId, pointsOfInterest, modeRef, setState, setInspection, setRefining])

}
