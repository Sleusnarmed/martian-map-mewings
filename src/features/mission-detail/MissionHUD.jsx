import MissionIcon from './MissionIcon.jsx'
import VoiceControls from './VoiceControls.jsx'
import { formatMeters, formatMinutes, getReturnState, isAvailable } from './missionPresentation.js'

export default function MissionHUD({ mission, onReturn, onOpenRoute, onOpenAlerts }) {
  if (!mission) return <section className="field-hud" aria-label="Mission controls">Mission data unavailable.</section>
  const { known, margin, belowReserve } = getReturnState(mission)
  const returning = mission.mode === 'return'
  const hasReturnRoute = isAvailable(mission.returnDurationSeconds) && mission.returnDurationSeconds >= 0
  return (
    <section className={`field-hud ${belowReserve ? 'is-warning' : ''}`} aria-label="Persistent mission controls">
      <button className="field-notice" onClick={onOpenAlerts} aria-label={`Open current notice: ${mission.notice?.title || 'No current notice'}`}><span className="field-status-dot" aria-hidden="true" /><span role="status" aria-live="polite">{!known ? 'Mission data unavailable' : belowReserve ? `Below reserve · ${mission.notice?.title || 'Review return'}` : mission.notice?.title || 'No current notice'}</span><MissionIcon name="chevron" size={16} /></button>
      <div className="field-instruments">
        <button className="field-next" onClick={onOpenRoute}><span>{returning ? 'Inbound reference' : 'Next reference'}</span><strong>{mission.nextWaypointName || 'No data'}</strong><small>{returning ? 'RETURN' : 'OUTBOUND'} · SIMULATION</small></button>
        <dl className="field-readouts">
          <div><dt>Remaining</dt><dd>{formatMeters(mission.remainingDistanceMeters)}</dd></div>
          <div><dt>Return margin</dt><dd className={belowReserve ? 'field-warning-value' : ''}>{formatMinutes(margin)}</dd><small>Reserve {formatMinutes(mission.reserveSeconds)}</small></div>
          <div><dt>O₂ autonomy</dt><dd>{formatMinutes(mission.oxygenRemainingSeconds)}</dd><small>Simulated estimate</small></div>
        </dl>
      </div>
      <div className="field-actions"><VoiceControls key={`${mission.id}-${mission.notice?.id}-${mission.notice?.text}`} text={mission.notice?.text} compact /><button className="md-button md-button-primary field-return" disabled={!onReturn || returning || !hasReturnRoute} onClick={onReturn}><MissionIcon name="return" size={22} /><span>{returning ? 'Returning to base' : 'Return to base'}</span></button></div>
    </section>
  )
}
