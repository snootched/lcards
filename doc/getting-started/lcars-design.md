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
| This page | The two looks, colour roles, structure, scale and density (with a checklist), motion and alerts, and the screen archetypes to start from |
| [LCARS Patterns](lcars-patterns) | Over twenty building blocks, rendered live: code-block columns, sweeps and frames, pill grids, gauges, lists, tiles |

## Two looks

**LCARS comes in two broad looks: the thin, dark *Picard* screens and the thick, colourful classic ones.** Most of the guidelines below apply to both.

- The look mostly comes from the theme: the same layout reads as Picard in a Picard theme and as TNG in a classic one.

| | Picard (*Picard* S3, Titan) | Classic (TNG, DS9, Voyager) |
|---|---|---|
| Structure | Thin frames in a few dark, muted tones | Thick blocks of colour |
| Colour | Mostly black and structure tones; a little accent | Several pastel colours at once |
| Buttons | Small square blocks with code numbers, pills at the edges | Grids of rounded pills, led by big numbers |
| Main display | Line-drawn schematic inside an open sweep | Content inside a bracket or sweep frame |
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
- **Frame the display with an open sweep.** On Picard screens the main display sits in one thin sweep that runs along the top, down the left and back along the bottom, open on the right ([display sweep](lcars-patterns#display-sweep)); classic ones put a thin sweep inside a thick one. A fully closed or double frame is rare: use it only when asked.
- **Break long bars into segments** of different lengths, separated by small black gaps. A segment can carry a small label or number.
- **One gap size everywhere.** The same gap between blocks, segments and frames on a screen (`grid-gap` on the layout view and layout cards). Blocks never touch.
- **Labels sit right-aligned**, usually at the bottom right of their block, in condensed capitals (the theme font). Numbers right-aligned in columns.
- **One title, top right**, large, in the accent colour or white; a dim subtitle at the bottom right if you need one. Classic titles often read `NAME • NUMBER`.
- **Numbers as texture.** Code-like numbers (`13-650`, `0099•06`) fill blocks and columns, and dense number cascades fill spare areas. Real readings and decorative numbers look alike; that's part of the look.
- **A sweep is at least as wide as what it frames.** If a sweep's vertical bar is narrower than the column above it, it looks detached; close a narrow column with a segmented bar instead.
- **Fill space with structure, not black.** If an area is empty, put blocks, a number cascade or a segmented bar in it.

## Scale and density

**An LCARS screen is many small parts of fixed size around one large part that takes the rest.** Measured on the reference screens, this matters more than colour. Generated screens most often look fan-made because their parts are too big and too few.

- **Small parts keep a fixed size.** Give their grid tracks a size in px (`64px`, `24px`) and leave `minmax(0, 1fr)` for the main display. With every track at `1fr`, blocks and pills grow with the screen and turn into large slabs. In a column or bar that must reach the screen edge, let one part (the last sidebar block, one long bar segment) take what is left.
- **Many parts.** A full screen carries about 50 to 90 small blocks, pills and bars, plus thin lines, ticks and number rows. A screen with fewer than about 30 reads as a web dashboard painted in LCARS colours.
- **No large empty patch.** About a sixth of the screen is plain black, spread out as gaps; no single empty region is larger than about a tenth of the screen. A chart or a short list alone in a big frame breaks this. Put readouts, a scale, or a column of blocks beside it.
- **Three or four size tiers, no medium-large.** One large display, one large title, small blocks and pills, and tiny labels, ticks and codes.

```yaml live
type: custom:lcards-layout-card
layout:
  height: 192px
  grid-gap: 4px
  # fixed small columns; only the display grows
  grid-template-columns: 64px 64px minmax(0, 1fr)
  grid-template-rows: repeat(7, 24px)
cards:
  # a two-wide code-block column, each block 64 x 24 px
  - type: custom:lcards-button
    preset: panel-light
    min_height: 0
    text:
      label:
        content: 63-934
        position: center-right
  - type: custom:lcards-button
    preset: panel-light
    min_height: 0
    text:
      label:
        content: 13-650
        position: center-right
  - type: custom:lcards-button
    preset: panel-dark
    min_height: 0
    text:
      label:
        content: 19-638
        position: center-right
  - type: custom:lcards-button
    preset: panel-light
    min_height: 0
    text:
      label:
        content: 42-991
        position: center-right
    style:
      card:
        color:
          background:
            default: theme:colors.ui.tertiary
  - type: custom:lcards-button
    preset: panel-light
    min_height: 0
    text:
      label:
        content: 28-130
        position: center-right
  - type: custom:lcards-button
    preset: panel-dark
    min_height: 0
    text:
      label:
        content: 50-957
        position: center-right
  - type: custom:lcards-button
    preset: panel-light
    min_height: 0
    text:
      label:
        content: 81-782
        position: center-right
  - type: custom:lcards-button
    preset: panel-light
    min_height: 0
    text:
      label:
        content: 85-334
        position: center-right
  # the one part that grows: here a number cascade standing in for the main display
  - type: custom:lcards-data-grid
    data_mode: decorative
    format: digit
    view_layout:
      grid-column: "3"
      grid-row: 1 / -1
    grid:
      grid-template-columns: repeat(8, 44px)
      grid-template-rows: repeat(9, 18px)
      gap: 3
    style:
      font_size: 14
      color: theme:colors.ui.secondary
      align: right
```

::: details More about scale and density
- **Measured sizes.** Measured at 1600 px wide on Picard and classic references, the typical block is about 2.5% of the screen height and 4% of the width (about 64 x 24 px). Letters in a block are about half the block's height: `font_size` 13 to 14 in a 24 px block. The title's letters are 3 to 4% of the screen height (Picard) or 6 to 7% (classic). Take these as targets to aim near, not limits.
- **A starting grid.** For the display with side columns at 1600 px wide: `grid-template-columns: 116px 134px minmax(0, 1fr) 196px` (pills, a two-wide block column, the display, a readings column) and `grid-template-rows: 84px minmax(0, 1fr) 132px` (header, display, strip). For the classic data screen: `grid-template-columns: 168px 200px minmax(0, 1fr) 156px 156px` and `grid-template-rows: 84px 142px 18px 18px 90px minmax(0, 1fr)`, the first row sized for the title (about 1.3 times its `font_size`) and the two 18 px rows holding the upper and lower sweeps' bars. Classic pills are about 30 px tall at this size. Other archetypes keep the same idea: fixed px for every area but the display.
- **Overlap by lines, not areas.** Each named area must be one rectangle, or the browser drops the whole template (the [config checker](config-checker) reports it). Where a part sits inside a sweep's open corner (the classic number rows, a display tucked under a curve), place it with `view_layout` `grid-row` and `grid-column` instead of an area, with a left margin that clears the sweep's inner curve. Columns that must line up (a ruler of blocks beside its numbers) need the same row sizes.
- **Edge columns are narrow.** Picard block columns, gauge pairs and pill columns are each about 4 to 9% of the width and sit tight against the frame. A classic sidebar is thicker, about 8 to 12%.
- **Thin structure fills black without weight.** 1 to 3 px rules, leader lines from a block to what it labels, tick scales and [dot rows](lcars-patterns#dot-rows) are everywhere on the references.
- **Frames interlock.** A header bar runs into a sweep that becomes a column, and the column ends in another bar. Regions are divided by thin frames and small gaps, not by one large gap between equal boxes.
- **The main display is busy.** A schematic with labels and leader lines, or a chart with a scale and readouts beside it; not a chart alone.
- **Phones and portrait panels** hold fewer parts (about half), at the same small sizes.
:::

### Check a screen

**Before you call a screen done, run down this list.** Each item is a guideline from the references; a screen can break one on purpose.

| Check | Aim near |
|---|---|
| Small parts on fixed px tracks | Only the main display uses `1fr`, plus one filler part per edge column or bar |
| Small blocks, pills and bars on a full screen | 50 to 90 |
| Block size at 1600 px wide | About 64 x 24 px; a classic sidebar block is wider |
| Label text | Letters about half the block's height (`font_size` 13 to 14 in a 24 px block); one title at 36 to 48 (Picard) or 56 to 80 (classic), clear of everything round it |
| Largest empty region | Under about a tenth of the screen |
| Accent colour | About a tenth of the screen (Picard); classic carries more |
| Number cascades and readouts | On black, never in outlined or rounded boxes |
| Numbers that mean something | Most numbers are readings with a label; at most one decorative cascade filling an area, in a slot a reading can take (short groups inside a code-block column don't count) |
| Frames | Open sweeps that interlock; bars in two to four segments; never one thick frame around a grid of equal boxes |

## Picard

**Picard screens are thin frames in dark tones, with columns of small blocks and a schematic in the middle.**

- **Columns of small number blocks** down one or both sides: mostly structure tones, a few in the accent, some dark (inactive). See [code-block column](lcars-patterns#code-block-column).
- **A utility column at the far edge:** a bracket frame open on the outer side, square-ended there, holding three to five small dark pills (zoom, settings, dimmer) with a red alert pill at the bottom. Every other button is a rectangular block. See [utility pills](lcars-patterns#utility-pills).
- **Concentric sweeps**: a thick sweep with a thin line running parallel inside it, for headers and corners. See [concentric sweep](lcars-patterns#concentric-sweep).
- **Controls inside a wide arm**: a thick frame whose black inset holds a group of blocks. See [controls inside a wide arm](lcars-patterns#controls-inside-a-wide-arm).
- **Vertical gauges with tick scales** beside the number columns ([Picard and gauge sliders](../cards/slider-card/)). See [gauge bank](lcars-patterns#gauge-bank).
- **The main display is a schematic**: a line drawing with leader lines to labels, small accent highlights for faults ([MSD](../cards/msd/)).
- **A strip of tabs and sliders along the bottom.** Tabs show their state as a line along the top ([toggle tab strip](lcars-patterns#toggle-tab-strip)).
- **Fixed chrome, changing centre.** Titan.DS keeps the same frame, columns and strips on every screen and swaps only the central display. In LCARdS: a layout view whose centre area holds several cards with [visibility conditions](../cards/layout-view/), one shown at a time.

## Classic (TNG, DS9, Voyager)

**Classic screens build their structure from thick blocks of colour, with grids of pills led by big numbers.**

- **The data screen is the classic shape.** An upper band about a quarter of the height carries a sweep, a [readings table](lcars-patterns#readings-table) of tiny labelled values (one or two colours a row), a few pills and the big title, which keeps clear of the readings. A thin band of two to four segments per bar divides it from the lower part. The lower part is a thick sidebar of stacked blocks beside one large line-art display (a grid, scan or schematic). See the [data screen archetype](#screen-archetypes).
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
| **Data screen** | One large classic display (a scan, a map, a chart) with data rows above it; TNG and Voyager readouts | `"sweep data title" "side band band" "side display display"` | [Classic](dashboard-gallery#classic-data-screen) |
| **Sweep console** | A classic control panel: thick header sweep, sidebar, button groups | `"head head head" "side pills readout" "foot foot foot"` | [Classic](dashboard-gallery#classic-sweep-console) |
| **Bracket screen** | A readout or a document: capped top and bottom bars, a numbered sidebar | `"top top" "side main" "bottom bottom"` | [Classic](dashboard-gallery#classic-bracket-screen) |
| **List** | Rosters, schedules, logs: rows of text under a split header | `"head head" "list numbers" "pills pills"` | [Classic](dashboard-gallery#classic-list) |

## Putting it together

**A screen is a [layout view](../cards/layout-view/) shaped by one of the archetypes, with [patterns](lcars-patterns) in its areas.** For example: a facing-sweeps header across the top, a code-block column and utility pills down the left, a display sweep round an MSD or chart in the centre, and a toggle tab strip along the bottom. Or a portrait panel: a header bar with a title, a gauge bank, a selector strip.

The [Dashboard Gallery](dashboard-gallery#built-from-the-design-guide) has seven complete screens built this way, four in the Picard look and three classic, each laid out differently.
