import { formatCoordinates } from '../route-planner/routeGeometry.js'
import SourceReference from '../../components/SourceReference.jsx'

export default function TerrainPointDetails({ selection, page }) {
  return <div className="mt-science">
    <h2>{selection.name}</h2>
    {page === 0 && <><p className="mt-panel-description">{selection.campaign}</p><p className="mt-science-description">{selection.summary || 'No science summary available for this site.'}</p></>}
    {page === 1 && <><h3>Published position</h3><p>{formatCoordinates(selection)}</p>{selection.positionNote && <p className="mt-body-note">{selection.positionNote}</p>}</>}
    {page === 2 && <><h3>Sources & coverage</h3><SourceReference source={selection.source} citation={selection.reference}>Published reference</SourceReference>{selection.contextSource && <SourceReference source={selection.contextSource}>NASA science context</SourceReference>}</>}
  </div>
}
