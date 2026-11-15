import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { Cartesian3, Cartographic, Ellipsoid, Ray } from 'cesium'
import { observationAt, clockLabel } from '../src/features/terrain/environmentModel.js'
import { slopeAt, pitchForRange, surfaceDistance } from '../src/features/terrain/terrainAnalysis.js'
import { sampleHeight, sampleRegionalHeight } from '../src/features/terrain/terrainData.js'
import { createTerrainProvider, TILE_SIZE } from '../src/features/terrain/createTerrainProvider.js'
import { bearingTo, buildWildcatRoute, moveAlongGround, routePosition } from '../src/features/terrain/wildcatRoute.js'
import { constrainCamera, explorationClearance } from '../src/features/terrain/cameraLimits.js'
import { pickTerrainRay } from '../src/features/terrain/pickTerrain.js'

const archive = JSON.parse(fs.readFileSync(new URL('../public/data/wildcat-ridge/meda.json', import.meta.url)))
const data = JSON.parse(fs.readFileSync(new URL('../public/terrain/jezero/metadata.json', import.meta.url)))
const bytes = fs.readFileSync(new URL('../public/terrain/jezero/heights.f32', import.meta.url))
data.heights = Float32Array.from({ length: data.width * data.height }, (_, i) => bytes.readFloatLE(i * 4))

test('a shared sol and LMST never borrow another sol or fill missing radiation with zero', () => {
  assert.equal(observationAt(archive.wind, 518, 735), null)
  assert.ok(observationAt(archive.wind, 312, 735))
  assert.equal(observationAt(archive.solar, 518, 60), null)
  assert.equal(observationAt(archive.solar, 312, 735), null)
  assert.equal(observationAt(archive.solar, 518, 735).value, 295.105)
  assert.notEqual(observationAt(archive['air-temperature'], 518, 735).value, observationAt(archive['air-temperature'], 518, 975).value)
  const gap = { sol: 518, readings: [{ time: '10:00:00', value: 12 }] }
  assert.equal(observationAt(gap, 518, 636), null)
  assert.equal(clockLabel(1435), '23:55')
})

test('slope respects Mars distances, geographic bounds and known inclines', () => {
  const d = { radius: 3396190, bounds: [-0.01, -0.01, 0.01, 0.01], width: 5, height: 5 }
  const step = 0.005 * Math.PI / 180 * d.radius
  d.heights = Float32Array.from({ length: 25 }, (_, i) => (i % 5) * step * Math.tan(Math.PI / 6))
  assert.ok(Math.abs(slopeAt(d, 0, 0) - 30) < 0.001)
  assert.equal(slopeAt(d, -0.01, 0), null)
  assert.ok(Math.abs(surfaceDistance({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0.01 }, d.radius) - d.radius * 0.01) < 0.0001)
})

test('automatic perspective is continuous and gets oblique only at close range', () => {
  assert.equal(pitchForRange(15000, 'auto'), -Math.PI / 2)
  assert.ok(pitchForRange(1300, 'auto') > pitchForRange(6000, 'auto'))
  assert.equal(pitchForRange(1300, 'map'), -Math.PI / 2)
  for (let r = 1301; r <= 12000; r += 37) assert.ok(Math.abs(pitchForRange(r, 'auto') - pitchForRange(r - 1, 'auto')) < 0.002)
})

test('DEM picking resolves negative MOLA terrain without waiting for render tiles', () => {
  const ellipsoid = new Ellipsoid(data.radius, data.radius, data.radius)
  const lon = 77.40588851, lat = 18.45863707
  const height = sampleHeight(data, lon, lat)
  const destination = Cartesian3.fromDegrees(lon, lat, height, ellipsoid)
  const origin = Cartesian3.fromDegrees(lon, lat, height + 12000, ellipsoid)
  const direction = Cartesian3.normalize(Cartesian3.subtract(destination, origin, new Cartesian3()), new Cartesian3())
  const hit = pickTerrainRay(new Ray(origin, direction), data)
  assert.ok(hit)
  assert.ok(Cartesian3.distance(hit, destination) < 0.1)
  assert.equal(pickTerrainRay(new Ray(origin, Cartesian3.negate(direction, new Cartesian3())), data), null)
  const outside = Cartesian3.fromDegrees(80, 20, 12000, ellipsoid)
  assert.equal(pickTerrainRay(new Ray(outside, Cartesian3.normalize(Cartesian3.negate(outside, new Cartesian3()), new Cartesian3())), data), null)
})

test('HiRISE refines only the covered tiles and rejoins CTX at the edge', async () => {
  const detail = JSON.parse(fs.readFileSync(new URL('../public/terrain/jezero/wildcat-hi.json', import.meta.url)))
  const detailBytes = fs.readFileSync(new URL('../public/terrain/jezero/wildcat-hi.f32', import.meta.url))
  detail.heights = Float32Array.from({ length: detail.width * detail.height }, (_, i) => detailBytes.readFloatLE(i * 4))
  const merged = { ...data, detail }
  const lon = 77.40588851, lat = 18.45863707
  assert.equal(sampleHeight(merged, lon, lat), sampleRegionalHeight(detail, lon, lat))
  assert.equal(sampleHeight(merged, detail.bounds[0], lat), sampleRegionalHeight(data, detail.bounds[0], lat))
  const provider = createTerrainProvider(merged)
  const level = provider.maximumLevel
  assert.ok(level > 4)
  const center = provider.tilingScheme.positionToTileXY(Cartographic.fromDegrees(lon, lat), level)
  assert.equal(provider.getTileDataAvailable(center.x, center.y, level), true)
  assert.equal(provider.getTileDataAvailable(0, 0, level), false)
  const [tile, east] = await Promise.all([
    provider.requestTileGeometry(center.x, center.y, level),
    provider.requestTileGeometry(center.x + 1, center.y, level),
  ])
  assert.equal(tile.childTileMask, 0)
  const parent = await provider.requestTileGeometry(Math.floor(center.x / 2), Math.floor(center.y / 2), level - 1)
  const childBit = (center.y % 2 === 0 ? 4 : 1) << (center.x % 2)
  assert.ok(parent.childTileMask & childBit)
  for (let row = 0; row < TILE_SIZE; row++) {
    assert.equal(tile._buffer[(row + 1) * TILE_SIZE - 1], east._buffer[row * TILE_SIZE])
  }
})

test('moving forward and backward updates progress along the simulated route', () => {
  const route = buildWildcatRoute(data)
  const [start, first, second, destination] = route.waypoints
  const heading = bearingTo(start, first, data.radius)
  const moved = moveAlongGround(start, heading, 30, data.radius)
  const returned = moveAlongGround(moved, heading, -30, data.radius)
  assert.ok(Math.abs(routePosition(route, moved).progress - 30) < 0.05)
  assert.ok(routePosition(route, returned).progress < 0.05)
  assert.equal(routePosition(route, first).next, second)
  assert.equal(routePosition(route, destination).arrived, true)
  const detour = moveAlongGround(moved, heading + Math.PI / 2, 60, data.radius)
  assert.ok(routePosition(route, detour).crossTrack > 30)
})

test('exploration camera stays above the mapped DEM and can look near the horizon', () => {
  const [longitude, latitude] = [77.40588851, 18.45863707]
  const ground = sampleHeight(data, longitude, latitude)
  const pose = { longitude, latitude, height: ground - 100, pitch: 0 }
  const safe = constrainCamera(data, pose, true)
  assert.equal(safe.height, ground + explorationClearance(data, longitude, latitude))
  assert.equal(safe.pitch, 0)
  const edge = constrainCamera(data, { ...pose, longitude: data.bounds[2] + 1 }, true)
  assert.equal(edge.longitude, data.bounds[2])
})
