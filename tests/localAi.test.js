import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyQuestion } from '../server/local-ai.mjs'
import { initialMission } from '../src/features/route-planner/missionState.js'
import { answerMissionQuestion, askMissionAssistant, validateIntent } from '../src/features/local-ai/missionAssistant.js'

test('model output cannot add actions or unsupported intents', async () => {
  assert.equal(validateIntent({ intent: 'oxygen', action: 'play' }), false)
  assert.equal(validateIntent({ intent: 'play' }), false)
  await assert.rejects(classifyQuestion('oxígeno', { fetchImpl: async () => ({ ok: true, json: async () => ({ message: { content: '{"intent":"play"}' } }) }) }), /INVALID_MODEL_RESPONSE/)
})

test('missing route never becomes a zero-minute return', () => {
  const text = answerMissionQuestion('return', initialMission())
  assert.match(text, /Regreso estimado desde la posición actual: sin datos/)
  assert.match(answerMissionQuestion('resources', initialMission()), /No hay una evaluación/)
})

test('resource minimum rounds upward and limited routes report deficits', () => {
  const state = { ...initialMission(), result: { resources: [{ id: 'oxygen', availableSeconds: 60, requiredSeconds: 125, minimumTotalSeconds: 125, shortfallSeconds: 65 }] } }
  assert.match(answerMissionQuestion('resources', state), /mínimo total 2.1 min; faltante 1.1 min/)
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
    assert.equal(body.think, false)
    assert.equal(body.options.num_ctx, 2048)
    assert.equal(body.options.num_predict, 80)
    return { ok: true, json: async () => ({ message: { content: '{"intent":"status"}' } }) }
  } })
})
