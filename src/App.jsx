import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import Home from './features/home/Home'
import { JEZERO_POINTS } from './features/terrain/pointsOfInterest'
import { normalizeRoute, routeForZone } from './navigation'
const MarsGlobe = lazy(() => import('./components/MarsGlobe3D'))
const Terrain = lazy(() => import('./features/terrain/JezeroTerrain'))

export default function App() {
  const [route, setRoute] = useState(() => normalizeRoute(window.location.hash))
  useEffect(() => {
    const update = () => setRoute(normalizeRoute(window.location.hash))
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  const go = useCallback(path => { window.location.hash = path }, [])
  const openZone = useCallback(zone => { const path = routeForZone(zone); if (path) go(path) }, [go])
  if (route === '/') return <Home onMarsSelected={() => go('/mars')} />
  return <>
    <nav className="journey-nav" aria-label="Mission navigation"><a href="#/">← Sistema solar</a><span>/</span>{route === '/mars' ? <strong>Marte</strong> : <><a href="#/mars">← Globo de Marte</a><span>/</span><strong>{route.endsWith('wildcat-ridge') ? 'Wildcat Ridge' : 'Jezero'}</strong></>}</nav>
    <div className="journey-screen"><Suspense fallback={<p className="journey-loading" role="status">Cargando vista de Marte…</p>}>
      {route === '/mars' ? <MarsGlobe onZoneSelected={openZone} /> : <Terrain key={route} pointsOfInterest={JEZERO_POINTS} initialPointId={route.endsWith('wildcat-ridge') ? 'wildcat-ridge' : 'jezero'} />}
    </Suspense></div>
  </>
}
