import test from 'node:test'
import assert from 'node:assert/strict'
import { createVoiceSession } from '../src/features/local-ai/voiceSession.js'
import { missionSpeechVoice } from '../src/features/mission-detail/missionSpeechVoice.js'

function fixture(onCommand = async () => ({ text: 'Oxígeno: 60.0 min. Reserva: 5.0 min.' }), { autoStart = true } = {}) {
  const captions = [], spoken = [], recognizers = [], timers = new Map()
  let timerId = 0
  const env = {
    SpeechRecognition: class {
      constructor() { recognizers.push(this) }
      start() { this.started = true; if (autoStart) this.onstart?.() }
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
  await f.session.listen()
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
  await f.session.listen(); f.session.cancel()
  assert.equal(f.recognizers[0].aborted, true)
  const pending = f.session.submit('por qué')
  f.session.cancel()
  finish({ text: 'Respuesta obsoleta.' }); await pending
  assert.equal(f.spoken.length, 0)
  assert.equal(f.session.getSnapshot().status, 'idle')
  assert.equal(f.timers.size, 0)
})

test('microphone denial and missing recognizer offer a recoverable visible error', async () => {
  const f = fixture()
  await f.session.listen()
  f.recognizers[0].onerror({ error: 'not-allowed' })
  assert.equal(f.session.getSnapshot().status, 'error')
  assert.match(f.session.getSnapshot().message, /Allow it/)
  const session = createVoiceSession({ ...f.env, SpeechRecognition: undefined })
  await session.listen()
  assert.match(session.getSnapshot().message, /does not support/)
})

test('listening begins only after the service confirms start, using the selected locale', async () => {
  const f = fixture(undefined, { autoStart: false })
  await f.session.listen({ language: 'en-US' })
  assert.equal(f.session.getSnapshot().status, 'starting')
  assert.equal(f.recognizers[0].lang, 'en-US')
  f.recognizers[0].onstart()
  assert.equal(f.session.getSnapshot().status, 'listening')
  f.session.cancel()
})

test('interim words do not execute a command and final resultIndex is respected', async () => {
  const calls = []
  const f = fixture(async text => { calls.push(text); return { text: 'Showing slopes.' } })
  await f.session.listen()
  const interim = Object.assign([{ transcript: 'show' }], { isFinal: false })
  f.recognizers[0].onresult({ resultIndex: 0, results: [interim] })
  assert.equal(calls.length, 0)
  const final = Object.assign([{ transcript: 'show slopes' }], { isFinal: true })
  f.recognizers[0].onresult({ resultIndex: 1, results: [interim, final] })
  await Promise.resolve()
  assert.deepEqual(calls, ['show slopes'])
})

test('late microphone permission after cancellation closes the track and never starts recognition', async () => {
  let grant, stopped = 0
  const f = fixture()
  f.env.navigator = { mediaDevices: { getUserMedia: () => new Promise(resolve => { grant = resolve }) } }
  const pending = f.session.listen()
  f.session.cancel()
  grant({ getTracks: () => [{ stop() { stopped++ } }] })
  await pending
  assert.equal(stopped, 1)
  assert.equal(f.recognizers.length, 0)
  assert.equal(f.session.getSnapshot().status, 'idle')
  assert.equal(f.timers.size, 0)
})

test('audio without transcription suggests language/service checks rather than no microphone', async () => {
  const f = fixture()
  await f.session.listen()
  f.recognizers[0].onspeechstart()
  f.recognizers[0].onerror({ error: 'no-speech' })
  assert.match(f.session.getSnapshot().message, /audio was detected/)
  assert.match(f.session.getSnapshot().message, /EN or ES/)
})

test('Qwen uses the application voice identity and reading rate', async () => {
  const f = fixture()
  const appVoice = { lang: 'en-US', name: 'Application voice', localService: true }
  f.env.speechSynthesis.getVoices = () => [{ lang: 'es-MX', name: 'Other voice', localService: true }, appVoice]
  await f.session.submit('oxígeno')
  assert.equal(f.spoken[0].voice, appVoice)
  assert.equal(f.spoken[0].voice, missionSpeechVoice(f.env))
  assert.equal(f.spoken[0].rate, 0.95)
  assert.equal(f.spoken[0].lang, 'en-US')
})
