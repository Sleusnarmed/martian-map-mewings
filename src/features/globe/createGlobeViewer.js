import * as Cesium from "cesium";
import {
  MARS_OVERVIEW_HEIGHT,
  MARS_PREVIEW_HEIGHT,
} from "../../components/globeMotion.js";

export function createGlobeViewer(container, compact) {
  const marsEllipsoid = Cesium.Ellipsoid.MARS;
  window.CESIUM_BASE_URL = `${import.meta.env.BASE_URL}cesium/`;

  const viewer = new Cesium.Viewer(container, {
    ellipsoid: marsEllipsoid,
    contextOptions: { webgl: { alpha: true } },
    skyBox: false,
    baseLayer: false,
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity,
    targetFrameRate: 30,
    useBrowserRecommendedResolution: false,
    globe: new Cesium.Globe(marsEllipsoid),
    skyAtmosphere: false,
    baseLayerPicker: false,
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    infoBox: false,
    selectionIndicator: false,
  });

  viewer.resolutionScale = Math.min(1, 2 / (window.devicePixelRatio || 1));
  const controls = viewer.scene.screenSpaceCameraController;
  controls.inertiaSpin = 0;
  controls.inertiaTranslate = 0;
  controls.inertiaZoom = 0;
  viewer.imageryLayers.removeAll();
  viewer.imageryLayers.addImageryProvider(
    new Cesium.WebMapTileServiceImageryProvider({
      url: "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg",
      layer: "Mars_Viking_MDIM21_ClrMosaic_global_232m",
      style: "default",
      format: "image/jpeg",
      tileMatrixSetID: "default028mm",
      maximumLevel: 7,
      ellipsoid: marsEllipsoid,
    }),
  );

  if (viewer.scene.skyAtmosphere) {
    viewer.scene.skyAtmosphere.show = false;
  }
  viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
  viewer.scene.globe.depthTestAgainstTerrain = false;

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      62.0,
      14.5,
      compact ? MARS_PREVIEW_HEIGHT : MARS_OVERVIEW_HEIGHT,
      marsEllipsoid,
    ),
  });

  return viewer;
}
