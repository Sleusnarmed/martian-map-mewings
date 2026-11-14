import assert from 'node:assert/strict'
import test from 'node:test'
import { MARS_REGIONS } from '../src/data/marsZones.js'
import { JEZERO_POINTS } from '../src/features/terrain/pointsOfInterest.js'
import { normalizeRoute, routeForZone } from '../src/navigation.js'

test('available globe destinations resolve to distinct terrain deep links', () => {
  const destinations = MARS_REGIONS.filter(region => region.available).flatMap(region => region.zones)
  assert.deepEqual(destinations.map(zone => zone.id).sort(), ['jezero', 'wildcat-ridge'])
  assert.equal(new Set(destinations.map(routeForZone)).size, 2)
  for (const zone of destinations) {
    const route = routeForZone(zone)
    assert.ok(route)
    assert.equal(normalizeRoute(`#${route}`), route)
  }
  const wildcat = destinations.find(zone => zone.id === 'wildcat-ridge')
  const point = JEZERO_POINTS.find(point => point.id === wildcat.id)
  assert.equal(wildcat.lat, point.latitude)
  assert.equal(wildcat.lon, point.longitude)
})

test('regions, unknown sites and inherited object keys cannot open terrain', () => {
  for (const zone of [...MARS_REGIONS, null, {}, { id: 'gale' }, { id: 'constructor' }, { id: '__proto__' }]) {
    assert.equal(routeForZone(zone), null)
  }
  for (const hash of ['', '#/', '#/earth', '#/mars/gale', '#/constructor']) {
    assert.equal(normalizeRoute(hash), '/')
  }
  assert.equal(normalizeRoute('#/mars'), '/mars')
})
