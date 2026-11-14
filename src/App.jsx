import { useCallback, useEffect, useState } from 'react'
import TerrainLoadingScreen from './features/terrain/TerrainLoadingScreen'
import { JEZERO_POINTS } from './features/terrain/pointsOfInterest'

export default function App() {
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [Terrain, setTerrain] = useState(null)
  const [error, setError] = useState(null)
  const onImageReady = useCallback(() => setPreviewLoaded(true), [])

  useEffect(() => {
    if (!previewLoaded) return
    let active = true
    // Let the small preview paint before fetching/evaluating Cesium's larger chunk.
    const timer = setTimeout(() => {
      import('./features/terrain/JezeroTerrain').then(module => {
        if (active) setTerrain(() => module.default)
      }).catch(() => { if (active) setError('Detailed view could not load. You can continue using the 2D map.') })
    }, 100)
    return () => { active = false; clearTimeout(timer) }
  }, [previewLoaded])

  return Terrain ? <Terrain pointsOfInterest={JEZERO_POINTS} /> : <TerrainLoadingScreen onImageReady={onImageReady} error={error}/>
}
