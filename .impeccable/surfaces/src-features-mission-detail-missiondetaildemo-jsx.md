---
version: 1
slug: "src-features-mission-detail-missiondetaildemo-jsx"
primary_target: "src/features/mission-detail/MissionDetailDemo.jsx"
related_targets: ["src/features/mission-detail/tablet-mission.css","src/features/mission-detail/mission-detail.css","src/features/mission-detail/MissionInfoPanel.jsx","src/features/mission-detail/MissionHUD.jsx","src/features/mission-detail/RouteMapPlaceholder.jsx"]
---

# Full-screen mission interface

Mode: Operate. Product truth: Context.md and feature README. User explicitly rejects the web-page composition and pins a replacement composition, not a replacement palette.

## Direction contract

THESIS: The map owns the entire screen. Information is a dismissible overlay; mission-critical state and return stay accessible.

OWN-WORLD: Preserve existing Deep Blue, Electric Blue, White, Neon Yellow and semantic color values. Use the user-requested black map placeholder. Follow NASA's digital typography roles: Inter headings, Public Sans interface/body and DM Mono measurements, all self-hosted. No event header or logo.

STORY: Select Syrtis Major, Jezero or Wildcat Ridge through text-only controls. Read Route, Science, Telemetry or Alerts in a horizontal floating deck. Collapse the deck to clear the map and reopen it with Information. Critical notice, reference, distance, return margin, oxygen autonomy and voice remain outside the deck.

FIRST VIEWPORT: Black full-screen canvas with one small Placeholder label. Borderless region names at upper left. Four horizontal tabs and a compact information pane at upper right, initially expanded. Bottom floating instruments and Voice/Return controls, inset from screen edges, with no full-width website footer. Demo fixture controls live in a closed Simulation disclosure.

FORM: `seed: none (pinned)` — user specifies: “quita el header por completo”, region buttons “solo deben ser las letras, no con bordes”, “el mapa abarca toda la pantalla”, “pantalla negra de fondo que diga Placeholder pequeño”, collapsible tabs that appear in the demo. No open concept choice or comp is needed.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Behavior and boundaries

Expanded information is the default on load. One explicit control collapses/reopens the entire deck without losing the selected tab/page. Selecting a region or opening an alert reveals the deck. Tabs retain roving keyboard focus and short Previous/Next pages. Voice stays mounted outside the deck. No live sensors, geographic coordinates, navigation, oxygen model or seismic forecasting are introduced. Source photo provenance remains accessible. The NASA brand guide is graphic guidance, not evidence of validated flight hardware or astronaut usability.

## Reference

https://www.nasa.gov/nasa-brand-center/brand-guidelines/ — typography roles and disciplined hierarchy inform this interface; the user's palette and map canvas override color selection. Preserve text focus indicators even though normal region controls have no border.
