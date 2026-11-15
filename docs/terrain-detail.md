# Near-field detail and route feasibility

## Terrain and imagery

The existing 2560×2560 HiRISE geographic crop retains its bounds, alpha edge,
illustrative colors and source: NASA/JPL/USGS, https://doi.org/10.5066/P9QJDP48.
`scripts/prepare-hirise-tiles.ps1` creates 85 PNGs in four geographic levels,
320×320 pixels per tile. Level 3 copies the original pixels without resampling;
coarser levels use bicubic reduction. Embedded origin metadata accompanies every
shipping tile. The source image remains available for regeneration.

A UrlTemplateImageryProvider streams the visible pyramid in map views. During
3D exploration, a separate 3×3 window of full-resolution SingleTile image patches
follows the camera, biased 90 m ahead. This keeps close-up detail independent of
the finite DEM leaf level. At most nine patches are visible, twelve are cached
(about 4.7 MiB decoded RGBA, excluding GPU/mipmaps and the existing base layers),
and two patches load concurrently. Outdated results are ignored; leaving 3D or
turning orbital imagery off removes the patches. CTX remains underneath while
images load. A failed patch is retried by toggling orbital imagery off/on.

The DEM remains bounded at the existing source levels and cache. Its leaf error
stays zero: the installed Cesium renderer can attempt to traverse missing
children with a positive leaf error. Preloading sibling terrain tiles is disabled;
3D uses screen-space error 1, overview uses 2. This is a rendering policy, not an
accuracy claim or a measured performance guarantee. The image limit is about
0.55 m/pixel and local relief about 3 m; these cannot resolve individual small
rocks. Map view uses local HiRISE slope in the reliable core and regional slope
elsewhere, labeling the source and exposing camera tilt.

2D enforces nadir. 2.5D starts between 35° and 55° down according to range, then
preserves manual orbit/tilt instead of reframing on every moveEnd. Selecting a
mode, focus, compass or zoom control deliberately reframes the camera.

## Route geometry and resources

Endpoints are virtual search nodes with all validated neighboring connectors,
so the search can avoid reverse hooks at A/B. Line-of-sight cleanup checks slope,
blocked areas and search cost before removing grid zigzags. Heights remain sampled
for directed timing. The rendered route is clamped to the visible terrain;
arbitrary splines never shortcut blocked terrain.

Resource insufficiency produces a preview, not a missing route. Both time and
oxygen show availability, shortfall and minimum total autonomy, including time
already spent, conservative return allowance, activity and reserve. Separate
outward and searched-return times remain visible. Preview cannot play, tick or
advance, including a return that cannot maintain the reserve. Spatial/slope
constraints, no-data and the 6 km local search bound remain enforced.

For the documented Wildcat coordinates, defaults currently yield roughly 482 m,
18.1 min out and 17.8 min back. With 20 min mission time and 30 min O₂ autonomy,
the preview needs about 46 min total for each resource. Displayed minima round
up to the next tenth of a minute so entering them does not undersupply the plan.

## Validation and finish review

55 Node tests, ESLint, the integrated build and the isolated mission build passed.
The existing large Cesium chunk warning remains. The tile window test checks
geographic coverage, bounds and shipped files; 192 finest-level pixel checks
matched the source exactly. The provenance scan reported 85 rasters, zero missing.
The one design detector pass scanned three JSX/CSS files with regex matching and
reported no findings; contrast/element rules did not run in that scan.

A fresh browser session calculated the route, advanced 25 m, entered 3D, moved
and turned, then returned to 2.5D without console errors. Separate checks confirmed
preview shortages, disabled traversal, 2D→2.5D, oblique pan, local-slope readings
and loaded near-field textures. No frame-rate or total GPU memory measurement is
claimed. Captures are local under `.impeccable/review/terrain-detail/`.

Independent fresh-context finish disposition: **ship**.

- Persistence: contract, source provenance and limitations are documented;
  DESIGN.md's palette, typography and materials are preserved.
- Fidelity: six complete captures cover desktop, portrait, mobile, locked
  traversal, oblique view and near-field 3D. The resource assessment and controls
  match the brief; secondary notes can scroll in compact layouts.
- Ceiling: appropriate Operate refinement without expanding the visual identity.
- Material fixes: none outstanding in the review.
- Keep: assessment first, separate resource minima, explicit traversal lock with
  visible route, horizontal navigation, camera/mission independence.
