---
name: VISTA Mars · Mission detail
description: Scoped NASA Space Apps Challenge 2026 adaptation of the science brief, mission HUD and voice controls.
colors:
  deep-blue: "#07173f"
  electric-blue: "#0042a6"
  white: "#ffffff"
  neon-yellow: "#eafe07"
  blue-yonder: "#2e96f5"
  martian-red: "#8e1100"
  muted-on-dark: "#b9cbe8"
  muted-on-white: "#46567a"
  border-on-dark: "#5777ac"
  border-on-white: "#b1bed5"
typography:
  display:
    fontFamily: "Mission Fira Sans, sans-serif"
    fontSize: "clamp(36px, 4.3vw, 58px)"
    fontWeight: 900
    lineHeight: 1.06
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Mission Fira Sans, sans-serif"
    fontSize: "clamp(26px, 2.6vw, 34px)"
    fontWeight: 900
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Mission Overpass, Segoe UI, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "Mission Overpass, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Mission Overpass, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: "Mission Overpass, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  metric:
    fontFamily: "Mission Overpass, Segoe UI, sans-serif"
    fontSize: "clamp(26px, 2.5vw, 34px)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
rounded:
  control: "4px"
  panel: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  section: "22px"
  group: "24px"
  column: "28px"
  panel: "32px"
components:
  button-primary:
    backgroundColor: "{colors.neon-yellow}"
    textColor: "{colors.deep-blue}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  button-primary-hover:
    backgroundColor: "{colors.white}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  button-outline-hover:
    backgroundColor: "{colors.electric-blue}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.muted-on-dark}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  scenario-selected:
    backgroundColor: "transparent"
    textColor: "{colors.neon-yellow}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 15px"
  tag:
    backgroundColor: "transparent"
    rounded: "{rounded.control}"
    padding: "4px 8px"
  science-panel:
    backgroundColor: "{colors.white}"
    textColor: "{colors.deep-blue}"
    rounded: "{rounded.panel}"
    padding: "clamp(20px, 2.5vw, 32px)"
  mission-panel:
    backgroundColor: "{colors.deep-blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.panel}"
    padding: "clamp(20px, 2.5vw, 32px)"
---

# Design System: VISTA Mars · Mission detail

## Overview

**Visual authority: NASA Space Apps Challenge 2026.** This document records the reviewed brand adaptation in `src/features/mission-detail/*` and `mission-demo.html`. It is available to teammates as a proposed reusable style. It does not describe or prescribe the current styling of the rest of the shared app.

The implemented surface pairs a Deep Blue mission area with a White science brief and an Electric Blue event header. The official event logo identifies Space Apps; VISTA MARS remains a separate project name. Scientific evidence, simulated exercise inputs and missing data keep their visible labels. This is a component preview for rehearsing a local excursion in Jezero with Wildcat Ridge as its science stop.

The source of truth is `src/features/mission-detail/mission-detail.css`, together with `MissionDetailDemo.jsx`, `RegionDetail.jsx`, `MissionHUD.jsx` and `VoiceControls.jsx`. Product context comes from `Context.md` and the feature `README.md`. The pinned identity is the [official Space Apps brand guide](https://www.spaceappschallenge.org/brand/); local assets, licenses and source links are recorded in `src/features/mission-detail/assets/SOURCES.md`. No invented visual metaphor is required for this brand application.

**Key Characteristics:**

- Fira Sans Black headings and Overpass body text and controls.
- Flat, bordered panels with distinct light and dark reading contexts.
- Neon Yellow accents for controls, selection and attention labels.
- Source photographs with separate, visible provenance.
- Explicit warning, missing-data and audio-availability states.

## Colors

Frontmatter values are normative; the names below describe their implemented roles.

### Primary

- **Deep Blue:** page shell, HUD and method note backgrounds; foreground on the science brief and primary action.
- **Electric Blue:** event header, science links, exercise-objective label and enabled outline/scenario hover backgrounds.

### Secondary

- **Neon Yellow:** primary return action, selected region and scenario outlines/text, checkbox accent, dark-context focus outlines, selection and warning attention labels.
- **Blue Yonder:** ordinary status dot, geographic-sequence chevrons, ordinary limiting-margin value, hover borders and scrollbar thumb.
- **Martian Red:** only the small numeric alert badge on the White information-tab bar, with a White glyph. This compact badge is not a body-text background.

### Neutral

- **White:** science-brief background and dark-context headings/body text; enabled primary-action hover background.
- **Muted on dark / Muted on white:** secondary labels, explanatory notes and provenance in their respective reading contexts.
- **Border on dark / Border on white:** panel boundaries, dividers, tags and unselected controls in their respective contexts. The header tag has its own lighter border in the source stylesheet.

**The Body Background Rule.** Body text sits on Deep Blue, Electric Blue or White backgrounds, following the official brand guidance. This is a restriction on body-text backgrounds; it does not prohibit the implemented secondary foreground tints.

**The Accent Rule.** Neon Yellow stays on controls, selection and attention labels. It is not used as a broad page field or headline color. Full notice headings use the foreground for their reading context.

The stylesheet also reserves Neon Blue and Rocket Red brand variables. They have no visible role in this reviewed surface and are not active design tokens here.

## Typography

**Display Font:** Fira Sans Black, self-hosted under the family alias `Mission Fira Sans`, with sans-serif fallback.

**Body Font:** Overpass, self-hosted under `Mission Overpass`, with Segoe UI and sans-serif fallbacks. Available weights are regular (400), semibold (600) and bold (700).

### Hierarchy

- **Display:** the two-line introductory heading uses the responsive `display` role.
- **Headline:** science and HUD panel titles use the responsive `headline` role. On screens at or below the small breakpoint, the source fixes these titles at (27px).
- **Title:** notice titles use `title`; objective and compact section labels use smaller bold Overpass styles from the source.
- **Body:** scientific prose uses `body`, with a maximum width of (74ch). Objective and notice prose use smaller Overpass text; the base interface line-height is (1.5).
- **Label:** supporting labels use `label`. Tags and provenance use (11px); metric notes use (10px). Retain the actual sentence case of the content.
- **Button:** action and scenario text uses `button`.
- **Metric:** numerical values use `metric` with tabular numerals; the limiting return margin is (21px), bold (700).

## Layout

The tablet demo uses a viewport-height grid (`100dvh`, minimum height 520px): event header (72px), mission/exercise toolbar, flexible workspace and persistent mission HUD. `src/features/mission-detail/tablet-mission.css` supplies this composition on top of the existing brand stylesheet; its compact type and panel spacing override the reusable baseline tokens where specified. The event logo is (112px) wide. The footer occupies its own row and does not overlay the workspace.

At widths of (700px) and above, the schematic route map sits beside a White information pane with four horizontal tabs. The base columns are `minmax(0, 1fr) minmax(360px, 38%)`, with a (16px) gap and (16px 20px) workspace padding. At or below (1100px), the pane becomes `minmax(350px, 42%)`; from (700px) through (900px), it is (350px) wide with a (12px) gap and (16px) horizontal workspace padding. The pane has dedicated tab (52px), flexible content and pager (64px) rows; content padding is (20px), reduced to (16px) for compact tablets. Map headings use Fira Sans Black at (24px), with compact overrides; information headings use (25px). These tablet values supersede the former introductory-heading and side-by-side science/HUD composition.

Route, Science, Telemetry and Alerts contain (2/3/2/2) short pages. Previous/Next buttons provide the primary reading path. The map, current notice, reserve comparison, next reference, remaining distance, limiting return margin, oxygen autonomy, voice and Return remain outside the changing page. The full next-reference button is in the footer main row on wider tablets; at widths at or below (900px), a compact Next/Inbound reference stays visible in its status strip. The map has four dedicated rows: heading, drawable stage, map-control strip and legend/actions. Map controls sit outside the SVG drawing area. The normal nine-page flow fits the reviewed tablet targets (1024×768, 1280×800, 768×1024 and 774×763) without content scrolling.

Below (700px), map and information pane stack, workspace overflow is accessible, and the pane uses tab/pager rows of (48px)/(56px). At or below (600px), the toolbar wraps and footer metrics/actions stack. A compact-height rule applies at heights at or below (700px) with widths of at least (901px). The content pane retains internal vertical overflow for constrained height or text enlargement; do not clip information to preserve the normal no-scroll tablet composition.

## Elevation & Depth

The reviewed system has no box shadows. White science content, the Electric Blue header, Deep Blue mission content and thin borders define the hierarchy. The image is presented directly inside the science brief without a floating frame.

The only animated treatment is a short notice reveal using `clip-path`, lasting (220ms) with `cubic-bezier(.16, 1, .3, 1)`. It runs only when reduced motion is not requested. Notices remain visible without animation; the reduced-motion rule disables animation and smooth scrolling inside the scoped feature.

## Shapes

Controls, tags and the photograph use small corners (`rounded.control`); panels use larger corners (`rounded.panel`). Borders and fact/metric dividers are (1px). The status indicator is a circular dot (8px). Line icons use a (1.5px) stroke and rounded caps/joins, with a normal size of (18px) and smaller source/stop icons of (16px).

## Components

### Buttons

Actions are compact, text-led controls with a minimum height of (44px), a (1px) border and the `button` type role. The primary action uses Neon Yellow and Deep Blue; enabled hover changes its field to White. Outline actions have a transparent field and a contextual border; enabled hover uses Electric Blue and Blue Yonder. Quiet actions use muted text; enabled hover turns the label White and underlines it.

Keyboard focus uses a (2px) contextual accent outline with a (4px) offset: Neon Yellow in the dark area and Electric Blue in the science brief. Disabled buttons use opacity (.55) and a not-allowed cursor. The return action includes an inline directional icon; audio controls include speaker and stop icons. There is no additional active/pressed action-button treatment in the current source.

### Selection and navigation

The compact geographic toolbar exposes Syrtis Major as context and Jezero/Wildcat Ridge as region buttons with inline chevrons. The current region uses a Neon Yellow border and foreground with `aria-current`; hover uses Electric Blue. Region selection opens Science without moving the simulated astronaut. Exercise selection is a native dark-background select with a minimum height of (44px). The No data toggle uses `aria-pressed`, an accent border/text and an underline. There is no text-input component in this feature.

The information pane uses four equal-width horizontal tabs: Route, Science, Telemetry and Alerts. Selection combines Electric Blue foreground and a (3px) bottom rule on White; hover adds an underline. The tablist uses roving focus, Left/Right Arrow and Home/End navigation, selected-state semantics and linked tab panels. Focus outlines are inset with a (-5px) offset. Changing tabs resets the page. Previous/Next controls have (44px) minimum targets, disable at the boundaries, and flank a polite live page count. These controls replace the former long science/HUD reading flow; the earlier standalone scenario, checkbox and sequence primitives remain baseline examples rather than the current toolbar composition.

### Tags and panels

Outlined tags identify simulation and map-placeholder context. Their padding is (4px 8px), weight (600), line-height (1.4), with no filled tag field. The route map and information pane retain the existing panel corner geometry. The White information pane uses contextual Deep Blue text, muted supporting copy and dividers, with its padding assigned to the content and pager rows rather than the outer panel.

### Mission state and voice

The persistent Deep Blue footer separates a clickable current-notice strip and reserve label from the reference, three metrics and mission actions. The notice opens Alerts; the next-reference button opens Route through `onOpenAlerts`/`onOpenRoute`. Normal status uses Blue Yonder; below-reserve notice text/dot and limiting-margin value use Neon Yellow alongside explicit wording. Full notice text and provenance are read in the White Alerts pane, using its contextual foreground treatment. Return switches the demo to the reverse route and opens Route.

Unavailable values display “No data”; the footer says “Mission data unavailable” rather than substituting zero or an affirmative margin state. The current-notice summary is a polite live region. On-demand voice controls stay mounted in the footer across tab/page changes and read the full current notice; changing the notice resets their keyed state. Preserve unavailable/error/reading text and disabled controls. Exercise values are static snapshots, not live suit telemetry.

### Schematic route map

The route placeholder fills the flexible map stage between its heading and bottom action row. A Blue Yonder polyline, White waypoint symbols and labels, a Neon Yellow simulated-crew marker, subtle grid and contour ellipses describe an illustrative route. Zoom, crew centering and fit controls manipulate the diagram only. Route details opens Route; Inspect stop opens the destination's Science brief. Keep “schematic,” “simulated” and “not to scale” visible; the route geometry and crew position have no geographic coordinates or validated metric scale. Replace this component with the shared map during integration.

### Source photograph

Science separates the regional brief, historical surface photograph and sources/coverage into three pages. The photograph uses full content width, `object-fit: contain` and a maximum height of (150px), with compact overrides to (140px)/(130px). Its instrument, date and credit sit below the image, never over it. Processing and scientific-source information are on the next page. A dashed-border image fallback explains the failure and directs the reader to that source page. Preserve the distinction between historical evidence, illustrative map geometry and simulation.

## Do's and Don'ts

### Do:

- **Do** keep this documented scope explicit when proposing reuse elsewhere in the shared app.
- **Do** use the unmodified official 2026 SVG, preserve its aspect ratio and keep the event identity distinct from VISTA MARS.
- **Do** keep body text on Deep Blue, Electric Blue or White backgrounds.
- **Do** preserve visible source credits, simulation labels, missing-data text and keyboard focus.
- **Do** use the self-hosted heading and body fonts recorded in the asset source manifest.
- **Do** keep photograph provenance below the image and preserve the source link on failure.

### Don't:

- **Don't** use Neon Yellow as a broad content field or a headline color.
- **Don't** invent visible roles for the reserved Neon Blue or Rocket Red variables, or extend Martian Red beyond the implemented numeric alert badge.
- **Don't** overlay interface text on source photographs.
- **Don't** use color alone to communicate selection, warning or missing data.
- **Don't** present the scoped preview as evidence that the rest of the app already follows this system.
