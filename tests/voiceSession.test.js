import test from 'node:test'
import assert from 'node:assert/strict'
import { createVoiceSession, voiceActive } from '../src/features/local-ai/voiceSession.js'
import { missionSpeechVoice } from '../src/features/mission-detail/missionSpeechVoice.js'

function fixture(onCommand = async () => ({ text: 'Oxygen: 60.0 min. Reserve: 5.0 min.' }), { autoStart = true, language = 'es', text = 'Muestra pendientes', fetchImpl } = {}) {
  const captions = [], spoken = [], captures = [], requests = [], timers = new Map()
  let timerId = 0
  const env = {
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text } },
    speechSynthesis: { getVoices: () => [], speak: item => spoken.push(item), cancel() {} },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail } },
    dispatchEvent: event => captions.push(event.detail),
    setTimeout: fn => { timers.set(++timerId, fn); return timerId }, clearTimeout: id => timers.delete(id),
  }
  const session = createVoiceSession(env, onCommand, {
    startCapture: async (_env, callbacks) => {
      let resolve, reject, settled = false
      const done = new Promise((yes, no) => { resolve = yes; reject = no })
      const capture = { done, callbacks, start: () => callbacks.onReady({ meterAvailable: true, deviceName: 'Test microphone' }),
        finish() { if (!settled) { settled = true; callbacks.onFinishing(); resolve(new Uint8Array([1, 2])) } },
        cancel() { if (!settled) { settled = true; reject(new Error('CANCELLED')) } },
        fail(error) { settled = true; reject(error) },
      }
      captures.push(capture)
      if (autoStart) capture.start()
      return capture
    },
    fetchImpl: async (url, options) => {
      requests.push({ url, ...options })
      return fetchImpl ? fetchImpl(url, options) : { ok: true, json: async () => ({ text, language }) }
    },
  })
  return { env, session, captions, spoken, captures, requests, timers }
}
const tick = async () => { for (let i = 0; i < 4; i++) await Promise.resolve() }

test('an unsupported voice request reports the actual transcript instead of hiding it behind generic help', async () => {
  const f = fixture(async () => ({ intent: 'unsupported', text: 'Ask EVA to show or hide a named layer.' }), { language: 'en', text: 'show slow' })
  const pending = f.session.listen(); await tick(); f.session.finishListening(); await pending
  assert.equal(f.session.getSnapshot().transcript, 'show slow')
  assert.match(f.spoken[0].text, /I heard: “show slow”/)
  assert.ok(f.captions.some(caption => caption.text === 'Heard: “show slow”'))
})

test('one button automatically accepts either English or Spanish and speaks English', async () => {
  for (const [language, text] of [['es', 'Muestra pendientes'], ['en', 'Show slopes']]) {
    const calls = []
    const f = fixture(async question => { calls.push(question); return { text: 'Showing slopes.' } }, { language, text })
    const pending = f.session.listen(); await tick()
    assert.equal(f.session.getSnapshot().status, 'listening')
    assert.equal(calls.length, 0)
    f.session.finishListening(); await pending
    assert.deepEqual(calls, [text])
    assert.equal(f.requests[0].url, '/api/assistant/transcribe')
    assert.equal(f.requests[0].headers['Content-Type'], 'audio/wav')
    assert.equal(f.spoken[0].text, 'Showing slopes.')
    assert.equal(f.spoken[0].lang, 'en-US')
    assert.equal(f.session.getSnapshot().status, 'speaking')
  }
})

test('speech subtitles follow sentences, preserve decimals and clear at completion', async () => {
  const f = fixture()
  await f.session.submit('oxygen')
  assert.equal(f.spoken[0].text, 'Oxygen: 60.0 min.')
  f.spoken[0].onstart()
  assert.equal(f.captions.at(-1).text, 'Oxygen: 60.0 min.')
  f.spoken[0].onend(); f.spoken[1].onstart()
  assert.equal(f.captions.at(-1).text, 'Reserve: 5.0 min.')
  f.spoken[1].onend()
  assert.equal(f.captions.at(-1).text, '')
  assert.equal(f.session.getSnapshot().status, 'result')
})

test('cancel stops capture and ignores an earlier model response', async () => {
  let finish
  const f = fixture(() => new Promise(resolve => { finish = resolve }))
  const listening = f.session.listen(); await tick(); f.session.cancel(); await listening
  const pending = f.session.submit('why this route')
  f.session.cancel()
  finish({ text: 'Stale answer.' }); await pending
  assert.equal(f.spoken.length, 0)
  assert.equal(f.session.getSnapshot().status, 'idle')
  assert.equal(f.timers.size, 0)
})

test('listening starts only after recorder confirmation and retains the signal meter', async () => {
  const f = fixture(undefined, { autoStart: false })
  const pending = f.session.listen(); await tick()
  assert.equal(f.session.getSnapshot().status, 'starting')
  f.captures[0].start()
  f.captures[0].callbacks.onSample({ level: 35, hasSignal: true })
  assert.equal(f.session.getSnapshot().status, 'listening')
  assert.equal(f.session.getSnapshot().inputLevel, 35)
  assert.equal(f.session.getSnapshot().heardAudio, true)
  f.session.cancel(); await pending
})

test('transcription has an active cancellable status and late results never execute', async () => {
  let resolve, commandCalls = 0
  const f = fixture(async () => { commandCalls++; return { text: 'Changed.' } }, { fetchImpl: () => new Promise(yes => { resolve = yes }) })
  const pending = f.session.listen(); await tick()
  f.session.finishListening(); await tick()
  assert.equal(f.session.getSnapshot().status, 'transcribing')
  assert.equal(voiceActive('transcribing'), true)
  f.session.cancel()
  assert.equal(f.requests[0].signal.aborted, true)
  resolve({ ok: true, json: async () => ({ text: 'Show slopes', language: 'en' }) }); await pending
  assert.equal(commandCalls, 0)
  assert.equal(f.session.getSnapshot().status, 'idle')
})

test('silence and local model failures have recoverable English messages', async () => {
  const silent = fixture()
  const pending = silent.session.listen(); await tick()
  silent.captures[0].fail(new Error('NO_SPEECH')); await pending
  assert.match(silent.session.getSnapshot().message, /silent or too low/)
  const failed = fixture(undefined, { fetchImpl: async () => ({ ok: false, status: 502, json: async () => ({ error: 'SPEECH_UNAVAILABLE' }) }) })
  const transcribing = failed.session.listen(); await tick(); failed.session.finishListening(); await transcribing
  assert.match(failed.session.getSnapshot().message, /Prepare the speech model/)
  assert.equal(failed.spoken.length, 0)
})

test('EVA uses the application voice identity and reading rate', async () => {
  const f = fixture()
  const appVoice = { lang: 'en-US', name: 'Application voice', localService: true }
  f.env.speechSynthesis.getVoices = () => [{ lang: 'es-MX', name: 'Other voice', localService: true }, appVoice]
  await f.session.submit('oxígeno')
  assert.equal(f.spoken[0].voice, appVoice)
  assert.equal(f.spoken[0].voice, missionSpeechVoice(f.env))
  assert.equal(f.spoken[0].rate, 0.95)
  assert.equal(f.spoken[0].lang, 'en-US')
})
