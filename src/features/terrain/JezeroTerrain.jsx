import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { DEM_SOURCE, loadTerrain, sampleHeight } from './terrainData'
import { createTerrainProvider } from './createTerrainProvider.js'
import { constrainCamera, MIN_CLEARANCE, MAX_CAMERA_HEIGHT } from './cameraLimits.js'
import { boundedZoomDistance } from './terrainZoom.js'
import region from './region.json'
import { geologyLayer, hiriseLayer, orbitalDetailLayer, orbitalLayer, useWildcatImagery } from './wildcatImagery'
import { useSlopeLayer } from './useSlopeLayer'
import { pickTerrainRay } from './pickTerrain'
import './terrain.css'

const EMPTY_POIS = []
const DEFAULT_URL = `${import.meta.env.BASE_URL}terrain/jezero/metadata.json`

function focusTerrain(context, longitude, latitude, range) {
  if (!context || context.viewer.isDestroyed()) return
  const height = sampleHeight(context.data, longitude, latitude)
  if (height === null) return
  const target = Cesium.Cartesian3.fromDegrees(longitude, latitude, height, context.ellipsoid)
  context.viewer.camera.lookAt(target, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-48), range))
  context.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
  context.viewer.scene.requestRender()
}

function makeMaterial(data, contours, spacing, elevationColors, baseOpacity) {
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 1
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 256, 0)
  ;region.palette.forEach((c, i) => gradient.addColorStop(i / 4, c))
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 1)
  return new Cesium.Material({ fabric: {
    type: 'JezeroElevation',
    uniforms: { elevationColors: elevationColors ? 1.0 : 0.0, baseOpacity },
    materials: {
      elevation: { type: 'ElevationRamp', uniforms: { image: canvas.toDataURL(), minimumHeight: data.minimumHeight, maximumHeight: data.maximumHeight } },
      contour: { type: 'ElevationContour', uniforms: { spacing, width: contours ? 1 : 0, color: Cesium.Color.fromCssColorString(region.contourColor).withAlpha(0.45) } },
    },
    components: {
      diffuse: 'mix(mix(vec3(0.32, 0.29, 0.27), elevation.diffuse, elevationColors), contour.diffuse, contour.alpha / max(0.0001, contour.alpha + baseOpacity * (1.0 - contour.alpha)))',
      alpha: 'contour.alpha + baseOpacity * (1.0 - contour.alpha)',
    },
  } })
}

/** Standalone local view. POIs require verified longitude/latitude and a source URL. */
export default function JezeroTerrain({ terrainUrl = DEFAULT_URL, pointsOfInterest = EMPTY_POIS, onPointSelect, initialPointId = 'jezero', embedded = false, focusPointId, focusRevision = 0, controlsTarget }) {
  const container = useRef(null)
  const viewerRef = useRef(null)
  const selectCallback = useRef(onPointSelect)
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [contours, setContours] = useState(initialPointId !== 'wildcat-ridge')
  const [elevationColors, setElevationColors] = useState(false)
  const [orbitalVisible, setOrbitalVisible] = useState(true)
  const [geologyVisible, setGeologyVisible] = useState(false)
  const [slopesVisible, setSlopesVisible] = useState(false)
  const [nearDetail, setNearDetail] = useState(initialPointId === 'wildcat-ridge')
  const imageryViewer = state.status === 'ready' ? state.viewer : null
  const orbital = useWildcatImagery(imageryViewer, state.data?.bounds, orbitalLayer, orbitalVisible)
  const orbitalDetail = useWildcatImagery(imageryViewer, state.data?.bounds, orbitalDetailLayer, orbitalVisible)
  const hirise = useWildcatImagery(imageryViewer, state.data?.bounds, hiriseLayer, orbitalVisible && nearDetail)
  const geology = useWildcatImagery(imageryViewer, state.data?.bounds, geologyLayer, geologyVisible, 0.7)
  const slopeStatus = useSlopeLayer(imageryViewer, state.data, slopesVisible)
  const imageryVisible = [orbital.status, orbitalDetail.status, hirise.status, geology.status, slopeStatus].includes('ready')
  const [spacing, setSpacing] = useState(100)
  const [inspection, setInspection] = useState(null)
  const [selectedPoint, setSelectedPoint] = useState(initialPointId)
  const [refining, setRefining] = useState(false)
  useEffect(() => { selectCallback.current = onPointSelect }, [onPointSelect])

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
        controls.tiltEventTypes = [Cesium.CameraEventType.MIDDLE_DRAG, { eventType: Cesium.CameraEventType.LEFT_DRAG, modifier: Cesium.KeyboardEventModifier.CTRL }]
        viewer.scene.globe.maximumScreenSpaceError = 2
        viewer.scene.globe.tileCacheSize = 160
        // Load and display each coarse level before requesting finer descendants.
        // Parent coverage remains visible while individual child tiles refine.
        viewer.scene.globe.loadingDescendantLimit = 0
        viewer.scene.globe.preloadAncestors = true
        viewer.scene.globe.preloadSiblings = true
        viewer.resolutionScale = Math.min(1, 2 / (window.devicePixelRatio || 1))
        viewerRef.current = { viewer, data, ellipsoid }
        const zoomHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
        const zoom = delta => {
          const distance = boundedZoomDistance(data, ellipsoid, viewer.camera.position, viewer.camera.direction, viewer.camera.pitch, delta)
          if (distance === 0) return
          viewer.camera.move(viewer.camera.direction, distance)
          viewer.scene.requestRender()
        }
        let rightDragY = null
        zoomHandler.setInputAction(zoom, Cesium.ScreenSpaceEventType.WHEEL)
        zoomHandler.setInputAction(event => { rightDragY = event.position.y }, Cesium.ScreenSpaceEventType.RIGHT_DOWN)
        zoomHandler.setInputAction(() => { rightDragY = null }, Cesium.ScreenSpaceEventType.RIGHT_UP)
        zoomHandler.setInputAction(event => {
          if (rightDragY === null) return
          zoom((event.endPosition.y - rightDragY) * 4)
          rightDragY = event.endPosition.y
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
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
          const safe = constrainCamera(data, pose)
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
          if (picked?.id?.properties?.poiId) {
            const id = picked.id.properties.poiId.getValue()
            setSelectedPoint(id)
            selectCallback.current?.(id)
          }
          const ray = viewer.camera.getPickRay(click.position)
          const position = pickTerrainRay(ray, data)
          if (!position) { setInspection(null); return }
          const cartographic = ellipsoid.cartesianToCartographic(position)
          const lon = Cesium.Math.toDegrees(cartographic.longitude)
          const lat = Cesium.Math.toDegrees(cartographic.latitude)
          const elevation = sampleHeight(data, lon, lat)
          setInspection(elevation === null ? null : { lon, lat, elevation })
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
  }, [terrainUrl, attempt, initialPointId, pointsOfInterest])

  useEffect(() => {
    const context = viewerRef.current
    if (!context || state.status !== 'ready') return
    const globe = context.viewer.scene.globe
    const baseOpacity = elevationColors ? (imageryVisible ? 0.60 : 1.0) : 0.0
    if (!globe.material) globe.material = makeMaterial(context.data, contours, spacing, elevationColors, baseOpacity)
    else {
      globe.material.uniforms.elevationColors = elevationColors ? 1.0 : 0.0
      globe.material.uniforms.baseOpacity = baseOpacity
      globe.material.materials.contour.uniforms.width = contours ? 1 : 0
      globe.material.materials.contour.uniforms.spacing = spacing
    }
    context.viewer.scene.requestRender()
  }, [state, contours, spacing, elevationColors, imageryVisible])

  useEffect(() => {
    if (!imageryViewer) return
    const update = () => {
      const position = imageryViewer.camera.positionCartographic
      const lon = Cesium.Math.toDegrees(position.longitude), lat = Cesium.Math.toDegrees(position.latitude)
      const [west, south, east, north] = hiriseLayer.bounds
      setNearDetail(position.height < 5000 && lon > west - 0.1 && lon < east + 0.1 && lat > south - 0.1 && lat < north + 0.1)
    }
    return imageryViewer.camera.changed.addEventListener(update)
  }, [imageryViewer])

  function focus(lon, lat, range) {
    focusTerrain(viewerRef.current, lon, lat, range)
  }

  useEffect(() => {
    if (state.status !== 'ready' || !focusPointId) return
    const point = focusPointId === 'jezero' ? region.center : pointsOfInterest.find(item => item.id === focusPointId)
    if (point) focusTerrain(viewerRef.current, point.longitude, point.latitude, focusPointId === 'jezero' ? 75000 : 3500)
  }, [state, focusPointId, focusRevision, pointsOfInterest])

  useLayoutEffect(() => {
    if (!embedded || !controlsTarget) return
    const host = container.current
    const viewport = host.parentElement
    const panel = controlsTarget.parentElement
    const update = () => {
      const view = viewport.getBoundingClientRect()
      const overlay = panel.getBoundingClientRect()
      let left, top = 0
      if (view.width >= 700 && view.width > view.height) left = -(view.width - Math.max(96, overlay.left - view.left))
      else {
        left = view.width < 700 ? -Math.min(144, Math.max(0, view.width - 160)) : 0
        top = 2 * Math.max(80, Math.min(view.height / 2, overlay.top - view.top - 40)) - view.height
      }
      // Reserve the same focus area whether panels are open or closed. Only a
      // viewport resize changes this frame; toggling HUD panels never resizes the map.
      host.style.left = `${left}px`; host.style.top = `${top}px`
      host.style.setProperty('--terrain-credit-offset', `${-left}px`)
      const context = viewerRef.current
      if (context && !context.viewer.isDestroyed()) {
        context.viewer.resize()
        context.viewer.scene.requestRender()
      }
    }
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    update()
    return () => { observer.disconnect(); host.style.removeProperty('left'); host.style.removeProperty('top'); host.style.removeProperty('--terrain-credit-offset') }
  }, [embedded, controlsTarget])

  useEffect(() => {
    const context = viewerRef.current
    if (!context || state.status !== 'ready') return
    const entities = []
    for (const poi of pointsOfInterest) {
      if (!Number.isFinite(poi.longitude) || !Number.isFinite(poi.latitude) || !poi.source) continue
      const height = sampleHeight(context.data, poi.longitude, poi.latitude)
      if (height === null) continue
      entities.push(context.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(poi.longitude, poi.latitude, height + 25, context.ellipsoid),
        properties: { poiId: poi.id },
        point: { pixelSize: 10, color: Cesium.Color.fromCssColorString('#eafe07'), outlineColor: Cesium.Color.BLACK, outlineWidth: 2 },
        label: { text: poi.name, font: '14px Overpass, sans-serif', backgroundColor: Cesium.Color.fromCssColorString('#07173f'), backgroundPadding: new Cesium.Cartesian2(10, 8), pixelOffset: new Cesium.Cartesian2(0, -24), showBackground: true },
      }))
    }
    const centerHeight = sampleHeight(context.data, region.center.longitude, region.center.latitude)
    entities.push(context.viewer.entities.add({
      properties: { poiId: 'jezero' },
      position: Cesium.Cartesian3.fromDegrees(region.center.longitude, region.center.latitude, centerHeight + 40, context.ellipsoid),
      point: { pixelSize: 9, color: Cesium.Color.WHITE, outlineColor: Cesium.Color.fromCssColorString('#35291e'), outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
      label: { text: 'JEZERO CRATER\nPublished center', font: '16px Overpass, sans-serif', fillColor: Cesium.Color.WHITE, showBackground: true, backgroundColor: Cesium.Color.fromCssColorString('#35291e').withAlpha(.85), pixelOffset: new Cesium.Cartesian2(0, -35), disableDepthTestDistance: Number.POSITIVE_INFINITY },
    }))
    if (!embedded) {
    const mock = region.mockPosition
    const arrow = document.createElement('canvas')
    arrow.width = 64; arrow.height = 64
    const ctx = arrow.getContext('2d')
    ctx.translate(32, 32); ctx.rotate(mock.headingDegrees * Math.PI / 180)
    ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(17, 20); ctx.lineTo(0, 10); ctx.lineTo(-17, 20); ctx.closePath()
    ctx.fillStyle = '#67e8f9'; ctx.fill(); ctx.strokeStyle = '#142a31'; ctx.lineWidth = 3; ctx.stroke()
    entities.push(context.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(mock.longitude, mock.latitude, sampleHeight(context.data, mock.longitude, mock.latitude) + 30, context.ellipsoid),
      billboard: { image: arrow, width: 42, height: 42, disableDepthTestDistance: Number.POSITIVE_INFINITY },
      label: { text: 'YOU ARE HERE · MOCK', font: '13px Overpass, sans-serif', fillColor: Cesium.Color.WHITE, showBackground: true, backgroundColor: Cesium.Color.fromCssColorString('#142a31'), pixelOffset: new Cesium.Cartesian2(0, 35), disableDepthTestDistance: Number.POSITIVE_INFINITY },
    }))
    }
    return () => { if (!context.viewer.isDestroyed()) entities.forEach(entity => context.viewer.entities.remove(entity)) }
  }, [state, pointsOfInterest, embedded])

  const ready = state.status === 'ready'
  const wildcat = ready && pointsOfInterest.find(p => p.id === 'wildcat-ridge' && p.source && Number.isFinite(p.longitude) && Number.isFinite(p.latitude) && sampleHeight(state.data, p.longitude, p.latitude) !== null)
  if (embedded) return <div className="terrain-embedded">
    <section id="map-viewport" className="map-shell" aria-label="Interactive Jezero terrain" tabIndex={-1}>
      <div className="cesium-host" ref={container} />
      {!ready && <div className="terrain-load-status" role="status">{state.status === 'error' ? state.message : 'Loading Jezero terrain…'}</div>}
      {state.status === 'error' && <button className="detail-retry" onClick={() => { setState({status:'loading'}); setAttempt(n => n + 1) }}>Retry map</button>}
    </section>
    {controlsTarget && createPortal(<aside className="md-panel field-map-panel" aria-label="Map view and layers">
      <h2>Map view</h2>
      <p className="mt-panel-description" role="status">{ready ? refining ? 'Refining terrain…' : 'Jezero · true-scale relief' : state.status === 'error' ? 'Map unavailable' : 'Loading terrain…'}</p>
      <div className="field-map-actions"><button className="md-button md-button-outline" disabled={!ready} onClick={() => { focus(region.center.longitude, region.center.latitude, 75000); selectCallback.current?.('jezero') }}>Jezero</button><button className="md-button md-button-outline" disabled={!wildcat} onClick={() => { focus(wildcat.longitude, wildcat.latitude, 3500); selectCallback.current?.('wildcat-ridge') }}>Wildcat Ridge</button></div>
      <label className="control-row"><span>Orbital imagery</span><input type="checkbox" checked={orbitalVisible} disabled={!ready} onChange={e => setOrbitalVisible(e.target.checked)} /></label>
      <label className="control-row"><span>Elevation colors</span><input type="checkbox" checked={elevationColors} disabled={!ready} onChange={e => setElevationColors(e.target.checked)} /></label>
      <label className="control-row"><span>Geology</span><input type="checkbox" checked={geologyVisible} disabled={!ready} onChange={e => setGeologyVisible(e.target.checked)} /></label>
      <label className="control-row"><span>Regional slopes</span><input type="checkbox" checked={slopesVisible} disabled={!ready} onChange={e => setSlopesVisible(e.target.checked)} /></label>
      {orbitalVisible && orbital.status !== 'ready' && <p role="status">{orbital.status === 'error' ? 'Orbital imagery unavailable; terrain remains available.' : 'Loading orbital imagery…'}</p>}
      <label className="control-row"><span>Contour lines</span><input type="checkbox" checked={contours} disabled={!ready} onChange={e => setContours(e.target.checked)} /></label>
      <label className="control-row">Contour interval<select disabled={!ready || !contours} value={spacing} onChange={e => setSpacing(Number(e.target.value))}><option value="50">50 m</option><option value="100">100 m</option><option value="250">250 m</option></select></label>
      {ready && elevationColors && <div className="field-map-elevation"><p>Elevation · m, MOLA</p><div className="elevation-ramp" style={{background:`linear-gradient(90deg, ${region.palette.join(',')})`}} /><div className="legend-values"><span>{Math.round(state.data.minimumHeight)}</span><span>{Math.round(state.data.maximumHeight)}</span></div></div>}
      <output className="field-map-inspection">{inspection ? `${inspection.lat.toFixed(5)}° N · ${inspection.lon.toFixed(5)}° E · ${inspection.elevation.toFixed(0)} m` : 'Tap terrain to inspect elevation.'}</output>
      <details className="field-map-sources"><summary>Data & sources</summary><p>MRO · CTX / NASA / JPL / USGS<br />Regional CTX DEM: 20 m source<br />Wildcat HiRISE: 1 m source, 3 m display<br />Vertical reference: MOLA</p><a href={DEM_SOURCE} target="_blank" rel="noreferrer">Source dataset</a>{wildcat && <a href={wildcat.source} target="_blank" rel="noreferrer">Wildcat Ridge position</a>}<a href={hiriseLayer.source} target="_blank" rel="noreferrer">HiRISE imagery</a><a href="https://doi.org/10.5066/P9REJ9JN" target="_blank" rel="noreferrer">HiRISE elevation</a><a href={geologyLayer.source} target="_blank" rel="noreferrer">Geology source</a><p>Orbital imagery uses illustrative colorization. Elevation colors are optional. Mission cases remain separate demo data.</p></details>
    </aside>, controlsTarget)}
  </div>
  return <main className="terrain-app">
    <header className="terrain-header"><div className="project-signature"><strong>MARTIAN MAP</strong><span>Space Apps Challenge · 2026</span></div><div><p className="eyebrow">Mars / Terrain explorer</p><h1>Jezero</h1></div><span className="mode-tag">Regional cartography</span></header>
    <div className="terrain-workspace">
      <aside className="terrain-panel">
        <div className="panel-intro-block"><p className="eyebrow">Explore the surface</p><h2>Your view of Jezero.</h2><p className="panel-intro">Inspect the crater’s relief or take a closer look at Wildcat Ridge.</p></div>
        <fieldset className="panel-section"><legend className="eyebrow">Points of interest</legend>
        <div className="poi-list"><button disabled={!ready} aria-pressed={selectedPoint === 'jezero'} onClick={() => { setSelectedPoint('jezero'); focus(region.center.longitude, region.center.latitude, 75000) }}><span className="poi-number">01</span><strong>Jezero crater<small>Regional terrain</small></strong><svg className="poi-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" /></svg></button>
          <button disabled={!wildcat} aria-pressed={selectedPoint === 'wildcat-ridge'} onClick={() => { setSelectedPoint('wildcat-ridge'); focus(wildcat.longitude, wildcat.latitude, 3500); selectCallback.current?.(wildcat.id) }}><span className="poi-number">02</span><strong>Wildcat Ridge<small>{wildcat ? 'Hazeltop sampling location' : 'Position awaiting verification'}</small></strong><svg className="poi-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" /></svg></button></div>
        </fieldset>
        <fieldset className="panel-section"><legend className="eyebrow">Map layers & view</legend>
        <label className="control-row"><span>Contour lines</span><input type="checkbox" checked={contours} disabled={!ready} onChange={e => setContours(e.target.checked)} /></label>
        <label className="control-row">Contour interval<select disabled={!ready || !contours} value={spacing} onChange={e => setSpacing(Number(e.target.value))}><option value="50">50 m</option><option value="100">100 m</option><option value="250">250 m</option></select></label>
        </fieldset>
        <details className="source-card"><summary>Data & sources</summary><strong>MRO · Context Camera</strong><p>NASA / JPL / USGS<br />Regional CTX DEM: 20 m source<br />Wildcat HiRISE: 1 m source, 3 m display<br />Vertical reference: MOLA</p><a href={DEM_SOURCE} target="_blank" rel="noreferrer">View source dataset ↗</a>{wildcat && <p><a href={wildcat.source} target="_blank" rel="noreferrer">Wildcat Ridge coordinates ↗</a></p>}<p>Prepared from historical NASA data. Colors and shading are derived from elevation, not a surface photograph.</p><p>The cyan arrow is a mock position and heading, not live tracking. Syrtis Major is the regional context.</p><a href={region.center.source} target="_blank" rel="noreferrer">Jezero center · USGS ↗</a></details>
      </aside>
      <section className="map-shell" aria-label="Interactive Jezero terrain">
        <div className="cesium-host" ref={container} />
        {!ready && <div className="terrain-load-status" role="status">{state.status === 'error' ? state.message : 'Loading Jezero’s 2.5D terrain…'}</div>}
        {ready && <><div className="map-badge"><strong>Syrtis Major / Jezero</strong><span role="status">{refining ? 'Refining terrain…' : 'True-scale relief'}</span></div><button className="map-reset" onClick={() => { setSelectedPoint('jezero'); focus(region.center.longitude, region.center.latitude, 75000) }}>Reset view</button><div className="map-legend"><p>Elevation · m, MOLA reference</p><div className="elevation-ramp" style={{background: `linear-gradient(90deg, ${region.palette.join(',')})`}}/><div className="legend-values"><span>{Math.round(state.data.minimumHeight)}</span><span>{Math.round(state.data.maximumHeight)}</span></div><small>Display grid ≈ {state.data.displayResolutionMeters} m · source 20 m</small></div></>}
        {state.status === 'error' && <button className="detail-retry" onClick={() => { setState({status: 'loading'}); setAttempt(n => n + 1) }}>Retry detailed view</button>}
        <footer className="map-footer"><span>{inspection ? `${inspection.lat.toFixed(5)}° N · ${inspection.lon.toFixed(5)}° E · ${inspection.elevation.toFixed(0)} m` : 'Click terrain to inspect elevation'}</span><span className="navigation-help">Drag to pan · Scroll to zoom · Ctrl + drag to tilt</span></footer>
      </section>
    </div>
  </main>
}
