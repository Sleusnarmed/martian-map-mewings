import { isAvailable } from './missionPresentation.js'

const references = ['Simulated base', 'Delta lookout', 'Wildcat Ridge']

export default function RouteProgress({ mission, onOpenRoute }) {
  const known = isAvailable(mission.routeProgress) && mission.routeProgress >= 0 && mission.routeProgress <= 1
  const progress = known ? mission.routeProgress : 0
  return (
    <button className="field-route-progress" onClick={onOpenRoute} aria-label={`Open route. ${known ? `Simulated position: ${Math.round(progress * 100)} percent of the outbound reference sequence.` : 'Position unavailable.'} ${mission.mode === 'return' ? 'Returning to base.' : 'Outbound.'}`}>
      <span className="field-route-caption">{mission.mode === 'return' ? 'Inbound' : 'Outbound'} · {known ? 'simulated position' : 'position unavailable'}</span>
      <span className="field-route-track" aria-hidden="true">
        {references.map((reference, index) => <span key={reference} className={`field-route-point ${known && index / 2 <= progress ? 'is-passed' : ''}`} style={{ left: `${index * 50}%` }}><i /><span>{reference}</span></span>)}
        {known && <span className="field-route-position" style={{ left: `${progress * 100}%` }}><i /></span>}
      </span>
    </button>
  )
}
