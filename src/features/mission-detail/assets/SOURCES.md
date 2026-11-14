# Brand asset sources

- `space-apps-2026.svg`: unmodified “Space Apps Logo Color and White.svg” from the [official 2026 logo pack](https://assets.spaceappschallenge.org/media/documents/NASA_Space_Apps_Logos_2026.zip), linked by the [Space Apps brand page](https://www.spaceappschallenge.org/brand/). Preserve aspect ratio and the supplied colorway. Used to identify the event; VISTA Mars remains a separate project name.
- `fira-sans-black.ttf`: Fira Sans, 900, served by [Google Fonts](https://fonts.gstatic.com/s/firasans/v18/va9B4kDNxMZdWfMOD5VnFK_uQQ.ttf). License: `FiraSans-OFL.txt` from [google/fonts](https://github.com/google/fonts/blob/main/ofl/firasans/OFL.txt).
- `overpass-regular.ttf`: Overpass, 400, served by [Google Fonts](https://fonts.gstatic.com/s/overpass/v19/qFda35WCmI96Ajtm83upeyoaX6QPnlo6_PPrOQ.ttf).
- `overpass-semibold.ttf`: Overpass, 600, served by [Google Fonts](https://fonts.gstatic.com/s/overpass/v19/qFda35WCmI96Ajtm83upeyoaX6QPnlo6IvTrOQ.ttf).
- `overpass-bold.ttf`: Overpass, 700, served by [Google Fonts](https://fonts.gstatic.com/s/overpass/v19/qFda35WCmI96Ajtm83upeyoaX6QPnlo6G_TrOQ.ttf). License for all three: `Overpass-OFL.txt` from [google/fonts](https://github.com/google/fonts/blob/main/ofl/overpass/OFL.txt).

Retrieved 2026-11-14. The brand page lists Fira Sans for headings and Overpass for interface/body copy. Font family aliases in CSS prevent interference with the shared app. Fonts and the event logo are bundled locally; the existing historical NASA surface photograph remains remote with visible provenance in the science brief.

## Current full-screen interface typography

The current interface follows the typography roles in [NASA Graphic Standards](https://www.nasa.gov/nasa-brand-center/brand-guidelines/). It does not display a NASA identifier or an event header. The earlier Fira Sans, Overpass and Space Apps logo assets above are retained reference assets and are no longer imported by the current demo.

- `inter-semibold.ttf` and `inter-bold.ttf`: [Inter 600](https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf), [Inter 700](https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf), from Google Fonts. `Inter-OFL.txt` from [google/fonts](https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt).
- `public-sans-regular.ttf` and `public-sans-semibold.ttf`: [Public Sans 400](https://fonts.gstatic.com/s/publicsans/v21/ijwGs572Xtc6ZYQws9YVwllKVG8qX1oyOymuFpm5ww.ttf), [Public Sans 600](https://fonts.gstatic.com/s/publicsans/v21/ijwGs572Xtc6ZYQws9YVwllKVG8qX1oyOymuyJ65ww.ttf), from Google Fonts. `PublicSans-OFL.txt` from [google/fonts](https://github.com/google/fonts/blob/main/ofl/publicsans/OFL.txt).
- `dm-mono-regular.ttf`: [DM Mono 400](https://fonts.gstatic.com/s/dmmono/v16/aFTU7PB1QTsUX8KYhh0.ttf), from Google Fonts. `DMMono-OFL.txt` from [google/fonts](https://github.com/google/fonts/blob/main/ofl/dmmono/OFL.txt).

Retrieved 2026-11-14. CSS aliases are Mission Inter, Mission Public Sans and Mission DM Mono. The existing blue/white/yellow palette is preserved; black is used only as the user-requested map placeholder background. No new photographic or AI-generated assets were introduced.
