import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { RouteMissionContext } from './RouteMissionContext.js'
import { initialMission, missionPresentation, missionReducer } from './missionState.js'

export default function RouteMissionProvider({ children }) {
  const [state, dispatch] = useReducer(missionReducer, undefined, initialMission)
  const [terrain, setTerrain] = useState(null)
  const attachTerrain = useCallback(data => setTerrain(data), [])
  const inspect = useCallback(point => dispatch({ type: 'inspect', point }), [])
  const { request, playing, rate } = state
  useEffect(() => {
    if (!request || !terrain) return
    // A new request terminates old work. Hidden hazards never enter this worker.
    const worker = new Worker(new URL('./planner.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }) => dispatch({ type: 'planned', ...data })
    worker.onerror = () => dispatch({ type: 'planned', id: request.id, result: { status: 'error', message: 'Route calculation could not start. Retry the calculation.' } })
    worker.postMessage({ terrain, request })
    return () => worker.terminate()
  }, [terrain, request])
  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => {
      if (!document.hidden) dispatch({ type: 'tick', seconds: rate })
    }, 1000)
    return () => clearInterval(interval)
  }, [playing, rate])
  const value = useMemo(() => ({ state, dispatch, terrain, attachTerrain, inspect, mission: missionPresentation(state) }), [state, terrain, attachTerrain, inspect])
  return <RouteMissionContext.Provider value={value}>{children}</RouteMissionContext.Provider>
}
