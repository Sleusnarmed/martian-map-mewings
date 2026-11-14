import { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import { animate } from "animejs";
import { MARS_ZONES } from "../data/marsZones";

export default function MarsGlobe3D({ onZoneSelected }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const overlayRef = useRef(null);

  const [hasEntered, setHasEntered] = useState(false);
  const [hoveredZone, setHoveredZone] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const marsEllipsoid = Cesium.Ellipsoid.MARS;

    const viewer = new Cesium.Viewer(containerRef.current, {
      globe: new Cesium.Globe(marsEllipsoid),
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

    // Mapa base oficial de Marte (NASA Mars Trek Viking Mosaic)
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

    viewer.scene.skyAtmosphere.show = false;
    viewer.scene.backgroundColor = Cesium.Color.BLACK;

    // Puntos interactivos de Jezero y Wildcat Ridge
    MARS_ZONES.forEach((zone) => {
      viewer.entities.add({
        id: zone.id,
        name: zone.name,
        position: Cesium.Cartesian3.fromDegrees(
          zone.lon,
          zone.lat,
          500,
          marsEllipsoid,
        ),
        point: {
          pixelSize: 14,
          color: Cesium.Color.fromCssColorString(zone.color),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: zone.name,
          font: "600 14px sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        properties: { zoneData: zone },
      });
    });

    // Rotación suave en la pantalla de inicio
    const spinListener = viewer.clock.onTick.addEventListener(() => {
      viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.0015);
    });

    // Eventos táctiles y de mouse
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.endPosition);
      if (Cesium.defined(picked) && picked.id?.properties?.zoneData) {
        viewer.canvas.style.cursor = "pointer";
        setHoveredZone(picked.id.properties.zoneData.getValue());
      } else {
        viewer.canvas.style.cursor = "grab";
        setHoveredZone(null);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction((click) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id?.properties?.zoneData) {
        const zone = picked.id.properties.zoneData.getValue();
        triggerZoneTransition(viewer, zone);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = { viewer, spinListener };

    return () => {
      handler.destroy();
      if (!viewer.isDestroyed()) viewer.destroy();
    };
  }, []);

  const handleEnterPlanet = () => {
    setHasEntered(true);
    const { viewer, spinListener } = viewerRef.current || {};
    if (spinListener) spinListener();

    setTimeout(() => {
      animate(".hud-panel", {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 700,
        ease: "outExpo",
      });
    }, 50);

    viewer?.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        77.5,
        18.4,
        8500000,
        Cesium.Ellipsoid.MARS,
      ),
      duration: 1.8,
    });
  };

  const triggerZoneTransition = (viewer, zone) => {
    setHasEntered(true);

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        zone.lon,
        zone.lat,
        zone.altitude,
        Cesium.Ellipsoid.MARS,
      ),
      duration: 2.2,
      complete: () => {
        if (overlayRef.current) {
          animate(overlayRef.current, {
            opacity: [1, 0],
            scale: [1, 1.05],
            duration: 500,
            ease: "inQuad",
            onComplete: () => {
              if (onZoneSelected) onZoneSelected(zone);
            },
          });
        } else if (onZoneSelected) {
          onZoneSelected(zone);
        }
      },
    });
  };

  return (
    <div
      ref={overlayRef}
      className="relative w-full h-screen bg-black overflow-hidden select-none"
    >
      <div ref={containerRef} className="w-full h-full touch-none" />

      {!hasEntered && (
        <div className="absolute inset-0 flex flex-col items-center justify-between py-12 px-6 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none">
          <div className="text-center">
            <span className="px-3 py-1 text-xs font-semibold tracking-widest uppercase text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded-full">
              NASA Space Apps 2026 · VISTA Mars
            </span>
            <h1 className="mt-3 text-4xl md:text-6xl font-bold text-white tracking-tight">
              PLANETA MARTE
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-300 max-w-md mx-auto">
              Selecciona el planeta e inicia la exploración táctica de
              superficie.
            </p>
          </div>

          <button
            onClick={handleEnterPlanet}
            className="pointer-events-auto px-8 py-3.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-semibold rounded-full shadow-lg shadow-orange-600/30 transition cursor-pointer"
          >
            Entrar
          </button>
        </div>
      )}

      {hasEntered && (
        <div className="hud-panel absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/70 rounded-2xl p-4 text-white shadow-2xl">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">
            Gira el planeta con el dedo o cursor y selecciona una zona:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MARS_ZONES.map((zone) => (
              <button
                key={zone.id}
                onClick={() =>
                  triggerZoneTransition(viewerRef.current.viewer, zone)
                }
                className="flex flex-col text-left p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-600/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: zone.color }}
                  />
                  <span className="font-semibold text-sm">{zone.name}</span>
                </div>
                <span className="text-xs text-slate-400 mt-1">
                  {zone.subtitle}
                </span>
              </button>
            ))}
          </div>

          {hoveredZone && (
            <div className="mt-3 pt-2 border-t border-slate-700/60 text-xs text-orange-300">
              {hoveredZone.name}: {hoveredZone.summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
