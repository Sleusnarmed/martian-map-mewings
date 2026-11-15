import { useEffect, useState } from 'react'
import { Math as CesiumMath } from 'cesium'
import { addOrderedImagery, hiriseLayer, wildcatAsset } from './wildcatImagery.js'
import { nearbyImageTiles } from './nearbyImagery.js'
import { createNearbyTileCache } from './nearbyTileCache.js'
import { createPatchProvider } from './createPatchProvider.js'

export function useNearbyImagery(viewer, enabled) {
  const [status, setStatus] = useState('off')
  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !enabled) return
    let lastUpdate = -Infinity, trailing
    const cache = createNearbyTileCache({
      onChange: value => setStatus(value.status),
      load: async (tile, signal) => {
        const response = await fetch(wildcatAsset(tile.file), { signal })
        if (!response.ok) throw new Error('HiRISE patch unavailable')
        const image = await createImageBitmap(await response.blob(), { imageOrientation: 'flipY', premultiplyAlpha: 'none' })
        if (signal.aborted || viewer.isDestroyed()) { image.close(); throw new DOMException('Obsolete image', 'AbortError') }
        try {
          const provider = createPatchProvider(image, tile.bounds, viewer.scene.globe.ellipsoid, hiriseLayer.credit)
          const layer = addOrderedImagery(viewer, provider, 2.5)
          viewer.scene.requestRender()
          return { layer, image }
        } catch (error) { image.close(); throw error }
      },
      release: ({ layer, image }) => {
        if (!viewer.isDestroyed()) { viewer.imageryLayers.remove(layer, true); viewer.scene.requestRender() }
        image.close()
      },
    })
    const update = () => {
      if (viewer.isDestroyed()) return
      if (performance.now() - lastUpdate < 300) {
        if (!trailing) trailing = setTimeout(() => { trailing = null; lastUpdate = -Infinity; update() }, 310)
        return
      }
      lastUpdate = performance.now()
      const position = viewer.camera.positionCartographic
      cache.update(nearbyImageTiles(hiriseLayer.bounds, { longitude: CesiumMath.toDegrees(position.longitude), latitude: CesiumMath.toDegrees(position.latitude) }, viewer.camera.heading))
    }
    const removeRender = viewer.scene.postRender.addEventListener(update)
    const removeEnd = viewer.camera.moveEnd.addEventListener(() => { lastUpdate = -Infinity; update() })
    update()
    return () => { clearTimeout(trailing); removeRender(); removeEnd(); cache.dispose() }
  }, [viewer, enabled])
  return enabled ? status : 'off'
}
