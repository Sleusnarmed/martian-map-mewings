import { missionPresentation } from '../route-planner/missionState.js'
import { MAP_LAYERS } from '../terrain/mapLayerState.js'

export const intents = ['status', 'oxygen', 'return', 'times', 'resources', 'explain_route', 'set_layer', 'unsupported']
export function validateIntent(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) || !intents.includes(value.intent)) return false
  if (Object.keys(value).some(key => !['intent', 'layer', 'visible'].includes(key))) return false
  if (value.intent === 'set_layer') return Object.hasOwn(MAP_LAYERS, value.layer) && typeof value.visible === 'boolean'
  return value.layer == null && value.visible == null
}

const minutes = value => Number.isFinite(value) ? `${(value / 60).toFixed(1)} min` : 'sin datos'

export function routeReasons(state) {
  const result = state.result
  if (!result) return [{ id: 'missing', text: state.phase === 'calculating' ? 'La ruta se está calculando. Espera a que termine para consultar el motivo.' : 'Todavía no hay una ruta evaluada. Selecciona A y B y calcula la ruta.' }]
  if (!result.route) {
    const messages = {
      span: 'La separación directa entre A y B supera el límite técnico de 6 kilómetros de este planificador local.',
      coordinates: 'Faltan coordenadas válidas de inicio o destino.',
      coincident: 'A y B deben estar separados al menos un metro.',
      endpoint: 'Un extremo está fuera de la cobertura de elevación utilizable, dentro de una zona bloqueada o por encima del límite de pendiente. El resultado no distingue cuál de estas condiciones ocurrió.',
      search: 'No se encontró una ruta dentro del área de búsqueda y el límite de pendiente. Esto no demuestra que no exista una ruta fuera de esa búsqueda.',
      return: 'No se pudo establecer un camino de regreso con los límites actuales.',
      settings: 'Los límites de planificación contienen valores no válidos.',
    }
    return [{ id: 'blocked', text: messages[result.reasonCode] ?? 'El planificador no produjo una ruta utilizable. Revisa los límites y la cobertura del terreno en Route.' }]
  }
  const reasons = [
    { id: 'priority', text: result.route.priority === 'distance'
      ? 'Se priorizó la distancia entre las opciones exploradas que cumplen las restricciones.'
      : 'Se priorizó el coste de recorrido: tiempo estimado, exposición a pendientes y una penalización por terreno aún no observado.' },
    { id: 'terrain', text: `La ruta se comprobó contra la elevación disponible y el límite de pendiente de ${state.settings.maxSlope} grados. Se excluyen las zonas bloqueadas conocidas. Esto no garantiza seguridad ante peligros no observados.` },
  ]
  if (Number.isFinite(result.route.maxSlope)) reasons.push({ id: 'slope', text: `La pendiente máxima evaluada en esta ruta es ${result.route.maxSlope.toFixed(1)} grados.` })
  if (result.status === 'resources') reasons.push({ id: 'resources', text: `La ruta se pudo calcular, pero el recorrido permanece bloqueado por recursos insuficientes. ${answerMissionQuestion('resources', state)}` })
  else reasons.push({ id: 'resources', text: `La evaluación incluye ida, regreso conservador, actividad y reserva. ${answerMissionQuestion('times', state)}` })
  return reasons
}

// All figures come from the same reducer/presentation used by the HUD, never the LLM.
export function answerMissionQuestion(intent, state) {
  const mission = missionPresentation(state)
  switch (intent) {
    case 'oxygen': return `Autonomía de oxígeno restante: ${minutes(mission.oxygenRemainingSeconds)}. Reserva requerida: ${minutes(mission.reserveSeconds)}. Es una estimación del planificador, no una lectura de sensores.`
    case 'return': return `Regreso estimado desde la posición actual: ${minutes(mission.returnDurationSeconds)}. Margen de tiempo tras regresar: ${minutes(mission.returnMarginSeconds)}. Margen de oxígeno tras regresar: ${minutes(mission.oxygenReturnMarginSeconds)}. Reserva requerida: ${minutes(mission.reserveSeconds)}. Revisa la ruta de regreso antes de continuar.`
    case 'times': {
      const result = state.result
      return `Tiempos de la última planificación: ida ${minutes(result?.outboundSeconds)}; vuelta ${minutes(result?.returnSeconds)}; vuelta conservadora ${minutes(result?.conservativeReturnSeconds)}. No representan necesariamente el tiempo restante durante el recorrido.`
    }
    case 'resources': {
      const resources = state.result?.resources
      if (!resources?.length) return 'No hay una evaluación de recursos disponible. Selecciona A y B y calcula una ruta.'
      return resources.map(resource => `${resource.id === 'oxygen' ? 'Oxígeno' : 'Tiempo de misión'}: disponible al calcular ${minutes(resource.availableSeconds)}; requerido ${minutes(resource.requiredSeconds)}; mínimo total ${Number.isFinite(resource.minimumTotalSeconds) ? `${(Math.ceil(resource.minimumTotalSeconds / 6) / 10).toFixed(1)} min` : 'sin datos'}; faltante ${minutes(resource.shortfallSeconds)}.`).join('\n')
    }
    case 'status': return `Estado: ${state.phase}. Distancia restante: ${Number.isFinite(mission.remainingDistanceMeters) ? `${Math.round(mission.remainingDistanceMeters)} m` : 'sin ruta calculada'}. Oxígeno: ${minutes(mission.oxygenRemainingSeconds)}. Regreso: ${minutes(mission.returnDurationSeconds)}.`
    case 'explain_route': return routeReasons(state).map(reason => reason.text).join(' ')
    default: return 'Puedes pedirme mostrar u ocultar una capa, explicar la ruta o consultar oxígeno, regreso, tiempos y recursos. Di una orden a la vez y nombra la capa.'
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
    return { intent: data.intent, text: `${data.visible ? 'Mostrando' : 'Ocultando'} ${layer.label}. ${layer.note ?? ''} Cambiar la visibilidad no altera las restricciones de la ruta.`.trim() }
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
    // Qwen selects and orders verified reasons; it cannot invent facts or figures.
    const selected = explanation.reasonIds
    if (!Array.isArray(selected) || !selected.length || selected.some(id => !reasons.some(reason => reason.id === id))) throw new Error('INVALID_MODEL_RESPONSE')
    const ids = [...new Set(selected)]
    if (reasons.some(reason => reason.id === 'resources')) ids.push(...(ids.includes('resources') ? [] : ['resources']))
    if (state.result?.status === 'resources') ids.sort((a, b) => (a === 'resources' ? -1 : b === 'resources' ? 1 : 0))
    return { intent: data.intent, text: ids.map(id => reasons.find(reason => reason.id === id).text).join(' ') }
  }
  return { intent: data.intent, text: answerMissionQuestion(data.intent, state) }
}
