import JezeroTerrain from './features/terrain/JezeroTerrain'
import { JEZERO_POINTS } from './features/terrain/pointsOfInterest'

export default function App() {
  return <JezeroTerrain pointsOfInterest={JEZERO_POINTS} />
}
