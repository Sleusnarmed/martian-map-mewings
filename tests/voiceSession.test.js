import test from 'node:test'
import assert from 'node:assert/strict'
import { createVoiceSession } from '../src/features/local-ai/voiceSession.js'
import { missionSpeechVoice } from '../src/features/mission-detail/missionSpeechVoice.js'

function fixture(onCommand = async () => ({ text: 'Oxígeno: 60.0 min. Reserva: 5.0 min.' })) {
  const captions = [], spoken = [], recognizers = [], timers = new Map()
  let timerId = 0
  const env = {
    SpeechRecognition: class {
      constructor() { recognizers.push(this) }
      start() { this.started = true }
      abort() { this.aborted = true }
    },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text } },
    speechSynthesis: { getVoices: () => [], speak: item => spoken.push(item), cancel() {} },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail } },
    dispatchEvent: event => captions.push(event.detail),
    setTimeout: fn => { timers.set(++timerId, fn); return timerId }, clearTimeout: id => timers.delete(id),
  }
  const session = createVoiceSession(env, onCommand)
  return { env, session, captions, spoken, recognizers, timers }
}

test('one microphone click accepts a single phrase and closes recognition', async () => {
  let question
  const f = fixture(async text => { question = text; return { text: 'Pendientes activadas.' } })
  f.session.listen()
  assert.equal(f.session.getSnapshot().status, 'listening')
  const recognizer = f.recognizers[0]
  assert.equal(recognizer.lang, 'es-MX')
  assert.equal(recognizer.continuous, false)
  recognizer.onresult({ results: [[{ transcript: 'Muestra pendientes' }]] })
  await Promise.resolve()
  assert.equal(question, 'Muestra pendientes')
  assert.equal(recognizer.aborted, true)
  assert.equal(f.session.getSnapshot().status, 'speaking')
})

test('speech subtitles follow sentences, preserve decimals and clear at completion', async () => {
  const f = fixture()
  await f.session.submit('oxígeno')
  assert.equal(f.spoken[0].text, 'Oxígeno: 60.0 min.')
  f.spoken[0].onstart()
  assert.equal(f.captions.at(-1).text, 'Oxígeno: 60.0 min.')
  f.spoken[0].onend()
  f.spoken[1].onstart()
  assert.equal(f.captions.at(-1).text, 'Reserva: 5.0 min.')
  f.spoken[1].onend()
  assert.equal(f.captions.at(-1).text, '')
  assert.equal(f.session.getSnapshot().status, 'result')
})

test('cancel stops capture and ignores responses from an earlier request', async () => {
  let finish
  const f = fixture(() => new Promise(resolve => { finish = resolve }))
  f.session.listen(); f.session.cancel()
  assert.equal(f.recognizers[0].aborted, true)
  const pending = f.session.submit('por qué')
  f.session.cancel()
  finish({ text: 'Respuesta obsoleta.' }); await pending
  assert.equal(f.spoken.length, 0)
  assert.equal(f.session.getSnapshot().status, 'idle')
  assert.equal(f.timers.size, 0)
})

test('microphone denial and missing recognizer offer a recoverable visible error', () => {
  const f = fixture()
  f.session.listen()
  f.recognizers[0].onerror({ error: 'not-allowed' })
  assert.equal(f.session.getSnapshot().status, 'error')
  assert.match(f.session.getSnapshot().message, /Permite su uso/)
  const session = createVoiceSession({ ...f.env, SpeechRecognition: undefined })
  session.listen()
  assert.match(session.getSnapshot().message, /no admite/)
})

test('Qwen uses the application voice identity and reading rate', async () => {
  const f = fixture()
  const appVoice = { lang: 'en-US', name: 'Application voice', localService: true }
  f.env.speechSynthesis.getVoices = () => [{ lang: 'es-MX', name: 'Other voice', localService: true }, appVoice]
  await f.session.submit('oxígeno')
  assert.equal(f.spoken[0].voice, appVoice)
  assert.equal(f.spoken[0].voice, missionSpeechVoice(f.env))
  assert.equal(f.spoken[0].rate, 0.95)
})
