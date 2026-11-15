import { useEffect, useState } from 'react'
import * as Cesium from 'cesium'
import { geologyLayer, hiriseLayer, orbitalDetailLayer, orbitalLayer, useWildcatImagery } from './wildcatImagery'
import { useSlopeLayer } from './useSlopeLayer'
import { useSolarHeatingLayer } from './useSolarHeatingLayer'
import { skyColor } from './environmentModel'
import { useTerrainMaterial } from './useTerrainMaterial'
import { useNearbyImagery } from './useNearbyImagery'

// Layer preferences and their Cesium synchronization, independent of mission state.
export function useTerrainLayers({ viewerRef, state, initialPointId, minute, exploring }) {
  const [contours, setContours] = useState(initialPointId !== 'wildcat-ridge')
  const [elevationColors, setElevationColors] = useState(false)
  const [orbitalVisible, setOrbitalVisible] = useState(true)
  const [geologyVisible, setGeologyVisible] = useState(false)
  const [slopesVisible, setSlopesVisible] = useState(false)
  const [nearDetail, setNearDetail] = useState(initialPointId === 'wildcat-ridge')
  const [geologyOpacity, setGeologyOpacity] = useState(0.7)
  const [slopeThreshold, setSlopeThreshold] = useState(15)
  const imageryViewer = state.status === 'ready' ? state.viewer : null
  const orbital = useWildcatImagery(imageryViewer, state.data?.bounds, orbitalLayer, orbitalVisible)
  const orbitalDetail = useWildcatImagery(imageryViewer, state.data?.bounds, orbitalDetailLayer, orbitalVisible)
  const hirise = useWildcatImagery(imageryViewer, state.data?.bounds, hiriseLayer, orbitalVisible && nearDetail)
  const nearbyStatus = useNearbyImagery(imageryViewer, orbitalVisible && exploring)
  const geology = useWildcatImagery(imageryViewer, state.data?.bounds, geologyLayer, geologyVisible, geologyOpacity)
  const slopeStatus = useSlopeLayer(imageryViewer, state.data, slopesVisible)
  const [heatVisible, setHeatVisible] = useState(false)
  const [heatOpacity, setHeatOpacity] = useState(0.6)
  const heatStatus = useSolarHeatingLayer(imageryViewer, state.data, heatVisible, minute, heatOpacity)
  useEffect(() => {
    if (!imageryViewer) return
    const [r, g, b] = skyColor(minute)
    const viewer = viewerRef.current?.viewer
    if (!viewer || viewer.isDestroyed()) return
    // Cesium owns this mutable scene; React owns only the selected replay time.
    // eslint-disable-next-line react-hooks/immutability
    viewer.scene.backgroundColor = Cesium.Color.fromBytes(r, g, b)
    imageryViewer.scene.requestRender()
  }, [viewerRef, imageryViewer, minute])
  const imageryVisible = [orbital.status, orbitalDetail.status, hirise.status, geology.status, slopeStatus, heatStatus].includes('ready')
  const [spacing, setSpacing] = useState(100)
  useTerrainMaterial({ viewerRef, state, contours, spacing, elevationColors, imageryVisible })

  useEffect(() => {
    if (!imageryViewer) return
    const update = () => {
      const position = imageryViewer.camera.positionCartographic
      const lon = Cesium.Math.toDegrees(position.longitude), lat = Cesium.Math.toDegrees(position.latitude)
      const [west, south, east, north] = hiriseLayer.bounds
      setNearDetail(position.height < 5000 && lon > west - 0.1 && lon < east + 0.1 && lat > south - 0.1 && lat < north + 0.1)
    }
    return imageryViewer.camera.changed.addEventListener(update)
  }, [imageryViewer])

  return {
    slopeThreshold,
    setSlopeThreshold,
    slopeStatus,
    orbital,
    orbitalDetail,
    hirise: exploring ? { ...hirise, status: nearbyStatus } : hirise,
    heatVisible,
    setHeatVisible,
    heatOpacity,
    setHeatOpacity,
    heatStatus,
    orbitalVisible,
    setOrbitalVisible,
    geologyVisible,
    setGeologyVisible,
    geology,
    geologyOpacity,
    setGeologyOpacity,
    elevationColors,
    setElevationColors,
    slopesVisible,
    setSlopesVisible,
    contours,
    setContours,
    spacing,
    setSpacing,
  }
}
