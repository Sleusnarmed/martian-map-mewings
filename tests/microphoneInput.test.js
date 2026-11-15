import test from 'node:test'
import assert from 'node:assert/strict'
import { openMicrophoneInput } from '../src/features/local-ai/microphoneInput.js'

function fixture(level = 0) {
  let tick, stopped = 0, disconnected = 0, closed = 0, cleared = 0
  const track = { label: 'Test microphone', stop() { stopped++ } }
  const context = { state: 'running', createAnalyser: () => ({ fftSize: 256, getFloatTimeDomainData: array => array.fill(level) }),
    createMediaStreamSource: () => ({ connect() {}, disconnect() { disconnected++ } }), close() { closed++; this.state = 'closed'; return Promise.resolve() } }
  const env = {
    navigator: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [track], getAudioTracks: () => [track] }) } },
    AudioContext: class { constructor() { return context } },
    setInterval(fn) { tick = fn; return 1 }, clearInterval() { cleared++ },
  }
  return { env, tick: () => tick(), counters: () => ({ stopped, disconnected, closed, cleared }) }
}

test('local signal meter distinguishes silence and audio and releases all capture resources', async () => {
  const silent = fixture(0), loud = fixture(0.1)
  let sample
  const first = await openMicrophoneInput(silent.env, value => { sample = value })
  silent.tick(); assert.equal(sample.hasSignal, false); assert.equal(sample.level, 0)
  first.stop(); first.stop()
  assert.deepEqual(silent.counters(), { stopped: 1, disconnected: 1, closed: 1, cleared: 1 })
  const second = await openMicrophoneInput(loud.env, value => { sample = value })
  loud.tick(); assert.equal(sample.hasSignal, true); assert.ok(sample.level > 0)
  assert.equal(second.deviceName, 'Test microphone')
  second.stop()
})

test('permission denial preserves its error and closes the audio context', async () => {
  const f = fixture()
  f.env.navigator.mediaDevices.getUserMedia = async () => { throw Object.assign(new Error('denied'), { name: 'NotAllowedError' }) }
  await assert.rejects(openMicrophoneInput(f.env, () => {}), { name: 'NotAllowedError' })
  assert.equal(f.counters().closed, 1)
})

test('cancelling an active meter closes the microphone immediately', async () => {
  const f = fixture(0.1), controller = new AbortController()
  await openMicrophoneInput(f.env, () => {}, controller.signal)
  controller.abort()
  assert.equal(f.counters().stopped, 1)
  assert.equal(f.counters().closed, 1)
})

test('quiet input remains visible and is not reported as complete silence', async () => {
  const f = fixture(0.002)
  let sample
  const meter = await openMicrophoneInput(f.env, value => { sample = value })
  f.tick()
  assert.equal(sample.hasSignal, true)
  assert.ok(sample.level >= 10)
  meter.stop()
})
