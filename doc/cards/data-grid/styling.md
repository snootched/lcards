---
description: "Data grid card styling and animation: style layers from grid to cell, style keys, header rows, CSS Grid layout, the LCARS colour cascade, highlighting changed cells and filters."
---

# Styling and Animation

How the cells look, how the grid is laid out, and how it moves. What the cells show is on [Data and Cells](./data).

## Style layers

**Every cell gets its style from up to six layers, from the whole grid down to one cell.** Later layers win, key by key, so set the common look once in `style` and override only what differs.

- Every layer takes the same [style keys](#style-keys).
- Rule patches from the [rules engine](../../core/rules/) apply to the grid-wide `style`.

| Order | Layer | Applies to |
|-------|-------|------------|
| 1 | Theme defaults | Every cell: theme text colour, right-aligned, 24px Antonio |
| 2 | `style` | Every cell |
| 3 | Header defaults, then `header_style` | Rows with `header: true` |
| 4 | `columns[i].style` | Column i (counting from 0) |
| 5 | Row `style` | One row (a row written with `values`) |
| 6 | Cell `style` | One cell (a [cell object](./data#cell-objects)) |

```yaml live
type: custom:lcards-data-grid
data_mode: data
rows:
  - values: [Sensor, Reading]
    header: true
  - [Inside, sensor.living_room_temperature]
  # a row style
  - values: [Outside, sensor.outdoor_temperature]
    style:
      background: var(--lcards-blue-darkest)
  # a cell style
  - - Battery
    - value: sensor.phone_battery
      style:
        color: var(--lcars-yellow)
        font_weight: 700
grid:
  grid-template-columns: 1fr 1fr
# every cell
style:
  font_size: 18px
  color: var(--lcars-african-violet)
# the first column
columns:
  - style:
      align: left
header_style:
  color: var(--lcars-orange)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style` | object | theme defaults | Style for every cell |
| `header_style` | object | header defaults | Style for header rows: see [Header rows](#header-rows) |
| `columns[].style` | object | - | Style for one column, by position |
| `rows[].style` | object | - | Style for one row |
| `rows[].values[].style` | object | - | Style for one cell |

## Style keys

**The keys every style layer takes: colours, font, alignment, padding, wrapping and borders.** Numbers become pixels, except `font_weight`, `line_height` and `opacity`.

- `color` and `background` also take a [state map](./data#conditional-colours) that follows the cell's entity.
- Colours accept everything in [Colours](../../core/colours.md): `var(--lcars-...)`, `theme:` tokens and computed colours such as `alpha(var(--lcars-orange), 0.2)`.
- Long text is cut with an ellipsis; `white_space: normal` wraps it instead.

```yaml live
type: custom:lcards-data-grid
data_mode: data
rows:
  - [Status, All decks report nominal. Warp core output steady at cruise.]
  - [Alert, None]
grid:
  grid-template-columns: 100px 1fr
style:
  font_size: 18px
  font_family: Antonio, sans-serif
  align: left
  padding: 6px 10px
  border_width: 1
  border_style: solid
  border_color: var(--lcars-gray)
  border_radius: 4
columns:
  - style:
      color: var(--lcars-orange)
      text_transform: uppercase
      letter_spacing: 0.05em
  # the long text wraps instead of being cut
  - style:
      white_space: normal
      line_height: 1.2
```

::: details More about style keys
- **Other CSS properties:** any other CSS property also works, written in snake_case: `border_bottom_color`, `opacity`, `text_shadow`, `align_items` (vertical alignment inside the cell, such as `flex-start`), and so on. The card applies every one of them.
- **Padding per side:** `padding` also takes `top`, `right`, `bottom` and `left` in px, which is how the Studio's padding editor writes it.
- **Typography on the grid:** the grid-wide `font_family`, `font_size` and `font_weight` are also set on the grid itself, so cells without a font of their own inherit them.
- **Borders:** a border shows only with a `border_style` such as `solid`; `border_width` on its own draws nothing.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `color` | colour / state map | theme text colour | Text colour, or a [state map](./data#conditional-colours) |
| `background` | colour / state map | `transparent` | Background colour, or a state map |
| `font_size` | number / string | `24px` | Font size, such as `18` or `1.2rem` |
| `font_family` | string | Antonio | Font, such as `Antonio, sans-serif` |
| `font_weight` | number / string | `400` | Weight, such as `700` or `bold` |
| `align` | string | `right` | Horizontal alignment: `left`, `center` or `right` |
| `padding` | number / string | `4px` | Space inside the cell, such as `4px 8px` |
| `text_transform` | string | - | `none`, `uppercase`, `lowercase` or `capitalize` |
| `letter_spacing` | number / string | - | Letter spacing, such as `0.05em` |
| `line_height` | number / string | - | Line height; a number has no unit (`1.2`) |
| `white_space` | string | `nowrap` | `nowrap` cuts long text with an ellipsis; `normal`, `pre-wrap` or `pre-line` wrap it; `pre` keeps spaces and line breaks without wrapping |
| `border_width` | number / string | - | Cell border width |
| `border_color` | string | - | Cell border colour |
| `border_style` | string | - | `solid`, `dashed`, `dotted`, `double`, `groove`, `ridge`, `inset`, `outset` or `none` |
| `border_radius` | number / string | - | Rounded corners |

## Header rows

**Header rows start from the theme's header look before `header_style` applies: bold, uppercase, 16px, with a 2px divider underneath.** Set `header_style` to change every header row at once.

- The header defaults come after the grid-wide `style`, so a `font_size` in `style` doesn't reach header rows; set it in `header_style`.
- Column, row and cell styles still win over `header_style`.

```yaml live
type: custom:lcards-data-grid
data_mode: data
rows:
  - values: [Deck, Status]
    header: true
  - [Bridge, Nominal]
  - [Sickbay, Nominal]
grid:
  grid-template-columns: 1fr 1fr
style:
  font_size: 18px
header_style:
  color: var(--lcars-orange)
  background: transparent
  font_size: 20px
  align: left
```

::: details More about header rows
- **The defaults:** font size `16px`, weight `700`, `uppercase`, padding `12px 8px`, and a `2px` solid divider underneath, in the theme's header background, header text and divider colours.
- **No divider:** set `border_bottom_width: 0` in `header_style`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `header_style` | object | header defaults | Style for every header row: the [style keys](#style-keys) |

## Grid layout

**`grid` takes [CSS Grid](https://developer.mozilla.org/docs/Web/CSS/CSS_grid_layout) properties for the grid container; column widths are the usual place to start.** `repeat(N, size)` and `minmax(min, max)` work as in CSS.

- Without `grid-template-columns` the columns are equal, one per cell in the longest row.
- In decorative mode the templates also set how many rows and columns there are (see [Decorative mode](./data#decorative-mode)).

```yaml live
type: custom:lcards-data-grid
data_mode: data
rows:
  - [Warp core, sensor.reactor_power, Online]
  - [Shields, sensor.shield_power, Standby]
  - [Life support, sensor.life_support_power, Online]
grid:
  # a wide name column, a flexible value column, a narrow status column
  grid-template-columns: 160px 1fr 90px
  row-gap: 2px
  column-gap: 12px
  align-items: center
style:
  font_size: 18px
columns:
  - style:
      align: left
      color: var(--lcars-orange)
```

::: details More about grid layout
- **Gaps:** a number in a gap becomes pixels (`gap: 0` works).
- **Other keys:** `grid-template-areas` is passed to the grid too, but cells fill in order and have no area names.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `grid.grid-template-columns` | string | equal columns | Column widths, such as `120px 1fr 80px` |
| `grid.grid-template-rows` | string | - | Row heights, such as `repeat(8, auto)` |
| `grid.gap` | number / string | `8px` | Space between cells |
| `grid.row-gap` | number / string | `gap` | Space between rows only |
| `grid.column-gap` | number / string | `gap` | Space between columns only |
| `grid.justify-items` | string | - | Where cells sit across their grid area: `stretch`, `start`, `end` or `center` |
| `grid.align-items` | string | - | Where cells sit down their grid area: `stretch`, `start`, `end` or `center` |
| `grid.justify-content` | string | - | Where the whole grid sits across the card: `start`, `end`, `center`, `stretch`, `space-between`, `space-around` or `space-evenly` |
| `grid.align-content` | string | - | Where the whole grid sits down the card, with the same values |
| `grid.grid-auto-flow` | string | `row` | Fill order: `row`, `column`, `dense`, `row dense` or `column dense` |
| `grid.grid-auto-rows` | string | - | Height of rows beyond the templates, such as `40px` |
| `grid.grid-auto-columns` | string | - | Width of columns beyond the templates |

## The cascade

**The cascade is the LCARS colour wave that rolls through the rows: each row holds a bright colour, snaps briefly to a dark one, flashes pale and repeats, every row on its own timing.** Add it with the `cascade-color` animation preset; it works in both modes.

- The cascade animates the text colour, so cells under a cascade ignore their own text `color`; backgrounds still apply.
- `pattern` picks a ready-made rhythm; `pattern: custom` with `timing` sets your own, one entry per row, repeated for further rows.
- In the Configuration Studio the preview leaves animations off until you press the animation button in its toolbar.

```yaml live
type: custom:lcards-data-grid
data_mode: decorative
format: digit
grid:
  grid-template-rows: repeat(8, auto)
  grid-template-columns: repeat(10, 1fr)
  gap: 0px
style:
  font_size: 18px
animations:
  - trigger: on_load
    preset: cascade-color
    params:
      pattern: niagara
      colors:
        start: var(--lcars-orange)
        text: var(--lcars-red)
        end: var(--lcars-yellow)
```

A custom rhythm: delays are in seconds, durations in milliseconds.

```yaml live
type: custom:lcards-data-grid
data_mode: decorative
format: hex
grid:
  grid-template-rows: repeat(6, auto)
  grid-template-columns: repeat(8, 1fr)
  gap: 0px
style:
  font_size: 18px
animations:
  - trigger: on_load
    preset: cascade-color
    params:
      pattern: custom
      timing:
        # row 1
        - duration: 3000
          delay: 0.1
        # row 2
        - duration: 2000
          delay: 0.2
        # row 3, then the list repeats
        - duration: 4000
          delay: 0.3
```

::: details More about the cascade
- **The patterns:** `default` mixes 3, 4 and 2 second cycles over eight rows, `niagara` runs every row on a 2 second cycle with even steps, and `fast` on a 1 second cycle. An unknown pattern, or `custom` without `timing`, uses `default`.
- **Reduced motion:** when the system asks for reduced motion the cascade doesn't run (unless the animation sets `essential_motion: true`), and the cells show their own `color`.
- **Colours:** the defaults are the theme's cascade colours (pale blue, dark blue and moonlight in the default theme). When the [alert mode](../../core/alert-mode.md) changes the palette, the cascade restarts with the new colours.
- **Turning it off:** `enabled: false` on the animation stops the cascade without removing it.
- **Other animations:** other [animation presets](../../core/animations.md) work on the grid as a whole; to target cells, use selectors such as `.grid-cell[data-row="0"]`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `params.pattern` | string | `default` | Row timing: `default` (the original mixed rhythm), `niagara` (smooth, even), `fast`, or `custom` |
| `params.speed_multiplier` | number | `1` | `2` runs twice as fast, `0.5` half as fast |
| `params.duration` | number | - | One cycle length in ms for every row; wins over the pattern and `speed_multiplier` |
| `params.timing` | list | - | For `pattern: custom`: one entry per row, repeated for further rows |
| `params.timing[].duration` | number | `3000` | That row's cycle length, ms |
| `params.timing[].delay` | number | `0` | When that row starts, seconds |
| `params.colors.start` | colour | theme cascade colour | The long bright hold |
| `params.colors.text` | colour | theme cascade colour | The short dark snap |
| `params.colors.end` | colour | theme cascade colour | The pale flash. `colors` may also be a list of the three |
| `params.ease` | string | `linear` | Easing between colours |

## Highlighting changes

**`highlight_changes` briefly animates cells whose value just changed: an entity update in data mode, or a refresh in decorative mode.** `true` gives a 500 ms pulse; an object picks the preset and its settings.

- The cell animates out and back, so it ends as it started.
- Under reduced motion cells are not highlighted.

```yaml live
type: custom:lcards-data-grid
data_mode: decorative
format: digit
refresh_interval: 1500
refresh_cells: 0.1
grid:
  grid-template-rows: repeat(4, auto)
  grid-template-columns: repeat(8, 1fr)
  gap: 0px
style:
  font_size: 20px
highlight_changes:
  preset: glow
  duration: 600
  params:
    color: var(--lcars-orange)
    blur_max: 8
  # at most 20 cells at once
  max_cells: 20
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `highlight_changes` | boolean / object | off | `true` for a pulse, or the keys below |
| `highlight_changes.preset` | string | `pulse` | Any animation preset; `pulse` and `glow` suit this best |
| `highlight_changes.duration` | number | `500` | Length in ms, out and back |
| `highlight_changes.ease` | string | `outQuad` | Easing |
| `highlight_changes.params` | object | - | Preset params, such as `max_scale: 1.08` for pulse, `color` and `blur_max` for glow. `duration` and `ease` here win over the ones above |
| `highlight_changes.max_cells` | number | all, up to 100 | The most cells to animate at once, for large grids. A value you set has no cap |

## Filters

**`filters` applies CSS filters (blur, brightness, hue rotation, ...) to the whole grid.** Use it to dim a decorative grid behind other cards, or tint it.

- Only CSS filters apply to this card; SVG filters are skipped. See [Filters](../../core/effects/filters.md) for every type and value.
- The previews on these pages don't draw filters, so this example is not live.

```yaml
type: custom:lcards-data-grid
data_mode: decorative
format: digit
filters:
  - type: brightness
    value: 0.6
  - type: blur
    value: 1px
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `filters` | list | - | CSS filters, applied in order |
| `filters[].type` | string | required | `blur`, `brightness`, `contrast`, `saturate`, `hue-rotate`, `grayscale`, `sepia`, `invert`, `opacity` or `drop-shadow` |
| `filters[].value` | number / string / object | - | The filter's value: see [Filters](../../core/effects/filters.md) |
| `filters[].mode` | string | `css` | `css`; `svg` filters don't apply to the data grid |
