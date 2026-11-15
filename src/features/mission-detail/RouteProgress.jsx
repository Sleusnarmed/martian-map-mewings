import { isAvailable } from './missionPresentation.js'

export default function RouteProgress({ mission, onOpenRoute }) {
  const endpoints = [`A · ${mission.startName ?? 'Base'}`, `B · ${mission.destinationName ?? 'Wildcat Ridge'}`]
  const known = isAvailable(mission.routeProgress) && mission.routeProgress >= 0 && mission.routeProgress <= 1
  const progress = known ? mission.routeProgress : 0
  return (
    <button className="field-route-progress" onClick={onOpenRoute} aria-label={`Open Route: ${endpoints.join(' to ')}. ${known ? `Position: ${Math.round(progress * 100)} percent from A to B.` : 'Position unavailable.'} ${mission.mode === 'return' ? 'Returning to A.' : 'Outbound to B.'}`}>
      <span className="field-route-caption">{mission.mode === 'return' ? 'Inbound · B → A' : 'Outbound · A → B'}{!known && ' · Position unavailable'}</span>
      <span className="field-route-track" aria-hidden="true">
        {endpoints.map((endpoint, index) => <span key={endpoint} className={`field-route-point ${known && index <= progress ? 'is-passed' : ''}`} style={{ left: `${index * 100}%` }}><i /><span>{endpoint}</span></span>)}
        {known && <span className="field-route-position" style={{ left: `${progress * 100}%` }}><i /></span>}
      </span>
    </button>
  )
}
