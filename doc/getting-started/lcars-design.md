---
description: "Guidelines for making a Home Assistant dashboard look like LCARS: frames, colour roles from your theme, the Picard and classic TNG/DS9/Voyager looks, motion, and the screen archetypes to start from."
---

# Designing LCARS Screens

**What makes a screen read as LCARS, written down as guidelines you can pick from.** They come from an automated analysis of hundreds of recognizable LCARS screens: the *Star Trek: Picard* season 3 consoles (as rebuilt by meWho's Titan.DS and LCARSlad London) and production panels from *The Next Generation*, *Deep Space Nine* and *Voyager*.

- A dashboard that follows just a few of these guidelines already looks more like LCARS than one that follows none: pick the ones that suit your screen and taste.
- [Building a Dashboard](building-dashboards) covers the mechanics (which card for which job, the layout view); this guide is about the look.
- The [Dashboard Gallery](dashboard-gallery#built-from-the-design-guide) has complete screens built from these guidelines.

| Page | Covers |
|---|---|
| This page | The two looks, colour roles, structure, motion and alerts, and the screen archetypes to start from |
| [LCARS Patterns](lcars-patterns) | Over twenty building blocks, rendered live: code-block columns, sweeps and frames, pill grids, gauges, lists, tiles |

## Two looks

**LCARS comes in two broad looks: the thin, dark *Picard* screens and the thick, colourful classic ones.** Most of the guidelines below apply to both.

- The look mostly comes from the theme: the same layout reads as Picard in a Picard theme and as TNG in a classic one.

| | Picard (*Picard* S3, Titan) | Classic (TNG, DS9, Voyager) |
|---|---|---|
| Structure | Thin frames in a few dark, muted tones | Thick blocks of colour |
| Colour | Mostly black and structure tones; a little accent | Several pastel colours at once |
| Buttons | Small square blocks with code numbers, pills at the edges | Grids of rounded pills, led by big numbers |
| Main display | Line-drawn schematic inside a nested frame | Content inside a bracket or sweep frame |
| Themes that suit it | `LCARS Picard [LCARdS Red/Blue Accent]`, `LCARS Picard I/II`, `LCARS 25C` | `LCARS Default`, `LCARS TNG`, `LCARS Classic`, `LCARS Nemesis Blue` |

## Colour comes from your theme

**Don't pick colours for an LCARS screen; pick roles, and let the theme supply the colour.** Then the screen follows when you switch themes, into light or dark mode, and into alert mode.

- **Prefer the `theme:` tokens.** They resolve to your [HA-LCARS](https://github.com/th3jesta/ha-lcars) theme's variable when it's installed and fall back to the LCARdS palette when it isn't, so the card always has a colour. A bare `var(--lcars-...)` is empty without HA-LCARS: give it a fallback, as in the table.
- **Keep accent colour sparse.** In the Picard references only about a tenth of the screen is accent colour; the rest is black and structure tones. A block stays a structure colour unless it means something.
- **Classic screens are more colourful:** several roles side by side, mixed freely. The classic themes already set their roles to the pastel set.
- HA-LCARS themes have one accent role, so the data colour is a deliberate pick from the palette: check it reads on your theme's structure colours.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 64px
  grid-gap: 6px
  grid-template-columns: repeat(4, minmax(0, 1fr))
  grid-template-rows: minmax(0, 1fr)
cards:
  # main structure
  - type: custom:lcards-button
    preset: panel-light
    min_height: 0
    text:
      label:
        content: PRIMARY
    style:
      card:
        color:
          background:
            default: theme:colors.ui.primary
  # secondary structure
  - type: custom:lcards-button
    preset: panel-light
    min_height: 0
    text:
      label:
        content: SECONDARY
    style:
      card:
        color:
          background:
            default: theme:colors.ui.secondary
  # dark structure, with its text partner
  - type: custom:lcards-button
    preset: panel-light
    min_height: 0
    text:
      label:
        content: DARK
        color: var(--lcars-card-top-text, var(--lcards-gray-lightest))
    style:
      card:
        color:
          background:
            default: theme:colors.card.topColor
  # accent: used sparingly
  - type: custom:lcards-button
    preset: panel-light
    min_height: 0
    text:
      label:
        content: ACCENT
    style:
      card:
        color:
          background:
            default: theme:colors.ui.tertiary
```

::: details More about colour
- **Light and dark mode belong to the theme.** If your theme has both, a screen built from roles works in both.
- **A view can choose its own theme:** `theme: LCARS Default` on a view shows that view in that theme, whatever the user's profile theme is. Handy for a classic screen on an otherwise Picard dashboard.
- **Every colour format:** [Colours](../core/colours) lists what a colour value can be and how theme tokens resolve.
:::

| Role | Use for | Token | HA-LCARS variable |
|---|---|---|---|
| Main structure | Sweeps, frame bars, the most important frame | `theme:colors.ui.primary` | `--lcars-ui-primary` |
| Secondary structure | Block columns, side bars | `theme:colors.ui.secondary`, `theme:colors.ui.quaternary` | `--lcars-ui-secondary`, `--lcars-ui-quaternary` |
| Dark structure | Inner frames, inactive blocks, tabs | `theme:colors.card.topColor`, `theme:colors.card.bottomColor` | `--lcars-card-top-color`, `--lcars-card-bottom-color` |
| Accent | What's on, selected or needs attention | `theme:colors.ui.tertiary`, `theme:colors.card.buttonOn` | `--lcars-ui-tertiary`, `--lcars-card-button-color` |
| Data | Readings, schematic lines, gauges | | a palette colour, e.g. `var(--lcars-blue, var(--lcards-blue-medium))` |
| Alert | Alert states | | `var(--lcars-alert-color, var(--lcards-orange-dark))` |
| Text on a role | Labels on a coloured block | | the role's text partner: `--lcars-ui-primary-text`, `--lcars-card-top-text`, ... |

## Structure

**An LCARS screen is black, framed by sweeps, and filled with structure rather than empty space.** These hold for both looks.

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

**Picard screens are thin frames in dark tones, with columns of small blocks and a schematic in the middle.**

- **Columns of small number blocks** down one or both sides: mostly structure tones, a few in the accent, some dark (inactive). See [code-block column](lcars-patterns#code-block-column).
- **A utility column of small dark pills, housed inside a bracket frame** at the far edge (zoom, settings, dimmer), with a red alert pill at the bottom. See [utility pills](lcars-patterns#utility-pills).
- **Concentric sweeps**: a thick sweep with a thin line running parallel inside it, for headers and corners. See [concentric sweep](lcars-patterns#concentric-sweep).
- **Controls inside a wide arm**: a thick frame whose black inset holds a group of blocks. See [controls inside a wide arm](lcars-patterns#controls-inside-a-wide-arm).
- **Vertical gauges with tick scales** beside the number columns ([Picard and gauge sliders](../cards/slider-card/)). See [gauge bank](lcars-patterns#gauge-bank).
- **The main display is a schematic**: a line drawing with leader lines to labels, small accent highlights for faults ([MSD](../cards/msd/)).
- **A strip of tabs and sliders along the bottom.** Tabs show their state as a line along the top ([toggle tab strip](lcars-patterns#toggle-tab-strip)).
- **Fixed chrome, changing centre.** Titan.DS keeps the same frame, columns and strips on every screen and swaps only the central display. In LCARdS: a layout view whose centre area holds several cards with [visibility conditions](../cards/layout-view/), one shown at a time.

## Classic (TNG, DS9, Voyager)

**Classic screens build their structure from thick blocks of colour, with grids of pills led by big numbers.**

- **Colour blocks are the structure.** Thick header blocks, often in several roles side by side.
- **Grids of rounded pills**, each with a small code label, in column groups that alternate two or three roles. See [pill grid](lcars-patterns#pill-grid-classic).
- **A column of big numbers** (`20`, `008`, `358`) leads each group of pills.
- **Bracket frames**: a top and a bottom bar with rounded ends, and a sidebar of stacked blocks with code numbers. See [bracket frame](lcars-patterns#bracket-frame-classic).
- **A split header**: two sweeps meeting across the top, with a thin segmented band in the gap between them. See [split header](lcars-patterns#split-header-classic).
- **Segment the long arms.** A classic bar seldom runs unbroken across the screen: the sweep turns into a short bar, then segments of different lengths and roles carry labels. See [segmented bar](lcars-patterns#segmented-bar-classic-arms).

## Motion and alerts

**Keep an LCARS screen mostly still: small things move, and an alert changes everything at once.**

- **At rest, move small things only**: ticking numbers, a dot row, a scanning line. On the reference screens about one twentieth of the screen moves at a time. See [Animations](../core/animations) and [data grid cascades](../cards/data-grid/).
- **Animate entrances once** (`on_show` with `draw`, `cascade` or `text-reveal`), not continuously.
- **Alerts change the whole screen at once**: [alert mode](../core/alert-mode) recolours everything in place, and an [alert overlay](../cards/alert-overlay/) adds the alert symbol. Avoid making every card flash.
- **Show state by colour in place**, not by moving things: a block turns to the accent, a tab's line lights up.

## Screen archetypes

**Start a screen by picking its overall shape, then fill the areas with [patterns](lcars-patterns).** These are the layouts that recur across the reference screens, and each suits a different job.

- Mix them: a Picard screen can use the wings layout, a classic one the tile wall.
- Take groupings and sections from the [gallery](dashboard-gallery) and the references freely, but compose the screen for its own job rather than reproducing one whole.
- Two things vary a screen more than anything else: which archetype you start from, and which patterns you put in its areas. A screen that reuses one gallery screen's grid with new labels is the same screen; one that combines a different archetype with two or three patterns is a new one.

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

## Putting it together

**A screen is a [layout view](../cards/layout-view/) shaped by one of the archetypes, with [patterns](lcars-patterns) in its areas.** For example: a facing-sweeps header across the top, a code-block column and utility pills down the left, a nested frame with an MSD or chart in the centre, and a toggle tab strip along the bottom. Or a portrait panel: a header bar with a title, a gauge bank, a selector strip.

The [Dashboard Gallery](dashboard-gallery#built-from-the-design-guide) has seven complete screens built this way, four in the Picard look and three classic, each laid out differently.
