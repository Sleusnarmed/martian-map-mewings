import MissionIcon from '../mission-detail/MissionIcon.jsx'
import { DriveButton } from './RouteGuide'

export default function TerrainMapControls({ navigation, ready }) {
  const { context, mode, chooseMode, north, explorer } = navigation
  return <>
    <nav className="field-map-perspective" aria-label="Map perspective">
      {[['map', '2D'], ['auto', '2.5D'], ['walk', '3D']].map(([id, name]) =>
        <button key={id} disabled={!ready} aria-pressed={mode === id} onClick={() => chooseMode(id)}>{name}</button>)}
    </nav>
    <button className="field-map-compass" disabled={!ready} onClick={north} aria-label="Orient map north" title={`Heading ${Math.round(context?.heading ?? 0)}° · orient north`}>
      <span style={{ display: 'inline-flex', transform: `rotate(${-(context?.heading ?? 0)}deg)` }}><MissionIcon name="compass" /></span><span>North</span>
    </button>
    {mode === 'walk' && <div className="field-map-drive" aria-label="Explore terrain">
      <DriveButton explorer={explorer} action="forward" label="Move forward"><MissionIcon name="arrow-up" /></DriveButton>
      <DriveButton explorer={explorer} action="back" label="Move backward"><MissionIcon name="arrow-down" /></DriveButton>
      <DriveButton explorer={explorer} action="left" label="Turn left"><MissionIcon name="arrow-left" /></DriveButton>
      <DriveButton explorer={explorer} action="right" label="Turn right"><MissionIcon name="arrow-right" /></DriveButton>
    </div>}
  </>
}
