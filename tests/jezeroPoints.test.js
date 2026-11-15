import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { JEZERO_POINTS } from '../src/features/terrain/pointsOfInterest.js'
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

test('crater-floor additions retain their published sample coordinates and regional DEM coverage', () => {
  const base = new URL('../public/terrain/jezero/', import.meta.url)
  const metadata = JSON.parse(fs.readFileSync(new URL('metadata.json', base)))
  const bytes = fs.readFileSync(new URL(metadata.heightFile, base))
  const grid = { ...metadata, heights: Float32Array.from({ length: metadata.width * metadata.height }, (_, i) => bytes.readFloatLE(i * 4)) }
  for (const [id, latitude, longitude, sample] of [
    ['rochette', 18.43074132, 77.44436502, 'M2020-190-3'],
    ['brac', 18.43397, 77.44301, 'M2020-262-5'],
    ['issole', 18.43264, 77.44133, 'M2020-298-7'],
  ]) {
    const point = JEZERO_POINTS.find(p => p.id === id)
    assert.equal(point.latitude, latitude); assert.equal(point.longitude, longitude)
    assert.ok(point.reference.includes(sample))
    assert.ok(Number.isFinite(sampleHeight(grid, longitude, latitude)))
  }
})

test('upper-fan and margin references span beyond Wildcat and stay inside the regional elevation package', () => {
  const base = new URL('../public/terrain/jezero/', import.meta.url)
  const metadata = JSON.parse(fs.readFileSync(new URL('metadata.json', base)))
  const bytes = fs.readFileSync(new URL(metadata.heightFile, base))
  const grid = { ...metadata, heights: Float32Array.from({ length: metadata.width * metadata.height }, (_, i) => bytes.readFloatLE(i * 4)) }
  for (const [id, latitude, longitude, page] of [
    ['berea', 18.47021736, 77.38394465, 14],
    ['emerald-lake', 18.4829798, 77.36815348, 48],
    ['dream-lake', 18.48380149, 77.3604692, 86],
    ['hans-amundsen', 18.48344692, 77.35065098, 14],
    ['turquoise-bay', 18.48867278, 77.34704595, 49],
    ['bunsen-peak', 18.49186664, 77.3272192, 87],
    ['cheyava-falls', 18.49747434, 77.30514915, 120],
  ]) {
    const point = JEZERO_POINTS.find(p => p.id === id)
    assert.equal(point.latitude, latitude); assert.equal(point.longitude, longitude)
    assert.equal(new URL(point.source).hash, `#page=${page}`)
    assert.ok(Number.isFinite(sampleHeight(grid, longitude, latitude)))
  }
  assert.equal(JEZERO_POINTS.length, 13)
})
