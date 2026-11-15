// Local signal diagnostics only. No audio recording, storage, or upload here.
export async function openMicrophoneInput(env, onSample, signal) {
  if (!env.navigator?.mediaDevices?.getUserMedia) return null
  const Context = env.AudioContext || env.webkitAudioContext
  let context, stream, source, interval
  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    signal?.removeEventListener('abort', stop)
    env.clearInterval?.(interval)
    source?.disconnect()
    stream?.getTracks().forEach(track => track.stop())
    if (context && context.state !== 'closed') void context.close().catch(() => {})
  }
  signal?.addEventListener('abort', stop, { once: true })
  try {
    // Resume within the initial user gesture, before waiting for permission.
    if (Context) {
      context = new Context()
      if (context.state !== 'running') void context.resume().catch(() => {})
    }
    const acquired = await env.navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false })
    if (signal?.aborted) {
      acquired.getTracks().forEach(track => track.stop())
      throw Object.assign(new Error('Microphone setup cancelled'), { name: 'AbortError' })
    }
    stream = acquired
    const deviceName = stream.getAudioTracks()[0]?.label || 'Default microphone'
    if (!context) return { stop, deviceName, meterAvailable: false, stream, context }
    const analyser = context.createAnalyser()
    analyser.fftSize = 256
    source = context.createMediaStreamSource(stream)
    source.connect(analyser)
    const samples = new Float32Array(analyser.fftSize)
    interval = env.setInterval(() => {
      if (context.state !== 'running') return
      analyser.getFloatTimeDomainData(samples)
      const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length)
      // A perceptual scale keeps quiet microphones visible instead of drawing
      // their entire useful range in the first few pixels of the meter.
      onSample({ level: Math.min(100, Math.round(Math.sqrt(rms) * 250)), hasSignal: rms >= 0.001 })
    }, 100)
    return { stop, deviceName, meterAvailable: context.state === 'running', stream, context }
  } catch (error) { stop(); throw error }
}
