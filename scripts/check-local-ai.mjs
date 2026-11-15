import { classifyQuestion } from '../server/local-ai.mjs'

const cases = [['¿Cuánto oxígeno me queda?', 'oxygen'], ['¿Cuánto tarda la ida y la vuelta?', 'times'], ['¿Qué recursos limitan esta ruta?', 'resources'], ['¿Puedo volver a la base?', 'return'], ['Dame el estado de la misión', 'status'], ['Oculta geología', 'unsupported']]
let failed = 0
for (const [question, expected] of cases) {
  const start = performance.now()
  try {
    const result = await classifyQuestion(question, { signal: AbortSignal.timeout(30000) })
    const ok = result.intent === expected
    if (!ok) failed++
    console.log(JSON.stringify({ question, expected, actual: result.intent, ok, milliseconds: Math.round(performance.now() - start) }))
  } catch (error) { failed++; console.log(JSON.stringify({ question, error: error.message })) }
}
process.exitCode = failed ? 1 : 0
