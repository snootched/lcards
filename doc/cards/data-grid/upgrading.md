---
description: "Data grid card: older configs (random/template modes, numeric grid sizes, the animation block, cellStyles) and the current keys they become."
---

# Upgrading

**Older data grids keep working: you don't need to change anything.** Earlier versions used a few different keys: a second `animation:` block next to `animations:`, numeric grid sizes, top-level font settings, and cell styles kept in a separate list.

What happens with an older grid:

1. **On your dashboard** it is converted in memory and drawn as before. Nothing is saved or changed.
2. **When you open it in the card editor**, the editor converts it to the current layout and shows a notice listing what changed. The YAML tab shows the new layout.
   - Press **Save** to keep the converted version.
   - Press **Cancel** to leave your config exactly as it was.
3. **If you type an old key by hand** in the YAML editor, it still works. The editor shows a warning naming the current option to use, and doesn't rewrite your text while you type.

Decorative grids made from the card picker's starting config already use the current layout.

## What changes

**Each older key and the current key it becomes.** Where both are set, the current key wins and the older one is dropped.

| Older layout | Current layout |
|--------------|----------------|
| `data_mode: random` | `data_mode: decorative` |
| `data_mode: template` or `datasource` | `data_mode: data` |
| `grid.rows: 8` and `grid.columns: 12` | `grid.grid-template-rows: repeat(8, auto)` and `grid.grid-template-columns: repeat(12, 1fr)` |
| `grid.cell_width: 80` | `grid.grid-template-columns: repeat(N, 80px)` (N is `grid.columns`, or 12) |
| `font_size`, `font_family`, `font_weight`, `align` at the top level | the same keys inside `style` |
| `animation.type: cascade`, with `pattern`, `colors` and the other cascade settings | an `animations` entry with `preset: cascade-color` and those settings as `params` |
| `animation.timing` | `params.timing` on the `cascade-color` animation |
| `animation.highlight_changes` with `change_preset`, `change_duration`, `change_easing`, `change_params`, `max_highlight_cells` | `highlight_changes` with `preset`, `duration`, `ease`, `params`, `max_cells` |
| `rows[].cellStyles` (written by the old Studio) | each cell becomes a cell object with `value` and `style` |
| `rows[].sources` | removed: an older format the card no longer read |

Some old settings start working after the upgrade. Top-level `font_size` and `align` were ignored by the cell styles before; inside `style` they apply. A legacy `animation.type: cascade` never started a cascade (it only removed the cell colours); as a `cascade-color` animation it runs.

::: details More about the conversion
- **Timing without a cascade:** `animation.timing` is dropped when there is no `cascade-color` animation to give it to.
- **An existing cascade:** when `animations` already has a `cascade-color` entry, `animation.type: cascade` adds no second one; `animation.timing` fills that entry's `params.timing` if it has none.
- **Cell styles:** a `cellStyles` entry merges into a cell object's own `style`, and the cell's own keys win.
:::

## Example

**The same grid before and after the conversion.**

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
