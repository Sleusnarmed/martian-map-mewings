import { useEffect } from 'react'
import { Cartesian2, Cartesian3, Color, LabelStyle, PolylineOutlineMaterialProperty, ArcType } from 'cesium'
import { sampleHeight } from './terrainData'

const routeColor = Color.fromCssColorString('#4de9ff')

export function useWildcatPath(viewer, data, route, visible) {
  useEffect(() => {
    if (!viewer || !data || !route || !visible) return
    const ellipsoid = viewer.scene.globe.ellipsoid
    const position = (lon, lat, lift) => Cartesian3.fromDegrees(lon, lat, sampleHeight(data, lon, lat) + lift, ellipsoid)
    const material = new PolylineOutlineMaterialProperty({ color: routeColor, outlineColor: Color.fromCssColorString('#0a2a34'), outlineWidth: 1 })
    const entities = []
    for (const segment of route.segments) {
      const positions = []
      const samples = Math.ceil(segment.distance / 3)
      for (let i = 0; i <= samples; i++) {
        const fraction = i / samples
        const lon = segment.start.longitude + fraction * (segment.end.longitude - segment.start.longitude)
        const lat = segment.start.latitude + fraction * (segment.end.latitude - segment.start.latitude)
        positions.push(position(lon, lat, 1.5))
      }
      entities.push(viewer.entities.add({
        polyline: { positions, arcType: ArcType.NONE, width: 6, material },
      }))
    }
    for (const point of route.waypoints.slice(0, -1)) {
      entities.push(viewer.entities.add({
        position: position(point.longitude, point.latitude, 2.5),
        point: { pixelSize: 9, color: routeColor, outlineColor: Color.BLACK, outlineWidth: 2 },
        label: {
          text: point.name, font: '13px sans-serif', style: LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 3, outlineColor: Color.BLACK, fillColor: Color.WHITE,
          pixelOffset: new Cartesian2(0, -15),
        },
      }))
    }
    viewer.scene.requestRender()
    return () => {
      if (viewer.isDestroyed()) return
      for (const entity of entities) viewer.entities.remove(entity)
      viewer.scene.requestRender()
    }
  }, [viewer, data, route, visible])
}
