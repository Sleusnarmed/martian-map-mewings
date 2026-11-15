import { createContext, useContext } from 'react'
export const MapLayerContext = createContext(null)
export const useMapLayers = () => useContext(MapLayerContext)
