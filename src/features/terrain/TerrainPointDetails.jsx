import { formatCoordinates } from '../route-planner/routeGeometry.js'

export default function TerrainPointDetails({ selection, pinned, onClose, onPointerEnter, onPointerLeave }) {
  return <aside className="terrain-poi-details" aria-label="Science point of interest"
    onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}
    onFocus={onPointerEnter} onBlur={onPointerLeave}>
    <div><strong>{selection.name}</strong><button aria-label="Close point details" onClick={onClose}>×</button></div>
    {selection.summary && <p>{selection.summary}</p>}
    <p>{formatCoordinates(selection)}</p>
    {selection.positionNote && <p>{selection.positionNote}</p>}
    {selection.reference && <small>{selection.reference}</small>}
    <a href={selection.source} target="_blank" rel="noreferrer">Published source ↗</a>
    {selection.contextSource && <a href={selection.contextSource} target="_blank" rel="noreferrer">NASA science context ↗</a>}
    <small>{pinned ? 'Pinned science reference.' : 'Click the marker to keep these details open.'}</small>
  </aside>
}
