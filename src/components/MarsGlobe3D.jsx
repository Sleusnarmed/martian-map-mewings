import { useCallback, useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import { routeForZone } from "../navigation";
import { animate } from "animejs";
import { useGlobeScene } from "../features/globe/useGlobeScene";
import GlobeHeader from "../features/globe/GlobeHeader";
import GlobeInspector from "../features/globe/GlobeInspector";
import GlobeSidebar from "../features/globe/GlobeSidebar";


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

  useGlobeScene({ containerRef, compactRef, navStateRef, viewerRef, transitionRef, enterRegion, enterZone, setInspectedItem, setTooltipPos });

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

      <GlobeHeader {...{ compact, isTransitioning, navLevel, activeRegion, handleBackToRegions }} />
      <GlobeInspector {...{ inspectedItem, compact, isTransitioning, tooltipPos }} />
      <GlobeSidebar {...{ compact, isTransitioning, isSidebarOpen, setIsSidebarOpen, navLevel, activeRegion, focusRegionOnGlobe }} onEnterZone={zone => enterZone(viewerRef.current?.viewer, zone)} />
    </div>
  );
}
