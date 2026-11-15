import { useCallback, useMemo, useReducer, useState } from 'react'
import { MapLayerContext } from './MapLayerContext.js'
import { initialMapLayers, mapLayerReducer } from './mapLayerState.js'

export default function MapLayerProvider({ children, initialPointId }) {
  const [visibility, dispatch] = useReducer(mapLayerReducer, initialPointId, initialMapLayers)
  const [ready, setReady] = useState(false)
  const setVisibility = useCallback((layer, visible) => dispatch({ type: 'visibility', layer, visible }), [])
  const value = useMemo(() => ({ visibility, setVisibility, ready, setReady }), [visibility, setVisibility, ready])
  return <MapLayerContext.Provider value={value}>{children}</MapLayerContext.Provider>
}
