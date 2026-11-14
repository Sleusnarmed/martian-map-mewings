import { useState } from 'react'
import MissionIcon from './MissionIcon.jsx'

export default function RouteMapPlaceholder({ mission, onInspectStop, onOpenRoute }) {
  const [zoom, setZoom] = useState(1)
  const [centerCrew, setCenterCrew] = useState(false)
  const positionKnown = typeof mission?.remainingDistanceMeters === 'number'
  const arrived = mission?.status === 'arrived'
  const nearStop = mission?.id !== 'normal'
  const crew = arrived ? [650, 135] : nearStop ? [590, 185] : [300, 310]
  const viewWidth = 800 / zoom
  const viewHeight = 500 / zoom
  const center = centerCrew ? crew : [400, 250]
  const viewBox = `${center[0] - viewWidth / 2} ${center[1] - viewHeight / 2} ${viewWidth} ${viewHeight}`
  const returning = mission?.mode === 'return'
  const hazard = mission?.id === 'seismic-delay'

  return (
    <section className="mt-map" aria-labelledby="route-map-title">
      <div className="mt-map-heading"><div><h1 id="route-map-title">Jezero excursion</h1><p>Schematic route · simulated · not to scale</p></div><span className="md-tag">Map placeholder</span></div>
      <div className="mt-map-stage">
        <svg className="mt-route-svg" viewBox={viewBox} role="img" aria-labelledby="schematic-title schematic-desc">
          <title id="schematic-title">Simulated route from base to Wildcat Ridge</title>
          <desc id="schematic-desc">Illustrative route through Delta lookout. Geometry and crew position are scenario placeholders, not geographic measurements.{returning ? ' Return mode follows the same route in reverse.' : ''}{!positionKnown ? ' Crew position unavailable.' : ''}</desc>
          <defs><pattern id="mt-map-grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#224476" strokeWidth="1" /></pattern></defs>
          <rect x="-800" y="-500" width="2400" height="1500" fill="#07173f" />
          <rect x="-800" y="-500" width="2400" height="1500" fill="url(#mt-map-grid)" />
          <g fill="none" stroke="#365686" strokeWidth="1" opacity=".7" aria-hidden="true">
            <ellipse cx="180" cy="110" rx="140" ry="75" /><ellipse cx="180" cy="110" rx="105" ry="53" /><ellipse cx="180" cy="110" rx="70" ry="32" />
            <ellipse cx="650" cy="390" rx="170" ry="95" /><ellipse cx="650" cy="390" rx="130" ry="70" /><ellipse cx="650" cy="390" rx="90" ry="45" />
          </g>
          {hazard && <g><circle cx="590" cy="185" r="65" fill="none" stroke="#eafe07" strokeWidth="2" strokeDasharray="7 7" /><text x="455" y="60" className="mt-map-alert-label">SIMULATED SEISMIC ALERT</text></g>}
          <polyline points="130,380 220,355 300,310 405,275 470,230 590,185 650,135" fill="none" stroke="#07173f" strokeWidth="13" strokeLinejoin="round" />
          <polyline points="130,380 220,355 300,310 405,275 470,230 590,185 650,135" fill="none" stroke="#2e96f5" strokeWidth="5" strokeLinejoin="round" />
          <g fill="#07173f" stroke="#ffffff" strokeWidth="3"><rect x="119" y="369" width="22" height="22" rx="3" /><circle cx="405" cy="275" r="10" /><circle cx="650" cy="135" r="10" /></g>
          <g className="mt-map-point-label"><text x="100" y="420">Simulated base</text><text x="350" y="315">Delta lookout</text><text x="600" y="105">Wildcat Ridge</text></g>
          {positionKnown && <g transform={`translate(${crew[0]},${crew[1]})`}><circle r="23" fill="#07173f" stroke="#eafe07" strokeWidth="2" /><path d={returning ? 'm-9 5 5-14 10 10-15 4Z' : 'm9-5-5 14-10-10 15-4Z'} fill="#eafe07" /><text x="0" y="-34" textAnchor="middle" className="mt-crew-label">CREW · SIMULATED</text></g>}
        </svg>
        {!positionKnown && <div className="mt-position-unavailable" role="status">Crew position unavailable</div>}
      </div>
        <div className="mt-map-tools" role="group" aria-label="Schematic map controls"><span>Map view</span>
          <button className="md-button md-button-outline" aria-label="Zoom in on schematic" disabled={zoom >= 2} onClick={() => setZoom(Math.min(2, zoom + .5))}><MissionIcon name="plus" /></button>
          <button className="md-button md-button-outline" aria-label="Zoom out of schematic" disabled={zoom <= 1} onClick={() => setZoom(Math.max(1, zoom - .5))}><MissionIcon name="minus" /></button>
          <button className="md-button md-button-outline" aria-label="Center simulated crew" disabled={!positionKnown} onClick={() => { setCenterCrew(true); setZoom(1.5) }}><MissionIcon name="locate" /></button>
          <button className="md-button md-button-outline" aria-label="Fit entire schematic route" onClick={() => { setCenterCrew(false); setZoom(1) }}><MissionIcon name="expand" /></button>
        </div>
      <div className="mt-map-bottom"><span><i />{returning ? 'Return route' : 'Outbound route'}<small>Scenario position · no live tracking</small></span><div><button className="md-button md-button-outline" onClick={onOpenRoute}>Route details</button><button className="md-button md-button-outline" onClick={onInspectStop}>Inspect stop</button></div></div>
    </section>
  )
}
