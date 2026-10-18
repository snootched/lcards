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
- **Fill space with structure, not black.** If an area is empty, put blocks, a number cascade or a segmented bar in it.

## Picard

- **Columns of small number blocks** down one or both sides: mostly structure tones, a few in the accent, some dark (inactive). See [number-block column](#number-block-column).
- **A utility column of pills at the far edge** (zoom, settings, dimmer), with a red alert pill at the bottom.
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

## Motion and alerts

- **At rest, move small things only**: ticking numbers, a dot row, a scanning line. On the reference screens about one twentieth of the screen moves at a time. [Animations](../core/animations.md), [data grid cascades](../cards/data-grid/).
- **Animate entrances once** (`on_show` with `draw`, `cascade` or `text-reveal`), not continuously.
- **Alerts change the whole screen at once**: [alert mode](../core/alert-mode.md) recolours everything in place, and an [alert overlay](../cards/alert-overlay/) adds the alert symbol. Avoid making every card flash.
- **Show state by colour in place**, not by moving things: a block turns to the accent, a tab's line lights up.

## Patterns

Building blocks to compose a screen from. Each is a [layout card](../cards/layout-card/) you can drop into a layout view area, with every colour from a theme role. Change the numbers, labels and entities to yours.

Two things keep a pattern from collapsing when you change it: give the layout card's rows a size (`grid-template-rows` or `grid-auto-rows` in px or `minmax(0, 1fr)`; rows left to size themselves squash the cards), and keep a button's row at least as tall as the button (56 px by default; small pills and blocks set a lower `min_height`, bar labels size their text to it).

### Number-block column

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
    preset: number-block
    text: { label: { content: 63-934 } }
  - type: custom:lcards-button
    preset: number-block
    text: { label: { content: 13-650 } }
  - type: custom:lcards-button
    preset: number-block
    text: { label: { content: 19-638 } }
  - type: custom:lcards-button
    preset: number-block
    entity: light.demo
    text: { label: { content: 42-991 } }
    tap_action: { action: toggle }
  - type: custom:lcards-button
    preset: number-block
    text: { label: { content: 28-130 } }
  - type: custom:lcards-button
    preset: number-block
    text: { label: { content: 50-957 } }
  - type: custom:lcards-button
    preset: number-block
    text: { label: { content: 81-782 } }
  - type: custom:lcards-button
    preset: number-block
    text: { label: { content: 85-334 } }
```

The block with an entity shows the accent while it's on. Leave out `text.label.content` and each block gets a random code.

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

The Picard edge column: small pills, with red alert at the bottom.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 240px
  grid-gap: 8px
  grid-template-columns: 140px
  grid-template-rows: 36px 36px 36px minmax(0, 1fr) 36px
cards:
  - type: custom:lcards-button
    preset: lozenge
    min_height: 36
    text: { label: { content: ZOOM, show: true, position: center } }
  - type: custom:lcards-button
    preset: lozenge
    min_height: 36
    text: { label: { content: SETTINGS, show: true, position: center } }
  - type: custom:lcards-button
    preset: lozenge
    min_height: 36
    text: { label: { content: DIMMER, show: true, position: center } }
  - type: custom:lcards-button
    preset: text-only
    min_height: 0
  - type: custom:lcards-button
    preset: lozenge
    min_height: 36
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

## Putting it together

A screen is a [layout view](../cards/layout-view/) whose areas hold these patterns: for example a facing-sweeps header across the top, a number-block column and utility pills down the left, a nested frame with an MSD or chart in the centre, a toggle tab strip along the bottom. The [Dashboard Gallery](dashboard-gallery#built-from-the-design-guide) has two complete screens built this way, a Picard console and a TNG console, to start from.
