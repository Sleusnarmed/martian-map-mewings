import RouteProgress from './RouteProgress.jsx'
import { formatMeters, formatMinutes, getReturnState } from './missionPresentation.js'

export default function MissionHUD({ mission, onOpenRoute }) {
  if (!mission) return <section className="field-hud" aria-label="Mission controls">Mission data unavailable.</section>
  const { margin, belowReserve } = getReturnState(mission)
  const returning = mission.mode === 'return'
  return (
    <section className={`field-hud ${belowReserve ? 'is-warning' : ''}`} aria-label="Persistent mission controls">
      <RouteProgress mission={mission} onOpenRoute={onOpenRoute} />
      <div className="field-instruments">
        <button className="field-next" onClick={onOpenRoute}><span>{returning ? 'Inbound reference' : 'Next reference'}</span><strong>{mission.nextWaypointName || 'No data'}</strong><small>{returning ? 'RETURN' : 'OUTBOUND'} · SIMULATION</small></button>
        <dl className="field-readouts">
          <div><dt>Remaining</dt><dd>{formatMeters(mission.remainingDistanceMeters)}</dd><small>To next reference</small></div>
          <div><dt>Return margin</dt><dd className={belowReserve ? 'field-warning-value' : ''}>{formatMinutes(margin)}</dd><small>{belowReserve ? 'Below reserve' : 'Reserve'} {formatMinutes(mission.reserveSeconds)}</small></div>
          <div><dt>O₂ autonomy</dt><dd>{formatMinutes(mission.oxygenRemainingSeconds)}</dd><small>Simulated estimate</small></div>
        </dl>
      </div>
    </section>
  )
}
