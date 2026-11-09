---
description: "LCARS patterns to compose a screen from, each a live LCARdS card or layout card coloured by theme role: code-block columns, toggle tabs, sweeps and frames, utility pills, pill grids, gauges, lists, tiles and more."
---

# LCARS Patterns

**Building blocks to compose an LCARS screen from: each one is a card or a [layout card](../cards/layout-card/) you can drop into an area of a layout view, with every colour taken from a theme role.** Change the numbers, labels and entities to yours. [Designing LCARS Screens](lcars-design) explains what makes a screen read as LCARS, and its [archetypes](lcars-design#screen-archetypes) give the overall shapes to put these in.

- **Give the layout card's rows a size** (`grid-template-rows` or `grid-auto-rows` in px or `minmax(0, 1fr)`): rows left to size themselves squash the cards.
- **Keep a button's row at least as tall as the button:** 56 px by default. Small pills and blocks set a lower `min_height`, and bar labels size their text to it.
- Patterns marked *(classic)* come from TNG, DS9 and Voyager screens, and most of the others from the *Picard* references. The theme sets the colours, so most work in either look.

| For | Patterns |
|---|---|
| Frames and headers | [Facing sweeps header](#facing-sweeps-header), [Concentric sweep](#concentric-sweep), [Nested frame](#nested-frame), [Header bar with a title](#header-bar-with-a-title), [Slanted bars](#slanted-bars), [Segmented bar](#segmented-bar-classic-arms), [Bracket frame](#bracket-frame-classic), [Split header](#split-header-classic) |
| Controls | [Code-block column](#code-block-column), [Utility pills](#utility-pills), [Controls inside a wide arm](#controls-inside-a-wide-arm), [Toggle tab strip](#toggle-tab-strip), [Selector strip](#selector-strip), [Flagged blocks](#flagged-blocks), [Pill grid](#pill-grid-classic) |
| Readings | [Status rows](#status-rows), [Readout rows](#readout-rows), [Gauge bank](#gauge-bank), [Tile wall](#tile-wall), [Fleet tiles](#fleet-tiles), [Brackets and scopes](#brackets-and-scopes), [List](#list) |
| Filling space | [Number cascade filler](#number-cascade-filler), [Dot rows](#dot-rows) |

## Code-block column

**The Picard side column: small blocks with code numbers, mostly in structure tones, one in the accent.** Use it down one or both sides of a screen.

- The blocks are panels (`panel-light`, `panel-dark`) with the label moved to the middle right and a lower `min_height`.
- A panel with an entity shows the theme's accent while it's on and the dark structure tone while it's off: toggle the light under the card to see block 42-991 change.
- Leave out `text.label.content` and each block gets a random code.

```yaml live controls
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
    text:
      label:
        content: 63-934
        position: center-right
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    text:
      label:
        content: 13-650
        position: center-right
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    text:
      label:
        content: 19-638
        position: center-right
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    entity: light.demo
    text:
      label:
        content: 42-991
        position: center-right
    tap_action:
      action: toggle
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    text:
      label:
        content: 28-130
        position: center-right
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    text:
      label:
        content: 50-957
        position: center-right
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    text:
      label:
        content: 81-782
        position: center-right
  - type: custom:lcards-button
    preset: panel-light
    min_height: 28
    text:
      label:
        content: 85-334
        position: center-right
```

## Toggle tab strip

**A row of tabs whose state shows as a line along the top: dark when off, the accent when on.** The `toggle-tab` preset shows the entity's name in the middle; a tab without an entity takes its `text.name.content`.

```yaml live controls
type: custom:lcards-layout-card
layout:
  height: 56px
  grid-gap: 6px
  grid-template-columns: repeat(3, minmax(0, 1fr))
  grid-template-rows: minmax(0, 1fr)
cards:
  - type: custom:lcards-button
    preset: toggle-tab
    entity: light.bridge
    tap_action:
      action: toggle
  - type: custom:lcards-button
    preset: toggle-tab
    entity: switch.viewscreen
    tap_action:
      action: toggle
  - type: custom:lcards-button
    preset: toggle-tab
    text:
      name:
        content: AUDIO
```

## Facing sweeps header

**Two sweeps meeting across the top, with the title in the black space between them.** The signature LCARS header: a `header-left` and a `header-right` elbow side by side, each in its own role.

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

## Nested frame

**The main display: a segmented frame, a thin inner bar inside a thicker outer one, opening onto black.** Put the most important content (an MSD, a chart) inside it; here the right side is left open.

```yaml live
type: custom:lcards-elbow
grid_options:
  rows: 4
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

## Utility pills

**The Picard edge column: small dark pills housed inside a bracket frame (a frame open on the outer side), with red alert at the bottom.** The frame and a layout card of pills share one grid area, and the inner layout card's padding keeps the pills inside the frame.

- The empty `text-only` button takes up the flexible row, so the red alert pill sits at the bottom whatever the height.
- RED ALERT runs `lcards.red_alert`: tap it here and the page goes to red alert.

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
    view_layout:
      grid-area: col
    elbow:
      type: frame
      segment:
        color: theme:colors.ui.secondary
      frame:
        bar_width: 14
        bar_height: 36
        outer_curve: 36
        left:
          enabled: false
  - type: custom:lcards-layout-card
    view_layout:
      grid-area: col
    layout:
      padding: 46px 22px 46px 4px
      grid-gap: 8px
      grid-template-columns: minmax(0, 1fr)
      grid-template-rows: 26px 26px 26px minmax(0, 1fr) 26px
    cards:
      - type: custom:lcards-button
        preset: lozenge
        min_height: 26
        text:
          label:
            content: ZOOM
            show: true
            position: center
            color: theme:colors.ui.secondary
        style:
          card:
            color:
              background:
                default: theme:colors.card.topColor
      - type: custom:lcards-button
        preset: lozenge
        min_height: 26
        text:
          label:
            content: SETTINGS
            show: true
            position: center
            color: theme:colors.ui.secondary
        style:
          card:
            color:
              background:
                default: theme:colors.card.topColor
      - type: custom:lcards-button
        preset: lozenge
        min_height: 26
        text:
          label:
            content: DIMMER
            show: true
            position: center
            color: theme:colors.ui.secondary
        style:
          card:
            color:
              background:
                default: theme:colors.card.topColor
      - type: custom:lcards-button
        preset: text-only
        min_height: 0
      - type: custom:lcards-button
        preset: lozenge
        min_height: 26
        text:
          label:
            content: RED ALERT
            show: true
            position: center
        style:
          card:
            color:
              background:
                default: var(--lcars-alert-color, var(--lcards-orange-dark))
        tap_action:
          action: perform-action
          perform_action: lcards.red_alert
```

## Concentric sweep

**A thick sweep with a thin line running parallel inside it: the Picard header and corner shape.** It is a segmented elbow (`style: segmented`): `outer_segment` is the sweep and `inner_segment` the line.

- Swap the weights for the other common Picard form: a thin outer band with a large curve wrapped round a wide inner block. The [split screen](dashboard-gallery#picard-split-screen) uses `outer_segment` 40 by 14 with `outer_curve: 120` round an `inner_segment` 150 by 30; the lcars-shell strategy's corners have the same form.

```yaml live
type: custom:lcards-elbow
grid_options:
  rows: 3
elbow:
  type: header-left
  style: segmented
  segments:
    gap: 6
    outer_segment:
      bar_width: 140
      bar_height: 24
      color: theme:colors.ui.secondary
    inner_segment:
      bar_width: 6
      bar_height: 4
      inner_curve: 25
      color: theme:colors.ui.primary
text:
  title:
    content: COURSE SELECT
    position: bottom-right
    color: theme:colors.ui.tertiary
```

## Controls inside a wide arm

**A thick frame whose black inset holds a group of controls, as in the Titan console side panels.** The frame and a layout card share the area, and the layout card's padding is a little more than the frame's bars (34 px inside 24 px bars).

```yaml live controls
type: custom:lcards-layout-card
layout:
  height: 240px
  grid-template-columns: 290px
  grid-template-rows: minmax(0, 1fr)
  grid-template-areas: |
    "arm"
cards:
  - type: custom:lcards-elbow
    view_layout:
      grid-area: arm
    elbow:
      type: frame
      segment:
        color: theme:colors.ui.primary
      frame:
        bar_width: 24
        bar_height: 24
        outer_curve: 0
        inner_curve: 0
  - type: custom:lcards-layout-card
    view_layout:
      grid-area: arm
    layout:
      padding: 34px
      grid-gap: 6px
      grid-template-columns: 1fr 1fr
      grid-template-rows: repeat(3, 34px)
    cards:
      - type: custom:lcards-button
        preset: outline
        min_height: 34
        text:
          label:
            content: 6-3390
            position: center-right
            show: true
      - type: custom:lcards-button
        preset: filled
        min_height: 34
        text:
          label:
            content: 60-1204
            position: center-right
            show: true
      - type: custom:lcards-button
        preset: outline
        min_height: 34
        entity: light.demo
        tap_action:
          action: toggle
        text:
          label:
            content: 5-6549
            position: center-right
            show: true
      - type: custom:lcards-button
        preset: panel-dark
        min_height: 34
        text:
          label:
            content: 34-3719
            position: center-right
      - type: custom:lcards-button
        preset: panel-dark
        min_height: 34
        text:
          label:
            content: 80-1932
            position: center-right
      - type: custom:lcards-button
        preset: panel-light
        min_height: 34
        text:
          label:
            content: 8-5300
            position: center-right
```

## Segmented bar (classic arms)

**Classic screens rarely run one unbroken bar across the screen: the sweep turns into a short bar, then continues as labelled segments of different lengths and roles.** Each segment is a panel in its own grid column.

- Keep the elbow's area just wider than its vertical bar, and put the segments in a row the same height as the bar (40 px here).
- The same works for a Picard closing bar: thin segments (14 to 20 px) in structure tones, one in the accent.

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
    view_layout:
      grid-area: corner
    elbow:
      type: header-left
      segment:
        bar_width: 140
        bar_height: 40
        color: theme:colors.ui.primary
  - type: custom:lcards-button
    preset: panel-light
    min_height: 40
    view_layout:
      grid-area: s1
    text:
      label:
        content: COURSE SELECT
        position: bottom-right
  - type: custom:lcards-button
    preset: panel-light
    min_height: 40
    view_layout:
      grid-area: s2
    text:
      label:
        content: "541"
        position: bottom-right
    style:
      card:
        color:
          background:
            default: theme:colors.ui.tertiary
  - type: custom:lcards-button
    preset: panel-light
    min_height: 40
    view_layout:
      grid-area: s3
    text:
      label:
        content: NAV REF
        position: bottom-right
    style:
      card:
        color:
          background:
            default: theme:colors.ui.secondary
  - type: custom:lcards-button
    preset: panel-light
    min_height: 40
    view_layout:
      grid-area: s4
    text:
      label:
        content: FLIGHT
        position: bottom-right
```

## Status rows

**A label block and a long value bar per line, for readings.** The `bar-label-left` preset draws the bar with its label cut into the left end.

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
    text:
      label:
        content: PRIMARY
  - type: custom:lcards-button
    preset: bar-label-left
    text:
      label:
        content: SECONDARY
  - type: custom:lcards-button
    preset: bar-label-left
    text:
      label:
        content: AUXILIARY
```

## Number cascade filler

**Fills a spare area with moving numbers instead of black.** A [data grid](../cards/data-grid/) in `decorative` mode needs no other keys.

```yaml live
type: custom:lcards-data-grid
data_mode: decorative
grid_options:
  rows: 3
```

## Pill grid (classic)

**TNG style: big numbers leading a group of pills, the groups in different roles.** The numbers are `text-only` buttons; each pill is a `lozenge` with its background set to a role.

- The `lozenge` preset hides its label; to name a pill, add a label with `show: true` (WARP below).

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
    text:
      label:
        content: "358"
        show: true
        position: center-right
        color: theme:colors.ui.tertiary
  - type: custom:lcards-button
    preset: lozenge
    style:
      card:
        color:
          background:
            default: theme:colors.ui.primary
  - type: custom:lcards-button
    preset: lozenge
    style:
      card:
        color:
          background:
            default: theme:colors.ui.primary
  - type: custom:lcards-button
    preset: lozenge
    style:
      card:
        color:
          background:
            default: theme:colors.ui.secondary
  - type: custom:lcards-button
    preset: text-only
    text:
      label:
        content: "451"
        show: true
        position: center-right
        color: theme:colors.ui.secondary
  - type: custom:lcards-button
    preset: lozenge
    style:
      card:
        color:
          background:
            default: theme:colors.ui.secondary
  - type: custom:lcards-button
    preset: lozenge
    style:
      card:
        color:
          background:
            default: theme:colors.ui.tertiary
  # a named pill
  - type: custom:lcards-button
    preset: lozenge
    text:
      label:
        content: WARP
        show: true
    style:
      card:
        color:
          background:
            default: theme:colors.ui.primary
```

## Bracket frame (classic)

**DS9 and Voyager screens: a header bar with the title, a sidebar of blocks and a footer bar, round the content.** Two elbows (`header-left` and `footer-left`) with the same `bar_width` as the sidebar column make the bracket.

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
    view_layout:
      grid-area: top
    elbow:
      type: header-left
      segment:
        bar_width: 120
        bar_height: 24
        color: theme:colors.ui.primary
    text:
      label:
        content: "STELLAR CARTOGRAPHY • 2387"
        position: top-right
        color: theme:colors.ui.tertiary
  - type: custom:lcards-button
    preset: panel-dark
    view_layout:
      grid-area: side1
  - type: custom:lcards-button
    preset: panel-light
    view_layout:
      grid-area: side2
  - type: custom:lcards-data-grid
    data_mode: decorative
    view_layout:
      grid-area: main
  - type: custom:lcards-elbow
    view_layout:
      grid-area: bottom
    elbow:
      type: footer-left
      segment:
        bar_width: 120
        bar_height: 24
        color: theme:colors.ui.primary
```

## Header bar with a title

**A bar that carries the screen or section title, with a short cap before it.** Picard sections (*MISSION OPS*, *PROPULSION*) use this instead of a sweep.

- The title grows to fill the bar's height, so in a narrow area set a smaller `text.label.font_size` (or a shorter `min_height`) or it runs off the end.

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

## Readout rows

**A label block and a horizontal gauge per line, for a set of levels read side by side.** Each line is a `panel-dark` button beside a slider with the `gauge-basic` preset; drag a level under the card to move its gauge.

```yaml live controls
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
    text:
      label:
        content: PRIMARY
        position: center-right
  - type: custom:lcards-slider
    entity: input_number.primary_level
    preset: gauge-basic
  - type: custom:lcards-button
    preset: panel-dark
    min_height: 0
    text:
      label:
        content: SECONDARY
        position: center-right
  - type: custom:lcards-slider
    entity: input_number.secondary_level
    preset: gauge-basic
  - type: custom:lcards-button
    preset: panel-dark
    min_height: 0
    text:
      label:
        content: RESERVE
        position: center-right
  - type: custom:lcards-slider
    entity: input_number.reserve_level
    preset: gauge-basic
```

## Gauge bank

**A row of vertical gauges, as on the Picard biometric and atmospheric panels.** Good for several readings of the same kind: each is a `picard` slider with the `picard-gauge-vertical` preset.

```yaml live controls
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

## Selector strip

**A row of equal tabs for choosing one of several, as in the Titan.DS fleet directory.** It is a [select menu](../cards/select-menu/) with the `toggle-tab` preset; the selected option is highlighted.

```yaml live controls
type: custom:lcards-select-menu
entity: input_select.demo_mode
preset: toggle-tab
grid:
  columns: 4
  gap: 6px
```

## Tile wall

**Small framed tiles, each with its own reading, as in the Picard signal-processing panels.** Each frame holds its reading as an embedded card ([symbiont](../cards/elbow/symbiont)): a chart, a camera, a data grid.

- `imprint.enabled: false` keeps the embedded card's own styling instead of taking the frame's colours and font.

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
      segment:
        color: theme:colors.card.topColor
      frame:
        bar_width: 4
        bar_height: 4
        outer_curve: 10
    symbiont:
      enabled: true
      position:
        top: 10
        right: 10
        bottom: 10
        left: 10
      imprint:
        enabled: false
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
      segment:
        color: theme:colors.card.topColor
      frame:
        bar_width: 4
        bar_height: 4
        outer_curve: 10
    symbiont:
      enabled: true
      position:
        top: 10
        right: 10
        bottom: 10
        left: 10
      imprint:
        enabled: false
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
      segment:
        color: theme:colors.ui.tertiary
      frame:
        bar_width: 4
        bar_height: 4
        outer_curve: 10
    symbiont:
      enabled: true
      position:
        top: 10
        right: 10
        bottom: 10
        left: 10
      imprint:
        enabled: false
      card:
        type: custom:lcards-data-grid
        data_mode: decorative
        format: float
        grid:
          grid-template-rows: repeat(4, auto)
          grid-template-columns: repeat(3, minmax(0, 1fr))
```

## Split header (classic)

**The TNG and Voyager header: an upper block that sweeps down into a bar, a thin gap, and a lower block that sweeps out of the next bar.** The title sits in the black beside the upper sweep, as a text field on the upper elbow.

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
      segment:
        bar_width: 140
        bar_height: 18
        color: theme:colors.ui.primary
    text:
      title:
        content: PATIENT BIOMEDICAL STATUS
        position: top-right
        font_size: 26
        color: theme:colors.ui.tertiary
  - type: custom:lcards-elbow
    elbow:
      type: header-left
      segment:
        bar_width: 140
        bar_height: 18
        color: theme:colors.ui.secondary
```

## List

**Rows of text in columns, for rosters, schedules and logs, as in Voyager's duty roster.** It is a [data grid](../cards/data-grid/) in data mode with fixed text or your entities; the first row is a header.

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

## Slanted bars

**Bars with a cut end, for labels and indicators (Titan console side panels).** The elbow's `bar-slant-right`, `bar-slant-left` and `bar-parallelogram` types make the whole card one bar, and `segment.diagonal_angle` sets the cut.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 96px
  grid-gap: 8px
  grid-template-columns: 200px 120px
  grid-template-rows: 44px 44px
cards:
  - type: custom:lcards-elbow
    elbow:
      type: bar-slant-right
      segment:
        color: theme:colors.ui.secondary
    text:
      label:
        content: LCARS
        position: center-left
        font_size: 22
        color: var(--lcars-text-dark, var(--lcards-gray-darkest))
  - type: custom:lcards-elbow
    elbow:
      type: bar-parallelogram
      segment:
        color: theme:colors.ui.tertiary
        diagonal_angle: 60
  - type: custom:lcards-elbow
    elbow:
      type: bar-slant-right
      segment:
        color: theme:colors.ui.primary
    text:
      label:
        content: "47"
        position: center-left
        font_size: 22
        color: var(--lcars-text-dark, var(--lcards-gray-darkest))
```

## Flagged blocks

**Number blocks with a thin accent tick on the left, as in the Titan console's number columns.** The `panel-flagged` preset draws them; with an entity, the tick turns to the off colour while it's off.

```yaml live controls
type: custom:lcards-layout-card
layout:
  height: 150px
  grid-gap: 6px
  grid-template-columns: 140px
  grid-template-rows: repeat(4, minmax(0, 1fr))
cards:
  - type: custom:lcards-button
    preset: panel-flagged
    min_height: 0
    text:
      label:
        content: "012"
  - type: custom:lcards-button
    preset: panel-flagged
    min_height: 0
    text:
      label:
        content: "330"
  - type: custom:lcards-button
    preset: panel-flagged
    min_height: 0
    entity: light.demo
    tap_action:
      action: toggle
    text:
      label:
        content: "436"
  - type: custom:lcards-button
    preset: panel-flagged
    min_height: 0
    text:
      label:
        content: "542"
```

## Dot rows

**Rows of dots in groups, along the top or bottom edge of a frame (Titan.DS headers and footers).** It is a `text-only` button whose label is runs of `•`.

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
    font_size: 44
```

## Fleet tiles

**A row of framed tiles, one per item, as in the Titan.DS fleet directory.** Each tile is a frame elbow with two text fields, the name and the class; its thicker top and bottom bars (`bar_height`) can carry a state colour.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 150px
  grid-gap: 8px
  grid-template-columns: repeat(3, minmax(0, 1fr))
  grid-template-rows: minmax(0, 1fr)
cards:
  - type: custom:lcards-elbow
    elbow:
      type: frame
      segment:
        color: theme:colors.card.topColor
      frame:
        bar_width: 4
        bar_height: 18
        outer_curve: 8
    text:
      label:
        content: NCC-1701-A
        position: top-center
        font_size: 14
        color: theme:colors.ui.tertiary
      class:
        content: CONSTITUTION
        position: center
        font_size: 18
        color: theme:colors.ui.primary
  - type: custom:lcards-elbow
    elbow:
      type: frame
      segment:
        color: theme:colors.ui.secondary
      frame:
        bar_width: 4
        bar_height: 18
        outer_curve: 8
    text:
      label:
        content: NCC-1701-C
        position: top-center
        font_size: 14
        color: theme:colors.ui.tertiary
      class:
        content: AMBASSADOR
        position: center
        font_size: 18
        color: theme:colors.ui.primary
  - type: custom:lcards-elbow
    elbow:
      type: frame
      segment:
        color: theme:colors.card.topColor
      frame:
        bar_width: 4
        bar_height: 18
        outer_curve: 8
    text:
      label:
        content: NCC-1701-E
        position: top-center
        font_size: 14
        color: theme:colors.ui.tertiary
      class:
        content: SOVEREIGN
        position: center
        font_size: 18
        color: theme:colors.ui.primary
```

## Brackets and scopes

**Round displays framed by bracket arcs, and radar scopes (meWho's Titan.DS and Protostar screens).** They are the button's `brackets` and `radar` [components](../cards/button/components#brackets-and-radar), and both take their colours from the theme roles.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 300px
  grid-gap: 12px
  grid-template-columns: 300px 300px
  grid-template-rows: minmax(0, 1fr)
cards:
  - type: custom:lcards-button
    component: brackets
    text:
      label:
        content: "88"
        show: true
        position: center
        font_size: 48
        color: theme:colors.ui.tertiary
  - type: custom:lcards-button
    component: radar
```
