# SANSI and Mewings placement

## Direction contract

THESIS: Use the supplied project and team identities within the existing screens.

OWN-WORLD: Preserve the current palette, typography, map controls and layout.
Logos retain their original colors, transparency and aspect ratios.

STORY: SANSI identifies the application; Mewings identifies the team. Both assets
are bundled locally. Logo artwork never becomes a map interaction target.

FIRST VIEWPORT: On the landing page, SANSI replaces the Martian Map heading and
a small Mewings mark sits at the lower right. On the expanded Mars globe, SANSI
replaces the Space Apps header logo; Mewings sits below the Cesium credit host
at the upper right. In Jezero, a small SANSI mark aligns with the lower-right
inset. When mission instruments appear, the same mark sits above their stack;
normal flow adapts to the actual HUD height. Compact information panels and
speech subtitles leave clearance for the logo.

FORM: `seed: none (pinned)` — user-supplied logos and exact placement instructions.
This is a narrow code-led extension, with no concept or palette change.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Asset provenance

See `src/assets/branding/SOURCES.md`. The current request supersedes the older
surface brief's restriction on adding a terrain logo and DESIGN.md's older
no-logo layout description. That file remains the scoped incumbent system;
its existing palette and component language are preserved.

## Verification · 2026-11-15

Independent finish review: **ship**, scoped to this branding integration.
Twelve final screenshots cover the landing, expanded globe and Jezero at
1366 × 768, 1024 × 768, 768 × 1024 and 390 × 844 as appropriate. The review found
no material branding clipping or overlap. Jezero retains a 12 px logo-to-HUD
gap; normal UI coordinate entry, calculation and route clearing verified both
HUD states. Caption fixtures verify visual clearance only.

Main and independent mission builds, targeted ESLint and 23 existing
audio/presentation/navigation tests passed. Supplied assets were compared
against the originals and are identical in the working tree. Detector findings
are pre-existing: one Overpass font warning and 20 system advisories; this
extension introduces no palette or type change.

The first terrain screenshot was discarded for incomplete tiles; the valid
no-HUD reference is the cleared-route capture. Mars rectangle measurements
sampled during layout transitions are unreliable; final screenshots provide
the visual evidence for those placements. Test captures use an isolated local
browser profile. The concurrent landing intro edit is preserved outside this
branding commit.
