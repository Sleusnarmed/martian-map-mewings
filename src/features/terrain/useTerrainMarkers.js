import { useEffect } from 'react'
import * as Cesium from 'cesium'
import { sampleHeight } from './terrainData'
import region from './region.json'

export function useTerrainMarkers({ viewerRef, state, pointsOfInterest }) {
  const ready = state.status === 'ready'
  useEffect(() => {
    const context = viewerRef.current
    if (!context || !ready) return
    const entities = []
    for (const poi of pointsOfInterest) {
      if (!Number.isFinite(poi.longitude) || !Number.isFinite(poi.latitude) || !poi.source) continue
      const height = sampleHeight(context.data, poi.longitude, poi.latitude)
      if (height === null) continue
      entities.push(context.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(poi.longitude, poi.latitude, height + (poi.markerHeight ?? 25), context.ellipsoid),
        properties: { poiId: poi.id },
        point: { pixelSize: 10, color: Cesium.Color.fromCssColorString('#eafe07'), outlineColor: Cesium.Color.BLACK, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
        label: { show: false, text: poi.name, font: '14px Mission Public Sans, sans-serif', backgroundColor: Cesium.Color.fromCssColorString('#07173f'), backgroundPadding: new Cesium.Cartesian2(10, 8), pixelOffset: new Cesium.Cartesian2(0, -48), showBackground: true, disableDepthTestDistance: Number.POSITIVE_INFINITY },
      }))
    }
    const centerHeight = sampleHeight(context.data, region.center.longitude, region.center.latitude)
    entities.push(context.viewer.entities.add({
      properties: { poiId: 'jezero' },
      position: Cesium.Cartesian3.fromDegrees(region.center.longitude, region.center.latitude, centerHeight + 40, context.ellipsoid),
      point: { pixelSize: 9, color: Cesium.Color.WHITE, outlineColor: Cesium.Color.fromCssColorString('#35291e'), outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
      label: { show: false, text: 'Jezero crater · published center', font: '14px Mission Public Sans, sans-serif', fillColor: Cesium.Color.WHITE, showBackground: true, backgroundColor: Cesium.Color.fromCssColorString('#07173f'), pixelOffset: new Cesium.Cartesian2(0, -48), disableDepthTestDistance: Number.POSITIVE_INFINITY },
    }))
    context.viewer.scene.requestRender()
    return () => {
      if (context.viewer.isDestroyed()) return
      entities.forEach(entity => context.viewer.entities.remove(entity))
      context.viewer.scene.requestRender()
    }
  }, [viewerRef, ready, pointsOfInterest])

}
