# Styling & Animation

## Style layers

Every cell gets its style from up to six layers. Later layers win, key by key:

| Order | Layer | Applies to |
|-------|-------|------------|
| 1 | Theme defaults | Every cell: theme text colour, right-aligned, 24px Antonio |
| 2 | `style` | Every cell |
| 3 | Header defaults, then `header_style` | Rows with `header: true` |
| 4 | `columns[i].style` | Column i (counting from 0) |
| 5 | Row `style` | One row (`{ values: [...], style: {...} }`) |
| 6 | Cell `style` | One cell (a [cell object](./data#showing-an-attribute)) |

```yaml live
type: custom:lcards-data-grid
data_mode: data
rows:
  - values: [Sensor, Reading]
    header: true
  - [Inside, sensor.living_room_temperature]
  - values: [Outside, sensor.outdoor_temperature]
    style:
      background: var(--lcars-blue)
  - - Battery
    - value: sensor.phone_battery
      style:
        color: var(--lcars-yellow)
        font_weight: 700
grid:
  grid-template-columns: 1fr 1fr
style:
  font_size: 18px
  color: var(--lcars-african-violet)
columns:
  - style:
      align: left
header_style:
  color: var(--lcars-orange)
```

Rule patches from the [rules engine](../../core/rules/) apply to the grid-wide `style`.

### Style keys

Every layer takes the same keys. Numbers become pixels, except `font_weight` and `line_height`.

| Key | Example | Description |
|-----|---------|-------------|
| `color` | `var(--lcars-orange)` | Text colour, or a [state map](./data#conditional-colours) |
| `background` | `transparent` | Background colour, or a state map |
| `font_size` | `18` or `1.2rem` | Font size |
| `font_family` | `Antonio, sans-serif` | Font |
| `font_weight` | `700` or `bold` | Weight |
| `align` | `left` | Horizontal alignment: `left`, `center`, `right` (default `right`) |
| `align_items` | `flex-start` | Vertical alignment inside the cell |
| `padding` | `4px 8px` | Space inside the cell (default `4px`) |
| `text_transform` | `uppercase` | `none`, `uppercase`, `lowercase`, `capitalize` |
| `letter_spacing` | `0.05em` | Letter spacing |
| `line_height` | `1.2` | Line height |
| `white_space` | `normal` | `nowrap` (default) cuts long text with an ellipsis; `normal`, `pre-wrap` or `pre-line` wrap it |
| `border_width`, `border_color`, `border_style` | `1`, `var(--lcars-gray)`, `solid` | Cell border |
| `border_radius` | `4` | Rounded corners |

Any other CSS property works too, written in snake_case: `border_bottom_color`, `opacity`, `text_shadow`, and so on.

Colours accept everything in [Colours](../../core/colours.md): `var(--lcars-...)`, hex, `theme:` tokens and computed colours such as `alpha(var(--lcars-orange), 0.2)`.

### Header rows

Header rows start from the theme's header look (bold, uppercase, 16px, a 2px divider underneath) before `header_style` applies. To drop the divider:

```yaml
header_style:
  border_bottom_width: 0
```

---

## Grid layout

`grid` takes [CSS Grid](https://developer.mozilla.org/docs/Web/CSS/CSS_grid_layout) properties for the grid container. Column widths are the usual place to start:

| Property | Example | Description |
|----------|---------|-------------|
| `grid-template-columns` | `120px 1fr 80px` | Column widths. Default: equal columns. In decorative mode this also sets the number of columns. |
| `grid-template-rows` | `repeat(8, auto)` | Row heights. In decorative mode this also sets the number of rows. |
| `gap` | `8px` | Space between cells (default `8px`) |
| `row-gap`, `column-gap` | `2px` | Space between rows, or columns, only |
| `justify-items`, `align-items` | `center` | Where cells sit inside their grid area |
| `justify-content`, `align-content` | `space-between` | Where the whole grid sits inside the card |
| `grid-auto-flow` | `column` | Fill order |
| `grid-auto-rows`, `grid-auto-columns` | `40px` | Size of rows or columns beyond the templates |

`repeat(N, size)` and `minmax(min, max)` work as in CSS. Numbers in gaps become pixels.

---

## The cascade

The cascade is the LCARS colour wave that rolls through the rows: each row holds a bright colour, snaps briefly to a dark one, flashes pale and repeats, every row on its own timing. Add it with the `cascade-color` animation preset:

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

| Param | Default | Description |
|-------|---------|-------------|
| `pattern` | `default` | Row timing: `default` (the original mixed rhythm), `niagara` (smooth, even), `fast`, or `custom` |
| `speed_multiplier` | `1` | `2` runs twice as fast, `0.5` half as fast |
| `duration` | - | One cycle length in ms for every row (overrides the pattern and `speed_multiplier`) |
| `timing` | - | Per-row timing for `pattern: custom`: a list of `{ duration, delay }` (ms and seconds), repeated for further rows |
| `colors` | theme cascade colours | `{ start, text, end }` (or a list of three): the long bright hold, the short dark snap, the pale flash |
| `ease` | `linear` | Easing between colours |

A custom rhythm:

```yaml
animations:
  - trigger: on_load
    preset: cascade-color
    params:
      pattern: custom
      timing:
        - { duration: 3000, delay: 0.1 }   # row 1
        - { duration: 2000, delay: 0.2 }   # row 2
        - { duration: 4000, delay: 0.3 }   # row 3, then the list repeats
```

The cascade animates the text colour, so cells under a cascade ignore their own text `color` (backgrounds still apply). It works in both modes. Other [animation presets](../../core/animations.md) work on the grid as a whole; to target cells, use selectors such as `.grid-cell[data-row="0"]`.

In the Configuration Studio, the preview leaves animations off until you press the animation button in its toolbar.

---

## Highlighting changes

`highlight_changes` briefly animates cells whose value just changed: an entity update in data mode, or a refresh in decorative mode.

```yaml
highlight_changes: true            # pulse, 500 ms
```

```yaml
highlight_changes:
  preset: glow                     # pulse or glow
  duration: 600
  params:
    color: var(--lcars-orange)
    blur_max: 8
  max_cells: 20                    # at most this many at once (default: all, up to 100)
```

| Option | Default | Description |
|--------|---------|-------------|
| `preset` | `pulse` | Any animation preset; `pulse` and `glow` suit this best |
| `duration` | `500` | Length in ms; the cell animates out and back |
| `ease` | `outQuad` | Easing |
| `params` | - | Preset params, e.g. `max_scale: 1.08` for pulse, `color` and `blur_max` for glow |
| `max_cells` | all (up to 100) | Limit for large grids |

---

## Filters

`filters` applies CSS filters (blur, brightness, hue rotation, ...) to the whole grid. See [Filters](../../core/effects/filters.md); SVG filters don't apply to this card.

```yaml
filters:
  - type: brightness
    value: 0.8
```
