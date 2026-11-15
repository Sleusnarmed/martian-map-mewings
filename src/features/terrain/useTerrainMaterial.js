import { useEffect } from 'react'
import * as Cesium from 'cesium'
import region from './region.json'

function makeMaterial(data, contours, spacing, elevationColors, baseOpacity) {
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 1
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createLinearGradient(0, 0, 256, 0)
  ;region.palette.forEach((c, i) => gradient.addColorStop(i / 4, c))
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 1)
  return new Cesium.Material({ fabric: {
    type: 'JezeroElevation',
    uniforms: { elevationColors: elevationColors ? 1.0 : 0.0, baseOpacity },
    materials: {
      elevation: { type: 'ElevationRamp', uniforms: { image: canvas.toDataURL(), minimumHeight: data.minimumHeight, maximumHeight: data.maximumHeight } },
      contour: { type: 'ElevationContour', uniforms: { spacing, width: contours ? 1 : 0, color: Cesium.Color.fromCssColorString(region.contourColor).withAlpha(0.45) } },
    },
    components: {
      diffuse: 'mix(mix(vec3(0.32, 0.29, 0.27), elevation.diffuse, elevationColors), contour.diffuse, contour.alpha / max(0.0001, contour.alpha + baseOpacity * (1.0 - contour.alpha)))',
      alpha: 'contour.alpha + baseOpacity * (1.0 - contour.alpha)',
    },
  } })
}

export function useTerrainMaterial({ viewerRef, state, contours, spacing, elevationColors, imageryVisible }) {
  useEffect(() => {
    const context = viewerRef.current
    if (!context || state.status !== 'ready') return
    const globe = context.viewer.scene.globe
    const baseOpacity = elevationColors ? (imageryVisible ? 0.60 : 1.0) : 0.0
    if (!globe.material) globe.material = makeMaterial(context.data, contours, spacing, elevationColors, baseOpacity)
    else {
      globe.material.uniforms.elevationColors = elevationColors ? 1.0 : 0.0
      globe.material.uniforms.baseOpacity = baseOpacity
      globe.material.materials.contour.uniforms.width = contours ? 1 : 0
      globe.material.materials.contour.uniforms.spacing = spacing
    }
    context.viewer.scene.requestRender()
  }, [viewerRef, state, contours, spacing, elevationColors, imageryVisible])

}
