import { createContext, useContext } from 'react'
export const RouteMissionContext = createContext(null)
export const useRouteMission = () => useContext(RouteMissionContext)
