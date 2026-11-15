import { useState } from 'react'

export default function TerrainNavigation({ navigation, slopes, orbitalReady, ctxDetailReady, hiriseReady, threshold }) {
  const [contextOpen, setContextOpen] = useState(() => window.matchMedia('(min-width: 701px)').matches)
  const { context, mode, zoom } = navigation
  const walking = mode === 'walk'
  const scale = context?.scale
  let imagery = orbitalReady ? 'CTX · 14 m/px' : 'Not displayed'
  if (ctxDetailReady && context?.detail) imagery = 'CTX · 5 m/px'
  if (hiriseReady && context?.hirise) imagery = 'HiRISE · 0.55 m/px'
  return <>
    {!walking && <div className="terrain-zoom-tools" aria-label="Map zoom">
        <button onClick={() => zoom(0.65)} aria-label="Zoom in">+</button>
        <button onClick={() => zoom(1.55)} aria-label="Zoom out">−</button>
    </div>}
    {walking && <><div className="terrain-crosshair" aria-hidden="true">+</div><p className="mt-panel-description">Camera inspection only. Use Information → Route → Traverse to advance the mission.</p></>}
    <details key={mode} className="terrain-context" open={!walking && contextOpen}
      onToggle={walking ? undefined : event => setContextOpen(event.currentTarget.open)}>
      <summary>{walking ? 'Explorer position' : 'At map center'} <span>{context?.outside ? 'Outside coverage' : `${Math.round(context?.heading ?? 0) % 360}° heading`}</span></summary>
      {!context || context.outside ? <p>No terrain at map center. Use Reset view to return to the mapped area.</p> : <>
        <p className="context-coordinates">{context.lat.toFixed(5)}° N · {context.lon.toFixed(5)}° E</p>
        <dl><div><dt>Elevation · MOLA</dt><dd>{context.elevation.toFixed(0)} m</dd></div>
          {walking && context.guidance && <div><dt>Camera above terrain</dt><dd>{Math.round(context.range)} m</dd></div>}
          <div><dt>{context.localSlope ? 'Local slope · HiRISE' : 'Regional slope'}</dt><dd>{context.slope === null ? 'No estimate' : `${context.slope.toFixed(1)}°`}</dd></div>
          <div><dt>View tilt</dt><dd>{Math.abs(context.pitch).toFixed(0)}° down</dd></div>
          <div><dt>Imagery</dt><dd>{imagery}</dd></div>
        </dl>
        {context.slope !== null && context.slope >= threshold && <p className="terrain-caution" role="status">Review terrain: slope exceeds your {threshold}° planning threshold.</p>}
        {!context.detail && <p className="terrain-caution">Outside the detailed image crop. Zooming cannot reveal additional detail here.</p>}
        <p className="context-limit">{context.hirise ? 'Local HiRISE relief grid ≈ 3 m. Image detail streams in visible tiles, up to ≈ 0.55 m/px.' : 'Regional relief grid ≈ 53 m. HiRISE close-up is available at Wildcat Ridge.'}</p>
        {slopes && <p className="slope-key"><span>5–10°</span><span>10–15°</span><span>≥15°</span></p>}
        <small>{slopes ? 'Slope overlay active · ' : ''}Route suitability is unverified.</small>
      </>}
    </details>
    {!walking && scale > 0 && <div className="terrain-scale"><span>{scale >= 1000 ? `${(scale / 1000).toFixed(2)} km` : `${Math.round(scale)} m`}</span><i /><small>At center · horizontal</small></div>}
  </>
}
