import { useEffect, useRef } from 'react'
import { Cartesian3, Math as CesiumMath } from 'cesium'
import { constrainCamera, explorationClearance } from './cameraLimits'
import { sampleHeight } from './terrainData'
import { moveAlongGround } from '../route-planner/routeGeometry.js'

const keys = {
  ArrowUp: 'forward', KeyW: 'forward', ArrowDown: 'back', KeyS: 'back',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
}
export const LOWERED_PITCH = CesiumMath.toRadians(-15)

export function cameraGroundPoint(viewer) {
  const position = viewer.camera.positionCartographic
  return {
    longitude: CesiumMath.toDegrees(position.longitude),
    latitude: CesiumMath.toDegrees(position.latitude),
  }
}

export function placeExplorer(viewer, data, point, heading, pitch = viewer.camera.pitch) {
  const ground = sampleHeight(data, point.longitude, point.latitude)
  if (ground === null) return
  const height = ground + explorationClearance(data, point.longitude, point.latitude)
  const safe = constrainCamera(data, { ...point, height, pitch }, true)
  viewer.camera.setView({
    destination: Cartesian3.fromDegrees(safe.longitude, safe.latitude, safe.height, viewer.scene.globe.ellipsoid),
    orientation: { heading, pitch: safe.pitch, roll: 0 },
  })
  viewer.scene.requestRender()
}

function setOrbitInputs(viewer, enabled) {
  const controller = viewer.scene.screenSpaceCameraController
  controller.enableInputs = enabled
  // The explorer already uses the loaded DEM for clearance, including before tiles render.
  controller.enableCollisionDetection = false
}

function moveExplorer(viewer, data, forward, turn, seconds) {
  const point = cameraGroundPoint(viewer)
  const heading = viewer.camera.heading + turn * seconds * 1.7
  const pace = explorationClearance(data, point.longitude, point.latitude) <= 25 ? 20 : 55
  const proposed = moveAlongGround(point, heading, forward * seconds * pace, data.radius)
  const next = sampleHeight(data, proposed.longitude, proposed.latitude) === null ? point : proposed
  placeExplorer(viewer, data, next, heading)
}

export function useExplorerControls(viewer, data, enabled) {
  const commands = useRef(null)
  useEffect(() => {
    if (!viewer || !data || !enabled) return
    const { canvas } = viewer
    const held = new Map()
    let pointer, frame, lastTime
    setOrbitInputs(viewer, false)

    function axes(actions) {
      return [
        Number(actions.has('forward')) - Number(actions.has('back')),
        Number(actions.has('right')) - Number(actions.has('left')),
      ]
    }

    function tick(now) {
      if (lastTime !== undefined) {
        const seconds = Math.min(0.20, (now - lastTime) / 1000)
        moveExplorer(viewer, data, ...axes(new Set(held.values())), seconds)
      }
      lastTime = now
      frame = requestAnimationFrame(tick)
    }

    function start(id, action) {
      held.set(id, action)
      if (!frame) frame = requestAnimationFrame(tick)
    }

    function end(id) {
      held.delete(id)
      if (held.size) return
      cancelAnimationFrame(frame)
      frame = lastTime = undefined
    }

    function resetInput() {
      held.clear()
      end()
      pointer = undefined
    }

    function step(action) {
      moveExplorer(viewer, data, ...axes(new Set([action])), action === 'back' || action === 'forward' ? 0.75 : 0.17)
    }

    function keyDown(event) {
      const action = keys[event.code]
      if (!action || event.ctrlKey || event.altKey || event.metaKey ||
        event.target instanceof Element && event.target.closest('input, select, textarea, [contenteditable], [role="slider"], dialog')) return
      event.preventDefault()
      // Single key presses work as deliberate steps, and a held key continues moving.
      if (!held.has(event.code)) {
        moveExplorer(viewer, data, ...axes(new Set([action])), 0.08)
        start(event.code, action)
      }
    }

    const keyUp = event => { if (keys[event.code]) end(event.code) }

    function lookStart(event) {
      if (!event.isPrimary || event.button !== 0) return
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
      canvas.setPointerCapture(event.pointerId)
    }

    function lookMove(event) {
      if (pointer?.id !== event.pointerId) return
      const deltaX = event.clientX - pointer.x
      const deltaY = event.clientY - pointer.y
      pointer.x = event.clientX
      pointer.y = event.clientY
      placeExplorer(viewer, data, cameraGroundPoint(viewer), viewer.camera.heading + deltaX * 0.005, viewer.camera.pitch - deltaY * 0.004)
    }

    function lookEnd(event) {
      if (pointer?.id === event.pointerId) pointer = undefined
    }

    commands.current = { start, end, step }
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('blur', resetInput)
    document.addEventListener('visibilitychange', resetInput)
    canvas.addEventListener('pointerdown', lookStart)
    canvas.addEventListener('pointermove', lookMove)
    canvas.addEventListener('lostpointercapture', lookEnd)
    return () => {
      if (pointer && canvas.hasPointerCapture(pointer.id)) canvas.releasePointerCapture(pointer.id)
      resetInput()
      commands.current = null
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('blur', resetInput)
      document.removeEventListener('visibilitychange', resetInput)
      canvas.removeEventListener('pointerdown', lookStart)
      canvas.removeEventListener('pointermove', lookMove)
      canvas.removeEventListener('lostpointercapture', lookEnd)
      if (!viewer.isDestroyed()) setOrbitInputs(viewer, true)
    }
  }, [viewer, data, enabled])

  return {
    hold: (id, action) => commands.current?.start(id, action),
    release: id => commands.current?.end(id),
    step: action => commands.current?.step(action),
  }
}
