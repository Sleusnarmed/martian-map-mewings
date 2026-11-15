# Local route planning

Branch implementation: endpoint selection → A* route → traversal → observation →
replanning → return, using one state for the map, HUD, information, alerts and voice.
Local language models, conversational commands and D* Lite remain pending.

## Try it

1. `npm install`, `npm run dev`, open `/#/mars/wildcat-ridge`.
2. Tap a location or the Wildcat marker. The inspector shows latitude, east-positive
   longitude and MOLA elevation. A reference reports its published coordinates,
   not the terrain under the label's screen position.
3. Choose Use as A or Use as B. Alternatively, Information → Route → Plan provides
   endpoint picking and manual coordinates. Neither endpoint has a runtime preset.
4. Calculate route; then open Traverse and use Advance 25 m or Start traverse.
   Return to A computes a new route from the current mission position.
5. Events → Place an unobserved obstacle ahead, then continue. Observations within
   65 m of its perimeter pause traversal and request a new route. The obstacle is
   a scenario input, not a detected Martian hazard. Report blocked area on any
   inspected point adds an immediately known 20 m radius exclusion plus 5 m buffer.
6. Add an 8 minute delay to revalidate resources. Clear route starts a new mission;
   known blocked areas persist until explicitly removed in Events.
7. Map view toggles route, known blockages, unobserved-ground shading and the
   incumbent imagery, slope, elevation, contours, geology and modeled sunlight.
   Hidden visual layers still participate in planning where applicable.

For a reproducible test, manually enter A = 18.4516° N, 77.4022° E and
B = 18.45863707° N, 77.40588851° E. These are documentation/test inputs only.
With the current DEM and defaults the computed path is approximately 506 m.

## Planning contract

- Finite local search: endpoints at most 6 km apart, crop around them with padding,
  bounded grid (about 161 cells per side), eight neighbors and no corner cutting.
  Fine coverage uses a minimum 6 m planning grid; other regions use the regional
  display resolution. Grid size increases to respect the node bound.
- Elevation is bilinearly sampled; local slope uses the source grid available at
  that coordinate, preferring HiRISE only inside its fully blended core. Adjacent
  edge samples also enforce the directional grade limit. No-data is blocked.
- Known circular exclusions, slope and edge sampling are hard constraints.
  The terrain preference minimizes estimated duration weighted by slope exposure
  and a modest unobserved-ground penalty. Distance preference minimizes distance,
  while preserving the same constraints. The heuristic is a lower bound.
- Exact A/B connectors are checked. No visual path smoothing shortcuts hazards.
  This is optimal for the discretized search with its selected endpoint connectors,
  not a guarantee of the globally safest continuous path. Failure means no
  compatible route found in this bounded search, not proof of impossibility.
- Before acceptance, check outbound + activity + return + reserve against both
  remaining time and oxygen autonomy. Return includes a conservative backtracking
  fallback and a separately searched path. Uphill/downhill durations differ.
  A reachable return with insufficient reserve can be shown with an explicit
  warning; an outbound plan cannot spend the required reserve.
- Known hazards are retained when endpoints change. Replacing endpoints resets
  excursion time/position. Worker versions reject stale results; replacing a
  request terminates its worker. There is no network call for route planning.

## Mission assumptions and data boundaries

Defaults: 0.5 m/s level pace, 20° slope threshold, 60 min budget, 60 min oxygen
autonomy, 5 min activity and 5 min reserve. These are adjustable scenario inputs,
not validated EVA limits. Duration factor is 1 + 3×positive grade + absolute grade.
Oxygen autonomy decreases with the same elapsed traversal/added-delay time.
Pausing playback pauses that clock; hidden tabs do not advance it. This is not a
live suit feed. Camera exploration does not spend resources or move the astronaut.

Survey coverage means locally observed versus known from orbit. Orbital elevation
is available before exploration. Hidden obstacle locations never reach the worker
until observed, including at accelerated playback speeds. Its observations and
reported blockages are scenario/operator inputs, not automated perception.

Geology is a raster context layer, MEDA is historical point data, solar heating is
relative modeled incidence. None becomes a measured spatial safety/temperature
field by toggling it. Foot-scale obstacles cannot be inferred from these DEMs.

## Checks

`node --test tests/*.test.js src/features/mission-detail/*.test.js`
`npm run lint`
`npm run build`
`npx vite build --config vite.mission.config.js`

UI checks: exact POI coordinates and free clicks, A/B replacement, blocked/same/
outside endpoints, route loading/failure, traversal and return, delay, discovery,
layer toggles, alert audio, reduced motion, tablet landscape/portrait, compact
layout, and repeated panel opening without recreating the Cesium viewer.
