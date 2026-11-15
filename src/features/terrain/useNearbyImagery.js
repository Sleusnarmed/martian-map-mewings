import { useEffect, useState } from 'react'
import { Credit, Math as CesiumMath, Rectangle, SingleTileImageryProvider } from 'cesium'
import { addOrderedImagery, hiriseLayer, wildcatAsset } from './wildcatImagery.js'
import { nearbyImageTiles } from './nearbyImagery.js'

// Finite terrain leaves stop mesh refinement. Separate 320px image patches keep
// near-field texture detail without making extra DEM levels or decoding 2560px.
export function useNearbyImagery(viewer, enabled) {
  const [status, setStatus] = useState('off')
  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || !enabled) return
    const cache = new Map(), failed = new Set()
    let active = new Map(), pending = new Set(), disposed = false, lastUpdate = -Infinity
    const remove = entry => { if (entry.layer && !viewer.isDestroyed()) viewer.imageryLayers.remove(entry.layer, true) }
    const prune = () => {
      for (const [key, entry] of cache) {
        if (cache.size <= 12) break
        if (!active.has(key)) { remove(entry); cache.delete(key) }
      }
    }
    const report = () => setStatus(!active.size ? 'off' : [...active.keys()].some(key => failed.has(key)) ? 'error'
      : [...active.keys()].every(key => cache.has(key)) ? 'ready' : 'loading')
    const pump = () => {
      if (disposed || viewer.isDestroyed()) return
      for (const tile of active.values()) {
        if (pending.size >= 2) break
        if (cache.has(tile.key) || pending.has(tile.key) || failed.has(tile.key)) continue
        pending.add(tile.key)
        SingleTileImageryProvider.fromUrl(wildcatAsset(tile.file), { rectangle: Rectangle.fromDegrees(...tile.bounds),
          ellipsoid: viewer.scene.globe.ellipsoid, credit: new Credit(hiriseLayer.credit) }).then(provider => {
          if (disposed || viewer.isDestroyed() || !active.has(tile.key)) return
          const layer = addOrderedImagery(viewer, provider, 2.5)
          cache.set(tile.key, { layer })
          prune()
          viewer.scene.requestRender()
        }).catch(() => { if (!disposed && active.has(tile.key)) failed.add(tile.key) }).finally(() => {
          pending.delete(tile.key)
          if (!disposed) { report(); pump() }
        })
      }
    }
    const update = () => {
      if (performance.now() - lastUpdate < 300) return
      lastUpdate = performance.now()
      const position = viewer.camera.positionCartographic
      active = new Map(nearbyImageTiles(hiriseLayer.bounds, { longitude: CesiumMath.toDegrees(position.longitude), latitude: CesiumMath.toDegrees(position.latitude) }, viewer.camera.heading).map(tile => [tile.key, tile]))
      for (const [key, entry] of cache) entry.layer.show = active.has(key)
      // At most 12 decoded patches (~4.7 MiB RGBA), 9 visible and 2 requests.
      prune()
      report(); pump()
    }
    const removeRender = viewer.scene.postRender.addEventListener(update)
    update()
    return () => { disposed = true; removeRender(); cache.forEach(remove); if (!viewer.isDestroyed()) viewer.scene.requestRender() }
  }, [viewer, enabled])
  return enabled ? status : 'off'
}
