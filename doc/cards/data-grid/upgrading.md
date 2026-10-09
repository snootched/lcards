# Upgrading

Earlier versions of the data grid used a few different keys: a second `animation:` block next to `animations:`, numeric grid sizes, top-level font settings, and cell styles kept in a separate list. **You don't need to change anything**: older grids keep working.

What happens with an older grid:

1. **On your dashboard** it is converted in memory and drawn as before. Nothing is saved or changed.
2. **When you open it in the card editor**, the editor converts it to the current layout and shows a notice listing what changed. The YAML tab shows the new layout.
   - Press **Save** to keep the converted version.
   - Press **Cancel** to leave your config exactly as it was.
3. **If you type an old key by hand** in the YAML editor, it still works. The editor shows a warning naming the current option to use, and doesn't rewrite your text while you type.

Decorative grids made from the card picker's starting config already use the current layout.

## What changes

| Older layout | Current layout |
|--------------|----------------|
| `data_mode: random` | `data_mode: decorative` |
| `data_mode: template` or `datasource` | `data_mode: data` |
| `grid: { rows: 8, columns: 12 }` | `grid: { grid-template-rows: repeat(8, auto), grid-template-columns: repeat(12, 1fr) }` |
| `grid.cell_width: 80` | `grid-template-columns: repeat(N, 80px)` |
| `font_size`, `font_family`, `font_weight`, `align` at the top level | the same keys inside `style` |
| `animation: { type: cascade, pattern, colors, ... }` | an `animations` entry with `preset: cascade-color` and those settings as `params` |
| `animation.timing` | `params.timing` on the `cascade-color` animation |
| `animation.highlight_changes`, `change_preset`, `change_duration`, `change_easing`, `change_params`, `max_highlight_cells` | `highlight_changes: { preset, duration, ease, params, max_cells }` |
| `rows[].cellStyles` (written by the old Studio) | each cell becomes `{ value, style }` |
| `rows[].sources` | removed: an older format the card no longer read |

Some old settings start working after the upgrade. Top-level `font_size` and `align` were ignored by the cell styles before; inside `style` they apply. A legacy `animation.type: cascade` never started a cascade (it only removed the cell colours); as a `cascade-color` animation it runs.

## Example

```yaml no-validate
# Before
type: custom:lcards-data-grid
data_mode: random
format: digit
grid:
  rows: 4
  columns: 8
font_size: 18
animation:
  type: cascade
  pattern: niagara
  highlight_changes: true
  change_preset: glow
```

```yaml live
# After
type: custom:lcards-data-grid
data_mode: decorative
format: digit
grid:
  grid-template-rows: repeat(4, auto)
  grid-template-columns: repeat(8, 1fr)
style:
  font_size: 18
animations:
  - trigger: on_load
    preset: cascade-color
    params:
      pattern: niagara
highlight_changes:
  preset: glow
```

To see a conversion explained, pick **Older format (converted)** in the [Playground](./playground).
