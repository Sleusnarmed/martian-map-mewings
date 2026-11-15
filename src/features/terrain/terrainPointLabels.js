import { Color } from 'cesium'

export function wrapPointName(name, maxWidth, measure) {
  const lines = ['']
  for (const word of name.split(/\s+/)) {
    const index = lines.length - 1
    const next = lines[index] ? `${lines[index]} ${word}` : word
    if (lines[index] && measure(next) > maxWidth) lines.push(word)
    else lines[index] = next
  }
  return lines.join('\n')
}

export function updatePointLabels(viewer, hoveredId, selectedId) {
  if (viewer.isDestroyed?.()) return
  let changed = false
  for (const entity of viewer.entities.values) {
    const id = entity.properties?.poiId?.getValue()
    if (!id || !entity.label) continue
    const show = id === hoveredId || id === selectedId
    const size = id === selectedId ? 14 : id === 'jezero' ? 9 : 10
    if (entity.point && entity.point.pixelSize?.getValue(viewer.clock.currentTime) !== size) {
      entity.point.pixelSize = size
      entity.point.outlineColor = id === selectedId ? Color.WHITE : id === 'jezero' ? Color.fromCssColorString('#35291e') : Color.BLACK
      changed = true
    }
    if (entity.label.show?.getValue(viewer.clock.currentTime) !== show) {
      entity.label.show = show
      changed = true
    }
  }
  if (changed) viewer.scene.requestRender()
}

