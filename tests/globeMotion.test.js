import test from 'node:test'
import assert from 'node:assert/strict'
import { createGlobeMotion, MARS_OVERVIEW_HEIGHT, MARS_PREVIEW_HEIGHT } from '../src/components/globeMotion.js'

function fixture(reduced = false, canResume = () => true) {
  let time = 0
  let shown = true
  const rotations = []
  const flights = []
  const states = []
  let zooms = 0
  const motion = createGlobeMotion({
    rotate: angle => rotations.push(angle), zoom: () => { zooms += 1 },
    resetCamera: (_, __, complete) => flights.push(complete), now: () => time,
    reducedMotion: () => reduced, visible: () => shown, onChange: state => states.push(state), canResume,
  })
  return { motion, rotations, flights, states, zooms: () => zooms, tick: ms => { time += ms; motion.tick() }, hide: value => { shown = !value } }
}

test('overview starts further out and rotation is time based', () => {
  assert.ok(MARS_OVERVIEW_HEIGHT > MARS_PREVIEW_HEIGHT)
  const f = fixture()
  f.motion.restart(true); f.flights[0]()
  for (let i = 0; i < 20; i++) f.tick(50)
  assert.ok(Math.abs(f.rotations.reduce((sum, angle) => sum + angle, 0) + 0.028) < 1e-12)
})

test('first and repeated blank taps never zoom; overview still resumes after 500 ms idle', () => {
  const f = fixture()
  f.motion.restart(true); f.flights[0](); f.tick(50)
  f.motion.beginInteraction()
  assert.equal(f.zooms(), 0)
  // Retain the old touch flag/zoom spy as a regression trap for the removed hook.
  f.motion.interact(true); f.motion.interact(true)
  f.tick(1000)
  assert.equal(f.zooms(), 0)
  assert.equal(f.rotations.length, 1)
  assert.equal(f.states.at(-1), 'paused')
  f.motion.endInteraction(); f.tick(499)
  assert.equal(f.rotations.length, 1)
  f.tick(1)
  assert.equal(f.rotations.length, 2)
  f.motion.restart(true); f.flights.at(-1)()
  f.motion.beginInteraction(); f.motion.endInteraction(); f.motion.interact(true)
  assert.equal(f.zooms(), 0)
})

test('new input extends the idle delay; focusing a zone disables all idle resumes', () => {
  const f = fixture()
  f.motion.restart(true); f.flights[0]()
  f.motion.interact(); f.tick(400); f.motion.interact(); f.tick(499)
  assert.equal(f.rotations.length, 0)
  f.tick(1)
  assert.equal(f.rotations.length, 1)
  f.motion.pause()
  f.motion.beginInteraction(); f.motion.interact(); f.motion.endInteraction(); f.tick(90000)
  assert.equal(f.rotations.length, 1)
  f.motion.restart(true); f.flights.at(-1)(); f.tick(50)
  assert.equal(f.rotations.length, 2)
})

test('interacting during a back flight invalidates its pending auto-rotation', () => {
  const f = fixture()
  f.motion.restart(true)
  f.motion.pause()
  f.flights[0](); f.tick(50)
  assert.equal(f.rotations.length, 0)
  assert.equal(f.zooms(), 0)
})

test('manually zooming into a regional view also locks the idle rotation until going back', () => {
  let wide = false
  const f = fixture(false, () => wide)
  f.motion.restart(true); f.flights[0]()
  f.motion.interact(); f.tick(500)
  assert.equal(f.states.at(-1), 'paused')
  wide = true
  f.motion.interact(); f.tick(500)
  assert.equal(f.rotations.length, 0)
  f.motion.restart(true); f.flights.at(-1)(); f.tick(50)
  assert.equal(f.rotations.length, 1)
})

test('hidden and reduced-motion views pause; compact previews rotate too', () => {
  const f = fixture()
  f.motion.restart(true); f.flights[0]()
  f.hide(true); f.tick(60000); f.hide(false); f.tick(50)
  assert.equal(f.rotations.length, 1)
  assert.ok(Math.abs(f.rotations[0]) < 0.003)
  f.motion.restart(false); f.flights.at(-1)(); f.tick(50)
  assert.equal(f.rotations.length, 2)
  const reduced = fixture(true)
  reduced.motion.restart(true); reduced.flights[0](); reduced.tick(50)
  assert.equal(reduced.rotations.length, 0)
})
