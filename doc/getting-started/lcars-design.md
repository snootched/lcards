---
description: "Guidelines for making a Home Assistant dashboard look like LCARS: frames, colour roles from your theme, the Picard and classic TNG/DS9/Voyager looks, motion, and patterns built from LCARdS cards."
---

# Designing LCARS Screens

What makes a screen read as LCARS, written down as guidelines you can pick from. They come from studying the screens people recognise: the *Star Trek: Picard* season 3 consoles (as rebuilt by meWho's Titan.DS and LCARSlad London) and production panels from *The Next Generation*, *Deep Space Nine* and *Voyager*.

None of this is required. A dashboard that follows three of these guidelines already looks more like LCARS than one that follows none; pick the ones that suit your screen. [Building a Dashboard](building-dashboards) covers the mechanics (which card for which job, the layout view); this page is about the look.

## Two looks

| | Picard (Titan.DS, *Picard* S3) | Classic (TNG, DS9, Voyager) |
|---|---|---|
| Structure | Thin frames in a few dark, muted tones | Thick blocks of colour |
| Colour | Mostly black and structure tones; a little accent | Several pastel colours at once |
| Buttons | Small square blocks with code numbers, pills at the edges | Grids of rounded pills, led by big numbers |
| Main display | Line-drawn schematic inside a nested frame | Content inside a bracket or sweep frame |
| Themes that suit it | `LCARS Picard [LCARdS Red/Blue Accent]`, `LCARS Picard I/II`, `LCARS 25C` | `LCARS Default`, `LCARS TNG`, `LCARS Classic`, `LCARS Nemesis Blue` |

Most of the guidelines below apply to both. The look mostly comes from the theme: the same layout reads as Picard in a Picard theme and as TNG in a classic one.

## Colour comes from your theme

Don't pick colours for an LCARS screen; pick **roles**, and let the theme supply the colour. Then the screen follows when you switch themes, into light or dark mode, and into alert mode.

| Role | Use for | Token | HA-LCARS variable |
|---|---|---|---|
| Main structure | Sweeps, frame bars, the most important frame | `theme:colors.ui.primary` | `--lcars-ui-primary` |
| Secondary structure | Block columns, side bars | `theme:colors.ui.secondary`, `theme:colors.ui.quaternary` | `--lcars-ui-secondary`, `--lcars-ui-quaternary` |
| Dark structure | Inner frames, inactive blocks, tabs | `theme:colors.card.topColor`, `theme:colors.card.bottomColor` | `--lcars-card-top-color`, `--lcars-card-bottom-color` |
| Accent | What's on, selected or needs attention | `theme:colors.ui.tertiary`, `theme:colors.card.buttonOn` | `--lcars-ui-tertiary`, `--lcars-card-button-color` |
| Data | Readings, schematic lines, gauges | | a palette colour, e.g. `var(--lcars-blue, var(--lcards-blue-medium))` |
| Alert | Alert states | | `var(--lcars-alert-color, var(--lcards-orange-dark))` |
| Text on a role | Labels on a coloured block | | the role's text partner: `--lcars-ui-primary-text`, `--lcars-card-top-text`, ... |

**Prefer the `theme:` tokens.** They resolve to your [HA-LCARS](https://github.com/th3jesta/ha-lcars) theme's variable when it's installed and fall back to the LCARdS palette when it isn't, so the card always has a colour. A bare `var(--lcars-...)` is empty without HA-LCARS: give it a fallback, as in the table. HA-LCARS themes have one accent role, so the data colour is a deliberate pick from the palette: check it reads on your theme's structure colours.

- **Keep accent colour sparse.** In the Picard references only about a tenth of the screen is accent colour; the rest is black and structure tones. A block stays a structure colour unless it means something.
- **Classic screens are more colourful**: several roles side by side, mixed freely. The classic themes already set their roles to the pastel set.
- **Light and dark mode belong to the theme.** If your theme has both, a screen built from roles works in both.
- **A view can choose its own theme**: `theme: LCARS Default` on a view shows that view in that theme, whatever the user's profile theme is. Handy for a classic screen on an otherwise Picard dashboard.

## Structure

- **Black canvas.** Content sits on black inside frames, not on coloured blocks.
- **Sweeps make the frames.** A frame is a bar that turns 90° into another bar (an [elbow](../cards/elbow/)). Two sweeps facing each other (a header pair, or a left and a right sweep) is the signature LCARS shape; a lone elbow in a corner is rarer.
- **Nest frames.** Put a thinner frame inside the main one around the most important content. Picard screens nest two thin frames; classic ones put a thin sweep inside a thick one.
- **Break long bars into segments** of different lengths, separated by small black gaps. A segment can carry a small label or number.
- **One gap size everywhere.** The same gap between blocks, segments and frames on a screen (`grid-gap` on the layout view and layout cards). Blocks never touch.
- **Labels sit right-aligned**, usually at the bottom right of their block, in condensed capitals (the theme font). Numbers right-aligned in columns.
- **One title, top right**, large, in the accent colour or white; a dim subtitle at the bottom right if you need one. Classic titles often read `NAME • NUMBER`.
- **Numbers as texture.** Code-like numbers (`13-650`, `0099•06`) fill blocks and columns, and dense number cascades fill spare areas. Real readings and decorative numbers look alike; that's part of the look.
- **A sweep is at least as wide as what it frames.** If a sweep's vertical bar is narrower than the column above it, it looks detached; close a narrow column with a segmented bar instead.
- **Fill space with structure, not black.** If an area is empty, put blocks, a number cascade or a segmented bar in it.

## Picard

- **Columns of small number blocks** down one or both sides: mostly structure tones, a few in the accent, some dark (inactive). See [code-block column](#code-block-column).
- **A utility column of small dark pills, housed inside a bracket frame** at the far edge (zoom, settings, dimmer), with a red alert pill at the bottom. See [utility pills](#utility-pills).
- **Concentric sweeps**: a thick sweep with a thin line running parallel inside it, for headers and corners. See [concentric sweep](#concentric-sweep).
- **Controls inside a wide arm**: a thick frame whose black inset holds a group of blocks. See [controls inside a wide arm](#controls-inside-a-wide-arm).
- **Vertical gauges with tick scales** beside the number columns ([Picard and gauge sliders](../cards/slider-card/)).
- **The main display is a schematic**: a line drawing with leader lines to labels, small accent highlights for faults ([MSD](../cards/msd/)).
- **A strip of tabs and sliders along the bottom.** Tabs show their state as a line along the top ([`toggle-tab`](#toggle-tab-strip)).
- **Fixed chrome, changing centre.** Titan.DS keeps the same frame, columns and strips on every screen and swaps only the central display. In LCARdS: a layout view whose centre area holds several cards with [visibility conditions](../cards/layout-view/), one shown at a time.

## Classic (TNG, DS9, Voyager)

- **Colour blocks are the structure.** Thick header blocks, often in several roles side by side.
- **Grids of rounded pills**, each with a small code label, in column groups that alternate two or three roles. See [pill grid](#pill-grid-classic).
- **A column of big numbers** (`20`, `008`, `358`) leads each group of pills.
- **Bracket frames**: a top and a bottom bar with rounded ends, and a sidebar of stacked blocks with code numbers. See [bracket frame](#bracket-frame-classic).
- **A split header**: two sweeps meeting across the top, with a thin segmented band in the gap between them.
- **Segment the long arms.** A classic bar seldom runs unbroken across the screen: the sweep turns into a short bar, then segments of different lengths and roles carry labels. See [segmented bar](#segmented-bar-classic-arms).

## Motion and alerts

- **At rest, move small things only**: ticking numbers, a dot row, a scanning line. On the reference screens about one twentieth of the screen moves at a time. [Animations](../core/animations.md), [data grid cascades](../cards/data-grid/).
- **Animate entrances once** (`on_show` with `draw`, `cascade` or `text-reveal`), not continuously.
- **Alerts change the whole screen at once**: [alert mode](../core/alert-mode.md) recolours everything in place, and an [alert overlay](../cards/alert-overlay/) adds the alert symbol. Avoid making every card flash.
- **Show state by colour in place**, not by moving things: a block turns to the accent, a tab's line lights up.

## Screen archetypes

Start a screen by picking its overall shape, then fill the areas with [patterns](#patterns). These are the layouts that recur across the reference screens; each one suits a different job. Mix them: a Picard screen can use the wings layout, a classic one the tile wall. Take groupings and sections from the [gallery](dashboard-gallery) and the references freely, but compose the screen for its own job rather than reproducing one whole.

| Archetype | Good for | Shape (`grid-template-areas`) | In the gallery |
|---|---|---|---|
| **Display with side columns** | One main system (a ship, a floor plan, a chart) with controls around it; Titan.DS modules | `"pills top top top" "pills left main right" "pills left strip right"` | [Picard](dashboard-gallery#picard-display-with-side-columns) |
| **Display over controls** | A wide display with a dense control deck under it; Titan.DS ship screens | `"head head" "display display" "deck1 deck2"` | [Picard](dashboard-gallery#picard-display-over-controls) |
| **Wings** | Two related halves (port and starboard, upstairs and downstairs) around a shared centre | `"head head head" "lwing centre rwing"` |  |
| **Portrait panel** | Phones and wall tablets mounted upright | `"title" "main" "gauges" "controls"` | [Picard](dashboard-gallery#picard-portrait-panel) |
| **Tile wall** | Many similar things at once: cameras, rooms, sensors | `"head head head" "t1 t2 t3" "t4 t5 t6"` |  |
| **Sweep console** | A classic control panel: thick header sweep, sidebar, button groups | `"head head head" "side pills readout" "foot foot foot"` | [Classic](dashboard-gallery#classic-sweep-console) |
| **Bracket screen** | A readout or a document: capped top and bottom bars, a numbered sidebar | `"top top" "side main" "bottom bottom"` | [Classic](dashboard-gallery#classic-bracket-screen) |
| **List** | Rosters, schedules, logs: rows of text under a split header | `"head head" "list numbers" "pills pills"` | [Classic](dashboard-gallery#classic-list) |

Two things vary a screen more than anything else: which archetype you start from, and which patterns you put in its areas. A screen that reuses one gallery screen's grid with new labels is the same screen; one that combines a different archetype with two or three patterns is a new one.

## Patterns

Building blocks to compose a screen from. Each is a [layout card](../cards/layout-card/) you can drop into a layout view area, with every colour from a theme role. Change the numbers, labels and entities to yours.

Two things keep a pattern from collapsing when you change it: give the layout card's rows a size (`grid-template-rows` or `grid-auto-rows` in px or `minmax(0, 1fr)`; rows left to size themselves squash the cards), and keep a button's row at least as tall as the button (56 px by default; small pills and blocks set a lower `min_height`, bar labels size their text to it).

### Code-block column

The Picard side column: small blocks with code numbers, mostly structure, one in the accent.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 300px
  grid-gap: 6px
  grid-template-columns: 1fr 1fr
  grid-auto-rows: minmax(0, 1fr)
cards:
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    text: { label: { content: 63-934, position: center-right } }
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    text: { label: { content: 13-650, position: center-right } }
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    text: { label: { content: 19-638, position: center-right } }
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    entity: light.demo
    text: { label: { content: 42-991, position: center-right } }
    tap_action: { action: toggle }
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    text: { label: { content: 28-130, position: center-right } }
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    text: { label: { content: 50-957, position: center-right } }
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    text: { label: { content: 81-782, position: center-right } }
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    text: { label: { content: 85-334, position: center-right } }
```

Panels (`panel-light`, `panel-dark`) with the label moved to the middle right and a lower `min_height`. A panel with an entity shows the theme's accent while it's on and the dark structure tone while it's off. Leave out `text.label.content` and each block gets a random code.

### Toggle tab strip

A row of tabs whose state shows as a line along the top: dark when off, the accent when on.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 56px
  grid-gap: 6px
  grid-template-columns: repeat(3, minmax(0, 1fr))
  grid-template-rows: minmax(0, 1fr)
cards:
  - type: custom:lcards-button
    preset: toggle-tab
    entity: light.demo
    tap_action: { action: toggle }
  - type: custom:lcards-button
    preset: toggle-tab
    entity: switch.demo
    tap_action: { action: toggle }
  - type: custom:lcards-button
    preset: toggle-tab
    text: { name: { content: AUDIO } }
```

### Facing sweeps header

Two sweeps meeting across the top, with the title in the black space between them.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 120px
  grid-gap: 6px
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)
  grid-template-rows: minmax(0, 1fr)
cards:
  - type: custom:lcards-elbow
    elbow:
      type: header-left
      segment:
        bar_width: 120
        bar_height: 20
        color: theme:colors.ui.primary
  - type: custom:lcards-elbow
    elbow:
      type: header-right
      segment:
        bar_width: 120
        bar_height: 20
        color: theme:colors.ui.secondary
    text:
      label:
        content: ENGINEERING
        position: center
        color: theme:colors.ui.tertiary
```

### Nested frame

The main display: a segmented frame, a thin inner bar inside a thicker outer one, opening onto black.

```yaml live
type: custom:lcards-elbow
grid_options: { rows: 4 }
elbow:
  type: frame
  style: segmented
  segment:
    color: theme:colors.ui.primary
  frame:
    bar_width: 30
    right:
      enabled: false
    segments:
      gap: 6
      inner_frame:
        bar_width: 10
        color: theme:colors.card.topColor
```

### Utility pills

The Picard edge column: small dark pills housed inside a bracket frame (a frame open on the outer side), with red alert at the bottom. The frame and the pills share one grid area; the pills' padding keeps them inside the frame.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 300px
  grid-template-columns: 150px
  grid-template-rows: minmax(0, 1fr)
  grid-template-areas: |
    "col"
cards:
  - type: custom:lcards-elbow
    view_layout: { grid-area: col }
    elbow:
      type: frame
      segment: { color: theme:colors.ui.secondary }
      frame:
        bar_width: 14
        bar_height: 36
        outer_curve: 36
        left: { enabled: false }
  - type: custom:lcards-layout-card
    view_layout: { grid-area: col }
    layout:
      padding: 46px 22px 46px 4px
      grid-gap: 8px
      grid-template-columns: minmax(0, 1fr)
      grid-template-rows: 26px 26px 26px minmax(0, 1fr) 26px
    cards:
        - { type: custom:lcards-button, preset: lozenge, min_height: 26, text: { label: { content: ZOOM, show: true, position: center, color: theme:colors.ui.secondary } }, style: { card: { color: { background: { default: theme:colors.card.topColor } } } } }
        - { type: custom:lcards-button, preset: lozenge, min_height: 26, text: { label: { content: SETTINGS, show: true, position: center, color: theme:colors.ui.secondary } }, style: { card: { color: { background: { default: theme:colors.card.topColor } } } } }
        - { type: custom:lcards-button, preset: lozenge, min_height: 26, text: { label: { content: DIMMER, show: true, position: center, color: theme:colors.ui.secondary } }, style: { card: { color: { background: { default: theme:colors.card.topColor } } } } }
        - { type: custom:lcards-button, preset: text-only, min_height: 0 }
        - type: custom:lcards-button
          preset: lozenge
          min_height: 26
          text: { label: { content: RED ALERT, show: true, position: center } }
          style:
            card:
              color:
                background:
                  default: var(--lcars-alert-color, var(--lcards-orange-dark))
          tap_action:
            action: perform-action
            perform_action: lcards.red_alert
```

### Concentric sweep

A thick sweep with a thin line running parallel inside it, the Picard header and corner shape. A segmented elbow: `outer_segment` is the sweep, `inner_segment` the line.

```yaml live
type: custom:lcards-elbow
grid_options: { rows: 3 }
elbow:
  type: header-left
  style: segmented
  segments:
    gap: 6
    outer_segment: { bar_width: 140, bar_height: 24, color: theme:colors.ui.secondary }
    inner_segment: { bar_width: 6, bar_height: 4, color: theme:colors.ui.primary }
text:
  title:
    content: COURSE SELECT
    position: bottom-right
    color: theme:colors.ui.tertiary
```

### Controls inside a wide arm

A thick frame whose black inset holds a group of controls, as in the Titan console side panels. The frame and a layout card share the area; the layout card's padding is a little more than the frame's bars.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 220px
  grid-template-columns: 260px
  grid-template-rows: minmax(0, 1fr)
  grid-template-areas: |
    "arm"
cards:
  - type: custom:lcards-elbow
    view_layout: { grid-area: arm }
    elbow:
      type: frame
      segment: { color: theme:colors.ui.primary }
      frame: { bar_width: 24, bar_height: 24, outer_curve: 40, inner_curve: 18 }
  - type: custom:lcards-layout-card
    view_layout: { grid-area: arm }
    layout:
      padding: 34px
      grid-gap: 6px
      grid-template-columns: 1fr 1fr
      grid-template-rows: repeat(3, 34px)
    cards:
      - { type: custom:lcards-button, preset: panel-dark, min_height: 34, text: { label: { content: 6-3390, position: center-right } } }
      - { type: custom:lcards-button, preset: panel-dark, min_height: 34, text: { label: { content: 60-1204, position: center-right } } }
      - { type: custom:lcards-button, preset: panel-dark, min_height: 34, entity: light.demo, tap_action: { action: toggle }, text: { label: { content: 5-6549, position: center-right } } }
      - { type: custom:lcards-button, preset: panel-dark, min_height: 34, text: { label: { content: 34-3719, position: center-right } } }
      - { type: custom:lcards-button, preset: panel-dark, min_height: 34, text: { label: { content: 80-1932, position: center-right } } }
      - { type: custom:lcards-button, preset: panel-dark, min_height: 34, text: { label: { content: 8-5300, position: center-right } } }
```

### Segmented bar (classic arms)

Classic screens rarely run one unbroken bar across the screen: the sweep turns into a short bar, then the bar continues as segments of different lengths and roles, each with a label. Keep the elbow's area just wider than its vertical bar, and put the segments in a row the same height as the bar.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 110px
  grid-gap: 6px
  grid-template-columns: 220px 3fr 1fr 4fr 2fr
  grid-template-rows: 40px minmax(0, 1fr)
  grid-template-areas: |
    "corner s1 s2 s3 s4"
    "corner .  .  .  ."
cards:
  - type: custom:lcards-elbow
    view_layout: { grid-area: corner }
    elbow:
      type: header-left
      segment: { bar_width: 140, bar_height: 40, color: theme:colors.ui.primary }
  - { type: custom:lcards-button, preset: panel-light, min_height: 40, view_layout: { grid-area: s1 }, text: { label: { content: COURSE SELECT, position: bottom-right } } }
  - { type: custom:lcards-button, preset: panel-light, min_height: 40, view_layout: { grid-area: s2 }, text: { label: { content: "541", position: bottom-right } }, style: { card: { color: { background: { default: theme:colors.ui.tertiary } } } } }
  - { type: custom:lcards-button, preset: panel-light, min_height: 40, view_layout: { grid-area: s3 }, text: { label: { content: NAV REF, position: bottom-right } }, style: { card: { color: { background: { default: theme:colors.ui.secondary } } } } }
  - { type: custom:lcards-button, preset: panel-light, min_height: 40, view_layout: { grid-area: s4 }, text: { label: { content: FLIGHT, position: bottom-right } } }
```

The same works for a Picard closing bar: thin segments (14 to 20 px) in structure tones, one in the accent.

### Status rows

A label block and a long value bar per line, for readings.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 190px
  grid-gap: 6px
  grid-template-columns: 1fr
  grid-template-rows: repeat(3, minmax(0, 1fr))
cards:
  - type: custom:lcards-button
    preset: bar-label-left
    text: { label: { content: PRIMARY } }
  - type: custom:lcards-button
    preset: bar-label-left
    text: { label: { content: SECONDARY } }
  - type: custom:lcards-button
    preset: bar-label-left
    text: { label: { content: AUXILIARY } }
```

### Number cascade filler

Fills a spare area with moving numbers instead of black.

```yaml live
type: custom:lcards-data-grid
data_mode: decorative
grid_options: { rows: 3 }
```

### Pill grid (classic)

TNG-style: big numbers leading a group of pills, the groups in different roles.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 180px
  grid-gap: 6px
  grid-template-columns: 70px repeat(3, minmax(0, 1fr))
  grid-template-rows: repeat(2, minmax(0, 1fr))
cards:
  - type: custom:lcards-button
    preset: text-only
    text: { label: { content: "358", show: true, position: center-right, color: theme:colors.ui.tertiary } }
  - type: custom:lcards-button
    preset: lozenge
    style: { card: { color: { background: { default: theme:colors.ui.primary } } } }
  - type: custom:lcards-button
    preset: lozenge
    style: { card: { color: { background: { default: theme:colors.ui.primary } } } }
  - type: custom:lcards-button
    preset: lozenge
    style: { card: { color: { background: { default: theme:colors.ui.secondary } } } }
  - type: custom:lcards-button
    preset: text-only
    text: { label: { content: "451", show: true, position: center-right, color: theme:colors.ui.secondary } }
  - type: custom:lcards-button
    preset: lozenge
    style: { card: { color: { background: { default: theme:colors.ui.secondary } } } }
  - type: custom:lcards-button
    preset: lozenge
    style: { card: { color: { background: { default: theme:colors.ui.tertiary } } } }
  - type: custom:lcards-button
    preset: lozenge
    style: { card: { color: { background: { default: theme:colors.ui.primary } } } }
```

To name a pill, add `text: { label: { content: WARP, show: true } }`.

### Bracket frame (classic)

DS9 and Voyager screens: a header bar with the title, a sidebar of blocks, a footer bar.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 260px
  grid-gap: 6px
  grid-template-columns: 120px minmax(0, 1fr)
  grid-template-rows: 70px minmax(0, 1fr) minmax(0, 1fr) 70px
  grid-template-areas: |
    "top    top"
    "side1  main"
    "side2  main"
    "bottom bottom"
cards:
  - type: custom:lcards-elbow
    view_layout: { grid-area: top }
    elbow:
      type: header-left
      segment: { bar_width: 120, bar_height: 24, color: theme:colors.ui.primary }
    text:
      label:
        content: "STELLAR CARTOGRAPHY • 2387"
        position: top-right
        color: theme:colors.ui.tertiary
  - type: custom:lcards-button
    preset: panel-dark
    view_layout: { grid-area: side1 }
  - type: custom:lcards-button
    preset: panel-light
    view_layout: { grid-area: side2 }
  - type: custom:lcards-data-grid
    data_mode: decorative
    view_layout: { grid-area: main }
  - type: custom:lcards-elbow
    view_layout: { grid-area: bottom }
    elbow:
      type: footer-left
      segment: { bar_width: 120, bar_height: 24, color: theme:colors.ui.primary }
```

### Header bar with a title

A bar that carries the screen or section title, with a short cap before it. Picard sections (*MISSION OPS*, *PROPULSION*) use this instead of a sweep. The title grows to fill the bar's height, so in a narrow area set a smaller `text.label.font_size` (or a shorter `min_height`) or it runs off the end.

```yaml live
type: custom:lcards-button
preset: bar-label-left
min_height: 48
text:
  label:
    content: MISSION OPS
    color: theme:colors.ui.tertiary
style:
  card:
    color:
      background:
        default: theme:colors.ui.tertiary
```

### Readout rows

A label block and a horizontal gauge per line, for a set of levels read side by side.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 190px
  grid-gap: 6px
  grid-template-columns: 130px minmax(0, 1fr)
  grid-template-rows: repeat(3, minmax(0, 1fr))
cards:
  - type: custom:lcards-button
    preset: panel-dark
    min_height: 0
    text: { label: { content: PRIMARY, position: center-right } }
  - type: custom:lcards-slider
    entity: input_number.primary_level
    preset: gauge-basic
  - type: custom:lcards-button
    preset: panel-dark
    min_height: 0
    text: { label: { content: SECONDARY, position: center-right } }
  - type: custom:lcards-slider
    entity: input_number.secondary_level
    preset: gauge-basic
  - type: custom:lcards-button
    preset: panel-dark
    min_height: 0
    text: { label: { content: RESERVE, position: center-right } }
  - type: custom:lcards-slider
    entity: input_number.reserve_level
    preset: gauge-basic
```

### Gauge bank

A row of vertical gauges, as on the Picard biometric and atmospheric panels. Good for several readings of the same kind.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 420px
  grid-gap: 10px
  grid-template-columns: repeat(4, minmax(0, 1fr))
  grid-template-rows: minmax(0, 1fr)
cards:
  - type: custom:lcards-slider
    component: picard
    preset: picard-gauge-vertical
    entity: sensor.demo_temperature
  - type: custom:lcards-slider
    component: picard
    preset: picard-gauge-vertical
    entity: sensor.demo_humidity
  - type: custom:lcards-slider
    component: picard
    preset: picard-gauge-vertical
    entity: sensor.demo_battery
  - type: custom:lcards-slider
    component: picard
    preset: picard-gauge-vertical
    entity: input_number.demo_level
```

### Selector strip

A row of equal tabs for choosing one of several, as in the Titan.DS fleet directory: a [select menu](../cards/select-menu/) with the `toggle-tab` preset, the selected option highlighted.

```yaml live
type: custom:lcards-select-menu
entity: input_select.demo_mode
preset: toggle-tab
grid:
  columns: 4
  gap: 6px
```

### Tile wall

Small framed tiles, each with its own reading, as in the Picard signal-processing panels. Each frame holds its reading as an embedded card ([symbiont](../cards/elbow/#symbiont)): a chart, a camera, a data grid.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 170px
  grid-gap: 10px
  grid-template-columns: repeat(3, minmax(0, 1fr))
  grid-template-rows: minmax(0, 1fr)
cards:
  - type: custom:lcards-elbow
    elbow:
      type: frame
      segment: { color: theme:colors.card.topColor }
      frame: { bar_width: 4, bar_height: 4, outer_curve: 10 }
    symbiont:
      enabled: true
      position: { top: 10, right: 10, bottom: 10, left: 10 }
      imprint: { enabled: false }
      card:
        type: custom:lcards-data-grid
        data_mode: decorative
        format: digit
        grid:
          grid-template-rows: repeat(4, auto)
          grid-template-columns: repeat(3, minmax(0, 1fr))
  - type: custom:lcards-elbow
    elbow:
      type: frame
      segment: { color: theme:colors.card.topColor }
      frame: { bar_width: 4, bar_height: 4, outer_curve: 10 }
    symbiont:
      enabled: true
      position: { top: 10, right: 10, bottom: 10, left: 10 }
      imprint: { enabled: false }
      card:
        type: custom:lcards-data-grid
        data_mode: decorative
        format: hex
        grid:
          grid-template-rows: repeat(4, auto)
          grid-template-columns: repeat(3, minmax(0, 1fr))
  - type: custom:lcards-elbow
    elbow:
      type: frame
      segment: { color: theme:colors.ui.tertiary }
      frame: { bar_width: 4, bar_height: 4, outer_curve: 10 }
    symbiont:
      enabled: true
      position: { top: 10, right: 10, bottom: 10, left: 10 }
      imprint: { enabled: false }
      card:
        type: custom:lcards-data-grid
        data_mode: decorative
        format: float
        grid:
          grid-template-rows: repeat(4, auto)
          grid-template-columns: repeat(3, minmax(0, 1fr))
```

### Split header (classic)

The TNG and Voyager header: an upper block that sweeps down into a bar, a thin gap, and a lower block that sweeps out of the next bar. The title sits in the black beside the upper sweep.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 200px
  grid-gap: 8px
  grid-template-columns: minmax(0, 1fr)
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr)
cards:
  - type: custom:lcards-elbow
    elbow:
      type: footer-left
      segment: { bar_width: 140, bar_height: 18, color: theme:colors.ui.primary }
    text:
      title:
        content: PATIENT BIOMEDICAL STATUS
        position: top-right
        font_size: 26
        color: theme:colors.ui.tertiary
  - type: custom:lcards-elbow
    elbow:
      type: header-left
      segment: { bar_width: 140, bar_height: 18, color: theme:colors.ui.secondary }
```

### List

Rows of text in columns, for rosters, schedules and logs, as in Voyager's duty roster. A [data grid](../cards/data-grid/) in data mode with fixed text or your entities.

```yaml live
type: custom:lcards-data-grid
data_mode: data
rows:
  - values: [Name, Station, Shift]
    header: true
  - [TUVOK, SECURITY, ALPHA]
  - [TORRES, ENGINEERING, BETA]
  - [PARIS, CONN, ALPHA]
  - [KIM, OPS, GAMMA]
grid:
  grid-template-columns: 1fr 1fr 90px
  gap: 4px
style:
  font_size: 20px
columns:
  - style:
      align: left
      color: theme:colors.ui.tertiary
```

### Slanted bars

Bars with a cut end, for labels and indicators (Titan console side panels). The elbow's `bar-slant-right`, `bar-slant-left` and `bar-parallelogram` types make the whole card one bar; `segment.diagonal_angle` sets the cut.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 96px
  grid-gap: 8px
  grid-template-columns: 200px 120px
  grid-template-rows: 44px 44px
cards:
  - type: custom:lcards-elbow
    elbow: { type: bar-slant-right, segment: { color: theme:colors.ui.secondary } }
    text: { label: { content: LCARS, position: center-left, font_size: 22, color: "var(--lcars-text-dark, black)" } }
  - type: custom:lcards-elbow
    elbow: { type: bar-parallelogram, segment: { color: theme:colors.ui.tertiary, diagonal_angle: 60 } }
  - type: custom:lcards-elbow
    elbow: { type: bar-slant-right, segment: { color: theme:colors.ui.primary } }
    text: { label: { content: "47", position: center-left, font_size: 22, color: "var(--lcars-text-dark, black)" } }
```

### Flagged blocks

Number blocks with a thin accent tick on the left, as in the Titan console's number columns: the `panel-flagged` preset.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 150px
  grid-gap: 6px
  grid-template-columns: 140px
  grid-template-rows: repeat(4, minmax(0, 1fr))
cards:
  - { type: custom:lcards-button, preset: panel-flagged, min_height: 0, text: { label: { content: "012" } } }
  - { type: custom:lcards-button, preset: panel-flagged, min_height: 0, text: { label: { content: "330" } } }
  - { type: custom:lcards-button, preset: panel-flagged, min_height: 0, entity: light.demo, tap_action: { action: toggle }, text: { label: { content: "436" } } }
  - { type: custom:lcards-button, preset: panel-flagged, min_height: 0, text: { label: { content: "542" } } }
```

### Dot rows

Rows of dots in groups, along the top or bottom edge of a frame (Titan.DS headers and footers). A text-only button with runs of `•`.

```yaml live
type: custom:lcards-button
preset: text-only
min_height: 24
text:
  label:
    content: "•  •••  ••  •••••  •  ••  •••"
    show: true
    position: center-right
    color: theme:colors.ui.secondary
```

### Fleet tiles

A row of framed tiles, one per item, as in the Titan.DS fleet directory: a frame elbow per tile with its name and class; the thicker bottom bar can carry a state colour.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 150px
  grid-gap: 8px
  grid-template-columns: repeat(3, minmax(0, 1fr))
  grid-template-rows: minmax(0, 1fr)
cards:
  - type: custom:lcards-elbow
    elbow: { type: frame, segment: { color: theme:colors.card.topColor }, frame: { bar_width: 4, bar_height: 18, outer_curve: 8 } }
    text:
      label: { content: NCC-1701-A, position: top-center, font_size: 14, color: theme:colors.ui.tertiary }
      class: { content: CONSTITUTION, position: center, font_size: 18, color: theme:colors.ui.primary }
  - type: custom:lcards-elbow
    elbow: { type: frame, segment: { color: theme:colors.ui.secondary }, frame: { bar_width: 4, bar_height: 18, outer_curve: 8 } }
    text:
      label: { content: NCC-1701-C, position: top-center, font_size: 14, color: theme:colors.ui.tertiary }
      class: { content: AMBASSADOR, position: center, font_size: 18, color: theme:colors.ui.primary }
  - type: custom:lcards-elbow
    elbow: { type: frame, segment: { color: theme:colors.card.topColor }, frame: { bar_width: 4, bar_height: 18, outer_curve: 8 } }
    text:
      label: { content: NCC-1701-E, position: top-center, font_size: 14, color: theme:colors.ui.tertiary }
      class: { content: SOVEREIGN, position: center, font_size: 18, color: theme:colors.ui.primary }
```

### Brackets and scopes

Round displays framed by bracket arcs, and radar scopes (meWho's Titan.DS and Protostar screens): the button's `brackets` and `radar` [components](../cards/button/#component-mode-brackets-and-radar). Both take their colours from the theme roles.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 200px
  grid-gap: 12px
  grid-template-columns: 200px 200px
  grid-template-rows: minmax(0, 1fr)
cards:
  - type: custom:lcards-button
    component: brackets
    text: { label: { content: "88", show: true, position: center, font_size: 48, color: theme:colors.ui.tertiary } }
  - type: custom:lcards-button
    component: radar
```

## Putting it together

A screen is a [layout view](../cards/layout-view/) shaped by one of the [archetypes](#screen-archetypes), with patterns in its areas: for example a facing-sweeps header across the top, a code-block column and utility pills down the left, a nested frame with an MSD or chart in the centre, a toggle tab strip along the bottom. Or a portrait panel: a header bar with a title, a gauge bank, a selector strip. The [Dashboard Gallery](dashboard-gallery#built-from-the-design-guide) has six complete screens built this way, three per look, each from a different archetype.
