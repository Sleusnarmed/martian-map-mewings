# José’s Jezero terrain component

Scope: local Cesium terrain, tilted/top-down navigation, elevation shading, contour lines and points of interest. Starts at Jezero. No routes, movement simulation, Delta marker, or globe transition. The colors encode elevation; they are not orbital imagery or geological classifications.

## Prepare the real data

Download the [USGS CTX DEM](https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/M20_JezeroCrater_CTXDEM_20m.tif) into `data/raw/`. Raw files are ignored by Git.

```bash
python3 -m venv .venv
.venv/bin/pip install -r scripts/terrain-requirements.txt
.venv/bin/python scripts/prepare_terrain.py data/raw/M20_JezeroCrater_CTXDEM_20m.tif
npm run dev
```

The converter creates `public/terrain/jezero/metadata.json` and `heights.f32`. Commit both generated files together once the source has been checked. The app displays an explicit data-unavailable state until they exist. Retry with “Reload data”. No generated or Earth terrain is substituted.

The default crop (77.15–77.85° E, 18.05–18.75° N) is a rectangular display extent around Jezero, not a geologic boundary. The checked GeoTIFF uses a spherical mapping radius of 3,396,190 m and an equirectangular standard parallel of 18.4663°. The source is a 20 m/pixel CTX DEM; the default 1025-square display grid is roughly 41 m/pixel. The converter derives geographic coordinates from the embedded Mars CRS, keeps MOLA heights, records the source SHA-256, and rejects missing cells. If coverage validation fails, inspect the raster in QGIS and select a covered crop using `--bounds WEST SOUTH EAST NORTH`.

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

The supplied GeoTIFF was converted successfully to 1,050,625 finite samples. The selected crop ranges from −2710.7 to −1380.5 m. Corner/centre interpolation and out-of-coverage checks passed, and the generated binary matches its metadata. The converter uses Pillow to read GeoTIFF tags and the spherical equirectangular equations with NumPy; it rejects other projections. Production build passed. WebGL interaction still needs browser verification: this session cannot bind the preview port (EPERM). Run `npm run dev` from your own terminal and open its Local URL.
