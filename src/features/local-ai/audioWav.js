export const SPEECH_SAMPLE_RATE = 16000
export const MAX_SPEECH_SECONDS = 20

export function encodeSpeechWav(samples, sampleRate) {
  if (!(samples instanceof Float32Array) || !Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 192000 || !samples.length || samples.length / sampleRate > MAX_SPEECH_SECONDS + 1) throw new Error('INVALID_AUDIO')
  const count = Math.min(SPEECH_SAMPLE_RATE * MAX_SPEECH_SECONDS, Math.floor(samples.length * SPEECH_SAMPLE_RATE / sampleRate))
  const bytes = new Uint8Array(44 + count * 2), view = new DataView(bytes.buffer)
  const ascii = (offset, value) => [...value].forEach((letter, index) => view.setUint8(offset + index, letter.charCodeAt(0)))
  ascii(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); ascii(8, 'WAVE'); ascii(12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, SPEECH_SAMPLE_RATE, true); view.setUint32(28, SPEECH_SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); ascii(36, 'data'); view.setUint32(40, count * 2, true)
  for (let i = 0; i < count; i++) {
    const start = i * sampleRate / SPEECH_SAMPLE_RATE, end = (i + 1) * sampleRate / SPEECH_SAMPLE_RATE
    let sum = 0, weight = 0
    for (let j = Math.floor(start); j < Math.min(samples.length, Math.ceil(end)); j++) {
      const fraction = Math.min(end, j + 1) - Math.max(start, j)
      sum += samples[j] * fraction; weight += fraction
    }
    const sample = Math.max(-1, Math.min(1, sum / Math.max(weight, 1e-9)))
    view.setInt16(44 + i * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true)
  }
  return bytes
}

export function decodeSpeechWav(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 44 || bytes.length > 700000) throw new Error('INVALID_AUDIO')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const ascii = offset => String.fromCharCode(...bytes.subarray(offset, offset + 4))
  if (ascii(0) !== 'RIFF' || ascii(8) !== 'WAVE' || view.getUint32(4, true) + 8 !== bytes.length) throw new Error('INVALID_AUDIO')
  let format, data
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const size = view.getUint32(offset + 4, true), start = offset + 8
    if (start + size > bytes.length) throw new Error('INVALID_AUDIO')
    if (ascii(offset) === 'fmt ' && size >= 16) format = { codec: view.getUint16(start, true), channels: view.getUint16(start + 2, true), rate: view.getUint32(start + 4, true), bits: view.getUint16(start + 14, true) }
    if (ascii(offset) === 'data') data = { start, size }
    offset = start + size + size % 2
  }
  if (!format || !data || format.codec !== 1 || format.channels !== 1 || format.rate !== SPEECH_SAMPLE_RATE || format.bits !== 16 || data.size % 2 || data.size < 8000 || data.size > SPEECH_SAMPLE_RATE * MAX_SPEECH_SECONDS * 2) throw new Error('INVALID_AUDIO')
  const samples = Float32Array.from({ length: data.size / 2 }, (_, index) => view.getInt16(data.start + index * 2, true) / 32768)
  const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length)
  if (!Number.isFinite(rms) || rms < 0.0001) throw new Error('NO_SPEECH')
  return samples
}
