---
name: VISTA Mars · Full-screen mission interface
description: Scoped mission demo with a full-screen map canvas, collapsible information and persistent instruments.
colors:
  deep-blue: "#07173f"
  electric-blue: "#0042a6"
  white: "#ffffff"
  neon-yellow: "#eafe07"
  blue-yonder: "#2e96f5"
  martian-red: "#8e1100"
  muted-on-dark: "#b9cbe8"
  border-on-dark: "#5777ac"
  map-black: "#000000"
typography:
  headline:
    fontFamily: "Mission Inter, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Mission Inter, sans-serif"
    fontSize: "22px"
    fontWeight: 600
  reference:
    fontFamily: "Mission Inter, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
  reference-mobile:
    fontFamily: "Mission Inter, sans-serif"
    fontSize: "19px"
    fontWeight: 600
  body:
    fontFamily: "Mission Public Sans, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  prose:
    fontFamily: "Mission Public Sans, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  notice:
    fontFamily: "Mission Public Sans, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  control:
    fontFamily: "Mission Public Sans, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  tab:
    fontFamily: "Mission Public Sans, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
  label:
    fontFamily: "Mission Public Sans, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  metadata:
    fontFamily: "Mission Public Sans, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 400
  note:
    fontFamily: "Mission Public Sans, Segoe UI, sans-serif"
    fontSize: "10px"
    fontWeight: 400
  micro:
    fontFamily: "Mission Public Sans, Segoe UI, sans-serif"
    fontSize: "9px"
    fontWeight: 400
  micro-compact:
    fontFamily: "Mission Public Sans, Segoe UI, sans-serif"
    fontSize: "8px"
    fontWeight: 400
  metric:
    fontFamily: "Mission DM Mono, monospace"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.15
  metric-medium:
    fontFamily: "Mission DM Mono, monospace"
    fontSize: "23px"
    fontWeight: 400
    lineHeight: 1.15
  metric-tablet:
    fontFamily: "Mission DM Mono, monospace"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.15
  metric-mobile:
    fontFamily: "Mission DM Mono, monospace"
    fontSize: "21px"
    fontWeight: 400
    lineHeight: 1.15
  summary-metric:
    fontFamily: "Mission DM Mono, monospace"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.25
  telemetry-metric:
    fontFamily: "Mission DM Mono, monospace"
    fontSize: "18px"
    fontWeight: 400
  page-count:
    fontFamily: "Mission DM Mono, monospace"
    fontSize: "12px"
    fontWeight: 400
rounded:
  none: "0"
  badge: "3px"
  control: "4px"
  disclosure: "8px"
  panel: "12px"
  dot: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  compact: "12px"
  inset: "16px"
  group: "20px"
  panel: "22px"
  frame: "24px"
components:
  button-primary:
    backgroundColor: "{colors.neon-yellow}"
    textColor: "{colors.deep-blue}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.white}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.white}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  button-outline-hover:
    backgroundColor: "{colors.electric-blue}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.muted-on-dark}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  region-current:
    backgroundColor: "transparent"
    textColor: "{colors.neon-yellow}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    padding: "10px 0"
    height: "48px"
  tab-selected:
    backgroundColor: "transparent"
    textColor: "{colors.neon-yellow}"
    typography: "{typography.tab}"
    rounded: "{rounded.none}"
    padding: "8px 3px"
  information-deck:
    backgroundColor: "{colors.deep-blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.panel}"
    width: "400px"
  instrument-dock:
    backgroundColor: "{colors.deep-blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.panel}"
    padding: "16px 20px"
  return-action:
    backgroundColor: "{colors.neon-yellow}"
    textColor: "{colors.deep-blue}"
    typography: "{typography.control}"
    rounded: "{rounded.panel}"
    padding: "18px"
    height: "72px"
    width: "168px"
---

# Design System: VISTA Mars · Full-screen mission interface

## Current integrated surface · 2026-11-14

The integrated workspace uses Cesium terrain and computed A/B routes. The older
placeholder composition below describes the isolated mission preview. Palette,
typography and translucent material remain shared. The integrated route controls,
coordinate inspector and responsive behavior are specified in
[the route extension contract](docs/route-planner-design.md); validation and the
finish verdict are recorded in [the route review](docs/route-planner-review.md).

## Overview

This document records the current implementation in `src/features/mission-detail/*` and `mission-demo.html`. The user requested a replacement composition while preserving the existing palette: the map fills the screen, information floats above it and mission instruments remain accessible below. This scoped demo is a proposed reusable style for teammates; it does not describe the rest of the shared app.

[NASA Graphic Standards](https://www.nasa.gov/nasa-brand-center/brand-guidelines/) informs the Inter, Public Sans and DM Mono typography roles. The implementation is a design demo with static exercise inputs, not evidence of validated spacecraft hardware or EVA usability. Sources and local font licenses are recorded in `src/features/mission-detail/assets/SOURCES.md`; the surface contract is in `.impeccable/surfaces/src-features-mission-detail-missiondetaildemo-jsx.md`.

**Key Characteristics:**

- Full-screen black map placeholder with independent overlays.
- Borderless geographic text controls and a collapsible horizontal information deck.
- Inter headings, Public Sans interface copy and DM Mono measurements.
- Deep Blue instrument surfaces with restrained Yellow selection and return actions.
- Visible evidence credits, simulation context, missing values and audio states.

## Colors

Frontmatter values preserve the implemented palette. Black is the user-requested map backdrop.

### Primary

- **Deep Blue:** information deck, instrument dock, voice surface and Simulation disclosure; foreground on the return action.
- **Electric Blue:** enabled outline-button and panel-toggle hover surfaces.

### Secondary

- **Neon Yellow:** selected region underline/text, active tab text/rule, Return, below-reserve notice and limiting margin, focus and text selection.
- **Blue Yonder:** ordinary status dot, source links, outline hover borders and scrollbar thumb.
- **Martian Red:** only the small numeric Alerts badge, with a White glyph.

### Neutral

- **White:** headings, body copy, region labels and primary-action hover.
- **Muted on dark:** supporting copy, metadata and inactive controls.
- **Border on dark:** panel edges, readout dividers and outline controls.
- **Map Black:** full-screen placeholder canvas, with one small muted label.

**The Accent Rule.** Neon Yellow marks actions, selection and attention; keep reading surfaces Deep Blue and headings White.

Neon Blue and Rocket Red remain reserved CSS variables without a visible role in this surface. The retired light-panel foreground and border are not active tokens.

## Typography

Fonts are self-hosted as `Mission Inter` (600/700), `Mission Public Sans` (400/600) and `Mission DM Mono` (400), with the fallback stacks in frontmatter. Current headings use Inter semibold; loading bold does not establish a new heading role. The NASA reference supplies graphic hierarchy, not operational validation.

- **Headings and references:** headline is the panel h2; title is the Route reference. The dock reference uses reference, reduced to (15px) on compact tablets. Mobile h2 uses (22px) and the Route reference (19px). Science subsection headings use Inter (14px/600).
- **Reading copy:** body is the interface baseline. Science/explanation prose uses prose; full notices use notice. Supporting notes use (13px/1.6), reduced to (12px) on short viewports. Science copy reduces to (14px) on compact tablets and mobile.
- **Controls and labels:** control covers region names and actions; tab covers tabs and pager actions. Labels use label. The placeholder is (12px). Dock labels and photograph captions use metadata; small readout notes use note. Simulation labels remain visibly distinct from reading text.
- **Measurements:** metric is the dock value with tabular numerals. Widths up to (1100px) use metric-medium, compact tablets use metric-tablet and mobile uses metric-mobile. Route summaries use summary-metric, table rows telemetry-metric and the pager page-count.
- **Small metadata:** dock mode uses micro with (.04em) tracking; compact tablets use micro-compact. Compact readout notes use micro; alert counts use note. These are auxiliary labels, not body-copy sizes. Audio failure text is (10px); preserve its accessible status announcement.

## Layout

The map is an absolute full-screen layer inside a viewport-height shell (`100dvh`, minimum height 560px). It contains only a small “Placeholder” label at (32% left, 47% top). No event header, logo, route diagram, scale, coordinates or simulated map marker is rendered.

Region text controls sit at the upper left with (24px) left and (22px) top insets. A closed-by-default Simulation disclosure sits below them. The information deck starts open at the upper right, inset (24px), width (400px). Its rows are tabs (56px), a flexible internally scrollable panel and pager (64px); height is `min(500px, calc(100dvh - 224px))`. Panel content uses the panel spacing token.

The instrument dock floats (24px) from the lower and side edges. A transparent clickable notice sits above the instruments. Next reference and three readouts share one bordered surface; Voice and Return are separate adjacent controls. This is an app instrument dock, not a full-width web footer. The map remains behind every overlay.

At (700–950px), the deck moves to (88px) from the top, narrows to (380px), and uses `min(500px, calc(100dvh - 270px))`; content padding becomes (18px). Readouts, controls and spacing compact. At heights up to (700px) and widths from (951px), the deck moves to (20px), height becomes `calc(100dvh - 208px)`, and content padding is (16px).

Below (700px), overlays use (16px) side insets; the information deck begins at (126px), has height `min(440px, calc(100dvh - 376px))` and minimum height (250px). The dock actions move to a second row and the dock reference is hidden; Route retains reference information. Voice and Return use (52px) minimum heights. The collapsed Information control sits at (76px) from the top. Preserve internal overflow for constrained height or enlarged text.

## Elevation & Depth

There are no box shadows, gradients or backdrop blur. Solid Deep Blue overlays, thin borders and the exposed black map establish separation. The stacking order is map (0), regions (2), information (3), instruments (4), Simulation (5) and focused skip link (20). No transition or reveal animation is currently applied. Reduced-motion preferences disable scoped animation, transitions and smooth scrolling.

## Shapes

Geographic controls and tabs have square, borderless geometry. Utility buttons and evidence images use control corners; the Simulation surface uses disclosure corners; the deck, instruments, Voice and Return use panel corners. The alert badge uses badge corners and the small (6px) status dot is circular. Panel edges, readout separators and utility borders are (1px); selected tabs have a (2px) bottom rule. Inline icons use (1.5px) strokes with rounded caps/joins, usually (18px), with (16px), (22px) and (24px) contextual sizes.

## Components

### Actions and selection

Primary, outline and quiet actions share a (48px) minimum target. Primary hover changes Yellow to White; outline hover uses Electric Blue and Blue Yonder; quiet hover turns text White and underlines it. Disabled controls use (.5) opacity and a not-allowed cursor. Focus uses a (2px) Yellow outline with (4px) offset, inset to (-5px) in tabs.

Syrtis Major, Jezero and Wildcat Ridge are text-only region buttons. Selection combines Yellow and underline with `aria-current`; ordinary hover underlines. They open Science without changing mission position. Do not restore normal-state borders. Simulation contains the native select and No data toggle; pressed No data uses Yellow border and text. No text-input field exists in this feature.

### Information deck

Route, Science, Telemetry and Alerts remain horizontal. Selected tabs combine Yellow text and a bottom rule. Roving focus supports Left/Right Arrow and Home/End; selected state and tab-panel labels remain linked. Tabs reset to their first page. Previous/Next controls flank a polite live page count; Route/Science/Telemetry/Alerts contain (2/3/2/2) pages.

The stable toggle hides the entire deck and becomes Information. It preserves tab/page state and focus; selecting a region, current notice or reference reopens the relevant information. `MissionInfoPanel` accepts `collapsed` in addition to its data and tab/page callbacks. The last Science page replaces Next with a large NASA source link.

### Instruments and voice

The notice opens Alerts; the reference opens Route. The three measurements are remaining distance, limiting return margin with reserve, and oxygen autonomy. Below reserve, explicit wording accompanies Yellow notice/dot and margin. Missing values remain “No data”; the notice says “Mission data unavailable.” Return switches the fixture to inbound mode and opens Route; it disables when return data is unavailable or return is already selected. Keep `MissionHUD` callbacks `onReturn`, `onOpenRoute` and `onOpenAlerts`.

Voice remains mounted outside the deck across collapse, tab and page changes. The compact control changes Voice to Stop while queued/reading and reads the full current notice. Preserve visible audio-unavailable/error text and status announcements; a changed notice resets playback state. These are exercise snapshots, not live suit telemetry.

### Evidence

Science separates regional context, historical surface evidence and source/coverage information. The photograph uses full content width with `object-fit: contain` and a (145px) maximum height, reduced to (120px) on compact tablets and (110px) on short/mobile layouts. Instrument, date and credit sit below it. A dashed-border fallback retains the credit and points to the NASA source on the next page. Processing context and the NASA source action remain accessible without placing interface text over the photo.

## Do's and Don'ts

### Do:

- **Do** preserve the scoped palette and the user-requested black placeholder canvas.
- **Do** keep the information deck initially visible, fully collapsible and recoverable without losing its tab/page.
- **Do** keep notice, readouts, Voice and Return outside the collapsible deck.
- **Do** use the local Inter, Public Sans and DM Mono families and preserve keyboard focus.
- **Do** retain simulation labels, missing-data text, audio states and photograph credits.
- **Do** keep source provenance below the photograph and NASA source on the final Science pager.

### Don't:

- **Don't** restore the event header/logo, a split map column or a full-width website footer.
- **Don't** add borders to the normal region text controls or draw invented geography in the placeholder.
- **Don't** invent visible roles for Neon Blue or Rocket Red, or expand Martian Red beyond the Alerts badge.
- **Don't** use Neon Yellow as a broad reading field or a headline color.
- **Don't** overlay interface text on source photographs or use color alone to convey status.
- **Don't** describe this design demo or NASA graphic guidance as validated spacecraft hardware or EVA usability.

