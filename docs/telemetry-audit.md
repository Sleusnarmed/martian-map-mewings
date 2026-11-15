# Jezero telemetry audit — 2026-11-15

Scope: the integrated Jezero/Wildcat mission's Telemetry tab, persistent HUD,
Route → Plan/Traverse resource assessment, and traversal/replanning calculations.
`MissionWorkspace` uses `RouteMissionProvider.mission` here, not the legacy demo
scenario fixtures. This audit checks arithmetic and consistency of the simulation;
it does not validate astronaut physiology or certify terrain traversability.

## Findings and corrections

- A time-limited step could span multiple terrain segments and then scale distance
  as if their walking speeds were equal. A synthetic mixed-grade route consumed
  24.52665 seconds across 190 requests of 0.1 seconds, instead of 19 seconds.
  Traversal now integrates each constant-speed segment separately. Long and short
  ticks produce equal time, distance and return margins (within floating-point error).
- Steps checked reserves/resources after movement, allowing overshoot. They now
  stop at the available time or outbound return-reserve boundary before committing
  position and elapsed time. Negative/nonfinite movement and delays are rejected.
- Route assessment's “Available now” previously displayed the worker's old values.
  The panel now derives availability, remaining travel and minimum total resources
  from current elapsed time/progress. The worker result stays immutable; EVA's
  explicitly labelled “available when calculated” responses remain unchanged.
- “Current delay” is now “Added delays”: it is an accumulated duration, already
  included in elapsed time, not a pending countdown. The telemetry heading explicitly
  identifies the values as simulated. Planned activity is labelled as an allowance.

## Verified definitions

All internal time values are seconds and distance values are metres.
For elapsed time `E`, mission budget `B`, initial oxygen autonomy `O`, and estimated
return time from the current position `R`:

- Time return margin = `B - E - R`.
- Oxygen autonomy = `max(0, O - E)`.
- Oxygen return margin = `O - E - R` (a negative value represents a deficit).
- HUD return margin = the smaller of the two return margins.
- Reserve comparison uses full-precision values, not rounded labels.
- Delays increment both accumulated delay and elapsed time exactly once.
- On outbound traversal, `R` is the faster of backtracking to the route start plus
  its verified return path, or continuing to B plus B's searched return path.
  Directed uphill/downhill timings are retained. On return, `R` is remaining
  return-leg time; arrival at A gives zero.
- The conservative allowance used to approve a complete excursion can exceed the
  searched return from B. Consequently, summing just the two displayed journey
  times is not the complete minimum: activity and reserve also contribute.

The unchanged duration assumption is `d / pace * (1 + 3*max(0, grade) + abs(grade))`,
with `grade = height change / d`. Here `d` is horizontal great-circle distance on
Mars's reference sphere (radius 3,396,190 m), not a measured 3D footpath length.
Distance remaining is the sum of those route segments, not straight-line distance.
The nominal pace and slope multiplier are simulation assumptions, not EVA measurements.

Playback advances simulated time in discrete timer ticks, at the selected 1×/10×/30×
rate; browser scheduling is not a real-time clock guarantee. Pause and hidden tabs
freeze traversal time. Camera movement does not advance the astronaut. Activity at
B is reserved during planning but is not automatically executed/charged at arrival;
added delays are the existing mechanism for spending stationary simulation time.

## Precision and provenance

Times are rounded to 0.1 minute (6-second increments, at most 3 seconds rounding
error per value), remaining distance to whole metres. Rounding occurs only in the
presentation functions. Near a threshold, rounded values can look equal while the
full-precision comparison correctly reports a reserve shortfall.

The checked files identify regional CTX elevations on an approximately 53 m display
grid and local HiRISE elevations on approximately 3 m spacing, sampled from source
DEMs identified in `public/terrain/jezero/metadata.json` and `wildcat-hi.json`.
Those spacings are not vertical/horizontal accuracy guarantees. This audit used
those shipped grids; it did not independently reprocess their original GeoTIFFs.
Oxygen is an assumed time capacity; no pressure, metabolic consumption or suit
sensor is connected. Historical MEDA replay is a separate clock and data source.

## Reproducible shipped-grid check

Default settings, A = 18.4516° N, 77.4022° E;
B = 18.45863707° N, 77.40588851° E:

| Quantity | Internal result | Display |
| --- | ---: | ---: |
| Route length | 482.270727 m | 482 m |
| Outbound duration | 1087.409839 s | 18.1 min |
| Searched return from B | 1068.456233 s | 17.8 min |
| Conservative return allowance | 1071.581101 s | 17.9 min |
| Minimum total including activity/reserve | 2758.990940 s | 46 min (rounded upward) |
| Elapsed after advancing 100 m | 215.926507 s | 3.6 min |
| Distance remaining after 100 m | 382.270727 m | 382 m |
| Current return estimate after 100 m | 213.515713 s | 3.6 min |
| Oxygen remaining after 100 m | 3384.073493 s | 56.4 min |
| Both return margins after 100 m | 3170.557781 s | 52.8 min |

Regression coverage: `tests/missionTelemetry.test.js`, `routeAssessment.test.js`,
`missionPresentation.test.js`, and the existing route-planner/terrain tests.
Browser appearance and live hardware telemetry are outside this verification.
