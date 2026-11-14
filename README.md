# Interplanetary Surface Explorer

> Preliminary project brief for the NASA Space Apps Challenge 2026 — **Interplanetary Survival Guide: Martian Map**. The concept, scope, and data sources will be refined after the team reviews the event resources and rules.

## The challenge

Plan a human exploration route on Mars using an integrated, local view of data from multiple NASA science missions. A useful plan should help astronauts reach scientifically valuable destinations, recognize terrain and environmental constraints, and return safely.

## Our idea

Build a **reusable surface-exploration planning system**. Given a destination, mission goals, available observations, and operational constraints, it should help a crew answer:

- Where should we go, and what science could we do there?
- Which route best balances travel effort, estimated hazards, and scientific value?
- What observations support that choice, and where is the evidence insufficient?

**Mars is our first demonstration, not a hard-coded limit of the concept.** The planning questions and decision process should apply to other planetary surfaces when appropriate data and body-specific constraints are supplied. A credible Mars case study takes priority over a superficial demonstration on multiple worlds.

## Proposed mission scenario

Select one well-observed area on Mars, a starting point, one or two science destinations, and a return route. Jezero Crater is a candidate because NASA has published orbital imagery, elevation products, and Perseverance mission context for the region. The exact site and science question remain open until we check data coverage and resolution.

The demonstration should compare at least two plausible routes and explain their tradeoffs. For example, a shorter route might cross less certain terrain, while another might avoid a difficult slope or reach a valuable observation site. Route labels such as “safer” must be supported by the available evidence and stated assumptions; they are not guarantees of astronaut safety.

## Data questions

We will prioritize layers that answer a mission decision, potentially including:

| Data category | Decision it could support | Key limitation to check |
| --- | --- | --- |
| Orbital or surface imagery | Recognize landmarks and visible obstacles | Coverage, age, and spatial resolution |
| Elevation and slope | Compare terrain difficulty along routes | Whether the elevation model resolves local hazards |
| Geology or mineral observations | Choose science stops | Whether observations align with the route at a useful scale |
| Environmental measurements | Add context to mission constraints | Location, time, and whether the data are observations or estimates |

Every layer should identify its source, spatial coverage, resolution, observation date where relevant, and uncertainty. **No data** must not be interpreted as **no hazard**.

## What we hope to learn from the data

The central output is an **explainable route comparison**: why one path is recommended under a chosen set of mission priorities. A second useful outcome is identifying *which missing observation would most improve a decision*, such as better terrain coverage around an uncertain segment.

Estimates of travel effort or route difficulty may be considered if the data support them. We will not claim to predict exact local weather, radiation exposure, or unseen obstacles without suitable evidence and a defensible model.

## Reusability principle

The general planning model should distinguish between:

1. **Common concepts:** routes, stops, terrain constraints, scientific value, provenance, and uncertainty.
2. **Body-specific context:** coordinate system, gravity, environment, mobility assumptions, and operational limits.
3. **Mission-specific data:** imagery, elevation, observations, coverage, and time frame.

Extending the system to another world would require suitable data and validation for that world; changing the visual appearance of a globe alone would not make the analysis transferable.

## Presentation priorities

The primary view should make the *local* mission decision understandable. A 3D globe may help establish geographic context, but it is optional. The route, its science objectives, supporting observations, and uncertainty are the core of the demonstration.

## Decisions to make when the event begins

- Confirm the official challenge resources and local event rules.
- Choose a specific Mars site and scientific objective.
- Check which datasets overlap there and at what resolution.
- Define the mission's starting point, stops, time or distance budget, and return condition.
- Select a small set of defensible route criteria and decide how to communicate uncertainty.
- Decide which outputs are achievable within the hackathon window.

## Status

The `main` branch now integrates Héctor’s planetary home, the Mars globe, and the Jezero cartography demo. The planning discussion above describes future work; route planning is not implemented.

Run `npm install` and `npm run dev`. Select **Marte → Explorar Marte**, then the **Syrtis Major** globe marker, then **Cráter Jezero** or **Jezero – Wildcat Ridge**. Other planets have no destination. The home screen embeds the real Cesium globe; Explorar Marte expands that same viewer without a URL change. Sistema solar collapses it. Terrain navigation still uses hash links and browser history. The Space Apps loader is indeterminate, not download progress. The globe renders on demand at up to 30 FPS, with capped pixel density and no automatic rotation.

Direct routes: `/#/`, `/#/mars`, `/#/mars/jezero`, and `/#/mars/wildcat-ridge`. Terrain always opens in 2.5D, with Wildcat Ridge centered in a close-up. Globe imagery requires NASA Trek connectivity; the prepared regional DEM is local.

Integration checkpoints, in order:
- `c824565`: import Héctor’s home from `~/Documents/NAsa/cosmic-voyager-react`.
- `06fc7b1`: merge `origin/feat/mars-3d-globe` (locally available `a93eb79`).
- `4e43d96`: merge `cartography` and reconcile Cesium build assets.

The original branches and Héctor’s source folder are preserved. GitHub DNS was unavailable during integration, so the remote branch could not be refreshed. Validate with `npm run build`, `npm run lint`, `node tests/navigation.test.js`, and `node tests/terrain.test.js`. Browser/WebGL interaction still needs a manual check on a machine with a browser.

