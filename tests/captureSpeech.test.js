import test from 'node:test'
import assert from 'node:assert/strict'
import { startSpeechCapture } from '../src/features/local-ai/captureSpeech.js'
import { decodeSpeechWav, encodeSpeechWav } from '../src/features/local-ai/audioWav.js'

function fixture() {
  let sample, level = 0.1, time = 0, stopped = 0, closed = 0, recorder
  const timers = new Map()
  const track = { label: 'Test mic', stop() { stopped++ } }
  const env = {
    Blob, performance: { now: () => time },
    navigator: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [track], getAudioTracks: () => [track] }) } },
    AudioContext: class {
      state = 'running'
      createAnalyser() { return { getFloatTimeDomainData: values => values.fill(level) } }
      createMediaStreamSource() { return { connect() {}, disconnect() {} } }
      close() { closed++; this.state = 'closed'; return Promise.resolve() }
      async decodeAudioData() { return { sampleRate: 48000, length: 48000, numberOfChannels: 1, getChannelData: () => new Float32Array(48000).fill(0.1) } }
    },
    MediaRecorder: class {
      static isTypeSupported() { return true }
      state = 'inactive'; mimeType = 'audio/webm'
      constructor() { recorder = this }
      start() { this.state = 'recording'; this.onstart() }
      stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['test']) }); void this.onstop?.() }
    },
    setInterval(fn) { sample = fn; return 10 }, clearInterval() {},
    setTimeout(fn) { const id = timers.size + 1; timers.set(id, fn); return id }, clearTimeout(id) { timers.delete(id) },
  }
  return { env, tick(value = 0.1, ms = 100) { level = value; time += ms; sample() }, counters: () => ({ stopped, closed }), timers, recorder: () => recorder }
}

test('a spoken utterance followed by silence ends capture, resamples and releases the mic', async () => {
  const f = fixture()
  let ready = false, finishing = false
  const capture = await startSpeechCapture(f.env, { onReady: () => { ready = true }, onFinishing: () => { finishing = true } })
  assert.equal(ready, true)
  f.tick(); f.tick(); f.tick(); f.tick(0, 1250)
  const wav = await capture.done
  assert.equal(decodeSpeechWav(wav).length, 16000)
  assert.equal(finishing, true)
  assert.deepEqual(f.counters(), { stopped: 1, closed: 1 })
  assert.equal(f.timers.size, 0)
})

test('manual finish submits captured speech and cancellation discards it', async () => {
  const f = fixture(), controller = new AbortController()
  const capture = await startSpeechCapture(f.env, { signal: controller.signal })
  f.tick(); f.tick(); f.tick(); capture.finish()
  assert.ok((await capture.done).length > 44)
  const cancelled = fixture()
  const other = await startSpeechCapture(cancelled.env, { signal: controller.signal })
  controller.abort()
  await assert.rejects(other.done, /CANCELLED/)
  assert.deepEqual(cancelled.counters(), { stopped: 1, closed: 1 })
})

test('silent recordings expire without uploading noise', async () => {
  const f = fixture()
  const capture = await startSpeechCapture(f.env)
  f.tick(0); capture.finish()
  await assert.rejects(capture.done, /NO_SPEECH/)
  assert.deepEqual(f.counters(), { stopped: 1, closed: 1 })
})

test('late permission after cancellation stops the newly granted microphone', async () => {
  const f = fixture(), controller = new AbortController()
  let grant, stopped = 0
  f.env.navigator.mediaDevices.getUserMedia = () => new Promise(resolve => { grant = resolve })
  const pending = startSpeechCapture(f.env, { signal: controller.signal })
  controller.abort()
  grant({ getTracks: () => [{ stop() { stopped++ } }] })
  await assert.rejects(pending, { name: 'AbortError' })
  assert.equal(stopped, 1)
  assert.equal(f.recorder(), undefined)
})

test('WAV validation rejects malformed formats, silence and excessive recordings', () => {
  const wav = encodeSpeechWav(new Float32Array(32000).fill(0.2), 32000)
  assert.equal(decodeSpeechWav(wav).length, 16000)
  assert.throws(() => decodeSpeechWav(new Uint8Array([1, 2, 3])), /INVALID_AUDIO/)
  assert.throws(() => decodeSpeechWav(encodeSpeechWav(new Float32Array(16000), 16000)), /NO_SPEECH/)
  assert.throws(() => encodeSpeechWav(new Float32Array(22 * 16000), 16000), /INVALID_AUDIO/)
  const stereo = wav.slice(); new DataView(stereo.buffer).setUint16(22, 2, true)
  assert.throws(() => decodeSpeechWav(stereo), /INVALID_AUDIO/)
})
