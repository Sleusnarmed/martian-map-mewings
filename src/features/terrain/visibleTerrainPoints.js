// Local perspective IDs come from TerrainMapControls; Cesium itself stays in SCENE3D.
export function visibleTerrainPoints(points, mode) {
  return points.filter(point => !point.displayModes || point.displayModes.includes(mode))
}
