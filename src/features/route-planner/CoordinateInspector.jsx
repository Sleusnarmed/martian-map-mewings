import { useRouteMission } from './RouteMissionContext.js'
import { formatCoordinates } from './routeGeometry.js'

export default function CoordinateInspector() {
  const { state, dispatch } = useRouteMission()
  const point = state.inspection
  if (!point && !state.pickTarget) return null
  return <section className="coordinate-inspector" aria-label="Selected map coordinates">
    <div className="coordinate-heading"><strong>{state.pickTarget ? `Select point ${state.pickTarget.toUpperCase()}` : point?.name ?? 'Selected point'}</strong><button aria-label="Close coordinate inspector" onClick={() => { dispatch({ type: 'dismiss-inspection' }); dispatch({ type: 'pick', target: null }) }}>Close</button></div>
    {!point ? <p role="status">Tap a location or a reference on the map.</p> : point.error ? <p role="status">{point.error}</p> : <>
      <output aria-live="polite">{formatCoordinates(point)}</output>
      <p>{Number.isFinite(point.elevation) ? `${Math.round(point.elevation)} m · MOLA elevation` : 'Elevation checked when calculating'}</p>
      <div className="route-actions"><button onClick={() => dispatch({ type: 'endpoint', target: 'a', point })}>Use as A</button><button onClick={() => dispatch({ type: 'endpoint', target: 'b', point })}>Use as B</button></div>
      <button className="coordinate-block" disabled={state.hazards.length >= 32} onClick={() => dispatch({ type: 'hazard', point })}>Report blocked area · 20 m</button>
    </>}
  </section>
}
