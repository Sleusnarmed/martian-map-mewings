import region from './region.json'
import { DEM_SOURCE } from './terrainData'
import { hiriseLayer, geologyLayer } from './wildcatImagery'
import TerrainNavigation from './TerrainNavigation'
import EnvironmentTimeline from './EnvironmentTimeline'
import WildcatLayers from './WildcatLayers'

export default function TerrainControlsPanel({ map, exploration, layers }) {
  const { ready, refining, state, focus, wildcat, onPointSelect, inspection } = map
  const { navigation, slopeThreshold, setSlopeThreshold, routeVisible, exploring, setRouteVisible, route, environment } = exploration
  const { slopeStatus, orbital, orbitalDetail, hirise, heatVisible, setHeatVisible, heatOpacity, setHeatOpacity, heatStatus, orbitalVisible, setOrbitalVisible, geologyVisible, setGeologyVisible, geology, geologyOpacity, setGeologyOpacity, elevationColors, setElevationColors, slopesVisible, setSlopesVisible, contours, setContours, spacing, setSpacing } = layers
  return <aside className="md-panel field-map-panel" aria-label="Map view and layers">
      <h2>Map view</h2>
      <p className="mt-panel-description" role="status">{ready ? refining ? 'Refining terrain…' : 'Jezero · true-scale relief' : state.status === 'error' ? 'Map unavailable' : 'Loading terrain…'}</p>
      <div className="field-map-actions"><button className="md-button md-button-outline" disabled={!ready} onClick={() => { focus(region.center.longitude, region.center.latitude, 75000); onPointSelect?.('jezero') }}>Jezero</button><button className="md-button md-button-outline" disabled={!wildcat} onClick={() => { focus(wildcat.longitude, wildcat.latitude, 3500); onPointSelect?.('wildcat-ridge') }}>Wildcat Ridge</button></div>
      <div className="field-explorer-tools">
        {ready && <TerrainNavigation navigation={navigation} slopes={slopeStatus === 'ready'} orbitalReady={orbital.status === 'ready'} ctxDetailReady={orbitalDetail.status === 'ready'} hiriseReady={hirise.status === 'ready'} threshold={slopeThreshold} />}
        <label className="control-row"><span>Show Wildcat demo route</span><input type="checkbox" disabled={!ready || exploring} checked={routeVisible || exploring} onChange={e => setRouteVisible(e.target.checked)} /></label>
        <p className="mt-panel-description">Preset exploration route; not a calculated safe path. Its progress is separate from the mission case HUD. In 3D: W/S to move, A/D to turn, drag to look.</p>
        <WildcatLayers ready={ready} environment={environment}
          closeUp={route ? () => { setRouteVisible(true); navigation.startRoute() } : null}
          heat={{ enabled: heatVisible, toggle: setHeatVisible, opacity: heatOpacity, setOpacity: setHeatOpacity, status: heatStatus }}
          orbital={{ enabled: orbitalVisible, toggle: setOrbitalVisible, status: orbital.status, detailStatus: orbitalDetail.status, hiriseStatus: hirise.status }}
          geology={{ enabled: geologyVisible, toggle: setGeologyVisible, status: geology.status }}
          geologyOpacity={geologyOpacity} setGeologyOpacity={setGeologyOpacity}
          terrainControls={<>
      <label className="control-row"><span>Elevation colors</span><input type="checkbox" checked={elevationColors} disabled={!ready} onChange={e => setElevationColors(e.target.checked)} /></label>
      <label className="control-row"><span>Regional slopes</span><input type="checkbox" checked={slopesVisible} disabled={!ready} onChange={e => setSlopesVisible(e.target.checked)} /></label>
      <label className="control-row"><span>Contour lines</span><input type="checkbox" checked={contours} disabled={!ready} onChange={e => setContours(e.target.checked)} /></label>
      <label className="control-row">Contour interval<select disabled={!ready || !contours} value={spacing} onChange={e => setSpacing(Number(e.target.value))}><option value="50">50 m</option><option value="100">100 m</option><option value="250">250 m</option></select></label>
      {ready && elevationColors && <div className="field-map-elevation"><p>Elevation · m, MOLA</p><div className="elevation-ramp" style={{background:`linear-gradient(90deg, ${region.palette.join(',')})`}} /><div className="legend-values"><span>{Math.round(state.data.minimumHeight)}</span><span>{Math.round(state.data.maximumHeight)}</span></div></div>}
          <label className="control-row">Slope review threshold<select value={slopeThreshold} onChange={e => setSlopeThreshold(Number(e.target.value))}><option value="10">10°</option><option value="15">15°</option><option value="20">20°</option></select></label>
          </>} />
        <EnvironmentTimeline environment={environment} />
      </div>
      <output className="field-map-inspection">{inspection ? `${inspection.lat.toFixed(5)}° N · ${inspection.lon.toFixed(5)}° E · ${inspection.elevation.toFixed(0)} m` : 'Tap terrain to inspect elevation.'}</output>
      <details className="field-map-sources"><summary>Data & sources</summary><p>MRO · CTX / NASA / JPL / USGS<br />Regional CTX DEM: 20 m source<br />Wildcat HiRISE: 1 m source, 3 m display<br />Vertical reference: MOLA</p><a href={DEM_SOURCE} target="_blank" rel="noreferrer">Source dataset</a>{wildcat && <a href={wildcat.source} target="_blank" rel="noreferrer">Wildcat Ridge position</a>}<a href={hiriseLayer.source} target="_blank" rel="noreferrer">HiRISE imagery</a><a href="https://doi.org/10.5066/P9REJ9JN" target="_blank" rel="noreferrer">HiRISE elevation</a><a href={geologyLayer.source} target="_blank" rel="noreferrer">Geology source</a><p>Orbital imagery uses illustrative colorization. Elevation colors are optional. Mission cases remain separate demo data.</p></details>
    </aside>
}
