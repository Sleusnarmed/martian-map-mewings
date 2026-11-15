import { warmSpeechModel, SPEECH_MODEL, SPEECH_REVISION } from '../server/speech-engine.mjs'
console.log(`Preparing local multilingual speech: ${SPEECH_MODEL} @ ${SPEECH_REVISION}`)
const start = performance.now()
await warmSpeechModel({ download: true })
console.log(`Local speech model ready in ${Math.round(performance.now() - start)} ms.`)
