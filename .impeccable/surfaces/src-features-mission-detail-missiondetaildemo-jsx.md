---
version: 1
slug: "src-features-mission-detail-missiondetaildemo-jsx"
primary_target: "src/features/mission-detail/MissionDetailDemo.jsx"
related_targets: ["src/features/mission-detail/tablet-mission.css","src/features/mission-detail/mission-detail.css","src/features/mission-detail/RegionDetail.jsx","src/features/mission-detail/MissionHUD.jsx","src/features/mission-detail/MissionInfoPanel.jsx","src/features/mission-detail/RouteMapPlaceholder.jsx"]
---

# Tablet mission workspace

Mode: Operate. Target: `/mission-demo.html`. Existing Space Apps brand and shared-state props remain authoritative. User requested horizontal information tabs, button-first navigation for Mars tablets, and a schematic route-map placeholder to define the HUD.

## Direction contract

THESIS: Read the map, consult one short page and request return without scrolling through a document.

OWN-WORLD: Preserve the reviewed Deep Blue/Electric Blue/White identity, local Fira Sans and Overpass, official Space Apps logo and sparse Neon Yellow controls/attention labels.

STORY: Select a regional brief or exercise; use Route, Science, Telemetry and Alerts horizontally; inspect source evidence through Previous/Next. Route map and bottom mission HUD remain mounted while pages change.

FIRST VIEWPORT: Compact event header and mission/exercise toolbar. Map occupies the left workspace and a white four-tab information pane occupies the right. A dedicated bottom grid row contains the current notice, reserve, next reference, remaining distance, limiting margin, oxygen autonomy, voice and Return. No overlay covers controls. Supported tablet targets: 1024×768 and 1280×800 landscape; 768×1024 portrait uses the same split workspace. Below 700px, stack with accessible overflow fallback rather than clipping.

FORM: Button-first map/master-detail workspace, specified by the user; existing brand identity. No concept round or comp. `seed: none (pinned)` — “se usarán en tabletas ... más importante que funcione por botones que por scrollear ... mapa de ruta (como placeholder)”.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Data boundaries

Map geometry and crew marker are scenario placeholders, not geographic coordinates or live telemetry. Background contours and the diagram grid are schematic. Zoom/center/fit controls manipulate this diagram only. Replace RouteMapPlaceholder with the shared map during integration. Time and oxygen samples remain static; source photographs remain historical. The seismic alert is explicitly simulated. Return reuses the route backwards in the demo adapter.

## Interaction

Four accessible horizontal tabs with roving keyboard focus and Arrow/Home/End navigation. Short pages: Route 2, Science 3, Telemetry 2, Alerts 2. Switching tabs resets the page. Science selection changes the brief, not the astronaut position. Current warning, reserve comparison, voice and return remain available outside the tabs. At constrained heights or zoom, internal overflow is an accessibility fallback, not the primary tablet navigation.
