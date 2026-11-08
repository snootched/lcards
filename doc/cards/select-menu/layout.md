---
description: "Select menu card grid and sizing: columns, gaps, row height and flow, how many rows the card asks for in a sections view, and the fit and 100% height modes for menus inside layouts."
---

# Grid and Sizing

How the option buttons are arranged, and how tall the card is in a dashboard or inside a layout.

## grid

**`grid` arranges the option buttons as a CSS grid: how many columns, the gaps between buttons and the height of each row.** Most menus need only `columns` and `gap`.

- `columns` takes a number for equal columns, or any CSS `grid-template-columns` value for columns of different widths (`100px 1fr 2fr`).
- Each row is `56px` high unless you set `grid-auto-rows`, and the buttons fill their cells. To place smaller buttons in their cells, give them a size in `button_template` (`width`, `height`) and set `justify-items` or `align-items`.
- `rows` sets a number of rows (each `grid-auto-rows` high) or a CSS `grid-template-rows` track list. With the default row flow, options beyond those rows add more.

```yaml live
type: custom:lcards-select-menu
entity: input_select.demo_mode
preset: lozenge
grid:
  columns: 2
  gap: 6px
  grid-auto-rows: 44px
```

::: details More about grid
- **Column flow:** with `grid-auto-flow: column` the options fill each column top to bottom, so set `rows`: without it every option goes in one row.
- **Gap aliases:** `row_gap` and `column_gap` are accepted as other spellings of `row-gap` and `column-gap`; the dashed key wins when both are set.
- **Other CSS grid keys:** the card builds the grid from the keys in this table only; other CSS grid properties under `grid` have no effect.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `grid.columns` | number / string | `1` | Number of equal-width columns (1 to 24), or a CSS `grid-template-columns` value |
| `grid.grid-template-columns` | string | - | A CSS `grid-template-columns` value; wins over `columns` |
| `grid.gap` | string | `4px` | Gap between rows and between columns |
| `grid.row-gap` | string | `gap` | Gap between rows; `row_gap` is an alias |
| `grid.column-gap` | string | `gap` | Gap between columns; `column_gap` is an alias |
| `grid.grid-auto-rows` | string | `56px` | Row height, such as `48px`, `minmax(40px, 56px)` or `auto` |
| `grid.grid-auto-flow` | string | `row` | `row`, `column`, `dense`, `row dense` or `column dense` |
| `grid.rows` | number / string | - | A number of rows, each `grid-auto-rows` high, or a CSS `grid-template-rows` value |
| `grid.justify-items` | string | `stretch` | Each button's place across its cell: `stretch`, `start`, `end` or `center`. Places buttons with a `button_template.width`; without one they fill the cell across |
| `grid.align-items` | string | `stretch` | Each button's place down its cell: `stretch`, `start`, `end` or `center`. Places buttons with a `button_template.height`; without one they fill the cell down |
| `grid.height` | string | natural | `fit` or `100%`: see [Height modes](#height-modes) |

## Sizing in a Dashboard

**In a sections view the card asks Home Assistant for enough grid rows to show every option.** It works the rows out from the number of options, the columns, `grid.rows`, the row height and the row gap.

- The row height it counts is `grid-auto-rows` in pixels (the larger value of `minmax(Apx, Bpx)`), or `56px` for anything else. A pixel track in `grid.rows` counts as given.
- A pixel `height` on the card sizes it instead, and your own `grid_options.rows` always wins.
- The card asks for 4 grid columns unless `grid_options.columns` says otherwise. In a masonry view it reports one unit per row of options (or its pixel `height` in 50 px units).

```yaml live
# 8 options in 4 columns: 2 rows, so a 2-row cell
type: custom:lcards-select-menu
entity: input_select.deck
preset: capped
grid:
  columns: 4
  gap: 4px
options:
  - value: bridge
    label: BRIDGE
  - value: engineering
    label: ENGINEERING
  - value: sickbay
    label: SICKBAY
  - value: tactical
    label: TACTICAL
  - value: science
    label: SCIENCE
  - value: cargo
    label: CARGO
  - value: shuttle
    label: SHUTTLE BAY
  - value: holodeck
    label: HOLODECK
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `height` | number / string | - | A fixed card height; a pixel value also sets the rows the card asks for. See [Sizing](../common#sizing-height-width-min-height-min-width-max-height-max-width) |
| `grid_options.rows` | number | enough for every option | Rows in a sections view; wins over the card's own count |
| `grid_options.columns` | number | `4` | Columns in a sections view; the card can't be resized below 2 |

## Height modes

**`grid.height` lets a menu inside a layout size its parent's row, or fill a row the parent sizes.** Leave it out and the option grid is as tall as its rows, and the card flows like normal content.

- `fit` gives the card a fixed pixel height worked out from the config (rows × row height + gaps, the same count as [Sizing in a Dashboard](#sizing-in-a-dashboard)), so a parent row sized to its content (`auto` or `minmax(0, max-content)`) can follow it exactly. Measuring the menu through Home Assistant's card wrapper is unreliable; a definite height always works. It needs a pixel `grid-auto-rows` (`Npx` or `minmax(Apx, Bpx)`, which counts the larger value).
- `100%` makes the option grid fill the height its container gives it. With a pixel `grid-auto-rows`, the card measures the container and shares it between the rows (not the options: 4 options in 2 columns are 2 rows), within the bounds; with a flexible maximum such as `minmax(40px, 1fr)`, CSS shares the height out.
- For a fixed card height with scrolling, use the card's own `height` and `overflow_y` instead.

This sidebar is the pattern the shell strategy uses: the menu's row hugs the menu, and a filler panel takes the rest.

```yaml live
type: custom:lcards-layout-card
height: 300
layout:
  grid-template-columns: 1fr
  grid-template-rows: minmax(0, max-content)
  grid-auto-rows: minmax(40px, 1fr)
  grid-gap: 5px
cards:
  - type: custom:lcards-select-menu
    entity: input_select.demo_mode
    preset: lozenge
    grid:
      columns: 1
      gap: 5px
      grid-auto-rows: minmax(40px, 56px)
      height: fit
    view_layout:
      # scrolls inside the menu if the container is too short
      overflow-y: auto
  - type: custom:lcards-button
    preset: panel-dark
    # lets the filler shrink with its row
    min_height: 1
```

::: details More about height modes
- **The parent row:** `minmax(0, max-content)` tracks the menu's published height exactly, capped by the container; the filler row (`minmax(40px, 1fr)`) takes the rest.
- **Buttons in rows that shrink:** set a small `min_height` on them. Without one, the button preset's minimum height (56 px from the theme) keeps them painting at full size even in a collapsed row.
- **100% when even the minimum does not fit:** the buttons stay at the minimum row height and the option grid scrolls inside the card instead of spilling into the layout. Until the container has been measured (the first frame), the grid clips.
- **Other values:** `grid.height` takes only `fit` and `100%`; anything else is ignored.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `grid.height` | string | - | Unset: as tall as the rows. `fit`: a fixed pixel height from the config. `100%`: fill the container |
| `grid.grid-auto-rows` | string | `56px` | Must be `Npx` or `minmax(Apx, Bpx)` for `fit`, and for `100%` to pick the row height itself |
