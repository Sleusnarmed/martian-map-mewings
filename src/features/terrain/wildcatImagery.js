import { useEffect, useRef, useState } from 'react'
import { Credit, Rectangle, SingleTileImageryProvider } from 'cesium'

export const wildcatAsset = file => import.meta.env.BASE_URL + 'data/wildcat-ridge/' + file

const layerOrder = new WeakMap()

export function addOrderedImagery(viewer, provider, order) {
  const layers = viewer.imageryLayers
  let index = 0
  while (index < layers.length && (layerOrder.get(layers.get(index)) ?? Infinity) <= order) index++
  const layer = layers.addImageryProvider(provider, index)
  layerOrder.set(layer, order)
  return layer
}

export const orbitalLayer = {
  file: 'ctx-jezero-detailed.jpg',
  credit: 'MRO CTX · NASA / JPL / USGS · illustrative colorization',
  source: 'https://astrogeology.usgs.gov/search/map/mars_2020_science_investigation_ctx_dem_mosaic',
  order: 0,
}

export const orbitalDetailLayer = {
  ...orbitalLayer,
  file: 'ctx-wildcat-blend.png',
  bounds: [77.32994976205632, 18.3799849721609, 77.49000472686771, 18.54007508233682],
  order: 1,
}

export const hiriseLayer = {
  file: 'hirise-wildcat-blend.png',
  bounds: [77.39407908659932, 18.44682764659932, 77.41769793340069, 18.470446493400683],
  credit: 'MRO HiRISE · NASA / JPL / USGS · illustrative colorization',
  source: 'https://doi.org/10.5066/P9QJDP48',
  order: 2,
}

export const geologyLayer = {
  order: 3,
  file: 'jezero-geology.png',
  credit: 'USGS SIM 3464 · Sun & Stack (2020)',
  source: 'https://www.usgs.gov/maps/geologic-map-jezero-crater-and-nili-planum-region-mars',
}

export const geologyLegend = [
  ['#ffff00', 'Eolian bedform'],
  ['#669900', 'Crater ejecta'],
  ['#ebeb66', 'Crater interior'],
  ['#b3804d', 'Crater rim'],
  ['#0000eb', 'Nili Planum fan'],
  ['#0099ff', 'Jezero fan 1'],
  ['#004deb', 'Jezero fan 2'],
  ['#eb4d80', 'Jezero floor'],
  ['#de4d00', 'Lower etched'],
  ['#ebcc99', 'Nili Planum 1'],
  ['#b300eb', 'Nili Planum 2'],
  ['#ebb3ff', 'Rugged bright'],
  ['#ffb300', 'Upper etched'],
  ['#ccde99', 'Smooth, undivided'],
]

// Keep each requested layer in its viewer so visibility and opacity changes need no new load.
export function useWildcatImagery(viewer, bounds, definition, enabled, opacity = 1) {
  const layerRef = useRef(null)
  const [requested, setRequested] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState(null)
  const shouldLoad = requested || enabled || (result?.viewer === viewer && result?.status === 'ready')

  useEffect(() => {
    if (!viewer || !shouldLoad) return
    let disposed = false
    let layer
    SingleTileImageryProvider.fromUrl(wildcatAsset(definition.file), {
      rectangle: Rectangle.fromDegrees(...(definition.bounds ?? bounds)),
      ellipsoid: viewer.scene.globe.ellipsoid,
      credit: new Credit(definition.credit),
    }).then(provider => {
      if (disposed || viewer.isDestroyed()) return
      layer = addOrderedImagery(viewer, provider, definition.order)
      layer.show = false
      layerRef.current = { viewer, layer }
      setResult({ viewer, attempt, status: 'ready' })
    }).catch(() => {
      if (!disposed) setResult({ viewer, attempt, status: 'error' })
    })
    return () => {
      disposed = true
      if (layerRef.current?.layer === layer) layerRef.current = null
      if (layer && !viewer.isDestroyed()) {
        viewer.imageryLayers.remove(layer, true)
        viewer.scene.requestRender()
      }
    }
  }, [viewer, bounds, definition, shouldLoad, attempt])

  const current = result?.viewer === viewer && result.attempt === attempt ? result.status : null
  useEffect(() => {
    const entry = layerRef.current
    if (current !== 'ready' || !entry || entry.viewer !== viewer || viewer.isDestroyed()) return
    entry.layer.show = enabled
    entry.layer.alpha = opacity
    viewer.scene.requestRender()
  }, [viewer, current, enabled, opacity])

  return {
    request: () => {
      setRequested(true)
      if (current === 'error') setAttempt(previous => previous + 1)
    },
    status: enabled ? current ?? 'loading' : 'off',
  }
}
