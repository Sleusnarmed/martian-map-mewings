# Near-field detail and route feasibility

## Terrain and imagery

The existing 2560×2560 HiRISE geographic crop retains its bounds, alpha edge,
illustrative colors and source: NASA/JPL/USGS, https://doi.org/10.5066/P9QJDP48.
`scripts/prepare-hirise-tiles.ps1` creates 85 PNGs in four geographic levels,
320×320 pixels per tile. Level 3 copies the original pixels without resampling;
coarser levels use bicubic reduction. Embedded origin metadata accompanies every
shipping tile. The source image remains available for regeneration.

A UrlTemplateImageryProvider streams the visible pyramid in map views. During
3D exploration, a separate 3×3 window of full-resolution image patches
follows the camera, biased 90 m ahead. This keeps close-up detail independent of
the finite DEM leaf level. At most nine decoded patches are retained (about
3.5 MiB RGBA, excluding in-flight decoding, GPU/mipmaps and existing base layers),
and two load concurrently. Each request uses AbortController; leaving its window
cancels the request and immediately removes the corresponding layer/GPU textures
and closes its ImageBitmap. A decode that finishes after cancellation is closed
without restoring an obsolete layer. Leaving 3D or hiding imagery releases the
whole window. Browser HTTP/disk caching may retain the compressed download for a
later visit; that is separate from decoded/GPU memory. CTX remains underneath
while patches load. Failed patches retry on reentry or an imagery off/on toggle.

2D/2.5D/3D controls are persistent beside Map view, with the north compass below
Map view. 3D movement controls sit beside the compass. These controls work with
all panels closed; 3D can start at map center without a route. Map view retains
terrain information, zoom, layers and source controls.

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

## Higher-resolution source preparation

The current app still uses its existing ~0.55 m/pixel crop. USGS lists a nominal
25 cm/pixel HiRISE orthomosaic for Jezero under the same dataset DOI, with the
[published product page](https://astrogeology.usgs.gov/search/map/Mars/Mars2020/JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first).
That is a possible ~2.2× improvement per image dimension, not a new source already
installed here. The publisher's page fetch returned HTTP 403 during this task;
its indexed catalog identifies the product, but a crop's coverage/georeferencing
and the actual source file must be checked before promising replacement assets.

Next data task: obtain the source, validate its CRS and Wildcat coverage, crop
only the required bounds, preserve no-data/alpha, and build a geographic pyramid
at its native resolution. Use GDAL/QGIS or a repeatable raster preparation tool;
do not load a whole mission mosaic in the browser. The nearby window should be
selected by ground distance rather than the old hardcoded eight tiles per side
when a finer level is added. Image resolution and the existing ~3 m relief remain
separate; a finer DTM needs its own source/preparation. Even 25 cm orbital imagery
cannot provide rover-camera detail at eye level. Upscaling or sharpened fictional
rocks would not add measured terrain information.

For local assistant design, hardware assumptions and the 6 km guard rationale,
see [the local AI plan](local-ai-plan.md).

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

## Persistent controls and unloading review

Fresh-context finish disposition: **ship**, scoped to the controls/lifetime
refinement. Persistence: updated contract, source limits and local-AI plan retain
the existing design system. Fidelity: six complete desktop/portrait/compact
captures show perspective beside Map view, north below, and movement outside the
panel; the narrow landscape and mobile layouts retain Calculate. Ceiling:
Operate refinement; the image remains the existing source resolution. Material
fixes: none outstanding. Keep: persistent controls, independent exploration,
current-window ownership and explicit data limits.

58 Node tests and ESLint passed. Both final builds passed with the existing
Cesium chunk warning. New asynchronous lifetime tests cover two concurrent loads,
immediate eviction, aborts, late decodes, disposal and failure/reentry. Browser
checks covered 3D without A/B, POI selection, route calculation and 25 m advance,
external compass/movement, 2.5D, imagery off/on and no console errors. The one
regex detector pass found zero anti-patterns; its radius advisory was fixed and
element/contrast rules did not run. No new shipping raster was created.

Capture evidence is local in `.impeccable/review/map-controls/`, including
1243×699 desktop, 768×1024 portrait, 390×843 compact and 768×600 landscape. The
final functional smoke and both builds completed after the finish verdict.
