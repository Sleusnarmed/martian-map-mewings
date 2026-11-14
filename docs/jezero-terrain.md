# José’s Jezero terrain component

Scope: local Cesium terrain, tilted/top-down navigation, elevation shading, contour lines and points of interest. Starts at Jezero. No routes, movement simulation, Delta marker, or globe transition. The colors encode elevation; they are not orbital imagery or geological classifications.

## Prepare the real data

Download the [USGS CTX DEM](https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif) into `data/raw/`. Raw files are ignored by Git.

```bash
python3 -m venv .venv
.venv/bin/pip install -r scripts/terrain-requirements.txt
.venv/bin/python scripts/prepare_terrain.py data/raw/M20_JezeroCrater_CTXDEM_20m.tif
.venv/bin/python scripts/prepare_preview.py
npm run dev
```

The converter creates `public/terrain/jezero/metadata.json` and `heights.f32`. Commit both generated files together once the source has been checked. The app displays an explicit data-unavailable state until they exist. Retry with “Retry detailed view”; the 2D preview remains available. No generated or Earth terrain is substituted.

The default crop (77.20–78.16° E, 17.97–18.85° N) is a rectangular display extent around Jezero, not a geologic boundary. The checked GeoTIFF uses a spherical mapping radius of 3,396,190 m and an equirectangular standard parallel of 18.4663°. The source is a 20 m/pixel CTX DEM; the default 1025-square display grid is roughly 53 m/pixel. The converter derives geographic coordinates from the embedded Mars CRS, keeps MOLA heights, records the source SHA-256, and rejects missing cells. If coverage validation fails, inspect the raster in QGIS and select a covered crop using `--bounds WEST SOUTH EAST NORTH`.

Cesium uses the source’s spherical Mars mapping radius, including for cartesian conversion and tiling. MOLA-referenced heights are used directly for local relief visualization; this is not a rigorous areoid-to-ellipsoid geodetic transformation. Height values and contour labels remain source values; vertical exaggeration is 1×. CTX cannot resolve individual rocks or walking hazards. No values here establish astronaut traversability.

## Integration

```jsx
import JezeroTerrain from './features/terrain/JezeroTerrain'

<JezeroTerrain
  terrainUrl="/terrain/jezero/metadata.json"
  pointsOfInterest={verifiedPoints}
  onPointSelect={(id) => setActivePointId(id)}
/>
```

`verifiedPoints` entries: `{ id, name, longitude, latitude, source }`. Angles are degrees, east-positive longitude, planetocentric latitude. Use `wildcat-ridge` for the Wildcat Ridge entry. The supplied `JEZERO_POINTS` uses the Hazeltop sample position (18.45863707° N, 77.40588851° E) from NASA PDS Initial Reports Volume 2 Release 2, page 14-1, to represent Wildcat Ridge. NASA’s Mars Rock Samples page identifies Hazeltop with Wildcat Ridge. The marker represents a documented sample location, not an outcrop boundary. Positions outside the prepared crop are not rendered. The component owns and destroys its own Viewer, so mount it as the regional view after the globe selection. If the team requires one persistent Viewer across screens, extract the provider and layer setup before integration rather than mount a second viewer simultaneously.

Cesium workers/assets are copied from the installed dependency on dev/build, served locally, and excluded from source control. No ion token or Earth basemap is used. The component does not change `Ellipsoid.default`. Anime.js is not needed for this scoped terrain view.

## Controls and checks

Drag to pan; wheel to zoom; Ctrl + drag to tilt/orbit. Buttons restore the regional tilted or overhead view, select contour spacing, toggle contours, and focus a verified Wildcat Ridge point. Click terrain for interpolated source elevation and coordinates. The overlay legend shows display-grid resolution.

Run `npm run build`. Once real data is prepared, check in a WebGL-capable browser: Jezero opens; crater relief is visible; no Earth tiles load; contours align with heights; top-down/tilted views work; selecting Wildcat Ridge focuses its verified position; unmounting/remounting works; and the source attribution remains visible. Browser rendering and real-data conversion cannot be marked verified before these checks.

## Verification completed

The supplied GeoTIFF was converted successfully to 1,050,625 finite samples. The selected crop ranges from −2921.9 to −803.5 m. Corner/centre interpolation and out-of-coverage checks passed, and the generated binary matches its metadata. The converter uses Pillow to read GeoTIFF tags and the spherical equirectangular equations with NumPy; it rejects other projections. Production build passed. WebGL interaction still needs browser verification: this session cannot bind the preview port (EPERM). Run `npm run dev` from your own terminal and open its Local URL.

## Navigation stability

The finite terrain provider advertises levels 0–4 for the 1025-square grid (65 samples per tile), rather than advertising unlimited child tiles. Leaf tiles have no children and report zero further refinement error. Adjacent tiles sample identical raster-space coordinates. Source tile buffers are cached separately from Cesium’s disposable mesh buffers, with a 341-entry cap (~5.5 MiB). Rendered terrain uses a 160-tile cache and retains parent coverage during refinement.

The camera limits fast gesture increments and reduces zoom/pan inertia. Tilt is constrained; a separate camera guard uses the complete DEM to maintain at least 300 m of surface clearance even while tiles load. The camera may stand beyond the cropped map for an oblique view but cannot escape arbitrarily far from the region. The terrain remains at 1× elevation. Reset view returns to the crater overview, and switching view modes retains the most recently focused point.

Contour controls update existing material uniforms instead of rebuilding the material/texture. Rendering is demand-driven when idle. These changes target excessive refinement, rapid camera overshoot, and repeated material allocation; they do not constitute a browser frame-rate measurement.

Regression checks: `node tests/terrain.test.js`. They cover finite tile availability, matching tile edges, preservation of the source raster at maximum detail, worker-buffer ownership, and rapid camera clearance/tilt inputs. The production build is also checked. A WebGL-capable browser should still be used to exercise fast scroll, drag and Ctrl-drag on the target device; local preview remains unavailable to this session.

## Progressive display and map context

The initial React entry is separate from the Cesium bundle. It loads a 768 × 742 WebP shaded-relief image (~15 KB) first; after that image loads (or fails), Cesium is imported dynamically. The lightweight map allows drag and button zoom without loading the elevation binary. While the full view prepares, the same preview covers the canvas. The cover is removed only after the regional camera is initialized, visible terrain is loaded, and the map center hits a surface for two rendered frames. Renderer/data failure leaves the 2D map usable. Fast 2D mode pauses the Cesium render loop; returning resumes it. Source/mesh caches still belong to the mounted Viewer and are released on unmount. The initial startup handoff does not promise that later zooms never need refinement.

`region.json` holds the Jezero display extent, shared warm map palette, the USGS crater center (18.41° N, 77.69° E), and an expressly simulated position (18.43° N, 77.43° E) with a decorative 35° heading. The arrow is a mockup, not GPS, rover telemetry, a recommended starting point, or a validated route. Its screen icon is illustrative. Syrtis Major is displayed as regional context; no regional administrative/geologic boundary is inferred. Jezero's default camera now targets the published crater center, and the expanded crop includes its approximate published extent.

Run `python3 scripts/prepare_preview.py` after preparing/changing the DEM crop. It verifies matching bounds, derives northwest hillshade and colors from the DEM, and outputs `preview.webp`. The same image is draped on the Cesium terrain with contour lines over it. This is derived cartography, not orbital photography. The fallback elevation material uses the same palette if the image cannot load. The preview is deliberately lower resolution than the geometric terrain. Only the map palette changes; the Space Apps UI tokens remain unchanged.

The current implementation is configured for Jezero; adding a region requires a matching region configuration, preview, and DEM package. It does not preload all regions.
