import { openMicrophoneInput } from './microphoneInput.js'
import { encodeSpeechWav, MAX_SPEECH_SECONDS } from './audioWav.js'

// Capture one utterance locally; no browser speech service or language setting.
export async function startSpeechCapture(env, { signal, onReady, onSample, onFinishing } = {}) {
  if (!env.MediaRecorder || !env.navigator?.mediaDevices?.getUserMedia) throw new Error('RECORDING_UNAVAILABLE')
  let recorder, finish, lastSignal = 0, signalSamples = 0, ready = false
  const now = () => env.performance?.now() ?? Date.now()
  const input = await openMicrophoneInput(env, sample => {
    if (!ready || signal?.aborted) return
    onSample?.(sample)
    if (sample.hasSignal) { lastSignal = now(); signalSamples++ }
    else if (signalSamples >= 3 && now() - lastSignal >= 1200) finish?.()
  }, signal)
  if (signal?.aborted) { input?.stop(); throw new Error('CANCELLED') }
  if (!input?.context || !input.stream) { input?.stop(); throw new Error('RECORDING_UNAVAILABLE') }
  const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(value => env.MediaRecorder.isTypeSupported?.(value))
  try { recorder = type ? new env.MediaRecorder(input.stream, { mimeType: type }) : new env.MediaRecorder(input.stream) }
  catch (error) { input.stop(); throw error }
  let resolve, reject, timer, settled = false, finishing = false
  const chunks = []
  const done = new Promise((yes, no) => { resolve = yes; reject = no })
  const cleanup = () => {
    ready = false
    env.clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
    recorder.onstart = recorder.ondataavailable = recorder.onstop = recorder.onerror = null
    if (recorder.state !== 'inactive') { try { recorder.stop() } catch { /* Already ended. */ } }
    input.stop()
    chunks.length = 0
  }
  const fail = error => { if (!settled) { settled = true; cleanup(); reject(error) } }
  const cancel = () => fail(new Error('CANCELLED'))
  finish = () => {
    if (settled || finishing) return
    finishing = true; ready = false
    if (signalSamples < 3) { fail(new Error('NO_SPEECH')); return }
    onFinishing?.()
    if (recorder.state === 'recording') recorder.stop()
  }
  recorder.onstart = () => { ready = true; onReady?.({ deviceName: input.deviceName, meterAvailable: input.meterAvailable }) }
  recorder.ondataavailable = event => { if (!settled && event.data?.size) chunks.push(event.data) }
  recorder.onerror = () => fail(new Error('AUDIO_CAPTURE_FAILED'))
  recorder.onstop = async () => {
    if (settled) return
    finishing = true; ready = false; onFinishing?.()
    try {
      if (signal?.aborted) throw new Error('CANCELLED')
      if (!chunks.length || signalSamples < 3) throw new Error('NO_SPEECH')
      const blob = new env.Blob(chunks, { type: recorder.mimeType })
      const audio = await input.context.decodeAudioData(await blob.arrayBuffer())
      if (signal?.aborted || settled) return
      const samples = new Float32Array(audio.length)
      for (let channel = 0; channel < audio.numberOfChannels; channel++) {
        const data = audio.getChannelData(channel)
        for (let i = 0; i < samples.length; i++) samples[i] += data[i] / audio.numberOfChannels
      }
      const wav = encodeSpeechWav(samples, audio.sampleRate)
      settled = true; cleanup(); resolve(wav)
    } catch (error) { fail(error) }
  }
  signal?.addEventListener('abort', cancel, { once: true })
  timer = env.setTimeout(finish, MAX_SPEECH_SECONDS * 1000)
  try { recorder.start() } catch (error) { fail(error) }
  return { done, finish, cancel }
}
