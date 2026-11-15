import { publishCaption } from './speechCaptions.js'
import { missionSpeechVoice } from '../mission-detail/missionSpeechVoice.js'

export const voiceActive = status => ['listening', 'processing', 'speaking'].includes(status)
const errors = {
  'not-allowed': 'Micrófono bloqueado. Permite su uso en el navegador y vuelve a pulsar Hablar.',
  'audio-capture': 'No se encontró un micrófono disponible. Revisa la conexión y vuelve a intentarlo.',
  'no-speech': 'No se detectó voz. Pulsa Hablar y di una orden.',
  network: 'El reconocimiento de voz no pudo conectarse. Revisa Internet o utiliza los botones del mapa.',
  'language-not-supported': 'El reconocimiento en español no está disponible en este navegador.',
  MISSION_CHANGED: 'La misión cambió durante la consulta. Pausa el recorrido y vuelve a preguntar.',
  MAP_NOT_READY: 'El mapa aún no está listo. Espera a que termine de cargar.',
  ASSISTANT_HTTP_429: 'Qwen está ocupado. Espera un momento y vuelve a preguntar.',
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
    publishCaption(env, 'qwen', '')
    update({ status: 'idle', message: '' })
  }
  function read(text, ticket) {
    if (!env.speechSynthesis || !env.SpeechSynthesisUtterance) {
      update({ status: 'result', message: 'Voz de salida no disponible. Lee la respuesta.' }); return
    }
    const chunks = text.split(/(?<=[.!?;])\s+/u)
    let index = 0
    const next = () => {
      if (ticket !== generation) return
      if (index >= chunks.length) { publishCaption(env, 'qwen', ''); update({ status: 'result', message: '' }); return }
      const chunk = chunks[index++].trim()
      const message = new env.SpeechSynthesisUtterance(chunk)
      message.lang = 'es-MX'; message.rate = 0.95
      const voice = missionSpeechVoice(env)
      if (voice) message.voice = voice
      utterance = message
      const valid = () => ticket === generation && utterance === message
      message.onstart = () => {
        if (!valid()) return
        env.clearTimeout(speechTimer)
        publishCaption(env, 'qwen', chunk)
        speechTimer = env.setTimeout(() => { if (valid()) { cancel(); update({ status: 'result', message: 'Lectura detenida. La respuesta sigue disponible.' }) } }, 90000)
      }
      message.onend = () => { if (valid()) { env.clearTimeout(speechTimer); utterance = null; next() } }
      message.onerror = () => { if (valid()) { env.clearTimeout(speechTimer); utterance = null; publishCaption(env, 'qwen', ''); update({ status: 'result', message: 'No se pudo leer la respuesta. Puedes leerla en pantalla.' }) } }
      update({ status: 'speaking' })
      speechTimer = env.setTimeout(() => { if (valid()) { cancel(); update({ status: 'result', message: 'El navegador bloqueó la voz. La respuesta sigue disponible.' }) } }, 4000)
      try { env.speechSynthesis.speak(message) } catch { message.onerror() }
    }
    next()
  }
  async function submit(text) {
    cancel()
    const ticket = generation
    controller = new AbortController()
    const signal = controller.signal
    timer = env.setTimeout(() => { if (ticket === generation) { cancel(); update({ status: 'error', message: 'Qwen tardó demasiado. Comprueba el servicio local y vuelve a intentarlo.' }) } }, 35000)
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
      update({ status: 'error', message: errors[error.message] ?? 'No se pudo consultar Qwen. Comprueba que Ollama y el servicio local estén abiertos y vuelve a intentarlo.' })
    }
  }
  function listen() {
    cancel()
    if (!Recognition) { update({ status: 'error', message: 'Este navegador no admite reconocimiento de voz. Prueba Chrome o Edge y utiliza los controles manuales mientras tanto.' }); return }
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
      clearRecognition(); update({ status: 'error', message: errors[event.error] ?? 'No se pudo reconocer la orden. Vuelve a pulsar Hablar.' })
    }
    instance.onend = () => { if (ticket === generation && recognition === instance) { clearRecognition(); update({ status: 'error', message: errors['no-speech'] }) } }
    update({ status: 'listening', transcript: '', text: '', message: '' })
    timer = env.setTimeout(() => { if (ticket === generation) { cancel(); update({ status: 'error', message: 'Escucha finalizada. Pulsa Hablar para intentarlo otra vez.' }) } }, 12000)
    try { instance.start() } catch { clearRecognition(); update({ status: 'error', message: errors['not-allowed'] }) }
  }
  return { setCommandHandler(handler) { onCommand = handler }, subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn) }, getSnapshot: () => snapshot, listen, submit, cancel, dispose: cancel }
}
