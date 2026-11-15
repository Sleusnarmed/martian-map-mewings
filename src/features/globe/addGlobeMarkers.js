import * as Cesium from "cesium";
import { MARS_REGIONS } from "../../data/marsZones";
import { createCrispBadge } from "./createGlobeBadge";

export function addGlobeMarkers(viewer) {
    const marsEllipsoid = Cesium.Ellipsoid.MARS;
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

}
