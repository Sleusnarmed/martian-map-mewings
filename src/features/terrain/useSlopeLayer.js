import { useEffect, useState } from 'react'
import { Credit, Rectangle, SingleTileImageryProvider } from 'cesium'
import { slopeAt } from './terrainAnalysis'
import { addOrderedImagery } from './wildcatImagery'

export function useSlopeLayer(viewer, data, enabled) {
  const [result, setResult] = useState(null)
  useEffect(() => {
    if (!viewer || !data || !enabled) return
    let disposed = false, layer
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 513
    const context = canvas.getContext('2d')
    const pixels = context.createImageData(canvas.width, canvas.height)
    const [west, south, east, north] = data.bounds
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const slope = slopeAt(data, west + x / (canvas.width - 1) * (east - west), north - y / (canvas.height - 1) * (north - south))
        if (slope === null || slope < 5) continue
        const color = slope < 10 ? [246, 218, 97, 90] : slope < 15 ? [247, 154, 61, 130] : [240, 66, 77, 180]
        pixels.data.set(color, (y * canvas.width + x) * 4)
      }
    }
    context.putImageData(pixels, 0, 0)
    SingleTileImageryProvider.fromUrl(canvas.toDataURL(), {
      rectangle: Rectangle.fromDegrees(...data.bounds), ellipsoid: viewer.scene.globe.ellipsoid,
      credit: new Credit('Regional slope derived from NASA / JPL / USGS CTX DEM · display grid ~53 m'),
    }).then(provider => {
      if (disposed || viewer.isDestroyed()) return
      layer = addOrderedImagery(viewer, provider, 5)
      viewer.scene.requestRender()
      setResult({ viewer, status: 'ready' })
    }).catch(() => { if (!disposed) setResult({ viewer, status: 'error' }) })
    return () => {
      disposed = true
      if (layer && !viewer.isDestroyed()) { viewer.imageryLayers.remove(layer, true); viewer.scene.requestRender() }
    }
  }, [viewer, data, enabled])
  return enabled ? result?.viewer === viewer ? result.status : 'loading' : 'off'
}
