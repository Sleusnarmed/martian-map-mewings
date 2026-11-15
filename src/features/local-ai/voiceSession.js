import { publishCaption } from './speechCaptions.js'
import { missionSpeechVoice } from '../mission-detail/missionSpeechVoice.js'

export const voiceActive = status => ['listening', 'processing', 'speaking'].includes(status)
const errors = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser, then press EVA again.',
  'audio-capture': 'No microphone is available. Check its connection and try again.',
  'no-speech': 'No speech detected. Press EVA and say a command.',
  network: 'Voice recognition could not connect. Check your Internet connection or use the map controls.',
  'language-not-supported': 'The selected speech recognition language is unavailable in this browser.',
  MISSION_CHANGED: 'The mission changed during the request. Pause traversal and ask again.',
  MAP_NOT_READY: 'The map is not ready. Wait for it to finish loading.',
  ASSISTANT_HTTP_429: 'EVA is busy. Wait a moment and ask again.',
}

export function createVoiceSession(env, onCommand) {
  const Recognition = env.SpeechRecognition || env.webkitSpeechRecognition
  const subscribers = new Set()
  let snapshot = { status: 'idle', transcript: '', text: '', message: '', recognitionAvailable: Boolean(Recognition) }
  let recognition, controller, utterance, timer, speechTimer
  let generation = 0
  function update(patch) { snapshot = { ...snapshot, ...patch }; subscribers.forEach(fn => fn()) }
  function clearRecognition() {
    env.clearTimeout(timer)
    if (recognition) {
      recognition.onresult = recognition.onerror = recognition.onend = null
      try { recognition.abort() } catch { /* Already stopped. */ }
      recognition = null
    }
  }
  function cancel() {
    generation++
    clearRecognition()
    controller?.abort(); controller = null
    env.clearTimeout(speechTimer)
    if (utterance) {
      utterance.onstart = utterance.onend = utterance.onerror = null
      utterance = null
      env.speechSynthesis?.cancel()
    }
    publishCaption(env, 'eva', '')
    update({ status: 'idle', message: '' })
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
    try {
      const result = await onCommand(text, signal)
      if (ticket !== generation || signal.aborted) return
      env.clearTimeout(timer)
      update({ text: result.text })
      read(result.text, ticket)
    } catch (error) {
      if (ticket !== generation || signal.aborted) return
      env.clearTimeout(timer)
      update({ status: 'error', message: errors[error.message] ?? 'EVA could not connect. Start the local assistant service and try again.' })
    }
  }
  function listen() {
    cancel()
    if (!Recognition) { update({ status: 'error', message: 'This browser does not support speech recognition. Try Chrome or Edge, or use the map controls.' }); return }
    const ticket = generation
    const instance = new Recognition()
    recognition = instance
    instance.lang = 'es-MX'; instance.continuous = false; instance.interimResults = false; instance.maxAlternatives = 1
    instance.onresult = event => {
      if (ticket !== generation) return
      const text = event.results?.[0]?.[0]?.transcript?.trim()
      clearRecognition()
      if (!text) { update({ status: 'error', message: errors['no-speech'] }); return }
      void submit(text)
    }
    instance.onerror = event => {
      if (ticket !== generation) return
      clearRecognition(); update({ status: 'error', message: errors[event.error] ?? 'The command could not be recognised. Press EVA to try again.' })
    }
    instance.onend = () => { if (ticket === generation && recognition === instance) { clearRecognition(); update({ status: 'error', message: errors['no-speech'] }) } }
    update({ status: 'listening', transcript: '', text: '', message: '' })
    timer = env.setTimeout(() => { if (ticket === generation) { cancel(); update({ status: 'error', message: 'Listening ended. Press EVA to try again.' }) } }, 12000)
    try { instance.start() } catch { clearRecognition(); update({ status: 'error', message: errors['not-allowed'] }) }
  }
  return { setCommandHandler(handler) { onCommand = handler }, subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn) }, getSnapshot: () => snapshot, listen, submit, cancel, dispose: cancel }
}
