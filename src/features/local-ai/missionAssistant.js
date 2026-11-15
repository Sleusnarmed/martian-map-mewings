import { missionPresentation } from '../route-planner/missionState.js'
import { MAP_LAYERS } from '../terrain/mapLayerState.js'

export const intents = ['status', 'oxygen', 'return', 'times', 'resources', 'explain_route', 'set_layer', 'unsupported']
export function validateIntent(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || !intents.includes(value.intent)) return false
  if (Object.keys(value).some(key => !['intent', 'layer', 'visible'].includes(key))) return false
  if (value.intent === 'set_layer') return Object.hasOwn(MAP_LAYERS, value.layer) && typeof value.visible === 'boolean'
  return value.layer == null && value.visible == null
}

const minutes = value => Number.isFinite(value) ? `${(value / 60).toFixed(1)} min` : 'no data'

export function routeReasons(state) {
  const result = state.result
  if (!result) return [{ id: 'missing', text: state.phase === 'calculating' ? 'The route is being calculated. Wait for the result before asking for an explanation.' : 'No route has been evaluated yet. Select A and B, then calculate the route.' }]
  if (!result.route) {
    const messages = {
      span: 'The direct distance between A and B exceeds this local planner’s technical limit of 6 kilometres.',
      coordinates: 'Valid start or destination coordinates are missing.',
      coincident: 'A and B must be at least one metre apart.',
      endpoint: 'An endpoint is outside usable elevation coverage, inside a blocked area, or above the slope limit. This result does not distinguish which condition occurred.',
      search: 'No route was found within the search area and slope limit. This does not prove that no route exists outside that search.',
      return: 'A return path could not be established under the current limits.',
      settings: 'The planning limits contain invalid values.',
    }
    return [{ id: 'blocked', text: messages[result.reasonCode] ?? 'The planner did not produce a usable route. Review the limits and terrain coverage in Route.' }]
  }
  const reasons = [
    { id: 'priority', text: result.route.priority === 'distance'
      ? 'Distance was prioritised among the explored options that satisfy the constraints.'
      : 'The planner prioritised traversal cost: estimated time, slope exposure, and a penalty for ground not yet observed.' },
    { id: 'terrain', text: `The route was checked against available elevation data and a slope limit of ${state.settings.maxSlope} degrees. Known blocked areas are excluded. This does not guarantee safety from unobserved hazards.` },
  ]
  if (Number.isFinite(result.route.maxSlope)) reasons.push({ id: 'slope', text: `The maximum evaluated slope on this route is ${result.route.maxSlope.toFixed(1)} degrees.` })
  if (result.status === 'resources') reasons.push({ id: 'resources', text: `The route was calculated, but traversal is locked because resources are insufficient. ${answerMissionQuestion('resources', state)}` })
  else reasons.push({ id: 'resources', text: `The assessment includes outbound travel, a conservative return, activity, and reserve. ${answerMissionQuestion('times', state)}` })
  return reasons
}

// All figures come from the same reducer/presentation used by the HUD, never the LLM.
export function answerMissionQuestion(intent, state) {
  const mission = missionPresentation(state)
  switch (intent) {
    case 'oxygen': return `Remaining oxygen autonomy: ${minutes(mission.oxygenRemainingSeconds)}. Required reserve: ${minutes(mission.reserveSeconds)}. This is a planner estimate, not a sensor reading.`
    case 'return': return `Estimated return from the current position: ${minutes(mission.returnDurationSeconds)}. Time margin after returning: ${minutes(mission.returnMarginSeconds)}. Oxygen margin after returning: ${minutes(mission.oxygenReturnMarginSeconds)}. Required reserve: ${minutes(mission.reserveSeconds)}. Review the return route before continuing.`
    case 'times': {
      const result = state.result
      return `Times from the latest plan: outbound ${minutes(result?.outboundSeconds)}; return ${minutes(result?.returnSeconds)}; conservative return ${minutes(result?.conservativeReturnSeconds)}. These do not necessarily represent the time remaining during traversal.`
    }
    case 'resources': {
      const resources = state.result?.resources
      if (!resources?.length) return 'No resource assessment is available. Select A and B, then calculate a route.'
      return resources.map(resource => `${resource.id === 'oxygen' ? 'Oxygen' : 'Mission time'}: available when calculated ${minutes(resource.availableSeconds)}; required ${minutes(resource.requiredSeconds)}; minimum total ${Number.isFinite(resource.minimumTotalSeconds) ? `${(Math.ceil(resource.minimumTotalSeconds / 6) / 10).toFixed(1)} min` : 'no data'}; shortfall ${minutes(resource.shortfallSeconds)}.`).join('\n')
    }
    case 'status': return `State: ${state.phase}. Remaining distance: ${Number.isFinite(mission.remainingDistanceMeters) ? `${Math.round(mission.remainingDistanceMeters)} m` : 'no calculated route'}. Oxygen: ${minutes(mission.oxygenRemainingSeconds)}. Return: ${minutes(mission.returnDurationSeconds)}.`
    case 'explain_route': return routeReasons(state).map(reason => reason.text).join(' ')
    default: return 'Ask EVA to show or hide a named layer, explain a route, or check oxygen, return, times, and resources. Give one command at a time.'
  }
}

export async function askMissionAssistant(question, { getState, getLayers, signal, fetchImpl = fetch }) {
  const state = getState()
  const response = await fetchImpl('/api/assistant/intent', {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }),
  })
  if (!response.ok) throw new Error(`ASSISTANT_HTTP_${response.status}`)
  const data = await response.json()
  const command = { intent: data.intent, ...(data.layer != null ? { layer: data.layer } : {}), ...(data.visible != null ? { visible: data.visible } : {}) }
  if (!validateIntent(command)) throw new Error('INVALID_MODEL_RESPONSE')
  // Revision alone does not cover traversal ticks, endpoint edits, or inspection.
  if (signal?.aborted) throw new Error('CANCELLED')
  if (data.intent === 'set_layer') {
    const layers = getLayers?.()
    if (!layers?.ready) throw new Error('MAP_NOT_READY')
    layers.setVisibility(data.layer, data.visible)
    const layer = MAP_LAYERS[data.layer]
    return { intent: data.intent, text: `${data.visible ? 'Showing' : 'Hiding'} ${layer.label}. ${layer.note ?? ''} Changing visibility does not alter route constraints.`.trim() }
  }
  if (getState() !== state) throw new Error('MISSION_CHANGED')
  if (data.intent === 'explain_route') {
    const reasons = routeReasons(state)
    const response = await fetchImpl('/api/assistant/explain', { method: 'POST', signal,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, reasons }) })
    if (!response.ok) throw new Error(`ASSISTANT_HTTP_${response.status}`)
    const explanation = await response.json()
    if (signal?.aborted) throw new Error('CANCELLED')
    if (getState() !== state) throw new Error('MISSION_CHANGED')
    // EVA selects and orders verified reasons; it cannot invent facts or figures.
    const selected = explanation.reasonIds
    if (!Array.isArray(selected) || !selected.length || selected.some(id => !reasons.some(reason => reason.id === id))) throw new Error('INVALID_MODEL_RESPONSE')
    const ids = [...new Set(selected)]
    if (reasons.some(reason => reason.id === 'resources')) ids.push(...(ids.includes('resources') ? [] : ['resources']))
    if (state.result?.status === 'resources') ids.sort((a, b) => (a === 'resources' ? -1 : b === 'resources' ? 1 : 0))
    return { intent: data.intent, text: ids.map(id => reasons.find(reason => reason.id === id).text).join(' ') }
  }
  return { intent: data.intent, text: answerMissionQuestion(data.intent, state) }
}
