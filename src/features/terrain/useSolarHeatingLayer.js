import { useEffect, useRef, useState } from 'react'
import { Credit, Rectangle, SingleTileImageryProvider } from 'cesium'
import { sampleRegionalHeight } from './terrainData'
import { addOrderedImagery } from './wildcatImagery'

export const heatColors = ['#192054', '#433181', '#c94562', '#f79444', '#fff3a3']
const palette = heatColors.map(color => [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16)))

// An equinox model of direct solar incidence. It uses no temperature or irradiance observations.
function heatImage(data, minute) {
  const size = 257
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const context = canvas.getContext('2d')
  const pixels = context.createImageData(size, size)
  const [west, south, east, north] = data.bounds
  const dx = (east - west) / (size - 1)
  const dy = (north - south) / (size - 1)
  const rad = Math.PI / 180
  const hourAngle = (minute - 720) * Math.PI / 720
  const morningEvening = -Math.sin(hourAngle)
  const daylight = Math.cos(hourAngle)
  for (let y = 0; y < size; y++) {
    const lat = north - y * dy
    const latitude = lat * rad
    const sunNorth = -Math.sin(latitude) * daylight
    const sunUp = Math.cos(latitude) * daylight
    for (let x = 0; x < size; x++) {
      const lon = west + x * dx
      const left = Math.max(west, lon - dx), right = Math.min(east, lon + dx)
      const bottom = Math.max(south, lat - dy), top = Math.min(north, lat + dy)
      const gradeEast = (sampleRegionalHeight(data, right, lat) - sampleRegionalHeight(data, left, lat)) /
        ((right - left) * rad * data.radius * Math.cos(latitude))
      const gradeNorth = (sampleRegionalHeight(data, lon, top) - sampleRegionalHeight(data, lon, bottom)) /
        ((top - bottom) * rad * data.radius)
      const incidence = (sunUp - gradeEast * morningEvening - gradeNorth * sunNorth) /
        Math.hypot(gradeEast, gradeNorth, 1)
      const tone = sunUp > 0 ? Math.max(0, Math.min(1, incidence)) * (palette.length - 1) : 0
      const index = Math.min(palette.length - 2, Math.floor(tone))
      const mix = tone - index
      const offset = (y * size + x) * 4
      for (let c = 0; c < 3; c++) pixels.data[offset + c] = palette[index][c] * (1 - mix) + palette[index + 1][c] * mix
      pixels.data[offset + 3] = 255
    }
  }
  context.putImageData(pixels, 0, 0)
  return canvas.toDataURL()
}

export function useSolarHeatingLayer(viewer, data, enabled, minute, opacity) {
  const current = useRef(null)
  const [result, setResult] = useState(null)
  const time = Math.floor(minute / 15) * 15

  useEffect(() => {
    if (!viewer || !enabled) return
    return () => {
      const layer = current.current
      current.current = null
      if (layer && !viewer.isDestroyed()) {
        viewer.imageryLayers.remove(layer, true)
        viewer.scene.requestRender()
      }
    }
  }, [viewer, enabled])

  useEffect(() => {
    if (!viewer || !data || !enabled) return
    let cancelled = false
    SingleTileImageryProvider.fromUrl(heatImage(data, time), {
      rectangle: Rectangle.fromDegrees(...data.bounds),
      ellipsoid: viewer.scene.globe.ellipsoid,
      credit: new Credit('Relative solar heating · illustrative equinox model from CTX elevation'),
    }).then(provider => {
      if (cancelled || viewer.isDestroyed()) return
      const previous = current.current
      const layer = addOrderedImagery(viewer, provider, 4)
      if (previous) viewer.imageryLayers.remove(previous, true)
      current.current = layer
      setResult({ viewer, layer, time, status: 'ready' })
      viewer.scene.requestRender()
    }).catch(() => {
      if (!cancelled) setResult({ viewer, time, status: 'error' })
    })
    return () => { cancelled = true }
  }, [viewer, data, enabled, time])

  useEffect(() => {
    if (!viewer || !enabled || result?.viewer !== viewer || result.status !== 'ready') return
    const layer = current.current
    if (layer) layer.alpha = opacity
    viewer.scene.requestRender()
  }, [viewer, enabled, result, opacity])

  return enabled ? (result?.viewer === viewer && result.time === time ? result.status : 'loading') : 'off'
}
