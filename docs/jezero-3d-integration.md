# Jezero map integration into master

Merged local `origin/eduardo/jezero-3d` at `693d96c` into master at `78787f8`.
The remote could not be refreshed because GitHub DNS was unavailable.
Rollback checkpoint: `backup/master-before-jezero-3d-20261114`.

The mission workspace, case fixtures, destination and remaining-resource HUD,
information tabs, alerts, voice controls, home and navigation remain unchanged.
The existing embedded terrain adapter and panel framing are preserved.

The active map uses Eduardo's CTX imagery, local HiRISE imagery and elevation
package, detail-aware terrain provider, DEM picking, geology and slope layers.
The Map view panel exposes imagery, elevation colors, geology, slopes and contours.
HiRISE imagery loads near Wildcat Ridge; fine elevation tiles are restricted to
its source coverage. Missing local elevation detail falls back to regional CTX.
Master's bounded wheel/drag zoom remains in place.

Eduardo's standalone route, walking and environment components are retained in
Git but not mounted in the mission workspace. They do not replace or drive the
existing destination, remaining-distance or resource fixtures.

Validation: ESLint, production build, and all four Node test files. This includes
HiRISE tile seams and availability, detail blending, DEM picking, camera bounds,
zoom safeguards, globe interaction and navigation. Mission and navigation files
were compared byte-for-byte against the pre-merge checkpoint. Browser/WebGL visual
verification is still required locally.
