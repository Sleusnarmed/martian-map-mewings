import test from 'node:test'
import assert from 'node:assert/strict'
import { Entity, JulianDate } from 'cesium'
import { updatePointLabels, wrapPointName } from '../src/features/terrain/terrainPointLabels.js'
import { sourceRecord } from '../src/components/sourceRecords.js'
import { nearbyPointFocus } from '../src/features/terrain/pointClusterFocus.js'

test('a selected native marker keeps its name when hover moves, leaves or the camera moves', () => {
  const time = JulianDate.now()
  const wildcat = new Entity({ properties: { poiId: 'wildcat-ridge' }, label: { show: false }, point: { pixelSize: 10 } })
  const skinner = new Entity({ properties: { poiId: 'skinner-ridge' }, label: { show: false }, point: { pixelSize: 10 } })
  let renders = 0
  const viewer = { entities: { values: [wildcat, skinner] }, clock: { currentTime: time }, scene: { requestRender() { renders++ } } }
  const visible = () => [wildcat, skinner].map(entity => entity.label.show.getValue(time))
  updatePointLabels(viewer, 'wildcat-ridge', null)
  assert.deepEqual(visible(), [true, false])
  updatePointLabels(viewer, 'skinner-ridge', 'wildcat-ridge')
  assert.deepEqual(visible(), [true, true])
  assert.equal(wildcat.point.pixelSize.getValue(time), 14)
  assert.equal(skinner.point.pixelSize.getValue(time), 10)
  updatePointLabels(viewer, null, 'wildcat-ridge')
  assert.deepEqual(visible(), [true, false])
  const stable = renders
  updatePointLabels(viewer, null, 'wildcat-ridge')
  assert.equal(renders, stable)
  updatePointLabels(viewer, null, 'skinner-ridge')
  assert.deepEqual(visible(), [false, true])
  updatePointLabels(viewer, null, null)
  assert.deepEqual(visible(), [false, false])
})

test('offline provenance preserves DOI, document edition and PDS product identifiers', () => {
  assert.match(sourceRecord('https://doi.org/10.5066/P9QJDP48').reference, /10.5066\/P9QJDP48/)
  assert.equal(sourceRecord('https://pds-geosciences.wustl.edu/Mars%202020%20Initial%20Reports%20Volume%201%20Release%202.2.pdf').product, 'Mars 2020 Initial Reports Volume 1 Release 2.2.pdf')
  assert.equal(sourceRecord('https://pds-atmospheres.nmsu.edu/archive/WE__0518.xml').product, 'WE__0518.xml')
})

test('overlapping science symbols zoom to the closest geographic pair without relocating them', () => {
  const points = [
    { id: 'wildcat', longitude: 77.40588851, latitude: 18.45863707, x: 100, y: 100 },
    { id: 'skinner', longitude: 77.40617078, latitude: 18.458931, x: 105, y: 101 },
    { id: 'other', longitude: 77.4, latitude: 18.45, x: 300, y: 200 },
  ]
  const original = structuredClone(points)
  const target = nearbyPointFocus(points[0], points, 3500, 3396190)
  assert.ok(target.range >= 140 && target.range < 3500)
  assert.equal(target.longitude, (points[0].longitude + points[1].longitude) / 2)
  assert.equal(nearbyPointFocus(points[0], points, target.range, 3396190), null)
  assert.equal(nearbyPointFocus(points[2], points, 3500, 3396190), null)
  assert.deepEqual(points, original)
})

test('long phone labels retain the complete site name within the map focus width', () => {
  for (const name of ['Cheyava Falls · Sapphire Canyon', 'Hans Amundsen Memorial · Pelican Point']) {
    const text = wrapPointName(name, 144, value => value.length * 7)
    assert.equal(text.split('\n').join(' '), name)
    assert.ok(text.split('\n').every(line => line.length * 7 <= 144))
    assert.ok(text.includes('\n'))
  }
})
