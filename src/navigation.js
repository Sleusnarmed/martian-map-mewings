export const TERRAIN_ROUTES = { jezero: '/mars/jezero', 'wildcat-ridge': '/mars/wildcat-ridge' }
export function routeForZone(zone) { return Object.hasOwn(TERRAIN_ROUTES, zone?.id) ? TERRAIN_ROUTES[zone.id] : null }
export function normalizeRoute(hash) {
  const path = hash.replace(/^#/, '') || '/'
  return ['/', '/mars', ...Object.values(TERRAIN_ROUTES)].includes(path) ? path : '/'
}
