import MissionIcon from './MissionIcon.jsx'
import VoiceControls from './VoiceControls.jsx'
import { formatMeters, formatMinutes, getReturnState, isAvailable } from './missionPresentation.js'

export default function MissionHUD({ mission, onReturn, onOpenRoute, onOpenAlerts }) {
  if (!mission) return <footer className="mt-hud">Mission data unavailable.</footer>
  const { known, margin, belowReserve } = getReturnState(mission)
  const returning = mission.mode === 'return'
  const hasReturnRoute = isAvailable(mission.returnDurationSeconds) && mission.returnDurationSeconds >= 0
  return (
    <footer className={`mt-hud ${belowReserve ? 'mt-hud-warning' : ''}`} aria-label="Persistent mission HUD">
      <div className="mt-status-strip">
        <button onClick={onOpenAlerts} className="mt-notice-short" aria-label={`Open current notice: ${mission.notice?.title || 'No current notice'}`}><span className="mt-notice-light" aria-hidden="true" /><span role="status" aria-live="polite">{!known ? 'Mission data unavailable' : belowReserve ? `Below reserve · ${mission.notice?.title || 'Review return'}` : mission.notice?.title || 'No current notice'}</span><MissionIcon name="chevron" size={16} /></button>
        <span className="mt-next-compact">{returning ? 'Inbound' : 'Next'}<strong>{mission.nextWaypointName || 'No data'}</strong></span>
        <span className="mt-reserve-label">Reserve {formatMinutes(mission.reserveSeconds)} · Simulation</span>
      </div>
      <div className="mt-hud-main">
        <button className="mt-hud-destination" onClick={onOpenRoute}><span>{returning ? 'Inbound reference' : 'Next reference'}</span><strong>{mission.nextWaypointName || 'No data'}</strong></button>
        <dl className="mt-hud-metrics"><div><dt>Remaining</dt><dd>{formatMeters(mission.remainingDistanceMeters)}</dd></div><div><dt>Return margin</dt><dd className={belowReserve ? 'mt-warning-value' : ''}>{formatMinutes(margin)}</dd></div><div><dt>Oxygen autonomy</dt><dd>{formatMinutes(mission.oxygenRemainingSeconds)}</dd></div></dl>
        <div className="mt-hud-actions"><VoiceControls key={`${mission.id}-${mission.notice?.id}-${mission.notice?.text}`} text={mission.notice?.text} /><button className="md-button md-button-primary" disabled={!onReturn || returning || !hasReturnRoute} onClick={onReturn}>{returning ? 'Returning to base' : 'Return to base'}<MissionIcon name="arrow-up-right" /></button></div>
      </div>
    </footer>
  )
}
