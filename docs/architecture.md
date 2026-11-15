# Application architecture

The app has three stages: planetary home, Mars globe, and mission workspace with
an embedded Jezero map. Hash routing belongs to `App.jsx` and `navigation.js`.
The integrated workspace uses RouteMissionProvider for computed route, position,
resources and notices. The isolated mission preview retains its case fixtures.

## Module ownership

| Area | Entry / owner | Responsibilities |
| --- | --- | --- |
| Home | `features/home/Home.jsx` | Planet selection and expansion of the existing globe |
| Globe coordination | `components/MarsGlobe3D.jsx` | React navigation state, camera actions, transition animation |
| Globe lifecycle | `features/globe/useGlobeScene.js` | Viewer ownership, event handlers, motion and teardown |
| Globe setup | `features/globe/createGlobeViewer.js` | Cesium configuration and orbital imagery |
| Globe markers | `features/globe/addGlobeMarkers.js`, `createGlobeBadge.js` | Entity creation and canvas labels |
| Globe UI | `features/globe/GlobeHeader`, `GlobeInspector`, `GlobeSidebar` | Presentational controls; actions come from the coordinator |
| Mission | `features/mission-detail/MissionWorkspace.jsx` | Case, information/alerts, resources, voice and panel state |
| Terrain coordination | `features/terrain/JezeroTerrain.jsx` | Connect scene, layer state, exploration and the mission panel slot |
| Terrain lifecycle | `useTerrainScene.js` | Async data loading, viewer creation, camera/input guards, cleanup |
| Terrain presentation | `TerrainControlsPanel.jsx` | Map, exploration and layer control groups; no viewer construction |
| Persistent map tools | `TerrainMapControls.jsx` | Perspective, compass and 3D movement in the workspace's external navigation slot |
| Terrain framing / markers / material | `useTerrainFraming.js`, `useTerrainMarkers.js`, `useTerrainMaterial.js` | Independent synchronization effects with matching cleanup |
| Terrain data | `terrainData.js`, `createTerrainProvider.js` | DEM validation, sampling, tile availability and bounded caches |
| Exploration | `useTerrainNavigation.js`, `useExplorerControls.js` | Camera inspection, independent of mission position |
| Layer coordination | `useTerrainLayers.js` | Layer preferences and scene synchronization |
| Layer services | `wildcatImagery.js`, `useSlopeLayer.js`, `useSolarHeatingLayer.js` | Imagery ownership, visibility, analysis overlays |
| Near-field image lifetime | `useNearbyImagery.js`, `nearbyTileCache.js`, `createPatchProvider.js` | Current window only, two abortable downloads, release layers and ImageBitmaps on eviction |

Unqualified filenames in the terrain rows are relative to `src/features/terrain`.

## Lifecycle rules

- Create/destroy a Cesium viewer in its scene hook only. UI panels never own one.
- Refs hold imperative Cesium objects and current callbacks. React state holds
  display choices and data readiness. Changing a panel does not recreate a viewer.
- Scene effects register and remove their own listeners. Async loading must check
  cancellation before touching a viewer; animations must be cancelled on teardown.
- Keep geometry and navigation calculations independent of JSX. Preserve bounded
  terrain subdivision, cache limits, and source-resolution checks.
- RouteMissionProvider owns the integrated mission; the map and HUD consume it.
  Historical MEDA and camera movement do not mutate mission resources.
- `features/route-planner/planner.js` owns bounded DEM search and return validation;
  its Web Worker is replaced on new requests. Visibility changes never enter it.
- Known blockages, survey history, traversal time and notices belong to the pure
  mission reducer. Unobserved scenario obstacles never enter a planning request.
- For the routing contract, assumptions and demo steps see `docs/route-planning.md`.

## Supported entry points and removals

`index.html` is the full app. `mission-demo.html` and `vite.mission.config.js` still
support the independent mission UI preview. Its placeholder is intentional.
The unmounted standalone terrain UI, unused Vite starter stylesheet, obsolete
home error-page styles, two unreferenced CTX images, and unused `react-router`
dependency were removed. The app uses its existing hash routing.

## Verification

Run `npm run lint` and `npm run build`. Run the Node tests in `tests/*.test.js`
and `src/features/mission-detail/*.test.js`. Build the isolated preview with
`npx vite build --config vite.mission.config.js` after the main build.

Manually check in Firefox: home expansion/collapse, region and Jezero selection,
mission panels, map focus, all three view modes, route movement, layer toggles,
historical replay, Back navigation and repeated mount/unmount. Node tests and
production builds do not verify WebGL rendering or visual layout.
