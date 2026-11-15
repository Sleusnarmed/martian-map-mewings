import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { sampleHeight } from './terrainData'
import region from './region.json'
import { visibleTerrainPoints } from './visibleTerrainPoints.js'

export function useTerrainMarkers({ viewerRef, state, pointsOfInterest, mode }) {
  const markersRef = useRef([])
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
        position: Cesium.Cartesian3.fromDegrees(poi.longitude, poi.latitude, height + (poi.displayModes ? 2 : 25), context.ellipsoid),
        properties: { poiId: poi.id },
        point: { pixelSize: 10, color: Cesium.Color.fromCssColorString('#eafe07'), outlineColor: Cesium.Color.BLACK, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
        label: { text: poi.name, font: '14px Overpass, sans-serif', backgroundColor: Cesium.Color.fromCssColorString('#07173f'), backgroundPadding: new Cesium.Cartesian2(10, 8), pixelOffset: new Cesium.Cartesian2(0, -24), showBackground: true, disableDepthTestDistance: Number.POSITIVE_INFINITY },
      }))
    }
    const centerHeight = sampleHeight(context.data, region.center.longitude, region.center.latitude)
    entities.push(context.viewer.entities.add({
      properties: { poiId: 'jezero' },
      position: Cesium.Cartesian3.fromDegrees(region.center.longitude, region.center.latitude, centerHeight + 40, context.ellipsoid),
      point: { pixelSize: 9, color: Cesium.Color.WHITE, outlineColor: Cesium.Color.fromCssColorString('#35291e'), outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
      label: { text: 'JEZERO CRATER\nPublished center', font: '16px Overpass, sans-serif', fillColor: Cesium.Color.WHITE, showBackground: true, backgroundColor: Cesium.Color.fromCssColorString('#35291e').withAlpha(.85), pixelOffset: new Cesium.Cartesian2(0, -35), disableDepthTestDistance: Number.POSITIVE_INFINITY },
    }))
    markersRef.current = entities
    context.viewer.scene.requestRender()
    return () => {
      markersRef.current = []
      if (context.viewer.isDestroyed()) return
      entities.forEach(entity => context.viewer.entities.remove(entity))
      context.viewer.scene.requestRender()
    }
  }, [viewerRef, ready, pointsOfInterest])

  // Preserve Cesium entity identity and glyphs when changing perspective.
  useEffect(() => {
    const context = viewerRef.current
    if (!context || !ready) return
    const visible = new Set(visibleTerrainPoints(pointsOfInterest, mode).map(point => point.id))
    for (const entity of markersRef.current) {
      const id = entity.properties.poiId.getValue()
      // Cesium entities are mutable engine objects, not React state.
      // eslint-disable-next-line react-hooks/immutability
      entity.show = id === 'jezero' || visible.has(id)
    }
    context.viewer.scene.requestRender()
  }, [viewerRef, ready, pointsOfInterest, mode])

}
