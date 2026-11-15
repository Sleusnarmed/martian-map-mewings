import { publishCaption } from './speechCaptions.js'
import { missionSpeechVoice } from '../mission-detail/missionSpeechVoice.js'
import { openMicrophoneInput } from './microphoneInput.js'

export const voiceActive = status => ['starting', 'listening', 'processing', 'speaking'].includes(status)
const errors = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser, then press EVA again.',
  'audio-capture': 'No microphone is available. Check its connection and try again.',
  NotAllowedError: 'Microphone access is blocked. Allow the microphone for this site in Edge and Windows, then press EVA again.',
  NotFoundError: 'No microphone input was found. Connect or enable a microphone in Windows, then retry.',
  NotReadableError: 'The microphone could not be opened. Check whether another application is using it, then retry.',
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
  let snapshot = { status: 'idle', transcript: '', text: '', message: '', recognitionAvailable: Boolean(Recognition), inputLevel: 0, heardAudio: false, meterAvailable: false, deviceName: '' }
  let recognition, microphone, controller, utterance, timer, speechTimer
  let generation = 0
  function update(patch) { snapshot = { ...snapshot, ...patch }; subscribers.forEach(fn => fn()) }
  function clearRecognition() {
    env.clearTimeout(timer)
    microphone?.stop(); microphone = null
    if (recognition) {
      recognition.onstart = recognition.onspeechstart = recognition.onresult = recognition.onerror = recognition.onend = null
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
  async function listen({ language = 'es-MX' } = {}) {
    cancel()
    if (!Recognition) { update({ status: 'error', message: 'This browser does not support speech recognition. Try Chrome or Edge, or use the map controls.' }); return }
    const ticket = generation
    controller = new AbortController()
    update({ status: 'starting', transcript: '', text: '', message: '', inputLevel: 0, heardAudio: false, meterAvailable: false, deviceName: '' })
    timer = env.setTimeout(() => { if (ticket === generation) { cancel(); update({ status: 'error', message: 'Microphone setup timed out. Check the browser permission prompt and try again.' }) } }, 30000)
    try {
      const input = await openMicrophoneInput(env, sample => {
        if (ticket === generation && ['starting', 'listening'].includes(snapshot.status)) update({ inputLevel: sample.level, heardAudio: snapshot.heardAudio || sample.hasSignal, meterAvailable: true })
      }, controller.signal)
      if (ticket !== generation) { input?.stop(); return }
      microphone = input
      update({ meterAvailable: input?.meterAvailable ?? false, deviceName: input?.deviceName ?? '' })
    } catch (error) {
      if (ticket !== generation) return
      clearRecognition()
      update({ status: 'error', message: errors[error.name] ?? 'The microphone could not be opened. Check your browser input settings and retry.' })
      return
    }
    let instance
    try { instance = new Recognition() } catch {
      clearRecognition(); update({ status: 'error', message: 'Speech recognition could not start. Reload the page or try another browser.' }); return
    }
    recognition = instance
    instance.lang = language === 'en-US' ? 'en-US' : 'es-MX'
    instance.continuous = false; instance.interimResults = true; instance.maxAlternatives = 1
    let heardWords = false
    const noSpeechMessage = () => heardWords
      ? 'Recognition ended before confirming the command. Match Input EN or ES to your speech and try again.'
      : snapshot.heardAudio
        ? 'Microphone audio was detected, but no words were recognised. Match Input EN or ES to your speech and retry. Edge voice recognition also needs Internet.'
        : snapshot.meterAvailable
          ? 'Microphone input is silent or too low. Raise the input volume or check the microphone selected in Edge and Windows, then retry.'
          : errors['no-speech']
    instance.onstart = () => {
      if (ticket !== generation || recognition !== instance) return
      env.clearTimeout(timer)
      update({ status: 'listening' })
      timer = env.setTimeout(() => {
        if (ticket !== generation) return
        const message = noSpeechMessage()
        cancel(); update({ status: 'error', message })
      }, 20000)
    }
    instance.onspeechstart = () => { if (ticket === generation) update({ heardAudio: true }) }
    instance.onresult = event => {
      if (ticket !== generation) return
      const results = Array.from(event.results ?? []).slice(event.resultIndex ?? 0)
      if (results.some(result => result[0]?.transcript?.trim())) heardWords = true
      const text = results.filter(result => result.isFinal !== false).map(result => result[0]?.transcript ?? '').join(' ').trim()
      if (!text) return
      clearRecognition()
      void submit(text)
    }
    instance.onerror = event => {
      if (ticket !== generation) return
      const message = event.error === 'no-speech' ? noSpeechMessage() : errors[event.error] ?? 'The command could not be recognised. Press EVA to try again.'
      clearRecognition(); update({ status: 'error', message })
    }
    instance.onend = () => { if (ticket === generation && recognition === instance) { const message = noSpeechMessage(); clearRecognition(); update({ status: 'error', message }) } }
    try { instance.start() } catch { clearRecognition(); update({ status: 'error', message: 'Speech recognition could not start. Check Edge microphone permissions and try again.' }) }
  }
  return { setCommandHandler(handler) { onCommand = handler }, subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn) }, getSnapshot: () => snapshot, listen, submit, cancel, dispose: cancel }
}
