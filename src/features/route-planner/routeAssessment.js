import { pointOnRoute } from './routeGeometry.js'

// Worker results describe the last plan. Panels describe resources available now.
// Do not mutate the verified result consumed by planning and the AI adapter.
export function currentRouteAssessment(state) {
  const result = state.result
  if (!result?.route) return result
  const spent = pointOnRoute(result.route, state.legDistance).seconds
  const requiredSeconds = Math.max(0, result.requiredSeconds - spent)
  const resources = result.resources.map(resource => {
    const total = resource.id === 'oxygen' ? state.settings.oxygenSeconds : state.settings.budgetSeconds
    const availableSeconds = total - state.elapsed
    return { ...resource, availableSeconds: Math.max(0, availableSeconds), requiredSeconds,
      minimumTotalSeconds: requiredSeconds + state.elapsed,
      shortfallSeconds: Math.max(0, requiredSeconds - availableSeconds) }
  })
  const limited = resources.some(resource => resource.shortfallSeconds > 1e-9)
  return { ...result, resources, requiredSeconds, status: limited ? 'resources' : 'ready',
    outboundSeconds: state.mode === 'return' ? 0 : Math.max(0, result.outboundSeconds - spent),
    returnSeconds: state.mode === 'return' ? Math.max(0, result.returnSeconds - spent) : result.returnSeconds,
    conservativeReturnSeconds: state.mode === 'return' ? Math.max(0, result.conservativeReturnSeconds - spent) : result.conservativeReturnSeconds }
}
