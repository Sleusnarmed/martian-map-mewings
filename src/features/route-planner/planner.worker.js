import { planMission } from './planner.js'
self.onmessage = ({ data: { terrain, request } }) => {
  try { self.postMessage({ id: request.id, result: planMission(terrain, request) }) }
  catch { self.postMessage({ id: request.id, result: { status: 'error', message: 'Route calculation failed. Try again with a shorter route.' } }) }
}
