---
version: 1
slug: "src-features-mission-detail-missiondetaildemo-jsx"
primary_target: "src/features/mission-detail/MissionWorkspace.jsx"
related_targets: ["src/App.jsx","src/components/MarsGlobe3D.jsx","src/features/terrain/JezeroTerrain.jsx","src/features/mission-detail/tablet-mission.css","src/features/mission-detail/mission-detail.css","src/features/mission-detail/MissionInfoPanel.jsx","src/features/mission-detail/MissionHUD.jsx","src/features/mission-detail/MissionDetailDemo.jsx"]
---

# Full-screen mission interface

Mode: Operate. Product truth: Context.md and feature README. User explicitly rejects the web-page composition and pins a replacement composition, not a replacement palette.

## Direction contract

THESIS: The real Jezero terrain owns the screen under the shared mission HUD. Information, Alerts and Map view share a single dismissible slot. A single Cesium Viewer survives HUD selection. The Mars overview starts wider and rotates until interaction; only going back resumes it.

OWN-WORLD: Preserve existing Deep Blue, Electric Blue, White, Neon Yellow and NASA typography in the HUD. Keep the cartography's actual elevation palette and source labels. The integrated map replaces the black Placeholder; the independent component preview retains it. Preserve the globe's existing Space Apps identity. No new header/logo is added over the terrain.

STORY: Select Syrtis Major, Jezero or Wildcat Ridge through text-only controls. Information opens Route, Telemetry, Science in that order. Route and all seven telemetry values each occupy one page; Science retains three. A separate Alerts button lives below Information, with Voice/Mute below Alerts. A new warning reveals its own panel and notifies with a short chime followed by speech. Return is inside Route. The route has only A · Base and B · Wildcat Ridge; touching it, the destination or remaining distance opens Route, while margin/oxygen open Telemetry. Visible copy and spoken notices present operational mission cases without simulation/training labels; fixture provenance stays in code/docs.

FIRST VIEWPORT: Full-screen source terrain; back-to-globe and regional text controls at upper left. Initially open information deck beside Information/Alerts/Voice. A separate Map view button opens layers, inspection and sources in the same overlay slot. Compact A–B route and approximately 78px instruments below. Surfaces retain 70% opacity, text/focus fully opaque. No duplicate terrain header/sidebar/footer and no mock crew arrow. Camera focus is framed through the exposed map area, with a bounded pixel budget. Mission case stays closed initially.

FORM: `seed: none (pinned)` — latest user direction replaces the integrated Placeholder with the existing map and requests a wider Mars view, automatic rotation, persistent pause after touch/selection and restart only on back navigation. Earlier constraints retain collapsible information, text region controls, A–B route, operational copy and the translucent HUD. No new world, comp or concept decision applies.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Behavior and boundaries

Expanded information is the default on load. Information and Alerts occupy the same overlay slot, one at a time; collapsing preserves tab/page state. Anime.js fades the outgoing view for 90ms before replacing/hiding it, then fades the incoming view for 140ms. Sections, Science pages and regional brief changes use the same interruptible transition. The latest request wins; functional page updates preserve rapid Next presses. Reduced motion removes the exit delay and keeps a 60ms entrance. Tabs retain roving keyboard focus; only Science uses Previous/Next. All seven telemetry values fit reference tablet viewports. Scrollbars are hidden only when measured content fits; smaller/shorter screens retain accessible overflow. New warning/missing-data cases reveal Alerts. Voice remains mounted outside both panels and persists mute across notices. Audio waits for an initial user gesture when required and exposes unsupported/blocked/error recovery. New notices cancel stale audio. Route position remains an explicit normalized A–B fixture, never inferred geographic distance. No live sensors, navigation, oxygen model or seismic forecasting are introduced by the operational presentation. Source photo provenance remains accessible. The NASA brand guide is graphic guidance, not evidence of validated flight hardware or astronaut usability.

## Reference

https://www.nasa.gov/nasa-brand-center/brand-guidelines/ — typography roles and disciplined hierarchy inform this interface; the user's palette and map canvas override color selection. Preserve text focus indicators even though normal region controls have no border.

## Integration verification · 2026-11-14

Finish review: `ship`, including landscape, portrait, compact and the 1243×699 viewport. Verified globe rotation, persistent interaction pause, back navigation, map POI selection, layer controls, keyboard skip link and one Viewer per view. All 25 tests, ESLint and both app/independent-demo builds pass. The incumbent HUD palette and typography in DESIGN.md are preserved; its older standalone-layout documentation and existing sidecar drift are not changed by this extension. Real terrain colors and source labels remain owned by the cartography. No new raster assets were authored.
