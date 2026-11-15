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

Eduardo's exploration tools are now mounted inside Map view: 2D, Auto 2.5D,
3D explore, the preset Wildcat route, filters, MEDA replay, solar heating and
photos. They do not drive the existing mission destination, remaining-distance
or resource fixtures. Map route progress is explicitly a separate demo.
Use Map view → 3D explore (or the Wildcat close-up action) to start the route;
W/S moves, A/D turns, drag looks, and on-screen arrows also work. Choose 2D or
Auto 2.5D to leave walking mode. Show Wildcat demo route toggles the path outside
walking mode. Environment replay and filters share their own historical clock.

Validation: ESLint, production build, and all four Node test files. This includes
HiRISE tile seams and availability, detail blending, DEM picking, camera bounds,
zoom safeguards, globe interaction and navigation. Mission and navigation files
were compared byte-for-byte against the pre-merge checkpoint. Browser/WebGL visual
verification is still required locally.
