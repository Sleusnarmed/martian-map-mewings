import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { JEZERO_POINTS } from '../src/features/terrain/pointsOfInterest.js'
import { visibleTerrainPoints } from '../src/features/terrain/visibleTerrainPoints.js'
import { sampleHeight } from '../src/features/terrain/terrainData.js'

const expected = [
  ['skinner-ridge', 18.458931, 77.40617078, '11-1', 'page=14'],
  ['amalik', 18.45068954, 77.40143171, '16-1', 'page=100'],
]

test('new Jezero references retain the NASA PDS sample coordinates and provenance', () => {
  assert.equal(new Set(JEZERO_POINTS.map(p => p.id)).size, JEZERO_POINTS.length)
  for (const [id, latitude, longitude, page, anchor] of expected) {
    const point = JEZERO_POINTS.find(p => p.id === id)
    assert.equal(point.latitude, latitude)
    assert.equal(point.longitude, longitude)
    assert.equal(new URL(point.source).hostname, 'pds-geosciences.wustl.edu')
    assert.equal(new URL(point.source).hash, `#${anchor}`)
    assert.ok(point.reference.includes(page))
    assert.equal(new URL(point.contextSource).hostname, 'science.nasa.gov')
    assert.match(point.positionNote, /sample position/)
  }
})

test('new references appear only in immersive 3D, including repeated perspective switches', () => {
  const original = structuredClone(JEZERO_POINTS)
  for (const mode of ['map', 'auto', 'walk', 'auto', 'walk', 'map', 'relief']) {
    const ids = visibleTerrainPoints(JEZERO_POINTS, mode).map(p => p.id)
    assert.ok(ids.includes('wildcat-ridge'))
    for (const [id] of expected) assert.equal(ids.includes(id), mode === 'walk')
  }
  assert.deepEqual(JEZERO_POINTS, original)
})

test('both published positions have finite elevation in the shipped Jezero and local HiRISE grids', () => {
  function readGrid(file) {
    const base = new URL('../public/terrain/jezero/', import.meta.url)
    const metadata = JSON.parse(fs.readFileSync(new URL(file, base)))
    const bytes = fs.readFileSync(new URL(metadata.heightFile, base))
    return { ...metadata, heights: Float32Array.from({ length: metadata.width * metadata.height }, (_, i) => bytes.readFloatLE(i * 4)) }
  }
  const regional = readGrid('metadata.json'), detail = readGrid('wildcat-hi.json')
  for (const [id] of expected) {
    const { longitude, latitude } = JEZERO_POINTS.find(p => p.id === id)
    assert.ok(Number.isFinite(sampleHeight(regional, longitude, latitude)))
    assert.ok(Number.isFinite(sampleHeight(detail, longitude, latitude)))
    assert.ok(Number.isFinite(sampleHeight({ ...regional, detail }, longitude, latitude)))
  }
})

test('original Jezero center and Wildcat reference match USGS and NASA PDS coordinates', () => {
  const region = JSON.parse(fs.readFileSync(new URL('../src/features/terrain/region.json', import.meta.url)))
  assert.equal(region.center.latitude, 18.41)
  assert.equal(region.center.longitude, 77.69)
  assert.equal(region.center.source, 'https://planetarynames.wr.usgs.gov/Feature/14300')
  const wildcat = JEZERO_POINTS.find(p => p.id === 'wildcat-ridge')
  assert.equal(wildcat.latitude, 18.45863707)
  assert.equal(wildcat.longitude, 77.40588851)
  assert.ok(wildcat.reference.includes('14-1'))
})
