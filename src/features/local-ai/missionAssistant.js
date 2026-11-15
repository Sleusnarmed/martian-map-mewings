import { missionPresentation } from '../route-planner/missionState.js'

export const intents = ['status', 'oxygen', 'return', 'times', 'resources', 'unsupported']
export function validateIntent(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === 1 && intents.includes(value.intent)
}

const minutes = value => Number.isFinite(value) ? `${(value / 60).toFixed(1)} min` : 'sin datos'

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
    default: return 'Por ahora puedo consultar estado, oxígeno, regreso, tiempos y recursos. El control de capas y las solicitudes de rutas todavía no están conectados.'
  }
}

export async function askMissionAssistant(question, { getState, signal, fetchImpl = fetch }) {
  const state = getState()
  const response = await fetchImpl('/api/assistant/intent', {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }),
  })
  if (!response.ok) throw new Error(`ASSISTANT_HTTP_${response.status}`)
  const data = await response.json()
  if (!validateIntent({ intent: data.intent })) throw new Error('INVALID_MODEL_RESPONSE')
  // Revision alone does not cover traversal ticks, endpoint edits, or inspection.
  if (getState() !== state) throw new Error('MISSION_CHANGED')
  return { intent: data.intent, text: answerMissionQuestion(data.intent, state) }
}
