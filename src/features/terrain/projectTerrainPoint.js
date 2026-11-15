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
