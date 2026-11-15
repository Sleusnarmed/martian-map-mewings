import { formatCoordinates } from '../route-planner/routeGeometry.js'
import SourceReference from '../../components/SourceReference.jsx'

export default function TerrainPointDetails({ selection, pinned, onClose, onPointerEnter, onPointerLeave }) {
  return <aside className="terrain-poi-details" aria-label="Science point of interest"
    onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}
    onFocus={onPointerEnter} onBlur={onPointerLeave}>
    <div><strong>{selection.name}</strong><button aria-label="Close point details" onClick={onClose}>×</button></div>
    <details><summary>Science details</summary>
    {selection.summary && <p>{selection.summary}</p>}
    <p>{formatCoordinates(selection)}</p>
    {selection.positionNote && <p>{selection.positionNote}</p>}
    {selection.reference && <small>{selection.reference}</small>}
    <SourceReference source={selection.source} citation={selection.reference}>Published reference</SourceReference>
    {selection.contextSource && <SourceReference source={selection.contextSource}>NASA science context</SourceReference>}
    <small>{pinned ? 'Pinned science reference.' : 'Click the marker to keep these details open.'}</small>
    </details>
  </aside>
}
