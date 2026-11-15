import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import Home from './features/home/Home'
import { JEZERO_POINTS } from './features/terrain/pointsOfInterest'
import { normalizeRoute, routeForZone } from './navigation'
import SpaceLoader from './components/SpaceLoader'
const Terrain = lazy(() => import('./features/terrain/JezeroTerrain'))
const MissionWorkspace = lazy(() => import('./features/mission-detail/MissionWorkspace'))

function MissionTerrain(props) {
  return <Suspense fallback={<SpaceLoader />}><Terrain {...props} pointsOfInterest={JEZERO_POINTS} /></Suspense>
}

export default function App() {
  const [route, setRoute] = useState(() => normalizeRoute(window.location.hash))
  useEffect(() => {
    const update = () => setRoute(normalizeRoute(window.location.hash))
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  const go = useCallback(path => { window.location.hash = path }, [])
  const openZone = useCallback(zone => { const path = routeForZone(zone); if (path) go(path) }, [go])
  if (route === '/' || route === '/mars') return <Home onZoneSelected={openZone} expanded={route === '/mars'} onExpandedChange={expanded => go(expanded ? '/mars' : '/')} />
  const initialPointId = route.endsWith('wildcat-ridge') ? 'wildcat-ridge' : 'jezero'
  return <Suspense fallback={<SpaceLoader />}>
    <MissionWorkspace key={route} integrated initialRegionId={initialPointId} onBackToGlobe={() => go('/mars')} MapComponent={MissionTerrain} />
  </Suspense>
}
