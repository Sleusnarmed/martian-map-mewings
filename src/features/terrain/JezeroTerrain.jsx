import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { sampleHeight } from './terrainData'
import region from './region.json'
import { useTerrainNavigation } from './useTerrainNavigation'
import { useRouteMission } from '../route-planner/RouteMissionContext.js'
import { useMissionMap } from '../route-planner/useMissionMap.js'
import { useEnvironmentClock } from './useEnvironmentClock'
import { focusTerrain } from './focusTerrain'
import { useTerrainScene } from './useTerrainScene'
import { useTerrainFraming } from './useTerrainFraming'
import { useTerrainLayers } from './useTerrainLayers'
import { useMapLayers } from './MapLayerContext.js'
import TerrainControlsPanel from './TerrainControlsPanel'
import TerrainMapControls from './TerrainMapControls'
import TerrainPoints from './TerrainPoints.jsx'
import { useTerrainMarkers } from './useTerrainMarkers.js'
import { buildMarsSky } from '../mars-sky/marsSkyModel'
import { useMarsSceneSky } from '../mars-sky/useMarsSceneSky'
import './terrain.css'

const EMPTY_POIS = []
const DEFAULT_URL = `${import.meta.env.BASE_URL}terrain/jezero/metadata.json`

/** Map adapter for MissionWorkspace; owns no mission case or telemetry state. */
export default function JezeroTerrain({ terrainUrl = DEFAULT_URL, pointsOfInterest = EMPTY_POIS, onPointSelect, initialPointId = 'jezero', focusPointId, focusRevision = 0, controlsTarget, navigationTarget }) {
  const planner = useRouteMission()
  const { attachTerrain, inspect, state: missionState } = planner
  const container = useRef(null)
  const viewerRef = useRef(null)
  const selectCallback = useRef(onPointSelect)
  const navigationRef = useRef(null)
  const [state, setState] = useState({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [skyPanelOpen, setSkyPanelOpen] = useState(false)
  const { visibility, setVisibility, setReady } = useMapLayers()
  const { route: routeVisible, hazards: hazardsVisible, coverage: coverageVisible } = visibility
  const setRouteVisible = value => setVisibility('route', value)
  const setHazardsVisible = value => setVisibility('hazards', value)
  const setCoverageVisible = value => setVisibility('coverage', value)
  const imageryViewer = state.status === 'ready' ? state.viewer : null
  const route = missionState.result?.route ?? null
  const navigation = useTerrainNavigation(imageryViewer, state.data, route)
  const { modeRef } = navigation
  useEffect(() => { navigationRef.current = navigation }, [navigation])
  const exploring = navigation.mode === 'walk'
  useMissionMap(imageryViewer, state.data, missionState, { route: routeVisible, hazards: hazardsVisible, coverage: coverageVisible })
  useEffect(() => { if (state.data) attachTerrain(state.data) }, [state.data, attachTerrain])
  const environment = useEnvironmentClock(Boolean(imageryViewer))
  const skyActive = exploring || skyPanelOpen
  const sky = useMemo(() => skyActive ? buildMarsSky(environment.sol, environment.minute) : null,
    [skyActive, environment.sol, environment.minute])
  useMarsSceneSky(imageryViewer, exploring && sky !== null, sky)
  const layers = useTerrainLayers({ viewerRef, state, initialPointId, minute: environment.minute, exploring })
  const { slopeThreshold, setSlopeThreshold } = layers
  const inspection = missionState.inspection
  const setInspection = useCallback(point => inspect(point), [inspect])
  const [refining, setRefining] = useState(false)
  useEffect(() => { selectCallback.current = onPointSelect }, [onPointSelect])

  useTerrainScene({ container, viewerRef, selectCallback, terrainUrl, attempt, initialPointId, pointsOfInterest, modeRef, setState, setInspection, setRefining })

  function focus(lon, lat, range) {
    if (exploring) navigation.chooseMode('auto')
    focusTerrain(viewerRef.current, lon, lat, range)
  }

  useEffect(() => {
    if (state.status !== 'ready' || !focusPointId) return
    const point = focusPointId === 'jezero' ? region.center : pointsOfInterest.find(item => item.id === focusPointId)
    if (navigationRef.current?.mode === 'walk') navigationRef.current.chooseMode('auto')
    if (point) focusTerrain(viewerRef.current, point.longitude, point.latitude, focusPointId === 'jezero' ? 75000 : 3500)
  }, [state, focusPointId, focusRevision, pointsOfInterest])

  useTerrainFraming({ container, viewerRef, controlsTarget })
  useTerrainMarkers({ viewerRef, state, pointsOfInterest, mode: navigation.mode })


  const ready = state.status === 'ready'
  useEffect(() => { setReady(ready); return () => setReady(false) }, [ready, setReady])
  const wildcat = ready && pointsOfInterest.find(p => p.id === 'wildcat-ridge' && p.source && Number.isFinite(p.longitude) && Number.isFinite(p.latitude) && sampleHeight(state.data, p.longitude, p.latitude) !== null)
  return <div className="terrain-embedded">
    <section id="map-viewport" className="map-shell" aria-label="Interactive Jezero terrain" tabIndex={-1}>
      <div className="cesium-host" ref={container} />
      {ready && <TerrainPoints viewer={imageryViewer} data={state.data} points={pointsOfInterest}
        mode={navigation.mode} />}
      {!ready && <div className="terrain-load-status" role="status">{state.status === 'error' ? state.message : 'Loading Jezero terrain…'}</div>}
      {state.status === 'error' && <button className="detail-retry" onClick={() => { setState({status:'loading'}); setAttempt(n => n + 1) }}>Retry map</button>}
    </section>
    {navigationTarget && createPortal(<TerrainMapControls navigation={navigation} ready={ready} />, navigationTarget)}
    {controlsTarget && createPortal(<TerrainControlsPanel
      map={{ ready, refining, state, focus, wildcat, onPointSelect, inspection }}
      exploration={{ navigation, slopeThreshold, setSlopeThreshold, routeVisible, exploring, setRouteVisible, route, environment, hazardsVisible, setHazardsVisible, coverageVisible, setCoverageVisible }}
      skyPanel={{ open: skyPanelOpen, setOpen: setSkyPanelOpen, sky }}
      layers={layers}
    />, controlsTarget)}
  </div>
}
