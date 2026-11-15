import { Cartesian3 } from 'cesium'

// World coordinates stay unchanged. Only annotations are drawn over the terrain.
export function projectTerrainPoint(camera, position, project, width, height) {
  const direction = Cartesian3.subtract(position, camera.positionWC, new Cartesian3())
  if (Cartesian3.dot(direction, camera.directionWC) <= 0) return null
  const screen = project(position)
  if (!screen || !Number.isFinite(screen.x) || !Number.isFinite(screen.y)) return null
  if (screen.x < 0 || screen.y < 0 || screen.x > width || screen.y > height) return null
  return { x: screen.x, y: screen.y }
}

// Cesium returns CSS pixels within its canvas, which may extend far beyond the
// visible map to reserve panel space. Never treat them as overlay-local pixels.
export function canvasPointToOverlay(point, canvasSize, canvasRect, overlaySize, overlayRect) {
  if (![canvasSize.width, canvasSize.height, canvasRect.width, canvasRect.height,
    overlaySize.width, overlaySize.height, overlayRect.width, overlayRect.height].every(n => Number.isFinite(n) && n > 0)) return null
  const x = (canvasRect.left + point.x * canvasRect.width / canvasSize.width - overlayRect.left) * overlaySize.width / overlayRect.width
  const y = (canvasRect.top + point.y * canvasRect.height / canvasSize.height - overlayRect.top) * overlaySize.height / overlayRect.height
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > overlaySize.width || y > overlaySize.height) return null
  return { x, y }
}
