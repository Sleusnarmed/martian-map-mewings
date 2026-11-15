import { useState } from 'react'
import RouteGuide, { DriveButton } from './RouteGuide'

export default function TerrainNavigation({ navigation, slopes, orbitalReady, ctxDetailReady, hiriseReady, threshold }) {
  const [contextOpen, setContextOpen] = useState(() => window.matchMedia('(min-width: 701px)').matches)
  const { context, mode, chooseMode, zoom, north, explorer, route } = navigation
  const walking = mode === 'walk'
  const scale = context?.scale
  let imagery = orbitalReady ? 'CTX · 14 m/px' : 'Not displayed'
  if (ctxDetailReady && context?.detail) imagery = 'CTX · 5 m/px'
  if (hiriseReady && context?.hirise) imagery = 'HiRISE · 0.55 m/px'
  return <>
    <nav className="terrain-view-tools" aria-label="Map perspective">
      {[['map', '2D'], ['auto', 'Auto 2.5D'], ['walk', '3D explore']].map(([id, name]) => <button key={id}
        disabled={id === 'walk' && !route} aria-pressed={mode === id} onClick={() => chooseMode(id)}>{name}</button>)}
    </nav>
    <div className="terrain-zoom-tools" aria-label="Map navigation">
      <button onClick={north} aria-label="Orient map north" title="North up"><span style={{ display: 'inline-block', transform: `rotate(${-(context?.heading ?? 0)}deg)` }}>↑</span> N</button>
      {walking ? <>
        <DriveButton explorer={explorer} action="forward" label="Move forward">↑</DriveButton>
        <DriveButton explorer={explorer} action="back" label="Move backward">↓</DriveButton>
        <DriveButton explorer={explorer} action="left" label="Turn left">←</DriveButton>
        <DriveButton explorer={explorer} action="right" label="Turn right">→</DriveButton>
      </> : <>
        <button onClick={() => zoom(0.65)} aria-label="Zoom in">+</button>
        <button onClick={() => zoom(1.55)} aria-label="Zoom out">−</button>
      </>}
    </div>
    {walking && <><div className="terrain-crosshair" aria-hidden="true">+</div><RouteGuide navigation={navigation} /></>}
    <details key={mode} className="terrain-context" open={!walking && contextOpen}
      onToggle={walking ? undefined : event => setContextOpen(event.currentTarget.open)}>
      <summary>{walking ? 'Explorer position' : 'At map center'} <span>{context?.outside ? 'Outside coverage' : `${Math.round(context?.heading ?? 0) % 360}° heading`}</span></summary>
      {!context || context.outside ? <p>No terrain at map center. Use Reset view to return to the mapped area.</p> : <>
        <p className="context-coordinates">{context.lat.toFixed(5)}° N · {context.lon.toFixed(5)}° E</p>
        <dl><div><dt>Elevation · MOLA</dt><dd>{context.elevation.toFixed(0)} m</dd></div>
          {walking && context.guidance && <div><dt>Camera above terrain</dt><dd>{Math.round(context.range)} m</dd></div>}
          <div><dt>Regional slope</dt><dd>{context.slope === null ? 'No estimate' : `${context.slope.toFixed(1)}°`}</dd></div>
          <div><dt>Imagery</dt><dd>{imagery}</dd></div>
        </dl>
        {context.slope !== null && context.slope >= threshold && <p className="terrain-caution" role="status">Review terrain: slope exceeds your {threshold}° planning threshold.</p>}
        {!context.detail && <p className="terrain-caution">Outside the detailed image crop. Zooming cannot reveal additional detail here.</p>}
        <p className="context-limit">{context.hirise ? 'Local HiRISE relief grid ≈ 3.5 m. The close-up image resolves finer features.' : 'Regional relief grid ≈ 53 m. HiRISE close-up is available at Wildcat Ridge.'}</p>
        {slopes && <p className="slope-key"><span>5–10°</span><span>10–15°</span><span>≥15°</span></p>}
        <small>{slopes ? 'Slope overlay active · ' : ''}Route suitability is unverified.</small>
      </>}
    </details>
    {!walking && scale > 0 && <div className="terrain-scale"><span>{scale >= 1000 ? `${(scale / 1000).toFixed(2)} km` : `${Math.round(scale)} m`}</span><i /><small>At center · horizontal</small></div>}
  </>
}
