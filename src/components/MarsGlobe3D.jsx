import { useCallback, useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { routeForZone } from "../navigation";
import { animate } from "animejs";
import { MARS_REGIONS } from "../data/marsZones";
import spaceAppsLogo from "../NASA Space Apps Logos - 2026/Space Apps White small logo.png";
import { createGlobeMotion, MARS_OVERVIEW_HEIGHT, MARS_PREVIEW_HEIGHT } from './globeMotion.js';

// Generador de etiquetas en Canvas HD para nitidez total en pantallas Retina / Tablet
function createCrispBadge(
  text,
  accentColor = "#2E96F5",
  textColor = "#FFFFFF",
  isDisabled = false,
) {
  const scale = 2;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const fontSize = (isDisabled ? 11.5 : 13) * scale;
  ctx.font = `700 ${fontSize}px "Fira Sans", sans-serif`;
  const textMetrics = ctx.measureText(text);

  const padX = (isDisabled ? 10 : 12) * scale;
  const padY = (isDisabled ? 5 : 6) * scale;
  const dotRadius = (isDisabled ? 3.5 : 4) * scale;
  const dotGap = 6 * scale;

  const width = Math.ceil(
    textMetrics.width + padX * 2 + dotRadius * 2 + dotGap,
  );
  const height = Math.ceil(fontSize + padY * 2);

  canvas.width = width;
  canvas.height = height;

  const radius = 6 * scale;
  ctx.fillStyle = isDisabled
    ? "rgba(15, 23, 42, 0.85)"
    : "rgba(7, 23, 63, 0.95)";
  ctx.beginPath();
  ctx.roundRect(1, 1, width - 2, height - 2, radius);
  ctx.fill();

  ctx.strokeStyle = isDisabled ? "rgba(148, 163, 184, 0.45)" : accentColor;
  ctx.lineWidth = (isDisabled ? 1 : 1.6) * scale;
  ctx.stroke();

  ctx.fillStyle = isDisabled ? "#94A3B8" : accentColor;
  ctx.beginPath();
  ctx.arc(padX + dotRadius, height / 2, dotRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `700 ${fontSize}px "Fira Sans", sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textBaseline = "middle";
  ctx.fillText(text, padX + dotRadius * 2 + dotGap, height / 2 + 1);

  return {
    image: canvas,
    width: width / scale,
    height: height / scale,
  };
}

export default function MarsGlobe3D({ onZoneSelected, compact = false }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const overlayRef = useRef(null);
  const transitionRef = useRef(null);

  const [navLevel, setNavLevel] = useState("regions");
  const [activeRegion, setActiveRegion] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Estado desplegable de la barra lateral izquierda
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [inspectedItem, setInspectedItem] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  const compactRef = useRef(compact);
  const navStateRef = useRef({ navLevel: "regions", activeRegionId: null });

  useEffect(() => {
    navStateRef.current = {
      navLevel,
      activeRegionId: activeRegion?.id || null,
    };
    viewerRef.current?.viewer.scene.requestRender();
  }, [navLevel, activeRegion]);

  useEffect(() => {
    compactRef.current = compact;
    const frame = requestAnimationFrame(() => {
      const viewer = viewerRef.current?.viewer;
      if (viewer && !viewer.isDestroyed()) {
        viewer.resize();
        setNavLevel('regions'); setActiveRegion(null); setInspectedItem(null); setIsSidebarOpen(true);
        viewerRef.current.motion.restart(!compact, false);
        viewer.scene.requestRender();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [compact]);

  const enterRegion = useCallback((viewer, region) => {
    if (!region.available) return;
    setInspectedItem(null);
    if (viewerRef.current?.stopSpin) viewerRef.current.stopSpin();

    setActiveRegion(region);
    setNavLevel("zones");
    setIsSidebarOpen(true);

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        77.5,
        18.4,
        region.zoomAltitude,
        Cesium.Ellipsoid.MARS,
      ),
      duration: 2.0,
    });
  }, []);

  const enterZone = useCallback((viewer, zone) => {
    if (!viewer || viewer.isDestroyed() || !routeForZone(zone)) return;
    setIsTransitioning(true);
    setInspectedItem(null);
    if (viewerRef.current?.stopSpin) viewerRef.current.stopSpin();

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        zone.lon,
        zone.lat,
        zone.altitude,
        Cesium.Ellipsoid.MARS,
      ),
      duration: 1.9,
      cancel: () => setIsTransitioning(false),
      complete: () => {
        if (viewer.isDestroyed()) return;
        if (overlayRef.current) {
          transitionRef.current = animate(overlayRef.current, {
            opacity: [1, 0],
            scale: [1, 1.04],
            duration: 450,
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
  }, [onZoneSelected]);

  useEffect(() => {
    if (!containerRef.current) return;

    const marsEllipsoid = Cesium.Ellipsoid.MARS;
    window.CESIUM_BASE_URL = `${import.meta.env.BASE_URL}cesium/`;

    const viewer = new Cesium.Viewer(containerRef.current, {
      ellipsoid: marsEllipsoid,
      contextOptions: { webgl: { alpha: true } },
      skyBox: false,
      baseLayer: false,
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
      targetFrameRate: 30,
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

    viewer.resolutionScale = Math.min(1, 1.5 / (window.devicePixelRatio || 1));
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
        compactRef.current ? MARS_PREVIEW_HEIGHT : MARS_OVERVIEW_HEIGHT,
        marsEllipsoid,
      ),
    });

    MARS_REGIONS.forEach((region) => {
      const isAvailable = region.available;
      const badgeLabel = isAvailable
        ? `${region.code} · ${region.name.toUpperCase()}`
        : region.name.toUpperCase();

      const regionBadge = createCrispBadge(
        badgeLabel,
        isAvailable ? "#2E96F5" : "#64748B",
        isAvailable ? "#FFFFFF" : "#CBD5E1",
        !isAvailable,
      );

      viewer.entities.add({
        id: `region-${region.id}`,
        name: region.name,
        position: Cesium.Cartesian3.fromDegrees(
          region.lon,
          region.lat,
          0,
          marsEllipsoid,
        ),
        point: {
          pixelSize: isAvailable ? 18 : 11,
          color: Cesium.Color.fromCssColorString(
            isAvailable ? "#2E96F5" : "#64748B",
          ),
          outlineColor: isAvailable
            ? Cesium.Color.WHITE
            : Cesium.Color.fromCssColorString("#94A3B8").withAlpha(0.7),
          outlineWidth: isAvailable ? 2.5 : 1.5,
        },
        billboard: {
          image: regionBadge.image,
          width: regionBadge.width,
          height: regionBadge.height,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, isAvailable ? -16 : -11),
        },
        properties: { itemType: "region", itemData: region },
      });

      region.zones.forEach((zone, idx) => {
        const isHighlight = zone.color === "#EAFE07";
        const zoneBadge = createCrispBadge(
          zone.name,
          zone.color,
          isHighlight ? "#EAFE07" : "#FFFFFF",
          false,
        );

        viewer.entities.add({
          id: `zone-${zone.id}`,
          name: zone.name,
          show: false,
          position: Cesium.Cartesian3.fromDegrees(
            zone.lon,
            zone.lat,
            0,
            marsEllipsoid,
          ),
          point: {
            pixelSize: 17,
            color: Cesium.Color.fromCssColorString(zone.color),
            outlineColor: Cesium.Color.fromCssColorString("#07173F"),
            outlineWidth: 2.5,
          },
          billboard: {
            image: zoneBadge.image,
            width: zoneBadge.width,
            height: zoneBadge.height,
            verticalOrigin:
              idx === 0
                ? Cesium.VerticalOrigin.TOP
                : Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, idx === 0 ? 16 : -16),
          },
          properties: {
            itemType: "zone",
            itemData: zone,
            parentRegion: region,
          },
        });
      });
    });

    // Ocultador por horizonte de Marte
    const occluder = new Cesium.EllipsoidalOccluder(
      marsEllipsoid,
      viewer.camera.position,
    );

    const motion = createGlobeMotion({
      now: () => performance.now(),
      reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      visible: () => !document.hidden,
      onChange: state => { if (containerRef.current) containerRef.current.dataset.motion = state; },
      rotate: angle => { viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, angle); viewer.scene.requestRender(); },
      zoom: () => { viewer.camera.cancelFlight(); viewer.camera.zoomIn(viewer.camera.positionCartographic.height * 0.15); viewer.scene.requestRender(); },
      resetCamera: (expanded, animated, complete) => {
        viewer.camera.cancelFlight();
        const destination = Cesium.Cartesian3.fromDegrees(62, 14.5, expanded ? MARS_OVERVIEW_HEIGHT : MARS_PREVIEW_HEIGHT, marsEllipsoid);
        if (animated) viewer.camera.flyTo({ destination, duration: 1.2, complete });
        else { viewer.camera.setView({ destination }); complete(); }
        viewer.scene.requestRender();
      },
    });
    const spinListener = viewer.clock.onTick.addEventListener(() => motion.tick());
    const tickListener = viewer.scene.preRender.addEventListener((_scene, time) => {
      if (containerRef.current) {
        containerRef.current.dataset.cameraHeight = String(Math.round(viewer.camera.positionCartographic.height));
        containerRef.current.dataset.cameraLongitude = String(viewer.camera.positionCartographic.longitude);
      }

      if (compactRef.current) {
        viewer.entities.values.forEach(entity => { entity.show = false; });
        return;
      }
      occluder.cameraPosition = viewer.camera.positionWC;
      const { navLevel: currentLevel, activeRegionId } = navStateRef.current;

      MARS_REGIONS.forEach((reg) => {
        const regEntity = viewer.entities.getById(`region-${reg.id}`);
        if (regEntity) {
          if (currentLevel === "zones") {
            regEntity.show = false;
          } else {
            const pos = regEntity.position.getValue(time);
            regEntity.show = pos ? occluder.isPointVisible(pos) : false;
          }
        }

        reg.zones.forEach((z) => {
          const zoneEntity = viewer.entities.getById(`zone-${z.id}`);
          if (zoneEntity) {
            if (currentLevel === "zones" && reg.id === activeRegionId) {
              const pos = zoneEntity.position.getValue(time);
              zoneEntity.show = pos ? occluder.isPointVisible(pos) : false;
            } else {
              zoneEntity.show = false;
            }
          }
        });
      });
    });

    const stopSpin = () => motion.pause();

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    let pointerDown = false;

    handler.setInputAction(
      () => { pointerDown = true; viewer.camera.cancelFlight(); motion.freeze(); },
      Cesium.ScreenSpaceEventType.LEFT_DOWN,
    );
    handler.setInputAction(() => { pointerDown = false; }, Cesium.ScreenSpaceEventType.LEFT_UP);
    handler.setInputAction(() => stopSpin(), Cesium.ScreenSpaceEventType.WHEEL);
    handler.setInputAction(
      () => stopSpin(),
      Cesium.ScreenSpaceEventType.PINCH_START,
    );

    handler.setInputAction((movement) => {
      if (pointerDown) stopSpin();
      const picked = viewer.scene.pick(movement.endPosition);
      if (Cesium.defined(picked) && picked.id?.properties?.itemData) {
        const data = picked.id.properties.itemData.getValue();
        const type = picked.id.properties.itemType.getValue();
        const canEnter = type === "zone" || data.available;

        viewer.canvas.style.cursor = canEnter ? "pointer" : "not-allowed";
        setInspectedItem({ ...data, type, isPinned: false });
        setTooltipPos({
          x: movement.endPosition.x,
          y: movement.endPosition.y,
        });
      } else {
        viewer.canvas.style.cursor = "grab";
        setInspectedItem((prev) => (prev?.isPinned ? prev : null));
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // Clic o toque directo sobre el globo 3D
    handler.setInputAction((click) => {
      const picked = viewer.scene.pick(click.position);
      if (Cesium.defined(picked) && picked.id?.properties?.itemData) {
        const data = picked.id.properties.itemData.getValue();
        const type = picked.id.properties.itemType.getValue();

        if (type === "region") {
          if (data.available) {
            // Al tocar el marcador de Syrtis Major en el globo, entra a ver sus sub-zonas
            enterRegion(viewer, data);
          } else {
            stopSpin();
            setInspectedItem({ ...data, type, isPinned: true });
            setTooltipPos({
              x: click.position.x,
              y: click.position.y,
            });
          }
        } else if (type === "zone") {
          enterZone(viewer, data);
        }
      } else {
        motion.pause(true);
        setInspectedItem(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = { viewer, stopSpin, motion };
    motion.restart(!compactRef.current, false);

    return () => {
      transitionRef.current?.cancel();
      transitionRef.current = null;
      viewerRef.current = null;
      viewer.camera.cancelFlight();
      motion.dispose();
      spinListener();
      tickListener();
      handler.destroy();
      if (!viewer.isDestroyed()) viewer.destroy();
    };
  }, [enterRegion, enterZone]);

  // Solo gira el planeta y centra la cámara en la región elegida desde el panel lateral (sin entrar automáticamente)
  const focusRegionOnGlobe = (region) => {
    const viewer = viewerRef.current?.viewer;
    if (!viewer) return;

    if (viewerRef.current?.stopSpin) viewerRef.current.stopSpin();
    setInspectedItem(null);

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        region.lon,
        region.lat,
        region.available ? 4800000 : 5500000,
        Cesium.Ellipsoid.MARS,
      ),
      duration: 1.5,
    });
  };

  // Entra dentro de Syrtis Major para desplegar Jezero y Wildcat Ridge
  const handleBackToRegions = () => {
    const viewer = viewerRef.current?.viewer;
    if (!viewer) return;

    setActiveRegion(null);
    setInspectedItem(null);
    setNavLevel("regions");
    setIsSidebarOpen(true);

    viewerRef.current.motion.restart(true);
  };

  return (
    <div
      ref={overlayRef}
      className="mars-globe-view relative w-full h-full overflow-hidden select-none text-white"
    >
      {/* Globo 3D de Marte */}
      <div ref={containerRef} className="w-full h-full touch-none" aria-label="Vista interactiva de Marte" />

      {/* BARRA SUPERIOR */}
      {!compact && !isTransitioning && (
        <header className="pointer-events-none absolute top-0 left-0 right-0 z-30 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <img
              src={spaceAppsLogo}
              alt="NASA Space Apps Challenge"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <div className="h-6 w-[1px] bg-[#2E96F5]/40" />
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-[#EAFE07] block">
                VISTA MARS · PLANETA MARTE
              </span>
              <span className="text-xs text-white/85">
                {navLevel === "zones" && activeRegion
                  ? `Región: ${activeRegion.name}`
                  : "Selección de Región Orbital"}
              </span>
            </div>
          </div>

          {navLevel === "zones" && (
            <button
              onClick={handleBackToRegions}
              className="pointer-events-auto min-h-[42px] px-4 py-2 text-xs font-bold uppercase tracking-wider bg-[#07173F]/95 hover:bg-[#0042A6] active:scale-95 text-[#EAFE07] border border-[#2E96F5] rounded-xl transition cursor-pointer"
            >
              ← Volver a Regiones
            </button>
          )}
        </header>
      )}

      {/* TARJETA FLOTANTE (ACTIVA O BLOQUEADA) */}
      {inspectedItem && !compact && !isTransitioning && tooltipPos && (
        <div
          style={{
            left: `${Math.min(Math.max(tooltipPos.x + 16, 16), window.innerWidth - 304)}px`,
            top: `${Math.min(Math.max(tooltipPos.y - 20, 72), window.innerHeight - 240)}px`,
          }}
          className={`pointer-events-none absolute z-50 w-72 backdrop-blur-md border-2 rounded-xl p-4 text-white shadow-2xl ${
            inspectedItem.type === "region" && !inspectedItem.available
              ? "bg-slate-950/95 border-slate-500/70"
              : "bg-[#07173F]/95 border-[#2E96F5]"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                inspectedItem.type === "region" && !inspectedItem.available
                  ? "bg-slate-800 text-slate-300"
                  : "bg-[#0042A6] text-[#EAFE07]"
              }`}
            >
              {inspectedItem.type === "region"
                ? inspectedItem.code
                : "ZONA DE INTERÉS"}
            </span>
            <span className="text-[11px] font-mono text-white/75">
              {inspectedItem.lat.toFixed(2)}°N, {inspectedItem.lon.toFixed(2)}°E
            </span>
          </div>

          <h3 className="font-nasa-title font-black text-base tracking-wide mt-2 text-white">
            {inspectedItem.name}
          </h3>

          <p
            className={`text-xs font-bold mt-0.5 ${
              inspectedItem.type === "region" && !inspectedItem.available
                ? "text-slate-400"
                : "text-[#2E96F5]"
            }`}
          >
            {inspectedItem.subtitle}
          </p>

          <p className="text-xs text-white/85 mt-2 leading-relaxed">
            {inspectedItem.summary}
          </p>

          <div
            className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-bold ${
              inspectedItem.type === "region" && !inspectedItem.available
                ? "border-slate-700 text-slate-400"
                : "border-[#2E96F5]/30 text-[#EAFE07]"
            }`}
          >
            <span>
              {inspectedItem.type === "region" && !inspectedItem.available
                ? "Sin datos hiperlocales disponibles aún"
                : inspectedItem.type === "region"
                  ? "Toca este punto para desplegar sub-zonas"
                  : "Toca este punto para abrir mapa táctico"}
            </span>
            <span>
              {inspectedItem.type === "region" && !inspectedItem.available
                ? "🔒"
                : "→"}
            </span>
          </div>
        </div>
      )}

      {/* BOTÓN FLOTANTE PARA VOLVER A DESPLEGAR LA BARRA LATERAL CUANDO ESTÁ COLAPSADA */}
      {!compact && !isTransitioning && !isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute left-3 sm:left-5 top-18 sm:top-20 z-30 min-h-[44px] px-4 py-2.5 bg-[#07173F]/95 hover:bg-[#0042A6] active:scale-95 text-[#EAFE07] border-2 border-[#2E96F5] rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
        >
          <span>☰</span>
          <span>{navLevel === "zones" ? "Zonas" : "Regiones"}</span>
        </button>
      )}

      {/* BARRA LATERAL IZQUIERDA DESPLEGABLE: REGIONES */}
      {!compact && navLevel === "regions" && !compact && !isTransitioning && isSidebarOpen && (
        <aside className="absolute left-3 sm:left-5 top-18 sm:top-20 bottom-4 z-30 w-68 sm:w-78 bg-[#07173F]/92 backdrop-blur-md border-2 border-[#2E96F5] rounded-2xl p-3.5 shadow-2xl flex flex-col transition-all duration-200">
          <div className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#2E96F5]/30">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#EAFE07] block">
                Regiones de Marte
              </span>
              <span className="text-[11px] text-white/70">
                Toca para ubicar · Toca el pin para entrar
              </span>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              title="Ocultar barra lateral"
              className="shrink-0 min-h-[34px] px-2.5 py-1 rounded-lg bg-[#0042A6]/60 hover:bg-[#0960E1] text-white/90 hover:text-white border border-[#2E96F5]/50 text-xs font-bold transition cursor-pointer"
            >
              ‹
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {MARS_REGIONS.map((region) =>
              region.available ? (
                <button
                  key={region.id}
                  onClick={() => focusRegionOnGlobe(region)}
                  className="w-full min-h-[62px] flex items-center justify-between gap-2 text-left p-3 rounded-xl bg-[#0042A6]/85 hover:bg-[#0960E1] active:scale-[0.99] border-2 border-[#2E96F5] transition cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#EAFE07] animate-pulse shrink-0" />
                      <span className="font-nasa-title font-bold text-sm text-white truncate">
                        {region.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/85 truncate mt-0.5">
                      {region.code} · Operativa
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg bg-[#07173F] text-[#EAFE07] border border-[#2E96F5]/60">
                    Ubicar
                  </span>
                </button>
              ) : (
                <button
                  key={region.id}
                  onClick={() => focusRegionOnGlobe(region)}
                  title="Región sin datos hiperlocales disponibles"
                  className="w-full min-h-[48px] flex items-center justify-between gap-2 text-left px-3 py-2 rounded-xl bg-slate-900/75 border border-slate-700/60 opacity-65 hover:opacity-95 transition cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                      <span className="font-nasa-title font-bold text-xs text-slate-300 truncate">
                        {region.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {region.code}
                    </p>
                  </div>
                  <span className="shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    Inactiva
                  </span>
                </button>
              ),
            )}
          </div>
        </aside>
      )}

      {/* BARRA LATERAL IZQUIERDA DESPLEGABLE: ZONAS DENTRO DE SYRTIS MAJOR */}
      {!compact && navLevel === "zones" &&
        activeRegion &&
        !compact && !isTransitioning &&
        isSidebarOpen && (
          <aside className="absolute left-3 sm:left-5 top-18 sm:top-20 z-30 w-68 sm:w-80 bg-[#07173F]/95 backdrop-blur-md border-2 border-[#2E96F5] rounded-2xl p-4 shadow-2xl transition-all duration-200">
            <div className="flex items-start justify-between gap-2 pb-2.5 mb-3 border-b border-[#2E96F5]/30">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#EAFE07] block">
                  Zonas en {activeRegion.name}
                </span>
                <span className="text-[11px] text-white/75">
                  Toca un punto en el mapa o elige aquí:
                </span>
              </div>

              <button
                onClick={() => setIsSidebarOpen(false)}
                title="Ocultar barra lateral"
                className="shrink-0 min-h-[34px] px-2.5 py-1 rounded-lg bg-[#0042A6]/60 hover:bg-[#0960E1] text-white/90 hover:text-white border border-[#2E96F5]/50 text-xs font-bold transition cursor-pointer"
              >
                ‹ Ocultar
              </button>
            </div>

            <div className="space-y-2.5">
              {activeRegion.zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => enterZone(viewerRef.current.viewer, zone)}
                  className="w-full min-h-[64px] flex flex-col justify-center text-left p-3.5 rounded-xl bg-[#0042A6]/70 hover:bg-[#0960E1] active:scale-[0.99] border border-[#2E96F5] transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="font-nasa-title font-bold text-sm text-white">
                      {zone.name}
                    </span>
                  </div>
                  <span className="text-xs text-white/85 mt-1">
                    {zone.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        )}
    </div>
  );
}
