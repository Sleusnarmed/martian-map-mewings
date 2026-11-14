import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { DEM_SOURCE, DEM_DOWNLOAD, loadTerrain, sampleHeight } from './terrainData'
import './terrain.css'

const EMPTY_POIS = []
const DEFAULT_URL = `${import.meta.env.BASE_URL}terrain/jezero/metadata.json`

function makeMaterial(data, contours, spacing) {
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 1
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 256, 0)
  ;['#07173f', '#0042a6', '#0960e1', '#2e96f5', '#ffffff'].forEach((c, i) => gradient.addColorStop(i / 4, c))
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 1)
  return new Cesium.Material({ fabric: {
    type: 'JezeroElevation',
    materials: {
      elevation: { type: 'ElevationRamp', uniforms: { image: canvas, minimumHeight: data.minimumHeight, maximumHeight: data.maximumHeight } },
      contour: { type: 'ElevationContour', uniforms: { spacing, width: contours ? 1 : 0, color: Cesium.Color.fromCssColorString('#ffffff').withAlpha(0.7) } },
    },
    components: { diffuse: 'mix(elevation.diffuse, contour.diffuse, contour.alpha)', alpha: '1.0' },
  } })
}

/** Standalone local view. POIs require verified longitude/latitude and a source URL. */
export default function JezeroTerrain({ terrainUrl = DEFAULT_URL, pointsOfInterest = EMPTY_POIS, onPointSelect }) {
  const container = useRef(null)
  const viewerRef = useRef(null)
  const selectCallback = useRef(onPointSelect)
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [contours, setContours] = useState(true)
  const [spacing, setSpacing] = useState(100)
  const [overhead, setOverhead] = useState(false)
  const [inspection, setInspection] = useState(null)
  const [selectedPoint, setSelectedPoint] = useState('jezero')
  useEffect(() => { selectCallback.current = onPointSelect }, [onPointSelect])

  useEffect(() => {
    const controller = new AbortController()
    let viewer
    async function start() {
      try {
        const data = await loadTerrain(terrainUrl, controller.signal)
        if (controller.signal.aborted) return
        window.CESIUM_BASE_URL = `${import.meta.env.BASE_URL}cesium/`
        const ellipsoid = new Cesium.Ellipsoid(data.radius, data.radius, data.radius)
        const rectangle = Cesium.Rectangle.fromDegrees(...data.bounds)
        const scheme = new Cesium.GeographicTilingScheme({ ellipsoid, rectangle, numberOfLevelZeroTilesX: 1, numberOfLevelZeroTilesY: 1 })
        const terrainProvider = new Cesium.CustomHeightmapTerrainProvider({
          tilingScheme: scheme, width: 65, height: 65,
          credit: 'NASA / JPL / USGS · MRO CTX elevation · MOLA reference',
          callback(x, y, level) {
            const rect = scheme.tileXYToRectangle(x, y, level)
            const tile = new Float32Array(65 * 65)
            for (let row = 0; row < 65; row++) for (let col = 0; col < 65; col++) {
              const lon = Cesium.Math.toDegrees(rect.west + (rect.east - rect.west) * col / 64)
              const lat = Cesium.Math.toDegrees(rect.north - (rect.north - rect.south) * row / 64)
              // Roundoff at the tile perimeter must not manufacture missing samples.
              tile[row * 65 + col] = sampleHeight(data, Math.max(data.bounds[0], Math.min(data.bounds[2], lon)), Math.max(data.bounds[1], Math.min(data.bounds[3], lat)))
            }
            return tile
          },
        })
        // The provider default assumes global coverage; this crop spans only 0.7°.
        const baseError = data.radius * Math.max(rectangle.width, rectangle.height) / 64
        terrainProvider.getLevelMaximumGeometricError = level => baseError / (2 ** level)
        viewer = new Cesium.Viewer(container.current, {
          ellipsoid, depthPlaneEllipsoidOffset: -10000,
          globe: new Cesium.Globe(ellipsoid), terrainProvider, baseLayer: false,
          animation: false, timeline: false, geocoder: false, homeButton: false,
          baseLayerPicker: false, sceneModePicker: false, navigationHelpButton: false,
          fullscreenButton: false, selectionIndicator: false, infoBox: false,
          skyBox: false, skyAtmosphere: false, scene3DOnly: true,
          mapProjection: new Cesium.GeographicProjection(ellipsoid), requestRenderMode: true,
        })
        viewer.scene.globe.cartographicLimitRectangle = rectangle
        viewer.scene.globe.showGroundAtmosphere = false
        viewer.scene.globe.enableLighting = false
        viewer.scene.globe.depthTestAgainstTerrain = true
        viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#07173f')
        viewer.scene.screenSpaceCameraController.minimumZoomDistance = 150
        viewer.scene.screenSpaceCameraController.maximumZoomDistance = 180000
        viewer.scene.globe.maximumScreenSpaceError = 3
        viewerRef.current = { viewer, data, ellipsoid }
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
    return () => { controller.abort(); viewerRef.current = null; if (viewer && !viewer.isDestroyed()) viewer.destroy() }
  }, [terrainUrl, attempt])

  useEffect(() => {
    const context = viewerRef.current
    if (!context || state.status !== 'ready') return
    context.viewer.scene.globe.material = makeMaterial(context.data, contours, spacing)
    context.viewer.scene.requestRender()
  }, [state, contours, spacing])

  function focus(lon, lat, range, top = overhead) {
    const context = viewerRef.current
    if (!context) return
    const height = sampleHeight(context.data, lon, lat)
    if (height === null) return
    const target = Cesium.Cartesian3.fromDegrees(lon, lat, height, context.ellipsoid)
    context.viewer.camera.lookAt(target, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(top ? -90 : -48), range))
    context.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
    context.viewer.scene.requestRender()
  }

  useEffect(() => {
    const context = viewerRef.current
    if (!context || state.status !== 'ready') return
    const [west, south, east, north] = context.data.bounds
    const lon = (west + east) / 2, lat = (south + north) / 2
    const height = sampleHeight(context.data, lon, lat)
    context.viewer.camera.lookAt(Cesium.Cartesian3.fromDegrees(lon, lat, height, context.ellipsoid), new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(overhead ? -90 : -48), 65000))
    context.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
  }, [state, overhead])

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
        label: { text: poi.name, font: '14px sans-serif', pixelOffset: new Cesium.Cartesian2(0, -24), showBackground: true },
      }))
    }
    return () => { if (!context.viewer.isDestroyed()) entities.forEach(entity => context.viewer.entities.remove(entity)) }
  }, [state, pointsOfInterest])

  const ready = state.status === 'ready'
  const wildcat = ready && pointsOfInterest.find(p => p.id === 'wildcat-ridge' && p.source && Number.isFinite(p.longitude) && Number.isFinite(p.latitude) && sampleHeight(state.data, p.longitude, p.latitude) !== null)
  return <main className="terrain-app">
    <header className="terrain-header"><div className="project-signature"><strong>MARTIAN MAP</strong><span>Space Apps Challenge · 2026</span></div><div><p className="eyebrow">Mars / Terrain explorer</p><h1>Jezero</h1></div><span className="mode-tag">Regional cartography</span></header>
    <div className="terrain-workspace">
      <aside className="terrain-panel">
        <div className="panel-intro-block"><p className="eyebrow">Explore the surface</p><h2>Your view of Jezero.</h2><p className="panel-intro">Inspect the crater’s relief or take a closer look at Wildcat Ridge.</p></div>
        <fieldset className="panel-section"><legend className="eyebrow">Points of interest</legend>
        <div className="poi-list"><button disabled={!ready} aria-pressed={selectedPoint === 'jezero'} onClick={() => { setSelectedPoint('jezero'); const b = state.data.bounds; focus((b[0]+b[2])/2, (b[1]+b[3])/2, 65000) }}><span className="poi-number">01</span><strong>Jezero crater<small>Regional terrain</small></strong><svg className="poi-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" /></svg></button>
          <button disabled={!wildcat} aria-pressed={selectedPoint === 'wildcat-ridge'} onClick={() => { setSelectedPoint('wildcat-ridge'); focus(wildcat.longitude, wildcat.latitude, 3500); selectCallback.current?.(wildcat.id) }}><span className="poi-number">02</span><strong>Wildcat Ridge<small>{wildcat ? 'Hazeltop sampling location' : 'Position awaiting verification'}</small></strong><svg className="poi-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14" /></svg></button></div>
        </fieldset>
        <fieldset className="panel-section"><legend className="eyebrow">Map layers & view</legend>
        <div className="view-buttons"><button disabled={!ready} aria-pressed={!overhead} onClick={() => setOverhead(false)}>Tilted view</button><button disabled={!ready} aria-pressed={overhead} onClick={() => setOverhead(true)}>Top down</button></div>
        <label className="control-row"><span>Contour lines</span><input type="checkbox" checked={contours} disabled={!ready} onChange={e => setContours(e.target.checked)} /></label>
        <label className="control-row">Contour interval<select disabled={!ready || !contours} value={spacing} onChange={e => setSpacing(Number(e.target.value))}><option value="50">50 m</option><option value="100">100 m</option><option value="250">250 m</option></select></label>
        </fieldset>
        <details className="source-card"><summary>Data & sources</summary><strong>MRO · Context Camera</strong><p>NASA / JPL / USGS<br />Source DEM: 20 m per pixel<br />Vertical reference: MOLA</p><a href={DEM_SOURCE} target="_blank" rel="noreferrer">View source dataset ↗</a>{wildcat && <p><a href={wildcat.source} target="_blank" rel="noreferrer">Wildcat Ridge coordinates ↗</a></p>}<p>Prepared from historical NASA data. Elevation colors show height above the MOLA reference.</p></details>
      </aside>
      <section className="map-shell" aria-label="Interactive Jezero terrain">
        <div className="cesium-host" ref={container} />
        {!ready && <div className="map-placeholder"><svg className="contour-symbol" viewBox="0 0 80 80" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="40" cy="40" r="32"/><circle cx="40" cy="40" r="23"/><circle cx="40" cy="40" r="14"/><path d="M0 40h80M40 0v80"/></svg><p className="eyebrow">JEZERO / ELEVATION DATA</p><h2>{state.status === 'error' ? 'Terrain unavailable' : 'Opening the terrain…'}</h2><p role="status">{state.message || 'Loading the local elevation grid.'}</p>{state.status === 'error' && <><p>The elevation data could not be opened. Try loading the map again.</p><div className="empty-actions"><a href={DEM_DOWNLOAD}>Download USGS DEM ↗</a><button onClick={() => { setState({status:'loading'}); setAttempt(n => n+1) }}>Reload data</button></div></>}</div>}
        {ready && <><div className="map-badge"><strong>Jezero crater</strong><span>True-scale relief</span></div><div className="map-legend"><p>Elevation · m, MOLA reference</p><div className="elevation-ramp"/><div className="legend-values"><span>{Math.round(state.data.minimumHeight)}</span><span>{Math.round(state.data.maximumHeight)}</span></div><small>Display grid ≈ {state.data.displayResolutionMeters} m · source 20 m</small></div></>}
        <footer className="map-footer"><span>{inspection ? `${inspection.lat.toFixed(5)}° N · ${inspection.lon.toFixed(5)}° E · ${inspection.elevation.toFixed(0)} m` : 'Click terrain to inspect elevation'}</span><span className="navigation-help">Drag to pan · Scroll to zoom · Ctrl + drag to tilt</span></footer>
      </section>
    </div>
  </main>
}
