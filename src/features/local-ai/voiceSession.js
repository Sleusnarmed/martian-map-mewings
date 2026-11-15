import { publishCaption } from './speechCaptions.js'
import { missionSpeechVoice } from '../mission-detail/missionSpeechVoice.js'
import { startSpeechCapture } from './captureSpeech.js'

export const voiceActive = status => ['starting', 'listening', 'transcribing', 'processing', 'speaking'].includes(status)
const errors = {
  NotAllowedError: 'Microphone access is blocked. Allow the microphone for this site in Edge and Windows, then press EVA again.',
  NotFoundError: 'No microphone input was found. Connect or enable a microphone in Windows, then retry.',
  NotReadableError: 'The microphone could not be opened. Check whether another application is using it, then retry.',
  NO_SPEECH: 'No clear speech was detected. Press EVA and say one command in English or Spanish.',
  RECORDING_UNAVAILABLE: 'Audio recording is unavailable. Open the app on localhost in Edge or Chrome and allow microphone access.',
  AUDIO_CAPTURE_FAILED: 'Audio capture failed. Check your microphone connection and press EVA again.',
  SPEECH_UNAVAILABLE: 'Local speech recognition is unavailable. Prepare the speech model and restart the local assistant service.',
  ASSISTANT_HTTP_504: 'Speech recognition timed out. Press EVA and try a shorter command.',
  MISSION_CHANGED: 'The mission changed during the request. Pause traversal and ask again.',
  MAP_NOT_READY: 'The map is not ready. Wait for it to finish loading.',
  ASSISTANT_HTTP_429: 'EVA is busy. Wait a moment and ask again.',
}

export function createVoiceSession(env, onCommand, { startCapture = startSpeechCapture, fetchImpl = (...args) => env.fetch(...args) } = {}) {
  const subscribers = new Set()
  let snapshot = { status: 'idle', transcript: '', text: '', message: '', inputLevel: 0, heardAudio: false, meterAvailable: false, deviceName: '' }
  let capture, controller, utterance, timer, speechTimer
  let generation = 0
  function update(patch) { snapshot = { ...snapshot, ...patch }; subscribers.forEach(fn => fn()) }
  function clearCapture() {
    env.clearTimeout(timer)
    capture?.cancel(); capture = null
  }
  function cancel() {
    generation++
    clearCapture()
    controller?.abort(); controller = null
    env.clearTimeout(speechTimer)
    if (utterance) {
      utterance.onstart = utterance.onend = utterance.onerror = null
      utterance = null
      env.speechSynthesis?.cancel()
    }
    publishCaption(env, 'eva', '')
    update({ status: 'idle', message: '', inputLevel: 0 })
  }
  function read(text, ticket) {
    if (!env.speechSynthesis || !env.SpeechSynthesisUtterance) {
      update({ status: 'result', message: 'Speech output is unavailable. Read the subtitles.' }); return
    }
    const chunks = text.split(/(?<=[.!?;])\s+/u)
    let index = 0
    const next = () => {
      if (ticket !== generation) return
      if (index >= chunks.length) { publishCaption(env, 'eva', ''); update({ status: 'result', message: '' }); return }
      const chunk = chunks[index++].trim()
      const message = new env.SpeechSynthesisUtterance(chunk)
      message.lang = 'en-US'; message.rate = 0.95
      const voice = missionSpeechVoice(env)
      if (voice) message.voice = voice
      utterance = message
      const valid = () => ticket === generation && utterance === message
      message.onstart = () => {
        if (!valid()) return
        env.clearTimeout(speechTimer)
        publishCaption(env, 'eva', chunk)
        speechTimer = env.setTimeout(() => { if (valid()) { cancel(); update({ status: 'result', message: 'Reading stopped. Read the subtitles.' }) } }, 90000)
      }
      message.onend = () => { if (valid()) { env.clearTimeout(speechTimer); utterance = null; next() } }
      message.onerror = () => { if (valid()) { env.clearTimeout(speechTimer); utterance = null; publishCaption(env, 'eva', ''); update({ status: 'result', message: 'The response could not be read aloud. Read the subtitles.' }) } }
      update({ status: 'speaking' })
      speechTimer = env.setTimeout(() => { if (valid()) { cancel(); update({ status: 'result', message: 'Your browser blocked speech output. Read the subtitles.' }) } }, 4000)
      try { env.speechSynthesis.speak(message) } catch { message.onerror() }
    }
    next()
  }
  async function submit(text) {
    cancel()
    const ticket = generation
    controller = new AbortController()
    const signal = controller.signal
    timer = env.setTimeout(() => { if (ticket === generation) { cancel(); update({ status: 'error', message: 'EVA timed out. Check the local assistant service and try again.' }) } }, 35000)
    update({ status: 'processing', transcript: text, text: '', message: '' })
    publishCaption(env, 'eva', `Heard: “${text}”`)
    try {
      const result = await onCommand(text, signal)
      if (ticket !== generation || signal.aborted) return
      env.clearTimeout(timer)
      const reply = result.intent === 'unsupported' ? `I heard: “${text}”. ${result.text}` : result.text
      update({ text: reply })
      read(reply, ticket)
    } catch (error) {
      if (ticket !== generation || signal.aborted) return
      env.clearTimeout(timer)
      update({ status: 'error', message: errors[error.message] ?? 'EVA could not connect. Start the local assistant service and try again.' })
    }
  }
  async function listen() {
    cancel()
    const ticket = generation
    controller = new AbortController()
    const signal = controller.signal
    update({ status: 'starting', transcript: '', text: '', message: '', inputLevel: 0, heardAudio: false, meterAvailable: false, deviceName: '' })
    timer = env.setTimeout(() => { if (ticket === generation) { cancel(); update({ status: 'error', message: 'Microphone setup timed out. Check the browser permission prompt and try again.' }) } }, 30000)
    try {
      const input = await startCapture(env, { signal,
        onReady: info => {
          if (ticket !== generation) return
          env.clearTimeout(timer)
          update({ status: 'listening', meterAvailable: info.meterAvailable, deviceName: info.deviceName })
        },
        onSample: sample => {
          if (ticket === generation && snapshot.status === 'listening') update({ inputLevel: sample.level, heardAudio: snapshot.heardAudio || sample.hasSignal, meterAvailable: true })
        },
        onFinishing: () => { if (ticket === generation) update({ status: 'transcribing', inputLevel: 0 }) },
      })
      if (ticket !== generation) { input.cancel(); await input.done.catch(() => {}); return }
      capture = input
      const wav = await input.done
      capture = null
      if (ticket !== generation || signal.aborted) return
      env.clearTimeout(timer)
      update({ status: 'transcribing', inputLevel: 0 })
      timer = env.setTimeout(() => {
        if (ticket !== generation) return
        cancel(); update({ status: 'error', message: errors.ASSISTANT_HTTP_504 })
      }, 50000)
      const response = await fetchImpl('/api/assistant/transcribe', { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: wav, signal })
      const result = await response.json()
      if (ticket !== generation || signal.aborted) return
      if (!response.ok) throw new Error(result.error === 'NO_SPEECH' ? 'NO_SPEECH' : response.status === 502 ? 'SPEECH_UNAVAILABLE' : `ASSISTANT_HTTP_${response.status}`)
      if (!['en', 'es'].includes(result.language) || typeof result.text !== 'string' || !result.text.trim() || result.text.length > 1000) throw new Error('NO_SPEECH')
      env.clearTimeout(timer)
      await submit(result.text.trim())
    } catch (error) {
      if (ticket !== generation || signal.aborted) return
      const message = error.message === 'NO_SPEECH' && !snapshot.heardAudio && snapshot.meterAvailable
        ? 'Microphone input is silent or too low. Check the microphone and input volume in Edge and Windows, then press EVA again.'
        : errors[error.name] ?? errors[error.message] ?? 'Voice recognition failed. Check the local assistant service and press EVA again.'
      cancel(); update({ status: 'error', message })
    }
  }
  return { setCommandHandler(handler) { onCommand = handler }, subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn) }, getSnapshot: () => snapshot, listen, finishListening: () => capture?.finish(), submit, cancel, dispose: cancel }
}
