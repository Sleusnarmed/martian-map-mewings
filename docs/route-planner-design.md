# Route planning extension

Mode: Operate. Extend the existing tablet mission surface; retain its palette,
typography, translucent panels, horizontal tabs and one persistent Cesium viewer.

## Direction contract

THESIS: Select a location, assign A or B, and follow one computed mission shared
by the terrain, instruments, alerts and voice.

OWN-WORLD: Existing Deep Blue surfaces, Yellow active controls, white text and
tabular coordinate values. No new visual identity or header.

STORY: Inspect any point or reference, set endpoints, calculate under explicit
terrain and resource limits, advance, observe a new blockage and replan or return.

FIRST VIEWPORT: Map fills the screen. Route opens in the existing Information
slot. A compact dismissible coordinate inspector appears at the left after a
map click. A/B markers and a computed path belong to the map. Lower instruments
reflect the same mission. Horizontal Route subpages keep controls button-driven.

FORM: seed: none (pinned). User requests “selección de punto de inicio y punto de
destino” and existing planned functionality through layer visibility. Selection
and tab changes inherit the current Anime.js transition grammar. IA stays pending.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Scope and evidence

The coordinate inspector reports geographic Mars coordinates, never screen or
camera coordinates. POI selection uses the published reference position.
Local DEM routing, assumptions, observations and historical environment remain
distinct. Layer visibility never changes routing constraints. Camera exploration
is independent of mission traversal. The standalone mission preview retains its
fixture adapter. No new raster assets or design-system changes are planned.

## Detail and feasibility refinement · 2026-11-14

Retain the Operate composition and identity. After calculation, Plan leads with
outbound/return times and resource requirements; editing endpoints is collapsible.
Resource-limited routes remain visible and explain each shortage; Traverse locks
movement. 2.5D preserves a user's oblique view. Local slope, elevation, view tilt
and image coverage remain available in Map view. The existing HiRISE crop is
repackaged as sourced geographic tiles; near-field texture loading is bounded,
with no generated texture or invented additional terrain detail.

## Persistent map controls and image lifetime

Keep the same Operate identity. Put perspective controls immediately beside Map
view and north below it; 3D movement shares the lower row. No panel must be opened
to inspect the terrain in 3D, including before choosing A/B. The map panel retains
terrain readings and layers. In compact layouts, controls clear the information
deck and inspector; narrow landscape reserves the left side for map tools.
Only current near-field images remain decoded; abort stale requests and explicitly
release image/GPU resources. Resolution improvements require measured source data;
the proposed 25 cm crop and local LLM remain preparation/planning work.
