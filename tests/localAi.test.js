import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyQuestion, explainReasons } from '../server/local-ai.mjs'
import { initialMission } from '../src/features/route-planner/missionState.js'
import { answerMissionQuestion, askMissionAssistant, validateIntent } from '../src/features/local-ai/missionAssistant.js'
import { explicitLayerCommand } from '../src/features/local-ai/layerCommandGuard.js'
import { initialMapLayers, mapLayerReducer } from '../src/features/terrain/mapLayerState.js'

test('model output cannot add actions or unsupported intents', async () => {
  assert.equal(validateIntent({ intent: 'oxygen', action: 'play' }), false)
  assert.equal(validateIntent({ intent: 'play' }), false)
  await assert.rejects(classifyQuestion('oxígeno', { fetchImpl: async () => ({ ok: true, json: async () => ({ message: { content: '{"intent":"play"}' } }) }) }), /INVALID_MODEL_RESPONSE/)
})

test('missing route never becomes a zero-minute return', () => {
  const text = answerMissionQuestion('return', initialMission())
  assert.match(text, /Estimated return from the current position: no data/)
  assert.match(answerMissionQuestion('resources', initialMission()), /No resource assessment/)
})

test('resource minimum rounds upward and limited routes report deficits', () => {
  const state = { ...initialMission(), result: { resources: [{ id: 'oxygen', availableSeconds: 60, requiredSeconds: 125, minimumTotalSeconds: 125, shortfallSeconds: 65 }] } }
  assert.match(answerMissionQuestion('resources', state), /minimum total 2.1 min; shortfall 1.1 min/)
})

test('changed mission invalidates in-flight answers even at same revision', async () => {
  let state = initialMission()
  await assert.rejects(askMissionAssistant('estado', { getState: () => state, fetchImpl: async () => {
    state = { ...state, elapsed: 10 }
    return { ok: true, json: async () => ({ intent: 'status' }) }
  } }), /MISSION_CHANGED/)
})

test('assistant derives numbers from mission, not model text', async () => {
  const state = initialMission()
  const result = await askMissionAssistant('oxígeno', { getState: () => state, fetchImpl: async () => ({ ok: true, json: async () => ({ intent: 'oxygen', text: '9999 minutos' }) }) })
  assert.match(result.text, /60.0 min/)
  assert.doesNotMatch(result.text, /9999/)
})

test('bounded input and unavailable engine fail explicitly', async () => {
  await assert.rejects(classifyQuestion('a'.repeat(1001)), /INVALID_QUESTION/)
  await assert.rejects(classifyQuestion('estado', { fetchImpl: async () => ({ ok: false }) }), /MODEL_UNAVAILABLE/)
})

test('inference explicitly disables reasoning and bounds context and generation', async () => {
  await classifyQuestion('estado', { fetchImpl: async (_url, options) => {
    const body = JSON.parse(options.body)
    assert.equal(body.model, 'gemma3:4b')
    assert.equal(body.think, false)
    assert.equal(body.options.num_ctx, 2048)
    assert.equal(body.options.num_predict, 120)
    return { ok: true, json: async () => ({ message: { content: '{"intent":"status"}' } }) }
  } })
})

test('layer commands need an explicit layer and direction, rejecting ambiguity and negation', () => {
  assert.equal(explicitLayerCommand('Muestra pendientes', { layer: 'slopes', visible: true }), true)
  assert.equal(explicitLayerCommand('Oculta pendientes', { layer: 'slopes', visible: true }), false)
  assert.equal(explicitLayerCommand('Activa esa capa', { layer: 'orbital', visible: true }), false)
  assert.equal(explicitLayerCommand('No muestres pendientes', { layer: 'slopes', visible: true }), false)
  assert.equal(explicitLayerCommand('Muestra geología y oculta pendientes', { layer: 'geology', visible: true }), false)
  assert.equal(explicitLayerCommand('Muestra terreno sin observar', { layer: 'coverage', visible: true }), true)
  assert.equal(explicitLayerCommand('Show slopes', { layer: 'slopes', visible: true }), true)
  assert.equal(explicitLayerCommand('Hide geology', { layer: 'geology', visible: false }), true)
  assert.equal(explicitLayerCommand('Do not show slopes', { layer: 'slopes', visible: true }), false)
  assert.equal(explicitLayerCommand('Show that layer', { layer: 'slopes', visible: true }), false)
})

test('Spanish requests produce English answers and layer confirmations', async () => {
  const state = initialMission()
  const oxygen = await askMissionAssistant('¿Cuánto oxígeno me queda?', { getState: () => state, fetchImpl: async () => ({ ok: true, json: async () => ({ intent: 'oxygen' }) }) })
  assert.match(oxygen.text, /^Remaining oxygen autonomy:/)
  const layer = await askMissionAssistant('Muestra pendientes', { getState: () => state, getLayers: () => ({ ready: true, setVisibility() {} }), fetchImpl: async () => ({ ok: true, json: async () => ({ intent: 'set_layer', layer: 'slopes', visible: true }) }) })
  assert.match(layer.text, /^Showing slopes\./)
  assert.doesNotMatch(layer.text, /Qwen|Mostrando|Ocultando/i)
})

test('shared map preference mutation does not alter mission or accept unknown layers', () => {
  const state = initialMapLayers('wildcat-ridge')
  const next = mapLayerReducer(state, { type: 'visibility', layer: 'slopes', visible: true })
  assert.equal(next.slopes, true)
  assert.equal(state.slopes, false)
  assert.equal(mapLayerReducer(next, { type: 'visibility', layer: 'oxygen', visible: true }), next)
  assert.equal(mapLayerReducer(next, { type: 'visibility', layer: 'geology', visible: 'false' }), next)
})

test('cancelled or unavailable-map commands cannot mutate layers', async () => {
  const state = initialMission()
  const controller = new AbortController()
  let changed = false
  const getLayers = () => ({ ready: true, setVisibility: () => { changed = true } })
  const fetchImpl = async () => { controller.abort(); return { ok: true, json: async () => ({ intent: 'set_layer', layer: 'slopes', visible: true }) } }
  await assert.rejects(askMissionAssistant('Muestra pendientes', { getState: () => state, getLayers, signal: controller.signal, fetchImpl }), /CANCELLED/)
  assert.equal(changed, false)
})

test('explanations reject invented reasons and retain limiting resources', async () => {
  await assert.rejects(explainReasons('por qué', [{ id: 'blocked', text: 'Sin cobertura' }], { fetchImpl: async () => ({ ok: true, json: async () => ({ message: { content: '{"reasonIds":["earthquake"]}' } }) }) }), /INVALID_MODEL_RESPONSE/)
  const state = { ...initialMission(), result: { status: 'resources', route: { priority: 'terrain', maxSlope: 12 }, resources: [{ id: 'oxygen', availableSeconds: 60, requiredSeconds: 120, minimumTotalSeconds: 120, shortfallSeconds: 60 }] } }
  const result = await askMissionAssistant('por qué', { getState: () => state, fetchImpl: async url => ({ ok: true, json: async () => url.endsWith('/intent') ? { intent: 'explain_route' } : { reasonIds: ['priority'] } }) })
  assert.match(result.text, /resources are insufficient/)
  assert.match(result.text, /shortfall 1.0 min/)
})
