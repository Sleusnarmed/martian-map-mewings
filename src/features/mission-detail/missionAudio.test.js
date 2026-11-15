import test from 'node:test'
import assert from 'node:assert/strict'
import { createMissionAudio } from './missionAudio.js'

function fixture({ activated = true, speech = true, tone = true, suspended = false } = {}) {
  let now = 0
  let sequence = 0
  const scheduled = new Map()
  const handlers = new Map()
  const spoken = []
  const oscillators = []
  let canceled = 0
  class Context {
    state = suspended ? 'suspended' : 'running'
    currentTime = 0
    destination = {}
    resume() { this.state = 'running'; return Promise.resolve() }
    close() { this.state = 'closed'; return Promise.resolve() }
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} } }
    createOscillator() {
      const oscillator = { frequency: { setValueAtTime() {} }, connect() {}, disconnect() {}, start() {}, stop() { this.stopped = true } }
      oscillators.push(oscillator)
      return oscillator
    }
  }
  const env = {
    navigator: { userActivation: { hasBeenActive: activated } },
    setTimeout(callback, delay) { const id = ++sequence; scheduled.set(id, { at: now + delay, callback }); return id },
    clearTimeout(id) { scheduled.delete(id) },
    addEventListener(type, callback) { handlers.set(type, callback) },
    removeEventListener(type) { handlers.delete(type) },
    ...(tone ? { AudioContext: Context } : {}),
    ...(speech ? {
      SpeechSynthesisUtterance: class { constructor(text) { this.text = text } },
      speechSynthesis: { getVoices: () => [], speak: (message) => spoken.push(message), cancel: () => { canceled += 1 } },
    } : {}),
  }
  const audio = createMissionAudio(env)
  const notice = (id) => ({ id, text: `Notice ${id}`, lang: 'en-US' })
  function advance(milliseconds) {
    const end = now + milliseconds
    while (true) {
      const next = [...scheduled].filter(([, item]) => item.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
      if (!next) break
      scheduled.delete(next[0]); now = next[1].at; next[1].callback()
    }
    now = end
  }
  return { env, audio, notice, advance, spoken, oscillators, handlers, canceled: () => canceled }
}

test('new notices play two tones before voice; mute persists across new notices', () => {
  const f = fixture()
  f.audio.present(f.notice('first'))
  assert.equal(f.oscillators.length, 2)
  assert.equal(f.spoken.length, 0)
  f.advance(260)
  assert.equal(f.spoken[0].text, 'Notice first')
  f.spoken[0].onstart()
  f.audio.toggle()
  assert.equal(f.audio.getSnapshot().muted, true)
  assert.equal(f.canceled(), 1)
  f.audio.dispose()
  f.audio.present(f.notice('second'))
  f.advance(1000)
  assert.equal(f.spoken.length, 1)
  assert.equal(f.oscillators.length, 2)
  f.audio.toggle()
  assert.equal(f.audio.getSnapshot().muted, false)
  assert.equal(f.spoken[1].text, 'Notice second')
})

test('a newer notice cancels a pending chime and stale speech callbacks', () => {
  const f = fixture()
  f.audio.present(f.notice('old'))
  f.advance(100)
  f.audio.present(f.notice('new'))
  f.advance(260)
  assert.deepEqual(f.spoken.map((message) => message.text), ['Notice new'])
  const staleStart = f.spoken[0].onstart
  f.audio.present(f.notice('newest'))
  staleStart()
  assert.equal(f.audio.getSnapshot().status, 'chime')
  f.advance(260)
  assert.equal(f.spoken[1].text, 'Notice newest')
  f.audio.dispose()
  f.advance(10000)
  assert.equal(f.spoken.length, 2)
  assert.equal(f.handlers.size, 0)
})

test('autoplay waits for a gesture and the voice button enables instead of immediately muting', () => {
  const f = fixture({ activated: false })
  f.audio.present(f.notice('blocked'))
  assert.equal(f.audio.getSnapshot().status, 'blocked')
  assert.equal(f.oscillators.length, 0)
  f.handlers.get('pointerdown')({ target: { closest: () => true } })
  assert.equal(f.audio.getSnapshot().status, 'blocked')
  f.audio.toggle()
  assert.equal(f.audio.getSnapshot().status, 'chime')
  f.advance(260)
  assert.equal(f.spoken.length, 1)
  assert.equal(f.audio.getSnapshot().muted, false)
})

test('first interaction resumes a suspended context; repeated keys do not duplicate playback', async () => {
  const f = fixture({ activated: false, suspended: true })
  f.audio.present(f.notice('pending'))
  f.handlers.get('keydown')({ key: 'Enter' })
  await Promise.resolve()
  f.handlers.get('keydown')({ key: 'ArrowRight' })
  f.advance(260)
  assert.equal(f.spoken.length, 1)
  assert.equal(f.oscillators.length, 2)
})

test('speech denial and silent queue failure expose a recoverable blocked state', () => {
  const f = fixture({ tone: false })
  f.audio.present(f.notice('denied'))
  f.spoken[0].onerror({ error: 'not-allowed' })
  assert.equal(f.audio.getSnapshot().status, 'blocked')
  f.audio.toggle()
  f.advance(4000)
  assert.equal(f.audio.getSnapshot().status, 'blocked')
  assert.equal(f.canceled(), 1)
})

test('missing speech can still notify; missing both APIs remains visible and unavailable', () => {
  const f = fixture({ speech: false })
  f.audio.present(f.notice('tone-only'))
  f.advance(260)
  assert.equal(f.oscillators.length, 2)
  assert.equal(f.audio.getSnapshot().speechAvailable, false)
  const none = fixture({ speech: false, tone: false })
  none.audio.present(none.notice('unavailable'))
  assert.equal(none.audio.getSnapshot().status, 'unavailable')
})

test('effect cleanup and reconnect do not duplicate initial notification playback', () => {
  const f = fixture()
  f.audio.present(f.notice('strict-mode'))
  f.audio.dispose()
  f.audio.present(f.notice('strict-mode'))
  f.advance(260)
  assert.equal(f.spoken.length, 1)
})

test('alert voice publishes subtitles and clears them when muted', () => {
  const f = fixture({ tone: false })
  const captions = []
  f.env.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail } }
  f.env.dispatchEvent = event => captions.push(event.detail)
  f.audio.present(f.notice('subtitle'))
  f.spoken[0].onstart()
  assert.deepEqual(captions.at(-1), { source: 'alerts', text: 'Notice subtitle' })
  f.audio.toggle()
  assert.equal(captions.at(-1).text, '')
})

test('assistant suspension prevents overlapping alert audio and resumes a deferred notice', () => {
  const f = fixture()
  f.audio.setSuspended(true)
  f.audio.present(f.notice('during-assistant'))
  f.advance(1000)
  assert.equal(f.spoken.length, 0)
  assert.equal(f.oscillators.length, 0)
  f.audio.setSuspended(false)
  f.advance(260)
  assert.equal(f.spoken.length, 1)
  assert.equal(f.spoken[0].text, 'Notice during-assistant')
})
