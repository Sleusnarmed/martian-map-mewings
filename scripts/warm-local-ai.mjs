import { ASSISTANT_MODEL } from '../server/assistant-config.mjs'
const started = performance.now()
const response = await fetch('http://127.0.0.1:11434/api/chat', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(60000),
  body: JSON.stringify({ model: ASSISTANT_MODEL, messages: [], stream: false, think: false,
    keep_alive: '30m', options: { num_ctx: 2048, num_predict: 80 } }),
})
if (!response.ok) throw new Error(`Ollama: HTTP ${response.status}`)
await response.json()
console.log(`EVA model prepared in ${Math.round(performance.now() - started)} ms; requested retention: 30 minutes.`)
