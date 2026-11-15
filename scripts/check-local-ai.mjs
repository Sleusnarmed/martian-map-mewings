import { classifyQuestion, explainReasons } from '../server/local-ai.mjs'
import { askMissionAssistant } from '../src/features/local-ai/missionAssistant.js'
import { initialMission } from '../src/features/route-planner/missionState.js'

const cases = [
  ['¿Cuánto oxígeno me queda?', 'oxygen'], ['¿Cuánto tarda la ida y la vuelta?', 'times'],
  ['¿Qué recursos limitan esta ruta?', 'resources'], ['¿Puedo volver a la base?', 'return'],
  ['Dame el estado de la misión', 'status'], ['Oculta geología', 'set_layer', 'geology', false],
  ['Muestra pendientes', 'set_layer', 'slopes', true], ['Activa calor', 'set_layer', 'heat', true],
  ['Oculta la ruta', 'set_layer', 'route', false], ['Muestra curvas de nivel', 'set_layer', 'contours', true],
  ['Muestra las zonas bloqueadas', 'set_layer', 'hazards', true], ['Oculta la capa de elevación', 'set_layer', 'elevation', false],
  ['Muestra terreno sin observar', 'set_layer', 'coverage', true], ['Oculta la imagen orbital', 'set_layer', 'orbital', false],
  ['¿Por qué se eligió esta ruta?', 'explain_route'], ['¿Por qué no puedo hacer el recorrido?', 'explain_route'],
  ['Explica por qué se eligió esta ruta o por qué no puede hacerse', 'explain_route'],
  ['Activa esa capa', 'unsupported'], ['Alterna geología', 'unsupported'], ['Avanza cincuenta metros', 'unsupported'],
  ['Muestra geología y oculta pendientes', 'unsupported'], ['Aumenta el oxígeno', 'unsupported'],
  ['Calcula una ruta hasta allí', 'unsupported'], ['Qué datos faltan para volver', 'return'], ['Apaga pendientes', 'set_layer', 'slopes', false],
  ['How much oxygen do I have left?', 'oxygen'], ['Show slopes', 'set_layer', 'slopes', true],
  ['Hide geology', 'set_layer', 'geology', false], ['Enable heat', 'set_layer', 'heat', true],
  ['Show elevation contours', 'set_layer', 'contours', true], ['Hide orbital imagery', 'set_layer', 'orbital', false],
  ['Show the route', 'set_layer', 'route', true], ['Hide known blocked areas', 'set_layer', 'hazards', false],
  ['Show unobserved ground', 'set_layer', 'coverage', true], ['Why was this route chosen?', 'explain_route'],
  ['Why can I not traverse this route?', 'explain_route'], ['How long is the outbound and return trip?', 'times'],
  ['Show that layer', 'unsupported'], ['Toggle geology', 'unsupported'], ['Increase oxygen', 'unsupported'],
]
let failed = 0
for (const [question, expected, layer, visible] of cases) {
  const start = performance.now()
  try {
    const result = await classifyQuestion(question, { signal: AbortSignal.timeout(30000) })
    const state = initialMission()
    const reply = await askMissionAssistant(question, { getState: () => state, getLayers: () => ({ ready: true, setVisibility() {} }),
      fetchImpl: async (url, options) => ({ ok: true, json: async () => url.endsWith('/intent') ? result : await explainReasons(question, JSON.parse(options.body).reasons, { signal: AbortSignal.timeout(30000) }) }) })
    const replyEnglish = !/[áéíóúñ¿¡]|qwen|sin datos|Mostrando|Ocultando/i.test(reply.text)
    const ok = replyEnglish && result.intent === expected && (expected !== 'set_layer' || result.layer === layer && result.visible === visible)
    if (!ok) failed++
    console.log(JSON.stringify({ question, expected, actual: result.intent, layer: result.layer, visible: result.visible, replyEnglish, ok, milliseconds: Math.round(performance.now() - start) }))
  } catch (error) { failed++; console.log(JSON.stringify({ question, error: error.message })) }
}
process.exitCode = failed ? 1 : 0
