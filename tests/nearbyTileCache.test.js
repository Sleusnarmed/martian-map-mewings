import test from 'node:test'
import assert from 'node:assert/strict'
import { setImmediate } from 'node:timers'
import { createNearbyTileCache } from '../src/features/terrain/nearbyTileCache.js'

const flush = () => new Promise(resolve => setImmediate(resolve))
function fixture() {
  const jobs = [], released = [], reports = []
  const cache = createNearbyTileCache({
    load: (tile, signal) => new Promise((resolve, reject) => jobs.push({ key: tile.key, signal, resolve, reject })),
    release: value => released.push(value), onChange: value => reports.push(value),
  })
  return { cache, jobs, released, reports }
}
test('camera windows release obsolete images immediately and keep two in-flight requests', async () => {
  const f = fixture()
  f.cache.update([{ key: 'a' }, { key: 'b' }, { key: 'c' }]); await flush()
  assert.equal(f.jobs.length, 2)
  f.jobs[0].resolve('image-a'); f.jobs[1].resolve('image-b'); await flush()
  assert.equal(f.jobs[2].key, 'c')
  f.cache.update([{ key: 'b' }, { key: 'd' }]); await flush()
  assert.deepEqual(f.released, ['image-a'])
  assert.equal(f.jobs[2].signal.aborted, true)
  assert.ok(f.reports.every(r => r.pending <= 2))
  // A decode that finishes after abort must release its image rather than restore it.
  f.jobs[2].resolve('stale-c'); await flush()
  assert.ok(f.released.includes('stale-c'))
  f.jobs.find(j => j.key === 'd').resolve('image-d'); await flush()
  assert.deepEqual(f.reports.at(-1), { loaded: 2, pending: 0, visible: 2, status: 'ready' })
  f.cache.dispose()
  assert.ok(f.released.includes('image-b') && f.released.includes('image-d'))
})
test('leaving 3D aborts pending work and releases late decoded images without new requests', async () => {
  const f = fixture()
  f.cache.update([{ key: 'a' }, { key: 'b' }, { key: 'c' }]); await flush()
  f.cache.dispose()
  assert.ok(f.jobs.every(j => j.signal.aborted))
  f.jobs.forEach(j => j.resolve(j.key)); await flush()
  assert.equal(f.jobs.length, 2)
  assert.deepEqual(f.released.sort(), ['a', 'b'])
})
test('image failure stops retry loops, clears after leaving and can be requested on reentry', async () => {
  const f = fixture()
  f.cache.update([{ key: 'a' }]); await flush()
  f.jobs[0].reject(new Error('offline')); await flush()
  assert.equal(f.reports.at(-1).status, 'error')
  f.cache.update([{ key: 'a' }]); await flush()
  assert.equal(f.jobs.length, 1)
  f.cache.update([]); f.cache.update([{ key: 'a' }]); await flush()
  assert.equal(f.jobs.length, 2)
  f.jobs[1].resolve('new-a'); await flush()
  assert.equal(f.reports.at(-1).status, 'ready')
  f.cache.dispose()
})
