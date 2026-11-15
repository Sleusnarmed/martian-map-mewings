import RouteProgress from './RouteProgress.jsx'
import { formatMeters, formatMinutes, getReturnState } from './missionPresentation.js'

export default function MissionHUD({ mission, onOpenRoute, onOpenTelemetry }) {
  if (!mission) return <section className="field-hud" aria-label="Mission controls">Mission data unavailable.</section>
  const { margin, belowReserve } = getReturnState(mission)
  const returning = mission.mode === 'return'
  return (
    <section className={`field-hud ${belowReserve ? 'is-warning' : ''}`} aria-label="Persistent mission controls">
      <RouteProgress mission={mission} onOpenRoute={onOpenRoute} />
      <div className="field-instruments">
        <button className="field-next" onClick={onOpenRoute} aria-label={`Open Route: destination ${mission.nextWaypointName || 'unavailable'}`}><span>Destination</span><strong>{mission.nextWaypointName || 'No data'}</strong><small>{returning ? 'POINT A · RETURN' : 'POINT B · DESTINATION'}</small></button>
        <div className="field-readouts" role="group" aria-label="Mission measurements">
          <button className="field-readout" onClick={onOpenRoute} aria-label={`Open Route: remaining distance ${formatMeters(mission.remainingDistanceMeters)}`}><span>Remaining</span><strong>{formatMeters(mission.remainingDistanceMeters)}</strong><small>{returning ? 'To point A' : 'To point B'}</small></button>
          <button className="field-readout" onClick={onOpenTelemetry} aria-label={`Open Telemetry: return margin ${formatMinutes(margin)}`}><span>Return margin</span><strong className={belowReserve ? 'field-warning-value' : ''}>{formatMinutes(margin)}</strong><small>{belowReserve ? 'Below reserve' : 'Reserve'} {formatMinutes(mission.reserveSeconds)}</small></button>
          <button className="field-readout" onClick={onOpenTelemetry} aria-label={`Open Telemetry: oxygen autonomy ${formatMinutes(mission.oxygenRemainingSeconds)}`}><span>O₂ autonomy</span><strong>{formatMinutes(mission.oxygenRemainingSeconds)}</strong><small>Time remaining</small></button>
        </div>
      </div>
    </section>
  )
}
