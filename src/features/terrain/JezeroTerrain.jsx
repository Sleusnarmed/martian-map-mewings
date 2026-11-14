import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { DEM_SOURCE, loadTerrain, sampleHeight } from './terrainData'
import { createTerrainProvider } from './createTerrainProvider.js'
import { constrainCamera, MIN_CLEARANCE, MAX_CAMERA_HEIGHT } from './cameraLimits.js'
import TerrainPreview from './TerrainPreview'
import region from './region.json'
import './terrain.css'

const EMPTY_POIS = []
const DEFAULT_URL = `${import.meta.env.BASE_URL}terrain/jezero/metadata.json`

function makeMaterial(data, contours, spacing, textured) {
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 1
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 256, 0)
  ;region.palette.forEach((c, i) => gradient.addColorStop(i / 4, c))
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 1)
  return new Cesium.Material({ fabric: {
    type: 'JezeroElevation',
    materials: {
      elevation: { type: 'ElevationRamp', uniforms: { image: canvas, minimumHeight: data.minimumHeight, maximumHeight: data.maximumHeight } },
      contour: { type: 'ElevationContour', uniforms: { spacing, width: contours ? 1 : 0, color: Cesium.Color.fromCssColorString(region.contourColor).withAlpha(0.45) } },
    },
    components: { diffuse: textured ? 'contour.diffuse' : 'mix(elevation.diffuse, contour.diffuse, contour.alpha)', alpha: textured ? 'contour.alpha' : '1.0' },
  } })
}

/** Standalone local view. POIs require verified longitude/latitude and a source URL. */
export default function JezeroTerrain({ terrainUrl = DEFAULT_URL, pointsOfInterest = EMPTY_POIS, onPointSelect }) {
  const container = useRef(null)
  const viewerRef = useRef(null)
  const focusRef = useRef(null)
  const selectCallback = useRef(onPointSelect)
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [contours, setContours] = useState(true)
  const [spacing, setSpacing] = useState(100)
  const [overhead, setOverhead] = useState(false)
  const [inspection, setInspection] = useState(null)
  const [selectedPoint, setSelectedPoint] = useState('jezero')
  const [refining, setRefining] = useState(false)
  const [terrainVisible, setTerrainVisible] = useState(false)
  const [fast2D, setFast2D] = useState(false)
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
        })
        viewer.scene.globe.cartographicLimitRectangle = rectangle
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
        controls.inertiaZoom = 0.15
        controls.maximumTiltAngle = Cesium.Math.toRadians(65)
        controls.enableCollisionDetection = true
        controls.minimumCollisionTerrainHeight = MAX_CAMERA_HEIGHT
        viewer.scene.globe.maximumScreenSpaceError = 3
        viewer.scene.globe.tileCacheSize = 160
        // Load and display each coarse level before requesting finer descendants.
        // Parent coverage remains visible while individual child tiles refine.
        viewer.scene.globe.loadingDescendantLimit = 0
        viewer.scene.globe.preloadAncestors = true
        viewer.scene.globe.preloadSiblings = true
        viewer.resolutionScale = 1
        let textured = false
        try {
          const imagery = await Cesium.SingleTileImageryProvider.fromUrl(`${import.meta.env.BASE_URL}terrain/jezero/preview.webp`, { rectangle, ellipsoid })
          if (controller.signal.aborted) return
          viewer.imageryLayers.addImageryProvider(imagery)
          textured = true
        } catch {
          // Elevation colors still work if the optional shaded texture fails.
          if (controller.signal.aborted) return
        }
        viewerRef.current = { viewer, data, ellipsoid, textured, viewInitialized: false }
        let settledFrames = 0
        let revealed = false
        cleanups.push(viewer.scene.postRender.addEventListener(() => {
          if (revealed || !viewerRef.current?.viewInitialized) return
          const center = new Cesium.Cartesian2(viewer.canvas.clientWidth / 2, viewer.canvas.clientHeight / 2)
          const ray = viewer.camera.getPickRay(center)
          const hasSurface = ray && viewer.scene.globe.pick(ray, viewer.scene)
          // Reveal the first usable coarse surface, without waiting for all detail.
          settledFrames = hasSurface ? settledFrames + 1 : 0
          if (settledFrames >= 2) { revealed = true; setTerrainVisible(true) }
          else if (settledFrames) viewer.scene.requestRender()
        }))
        focusRef.current = null
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
          const position = viewer.scene.globe.pick(ray, viewer.scene)
          if (!position) { setInspection(null); return }
          const cartographic = ellipsoid.cartesianToCartographic(position)
          const lon = Cesium.Math.toDegrees(cartographic.longitude)
          const lat = Cesium.Math.toDegrees(cartographic.latitude)
          const elevation = sampleHeight(data, lon, lat)
          setInspection(elevation === null ? null : { lon, lat, elevation })
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        setState({ status: 'ready', data })
      } catch (error) {
        if (controller.signal.aborted) return
        if (viewer && !viewer.isDestroyed()) viewer.destroy()
        viewerRef.current = null
        setState({ status: 'error', message: error.message })
      }
    }
    start()
    return () => { controller.abort(); cleanups.forEach(remove => remove()); viewerRef.current = null; if (viewer && !viewer.isDestroyed()) viewer.destroy() }
  }, [terrainUrl, attempt])

  useEffect(() => {
    const context = viewerRef.current
    if (!context || state.status !== 'ready') return
    const globe = context.viewer.scene.globe
    if (!globe.material) globe.material = makeMaterial(context.data, contours, spacing, context.textured)
    else {
      globe.material.materials.contour.uniforms.width = contours ? 1 : 0
      globe.material.materials.contour.uniforms.spacing = spacing
    }
    context.viewer.scene.requestRender()
  }, [state, contours, spacing])

  function focus(lon, lat, range, top = overhead) {
    const context = viewerRef.current
    if (!context) return
    const height = sampleHeight(context.data, lon, lat)
    if (height === null) return
    setFast2D(false)
    focusRef.current = { lon, lat, range }
    const target = Cesium.Cartesian3.fromDegrees(lon, lat, height, context.ellipsoid)
    context.viewer.camera.lookAt(target, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(top ? -90 : -48), range))
    context.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
    context.viewer.scene.requestRender()
  }

  useEffect(() => {
    const context = viewerRef.current
    if (!context || state.status !== 'ready') return
    const { lon, lat, range } = focusRef.current ?? { lon: region.center.longitude, lat: region.center.latitude, range: 75000 }
    const height = sampleHeight(context.data, lon, lat)
    context.viewer.camera.lookAt(Cesium.Cartesian3.fromDegrees(lon, lat, height, context.ellipsoid), new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(overhead ? -90 : -48), range))
    context.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
    context.viewInitialized = true
    context.viewer.scene.requestRender()
  }, [state, overhead])

  useEffect(() => {
    const context = viewerRef.current
    if (!context || state.status !== 'ready') return
    context.viewer.useDefaultRenderLoop = !fast2D
    if (!fast2D) context.viewer.scene.requestRender()
  }, [state, fast2D])

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
      position: Cesium.Cartesian3.fromDegrees(region.center.longitude, region.center.latitude, centerHeight + 40, context.ellipsoid),
      point: { pixelSize: 9, color: Cesium.Color.WHITE, outlineColor: Cesium.Color.fromCssColorString('#35291e'), outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
      label: { text: 'JEZERO CRATER\nPublished center', font: '16px Overpass, sans-serif', fillColor: Cesium.Color.WHITE, showBackground: true, backgroundColor: Cesium.Color.fromCssColorString('#35291e').withAlpha(.85), pixelOffset: new Cesium.Cartesian2(0, -35), disableDepthTestDistance: Number.POSITIVE_INFINITY },
    }))
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
    return () => { if (!context.viewer.isDestroyed()) entities.forEach(entity => context.viewer.entities.remove(entity)) }
  }, [state, pointsOfInterest])

  const showPreview = fast2D || !terrainVisible || state.status === 'error'
  const ready = state.status === 'ready'
  const wildcat = ready && pointsOfInterest.find(p => p.id === 'wildcat-ridge' && p.source && Number.isFinite(p.longitude) && Number.isFinite(p.latitude) && sampleHeight(state.data, p.longitude, p.latitude) !== null)
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
        <button className="fast-map-toggle" aria-pressed={fast2D} onClick={() => setFast2D(value => !value)}>{fast2D ? 'Open 2.5D relief' : 'Fast 2D map'}</button>
        <div className="view-buttons"><button disabled={!ready || fast2D} aria-pressed={!overhead} onClick={() => setOverhead(false)}>Tilted view</button><button disabled={!ready || fast2D} aria-pressed={overhead} onClick={() => setOverhead(true)}>Top down</button></div>
        <label className="control-row"><span>Contour lines</span><input type="checkbox" checked={contours} disabled={!ready || showPreview} onChange={e => setContours(e.target.checked)} /></label>
        <label className="control-row">Contour interval<select disabled={!ready || !contours || showPreview} value={spacing} onChange={e => setSpacing(Number(e.target.value))}><option value="50">50 m</option><option value="100">100 m</option><option value="250">250 m</option></select></label>
        </fieldset>
        <details className="source-card"><summary>Data & sources</summary><strong>MRO · Context Camera</strong><p>NASA / JPL / USGS<br />Source DEM: 20 m per pixel<br />Vertical reference: MOLA</p><a href={DEM_SOURCE} target="_blank" rel="noreferrer">View source dataset ↗</a>{wildcat && <p><a href={wildcat.source} target="_blank" rel="noreferrer">Wildcat Ridge coordinates ↗</a></p>}<p>Prepared from historical NASA data. Colors and shading are derived from elevation, not a surface photograph.</p><p>The cyan arrow is a mock position and heading, not live tracking. Syrtis Major is the regional context.</p><a href={region.center.source} target="_blank" rel="noreferrer">Jezero center · USGS ↗</a></details>
      </aside>
      <section className="map-shell" aria-label="Interactive Jezero terrain">
        <div className="cesium-host" ref={container} aria-hidden={showPreview} style={{ pointerEvents: showPreview ? 'none' : 'auto' }} />
        {showPreview && <TerrainPreview message={fast2D ? 'Fast 2D · Detailed rendering paused' : 'Preparing the first terrain surface…'} error={state.status === 'error' ? state.message : null} onOpenDetail={fast2D ? () => setFast2D(false) : undefined}/>}
        {ready && !showPreview && <><div className="map-badge"><strong>Syrtis Major / Jezero</strong><span role="status">{refining ? 'Refining terrain…' : 'True-scale relief'}</span></div><button className="map-reset" onClick={() => { setSelectedPoint('jezero'); focus(region.center.longitude, region.center.latitude, 75000) }}>Reset view</button><div className="map-legend"><p>Elevation · m, MOLA reference</p><div className="elevation-ramp" style={{background: `linear-gradient(90deg, ${region.palette.join(',')})`}}/><div className="legend-values"><span>{Math.round(state.data.minimumHeight)}</span><span>{Math.round(state.data.maximumHeight)}</span></div><small>Display grid ≈ {state.data.displayResolutionMeters} m · source 20 m</small></div></>}
        {state.status === 'error' && <button className="detail-retry" onClick={() => { setTerrainVisible(false); setState({status: 'loading'}); setAttempt(n => n + 1) }}>Retry detailed view</button>}
        <footer className="map-footer"><span>{showPreview ? 'Shaded relief · Mock position, not live tracking' : inspection ? `${inspection.lat.toFixed(5)}° N · ${inspection.lon.toFixed(5)}° E · ${inspection.elevation.toFixed(0)} m` : 'Click terrain to inspect elevation'}</span><span className="navigation-help">{showPreview ? '2D: drag to pan · Use + / − to zoom' : 'Drag to pan · Scroll to zoom · Ctrl + drag to tilt'}</span></footer>
      </section>
    </div>
  </main>
}
