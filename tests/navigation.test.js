import assert from 'node:assert/strict'
import test from 'node:test'
import { MARS_REGIONS } from '../src/data/marsZones.js'
import { JEZERO_POINTS } from '../src/features/terrain/pointsOfInterest.js'
import { normalizeRoute, routeForZone } from '../src/navigation.js'

test('the globe offers only Jezero; Wildcat remains a point inside its local map', () => {
  const destinations = MARS_REGIONS.filter(region => region.available).flatMap(region => region.zones)
  assert.deepEqual(destinations.map(zone => zone.id), ['jezero'])
  for (const zone of destinations) {
    const route = routeForZone(zone)
    assert.ok(route)
    assert.equal(normalizeRoute(`#${route}`), route)
  }
  assert.ok(JEZERO_POINTS.some(point => point.id === 'wildcat-ridge'))
  assert.equal(normalizeRoute('#/mars/wildcat-ridge'), '/mars/wildcat-ridge')
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
