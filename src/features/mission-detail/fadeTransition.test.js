import test from 'node:test'
import assert from 'node:assert/strict'
import { createFadeTransition } from './fadeTransition.js'

function fixture(initialValue = 'route', reduced = false) {
  const committed = []
  const animations = []
  const target = { getBoundingClientRect: () => ({ height: 200 }), style: { removeProperty() {} } }
  const transition = createFadeTransition({
    initialValue,
    commit: (value) => committed.push(value),
    getTarget: () => target,
    reducedMotion: () => reduced,
    animate: (_, options) => {
      const animation = { options, canceled: false, cancel() { this.canceled = true } }
      animations.push(animation)
      return animation
    },
  })
  return { transition, committed, animations }
}

test('closing retains the outgoing panel until fade-out completes', () => {
  const f = fixture('information')
  f.transition.request(null)
  assert.deepEqual(f.committed, [])
  f.animations[0].options.onComplete()
  assert.deepEqual(f.committed, [null])
})

test('rapid changes commit only the latest section, including late animation callbacks', () => {
  const f = fixture()
  f.transition.request('telemetry')
  const staleCompletion = f.animations[0].options.onComplete
  f.transition.request('science')
  staleCompletion()
  assert.deepEqual(f.committed, [])
  f.animations[1].options.onComplete()
  assert.deepEqual(f.committed, ['science'])
})

test('reopening during an exit reverses the fade without hiding the panel', () => {
  const f = fixture('information')
  f.transition.request(null)
  const staleCompletion = f.animations[0].options.onComplete
  f.transition.request('information')
  staleCompletion()
  assert.deepEqual(f.committed, [])
  assert.equal(f.animations.at(-1).options.opacity, 1)
})

test('functional updates use the pending page instead of dropping rapid Next clicks', () => {
  const f = fixture(0)
  f.transition.request((page) => page + 1)
  f.transition.request((page) => page + 1)
  f.animations.at(-1).options.onComplete()
  assert.deepEqual(f.committed, [2])
})

test('unmount cleanup invalidates unfinished transitions', () => {
  const f = fixture()
  f.transition.request('science')
  const completion = f.animations[0].options.onComplete
  f.transition.dispose()
  completion()
  assert.deepEqual(f.committed, [])
  assert.equal(f.animations[0].canceled, true)
})

test('reduced motion commits immediately and keeps a gentle entrance', () => {
  const f = fixture('route', true)
  f.transition.request('telemetry')
  assert.deepEqual(f.committed, ['telemetry'])
  assert.equal(f.animations.length, 0)
  f.transition.enter('telemetry')
  assert.equal(f.animations[0].options.duration, 60)
})
