# Space Apps styling for the regional view

Authority: https://www.spaceappschallenge.org/brand/ and the linked [May 23, 2025 guidelines](https://assets.spaceappschallenge.org/media/documents/Space_Apps_Brand_Guide_-_23_May_2025.pdf), pages 7–13 and 17–19.

The regional explorer uses Deep Blue (#07173F) and Electric Blue (#0042A6) surfaces, white body text, Fira Sans Bold/Black headings and Overpass body/control text. Neon Yellow (#EAFE07) is reserved for small interactive accents and focus indicators. The header gradient runs from Electric Blue at the upper left to Deep Blue at the lower right. Text sits on opaque surfaces, including map overlays. Selection also uses borders and aria-pressed; color is not the only state indicator.

Fonts load from Google Fonts with display=swap and an Arial fallback. An internet connection is needed on first font load. For an offline distribution, bundle the corresponding licensed font files and replace the stylesheet link with local @font-face rules.

The project name is plain text, not a recreated Space Apps logo. The generic starter favicon has been removed. The scope is the regional explorer only.

The map now uses a original slate/green/sand/rust elevation palette and shaded relief at the user’s request; the Space Apps blue palette still applies to the surrounding UI. Its legend retains numeric endpoints and units. This is a cartographic encoding of height, not a natural-color photograph. Desktop keeps the map beside its controls; small screens stack controls above the map. Keyboard focus, labeled controls, 44px controls, and reduced-motion handling are included.
