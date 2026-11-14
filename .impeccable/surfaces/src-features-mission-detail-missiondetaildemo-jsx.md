---
version: 1
slug: "src-features-mission-detail-missiondetaildemo-jsx"
primary_target: "src/features/mission-detail/MissionDetailDemo.jsx"
related_targets: ["src/features/mission-detail/tablet-mission.css","src/features/mission-detail/mission-detail.css","src/features/mission-detail/MissionInfoPanel.jsx","src/features/mission-detail/MissionHUD.jsx","src/features/mission-detail/RouteMapPlaceholder.jsx"]
---

# Full-screen mission interface

Mode: Operate. Product truth: Context.md and feature README. User explicitly rejects the web-page composition and pins a replacement composition, not a replacement palette.

## Direction contract

THESIS: The map owns the entire screen. Information and Alerts are separate dismissible overlays; the right rail controls them and audio while a compact lower HUD keeps resources and route references visible. Return belongs inside Route.

OWN-WORLD: Preserve existing Deep Blue, Electric Blue, White, Neon Yellow and semantic color values. Use the user-requested black map placeholder. Follow NASA's digital typography roles: Inter headings, Public Sans interface/body and DM Mono measurements, all self-hosted. No event header or logo.

STORY: Select Syrtis Major, Jezero or Wildcat Ridge through text-only controls. Information opens Route, Telemetry, Science in that order. Route and all seven telemetry values each occupy one page; Science retains three. A separate Alerts button lives below Information, with Voice/Mute below Alerts. A new warning reveals its own panel and notifies with a short chime followed by speech. Return is inside Route; touching the reference sequence above the HUD recovers Route.

FIRST VIEWPORT: Black full-screen canvas with one small Placeholder label. Borderless region names at upper left. Initially expanded information deck immediately left of the Information/Alerts/Voice rail. Compact horizontal reference line above an approximately 78px bottom instrument surface; no bottom action buttons. Panels and controls use 70% background opacity, with fully opaque text and focus. Demo fixture controls live in a closed Simulation disclosure.

FORM: `seed: none (pinned)` — user specifies: “quita el header por completo”, region buttons “solo deben ser las letras, no con bordes”, “el mapa abarca toda la pantalla”, “pantalla negra de fondo que diga Placeholder pequeño”, collapsible tabs that appear in the demo. No open concept choice or comp is needed.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Behavior and boundaries

Expanded information is the default on load. Information and Alerts occupy the same overlay slot, one at a time; collapsing preserves tab/page state. Tabs retain roving keyboard focus; only Science uses Previous/Next. All seven telemetry values fit reference tablet viewports; smaller/shorter screens retain accessible overflow. New warning/missing-data scenarios reveal Alerts. Voice remains mounted outside both panels and persists mute across notices. Audio waits for an initial user gesture when required and exposes unsupported/blocked/error recovery. New notices cancel stale audio. Anime.js scopes animate panel feedback, with reduced-motion opacity only. Route markers use explicit normalized fixture positions, never inferred geographic distances. No live sensors, navigation, oxygen model or seismic forecasting are introduced. Source photo provenance remains accessible. The NASA brand guide is graphic guidance, not evidence of validated flight hardware or astronaut usability.

## Reference

https://www.nasa.gov/nasa-brand-center/brand-guidelines/ — typography roles and disciplined hierarchy inform this interface; the user's palette and map canvas override color selection. Preserve text focus indicators even though normal region controls have no border.
