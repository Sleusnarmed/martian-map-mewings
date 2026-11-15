# Jezero science points and offline references

The local map includes **13 science sites plus Jezero’s published center**.
All native symbols are available in 2D, 2.5D and immersive 3D. Hover reveals the
name; selecting a site keeps its name above its symbol and adds a white selection
ring. It remains selected while moving the cursor, panning or switching views.
Selecting another site replaces it; Escape clears the pinned marker.
The coordinate inspector can be dismissed independently.

Science-site selection opens **Information → Science**, using the same panel
and paging controls as Jezero and Wildcat. Additional sites have three pages:
science summary, published position, and local source records. They do not
create a separate map card or coordinate-inspector popup. Changing sites resets
Science to its first page; switching to Route or Telemetry preserves the chosen
site. Selecting a region restores its regional brief. Native marker labels and
the automatic zoom for overlapping symbols remain available.

Science includes **Use as A** and **Use as B**, including the regional Jezero
and Wildcat briefs. Assignment opens Route with the chosen coordinates and
preserves the other endpoint. Alternatively, select A or B in Route and tap a
science symbol: its published position fills that endpoint directly, retaining
the Route view. Science browsing without an active endpoint request still
opens Science. Changing an endpoint invalidates any previous calculated route.

A click on overlapping science symbols zooms toward the closest geographic pair.
Coordinates are never displaced to make room. The camera preserves 2D or oblique
perspective; a group selected during surface exploration opens a closer oblique
view for disambiguation. Isolated markers and already separated points do not
trigger this zoom. Map view → Science points provides equivalent named buttons
for keyboard and touch selection, including sites outside the current viewport.

The sites cover the crater floor, delta front, upper fan and western margin.
Perseverance’s well-documented named sampling sites are concentrated in western
Jezero. This is not a complete inventory of every landform across the crater;
unverified coordinates were not invented for unvisited eastern sectors.

## Published positions

All numbers are planetocentric latitude north and longitude east. A sample
location represents its parent site; it is not a surveyed outcrop boundary.
The NASA PDS Initial Reports are preliminary field records whose measurements
and interpretations may be revised. Their report numbering includes witness
tubes and differs from NASA’s public rock-sample numbering.

| Site / sample | Latitude N | Longitude E | Coordinate source |
| --- | ---: | ---: | --- |
| Wildcat Ridge / Hazeltop | 18.45863707 | 77.40588851 | Volume 2 Release 2 · M2020-509-14 · printed 14-1, PDF 58 |
| Skinner Ridge / Swift Run | 18.458931 | 77.40617078 | Volume 2 Release 2 · M2020-490-11 · printed 11-1, PDF 14 |
| Amalik / Shuyak | 18.45068954 | 77.40143171 | Volume 2 Release 2 · M2020-575-16 · printed 16-1, PDF 100 |
| Rochette / Montdenier | 18.43074132 | 77.44436502 | Volume 1 Release 2.2 · M2020-190-3 · printed 3-1 |
| Brac / Salette | 18.43397 | 77.44301 | Reports 1–10, August 2022 · M2020-262-5 · printed 5-1 |
| Issole / Robine | 18.43264 | 77.44133 | Reports 1–10, August 2022 · M2020-298-7 · printed 7-1 |
| Berea / Melyn | 18.47021736 | 77.38394465 | Volume 3 · M2020-749-22 · printed 22-1, PDF 14 |
| Emerald Lake / Otis Peak | 18.4829798 | 77.36815348 | Volume 3 · M2020-822-23 · printed 23-1, PDF 48 |
| Dream Lake / Pilot Mountain | 18.48380149 | 77.3604692 | Volume 3 · M2020-882-24 · printed 24-1, PDF 86 |
| Hans Amundsen Memorial / Pelican Point | 18.48344692 | 77.35065098 | Volume 4 · M2020-923-25 · printed 25-1, PDF 14 |
| Turquoise Bay / Lefroy Bay | 18.48867278 | 77.34704595 | Volume 4 · M2020-949-26 · printed 26-1, PDF 49 |
| Bunsen Peak / Comet Geyser | 18.49186664 | 77.3272192 | Volume 4 · M2020-1088-27 · printed 27-1, PDF 87 |
| Cheyava Falls / Sapphire Canyon | 18.49747434 | 77.30514915 | Volume 4 · M2020-1215-28 · PDF 120 |

Sapphire Canyon’s printed opening page reads “26-1” despite its report ID ending
in 28; the product cites **PDF page 120** to avoid propagating that ambiguity.
Names associating samples with parent features are cross-checked against NASA’s
rock-sample catalogue. Jezero’s existing IAU/USGS center is 18.41° N, 77.69° E,
published to 0.01°, not metre accuracy.

## Primary sources checked 2026-11-15

- [NASA PDS archive and release notes](https://pds-geosciences.wustl.edu/missions/mars2020/returned_sample_science.htm): official archive authority, preliminary-report limitations and current volumes.
- [NASA PDS Volume 3](https://pds-geosciences.wustl.edu/m2020/urn-nasa-pds-mars2020_sample_dossier/initial_reports/initial_reports_volume3.pdf): DOI 10.17189/x0qh-rh91; headers on PDF pages 14, 48 and 86 read directly from the document.
- [NASA PDS Volume 4](https://pds-geosciences.wustl.edu/m2020/urn-nasa-pds-mars2020_sample_dossier/initial_reports/initial_reports_volume4.pdf): DOI 10.17189/mzx3-k371; headers on PDF pages 14, 49, 87 and 120 read directly from the document.
- [NASA PDS Volume 1 Release 2.2](https://pds-geosciences.wustl.edu/missions/mars2020/Mars%202020%20Initial%20Reports%20Volume%201%20Release%202.2.pdf): Montdenier position.
- [NASA PDS Reports 1–10, August 2022](https://pds-geosciences.wustl.edu/missions/mars2020/Mars%202020%20Initial%20Reports%201-10%20August%202022.pdf): Salette and Robine positions retained at this edition’s precision.
- [NASA PDS Volume 2 Release 2](https://pds-geosciences.wustl.edu/missions/mars2020/Mars%202020%20Initial%20Reports%20Volume%202%20Release%202.pdf): the three existing delta references.
- [NASA rock-sample catalogue](https://science.nasa.gov/mission/mars-2020-perseverance/mars-rock-samples/): sample/outcrop associations and geological campaign context.
- [NASA: Rochette after sampling](https://www.nasa.gov/image-article/rochette-after-perseverance-sampling-2/).
- [NASA: To Séítah and Back](https://science.nasa.gov/blog/to-seitah-and-back/).
- [NASA: Berea sampling](https://science.nasa.gov/resource/perseverance-samples-berea/).
- [USGS/IAU Jezero entry](https://planetarynames.wr.usgs.gov/Feature/14300).

## Offline attribution and rendering

External navigation has been removed from the product. Source actions are local,
expandable records showing publisher, dataset/report identifier, edition and
page where available. The bibliography URLs remain development provenance;
they are not rendered as navigable links. Full PDF reports are not bundled.
The home team list includes @Eduardo450 as plain GitHub attribution. Cesium’s
credit is retained as text in Data attribution. The Science image uses the
already packaged Wildcat mosaic instead of fetching a remote NASA image.

This change removes web exits; it does **not** certify complete offline operation.
The planetary globe still requests NASA Trek tiles, and index.html still loads
Google Fonts CSS. Those network dependencies require a separate packaging/cache
pass before a fully disconnected deployment. Local terrain, source records and
science-point metadata are packaged.

Cesium owns all marker positions, symbols and labels; no HTML geographic overlay
or fabricated spacing is introduced. Existing annotation offsets are retained:
Wildcat 25 m, Jezero center 40 m, other science markers 2 m above sampled terrain.
These are drawing offsets, not surveyed elevation changes or line-of-sight
assurances. In surface view, markers still need to lie inside the camera’s field
of view; backing away from a site beneath the camera reveals its annotation.

Hover uses native entity projections and avoids GPU picking; it pauses during
camera movement. Pinning and close update labels without continuous animation.
Tests check all coordinate fixtures, regional coverage, selection/hover lifetime,
source identifiers and clustered-point framing. Broader additions use regional
CTX elevation outside the local Wildcat HiRISE patch; annotation visibility does
not assert traversability or relax route limits.

## Validation

On phone layouts, selected names wrap without abbreviating the site and the
camera focus occupies the clear area to the right of the perspective controls.
The former floating point card has been removed; site details now occupy the
existing Information panel.

Verified with 99 passing tests, ESLint, the production build and the isolated
mission-detail build. Live captures cover grouped-point zoom, hover/pinning,
2D, oblique and surface markers, local attribution, tablet and phone layouts.
The earlier independent finish review marked both phone-label and subtitle-priority
findings resolved. Subtitle captures use an explicitly labelled layout fixture;
they do not test actual speech playback. The longest Hans Amundsen name was
visually checked on desktop and covered by the wrapping test, but its phone
capture could not be completed after the browser viewport override stopped
applying. Cheyava's phone capture confirms the same wrapping and framing path.

The subsequent Science-panel integration passed the 99-test suite, ESLint and
the production build. Live desktop checks covered list and native-symbol
selection, all three Science pages, switching sites, returning from Route to
Science, and restoring Wildcat's region brief. An independent code/capture
review approved this scoped integration; responsive captures above belong to
the earlier marker work, not a new responsive audit of the Science panel.
