import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { nearbyImageTiles } from '../src/features/terrain/nearbyImagery.js'

const bounds = [77.39407908659932, 18.44682764659932, 77.41769793340069, 18.470446493400683]
test('nearby imagery has bounded geographic coverage and every requested tile exists', () => {
  const root = new URL('../public/data/wildcat-ridge/', import.meta.url)
  for (let i = 0; i <= 20; i++) for (const heading of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const point = { longitude: bounds[0] + i / 20 * (bounds[2] - bounds[0]), latitude: bounds[1] + i / 20 * (bounds[3] - bounds[1]) }
    const tiles = nearbyImageTiles(bounds, point, heading)
    assert.ok(tiles.length >= 4 && tiles.length <= 9)
    assert.ok(tiles.some(tile => tile.bounds[0] <= point.longitude && tile.bounds[2] >= point.longitude && tile.bounds[1] <= point.latitude && tile.bounds[3] >= point.latitude))
    for (const tile of tiles) {
      const bytes = fs.readFileSync(new URL(tile.file, root))
      assert.equal(bytes.readUInt32BE(16), 320)
      assert.equal(bytes.readUInt32BE(20), 320)
      assert.ok(tile.bounds[0] >= bounds[0] && tile.bounds[2] <= bounds[2] + 1e-12)
    }
  }
  assert.deepEqual(nearbyImageTiles(bounds, { longitude: 77, latitude: 18 }, 0), [])
})
