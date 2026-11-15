import { useEffect } from "react";
import * as Cesium from "cesium";
import { MARS_REGIONS } from "../../data/marsZones";
import { createGlobeMotion, MARS_OVERVIEW_HEIGHT, MARS_PREVIEW_HEIGHT } from "../../components/globeMotion.js";
import { createGlobeViewer } from "./createGlobeViewer";
import { addGlobeMarkers } from "./addGlobeMarkers";

export function useGlobeScene({ containerRef, creditRef, compactRef, navStateRef, viewerRef, transitionRef, enterRegion, enterZone, setInspectedItem, setTooltipPos }) {
  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = createGlobeViewer(containerRef.current, compactRef.current, creditRef.current);
    const marsEllipsoid = Cesium.Ellipsoid.MARS;
    addGlobeMarkers(viewer);

    // Ocultador por horizonte de Marte
    const occluder = new Cesium.EllipsoidalOccluder(
      marsEllipsoid,
      viewer.camera.position,
    );

    const motion = createGlobeMotion({
      now: () => performance.now(),
      reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      visible: () => !document.hidden && viewer.useDefaultRenderLoop,
      canResume: () => viewer.camera.positionCartographic.height >= MARS_PREVIEW_HEIGHT,
      onChange: state => { if (containerRef.current) containerRef.current.dataset.motion = state; },
      rotate: angle => { viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, angle); viewer.scene.requestRender(); },
      resetCamera: (expanded, animated, complete) => {
        viewer.camera.cancelFlight();
        const destination = Cesium.Cartesian3.fromDegrees(62, 14.5, expanded ? MARS_OVERVIEW_HEIGHT : MARS_PREVIEW_HEIGHT, marsEllipsoid);
        if (animated) viewer.camera.flyTo({ destination, duration: 1.2, complete });
        else { viewer.camera.setView({ destination }); complete(); }
        viewer.scene.requestRender();
      },
    });
    const resize = new ResizeObserver(() => {
      if (!viewer.isDestroyed() && viewer.useDefaultRenderLoop) {
        viewer.resize();
        viewer.scene.requestRender();
      }
    });
    resize.observe(containerRef.current);
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

    const beginInteraction = () => { pointerDown = true; viewer.camera.cancelFlight(); motion.beginInteraction(); };
    const endInteraction = () => { pointerDown = false; motion.endInteraction(); };
    for (const type of [Cesium.ScreenSpaceEventType.LEFT_DOWN, Cesium.ScreenSpaceEventType.RIGHT_DOWN, Cesium.ScreenSpaceEventType.MIDDLE_DOWN, Cesium.ScreenSpaceEventType.PINCH_START]) handler.setInputAction(beginInteraction, type);
    for (const type of [Cesium.ScreenSpaceEventType.LEFT_UP, Cesium.ScreenSpaceEventType.RIGHT_UP, Cesium.ScreenSpaceEventType.MIDDLE_UP, Cesium.ScreenSpaceEventType.PINCH_END]) handler.setInputAction(endInteraction, type);
    handler.setInputAction(() => { viewer.camera.cancelFlight(); motion.interact(); }, Cesium.ScreenSpaceEventType.WHEEL);

    handler.setInputAction((movement) => {
      if (pointerDown) motion.interact();
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
            motion.interact();
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
        motion.interact();
        setInspectedItem(null);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = { viewer, stopSpin, motion };
    motion.restart(!compactRef.current, false);

    return () => {
      resize.disconnect();
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
  }, [containerRef, creditRef, compactRef, navStateRef, viewerRef, transitionRef, enterRegion, enterZone, setInspectedItem, setTooltipPos]);

}
