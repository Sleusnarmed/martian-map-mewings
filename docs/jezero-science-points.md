# Additional Jezero science references (local 3D only)

These additions are on `main`, based on `master` at `e69f12b`. The old `main`
head was preserved as `backup/main-before-jezero-pois-466a0e2`. `master` was not
modified by this work.

Select the local map's **3D** perspective to see the additional points. Hover
for details and click a marker to pin its card and open its published sources.
Returning to 2D or 2.5D removes the additional markers and the detail card.
Jezero's existing center and Wildcat Ridge remain available in their original
perspectives. No new globe destinations, automatic routes or hazards are added.

## Coordinate provenance

Both new positions were transcribed from the already downloaded NASA PDS
*Mars 2020 Initial Reports, Volume 2, Release 2*. The archive describes these
as preliminary sample-acquisition reports, not final surveyed outcrop boundaries.

| Map point | Sample | Latitude north | Longitude east | Printed pages | PDF page |
| --- | --- | ---: | ---: | --- | ---: |
| Skinner Ridge · Swift Run | M2020-490-11 | 18.458931° | 77.40617078° | 11-1 (position), 11-2 (outcrop context) | 14 |
| Amalik · Shuyak | M2020-575-16 | 18.45068954° | 77.40143171° | 16-1 (position), 16-2 (outcrop context) | 100 |

- [PDS report: Swift Run, page 14](https://pds-geosciences.wustl.edu/missions/mars2020/Mars%202020%20Initial%20Reports%20Volume%202%20Release%202.pdf#page=14)
- [PDS report: Shuyak, page 100](https://pds-geosciences.wustl.edu/missions/mars2020/Mars%202020%20Initial%20Reports%20Volume%202%20Release%202.pdf#page=100)
- [NASA: Skinner Ridge and Wildcat Ridge in Jezero's delta](https://science.nasa.gov/photojournal/2-perseverance-sampling-locations-in-jezeros-delta/)
- [NASA: Shuyak and Mageik from Amalik](https://science.nasa.gov/resource/meet-the-mars-samples-shuyak-and-mageik-samples-14-and-15/)
- [NASA PDS archive and report revision history](https://pds-geosciences.wustl.edu/missions/mars2020/returned_sample_science.htm)

Local report SHA-256:
`7a9ed0e1ea15eb3ffa61c5c52082e42da0e884a2d1a11e92795f5265535c6469`.
Coordinates retain the report's digits without implying equivalent positional
accuracy. Skinner Ridge is close to Wildcat Ridge; its location was not shifted
for visual spacing. Shuyak and Swift Run are sample locations representing their
parent outcrops. They are not outcrop centers or perimeter definitions.

Markers use the original native Cesium entities, not a projected HTML overlay.
Jezero and Wildcat retain their original styling and display offsets (40 m and
25 m above sampled DEM elevation respectively). These offsets lift annotations
for readability; they do not change their published longitude/latitude or the
inspector elevation. New 3D-only points use the existing 2 m display offset.
React renders the science detail card only; Cesium positions and picks markers.

Source metadata and summaries are bundled, so hovering needs no network request;
opening a source link requires connectivity.

`tests/jezeroPoints.test.js` checks coordinates, provenance, mode filtering over
repeated switches, and finite coverage in the shipped regional and local grids.
The `walk` perspective is the UI's **3D** mode. Checking Cesium `SCENE3D` would be
wrong here: its engine also renders the 2D/2.5D camera perspectives.

## Recheck of all geographic coordinates

Rechecked 2026-11-15. The [USGS/IAU Jezero entry](https://planetarynames.wr.usgs.gov/Feature/14300)
reports the center at 18.41° N, 77.69° E (planetocentric, positive-east). The center
is published to 0.01°, not metre precision. It is not the centroid of the displayed
image crop or an independently fitted crater rim. The [Hazeltop report, PDF page 58](https://pds-geosciences.wustl.edu/missions/mars2020/Mars%202020%20Initial%20Reports%20Volume%202%20Release%202.pdf#page=58)
lists Wildcat's sample reference at 18.45863707° N, 77.40588851° E. Both agree with
the stored values, as do Swift Run and Shuyak above. These coordinates were not
shifted to compensate for a rendering error.

The original Cesium marker implementation was restored after the HTML overlay
failed the user's visual checks. Source-coordinate tests do not establish
independent survey accuracy or replace browser/imagery registration inspection.

Native marker stability: perspective changes toggle entity visibility instead of
recreating entities. All POI annotations bypass terrain depth testing, including
Wildcat, so they remain readable through relief (not proof of line of sight).
Hover picking requests a visible render in the on-demand scene. Coordinates,
DEM display offsets and native Cesium positioning are unchanged.
