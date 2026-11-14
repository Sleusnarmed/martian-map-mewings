// One owner for notification tones and speech. Inject a browser-shaped environment for tests.
export function createMissionAudio(env) {
  const AudioContext = env.AudioContext || env.webkitAudioContext
  const speechAvailable = Boolean(env.speechSynthesis && env.SpeechSynthesisUtterance)
  const listeners = new Set()
  const nodes = new Set()
  const timers = new Set()
  let snapshot = { status: 'idle', muted: false, speechAvailable, chimeAvailable: Boolean(AudioContext) }
  let context = null
  let utterance = null
  let currentNotice = null
  let generation = 0
  let listening = false
  let activated = Boolean(env.navigator?.userActivation?.hasBeenActive)

  function update(values) {
    snapshot = { ...snapshot, ...values }
    listeners.forEach((listener) => listener())
  }

  function later(callback, delay) {
    const timer = env.setTimeout(() => { timers.delete(timer); callback() }, delay)
    timers.add(timer)
  }

  function cancel() {
    generation += 1
    timers.forEach((timer) => env.clearTimeout(timer))
    timers.clear()
    if (utterance) {
      utterance.onstart = utterance.onend = utterance.onerror = null
      utterance = null
      env.speechSynthesis.cancel()
    }
    nodes.forEach((node) => {
      try { node.stop?.() } catch { /* An oscillator may already have ended. */ }
      node.disconnect()
    })
    nodes.clear()
  }

  function speak(notice, ticket) {
    if (ticket !== generation || snapshot.muted) return
    if (!speechAvailable) { update({ status: 'unavailable' }); return }
    const message = new env.SpeechSynthesisUtterance(notice.text)
    message.lang = notice.lang
    message.rate = 0.95
    const voices = env.speechSynthesis.getVoices()
    const voice = voices.find((item) => item.localService && item.lang === notice.lang)
      || voices.find((item) => item.localService && item.lang.startsWith(notice.lang.split('-')[0]))
      || voices.find((item) => item.lang === notice.lang)
    if (voice) message.voice = voice
    const ownsMessage = () => ticket === generation && utterance === message
    message.onstart = () => { if (ownsMessage()) update({ status: 'speaking' }) }
    message.onend = () => { if (ownsMessage()) { utterance = null; update({ status: 'idle' }) } }
    message.onerror = (event) => {
      if (!ownsMessage()) return
      utterance = null
      update({ status: event.error === 'not-allowed' ? 'blocked' : event.error === 'canceled' || event.error === 'interrupted' ? 'idle' : 'error' })
    }
    utterance = message
    update({ status: 'queued' })
    try { env.speechSynthesis.speak(message) }
    catch { cancel(); update({ status: 'error' }); return }
    // Some engines silently reject autoplay instead of emitting an error.
    later(() => {
      if (ownsMessage() && snapshot.status === 'queued') { cancel(); update({ status: 'blocked' }) }
    }, 4000)
  }

  function chime() {
    const start = context.currentTime
    ;[660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const at = start + index * 0.12
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, at)
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(0.065, at + 0.012)
      gain.gain.linearRampToValueAtTime(0, at + 0.1)
      oscillator.connect(gain)
      gain.connect(context.destination)
      nodes.add(oscillator); nodes.add(gain)
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); nodes.delete(oscillator); nodes.delete(gain) }
      oscillator.start(at)
      oscillator.stop(at + 0.11)
    })
  }

  async function play(withChime) {
    cancel()
    if (!currentNotice?.text?.trim() || snapshot.muted) return
    if (!activated) { update({ status: 'blocked' }); return }
    const notice = currentNotice
    const ticket = generation
    if (withChime && AudioContext) {
      update({ status: 'chime' })
      try {
        context ||= new AudioContext()
        if (context.state !== 'running') {
          const resuming = context.resume()
          later(() => {
            if (ticket === generation && snapshot.status === 'chime' && context?.state !== 'running') { cancel(); update({ status: 'blocked' }) }
          }, 1000)
          await resuming
        }
        if (ticket !== generation) return
        if (context.state !== 'running') { update({ status: 'blocked' }); return }
        chime()
        later(() => speak(notice, ticket), 260)
        return
      } catch {
        if (ticket !== generation) return
        update({ chimeAvailable: false })
      }
    }
    speak(notice, ticket)
  }

  function onGesture(event) {
    if (event.target?.closest?.('[data-mission-voice]') || ['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return
    activated = true
    if (snapshot.status === 'blocked' && !snapshot.muted) void play(true)
  }

  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    getSnapshot: () => snapshot,
    present(notice) {
      cancel()
      currentNotice = notice
      if (!listening) {
        env.addEventListener('pointerdown', onGesture, true)
        env.addEventListener('keydown', onGesture, true)
        listening = true
      }
      if (!speechAvailable && !AudioContext) { update({ status: 'unavailable' }); return }
      if (snapshot.muted || !notice.text?.trim()) { update({ status: 'idle' }); return }
      void play(true)
    },
    toggle() {
      activated = true
      if (['chime', 'queued', 'speaking'].includes(snapshot.status)) {
        cancel(); update({ muted: true, status: 'idle' })
      } else {
        const withChime = snapshot.status === 'blocked' || !speechAvailable
        update({ muted: false })
        void play(withChime)
      }
    },
    dispose() {
      cancel()
      currentNotice = null
      env.removeEventListener('pointerdown', onGesture, true)
      env.removeEventListener('keydown', onGesture, true)
      listening = false
      const closing = context
      context = null
      if (closing && closing.state !== 'closed') void closing.close().catch(() => {})
    },
  }
}
