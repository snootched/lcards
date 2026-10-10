# Data Grid Card

`custom:lcards-data-grid`

A grid of cells in the LCARS style. Use it two ways:

- **Decorative:** columns of generated numbers and codes, often with the classic LCARS colour cascade rolling down the rows. No entities needed.
- **Data:** a table you write yourself, where each cell is text, a live entity state or a template.

::: tip Try it
- In the card editor, **Open Configuration Studio** gives you a live preview, a spreadsheet of your cells, and row, column and cell styling.
- The [Playground](./playground) lets you edit data grid YAML right here in the docs and see the result.
:::

The grids on these pages are live previews drawn by the card's own code. Entities show sample values.

| Page | Covers |
|------|--------|
| [Data & Cells](./data) | Rows, cell types, entities and templates, header rows, conditional colours, tap actions |
| [Styling & Animation](./styling) | Style layers, grid layout, the cascade, highlighting changes, filters |
| [Playground](./playground) | Edit YAML and see the grid live |
| [Upgrading](./upgrading) | Older data grid configs and what they become |

---

## Quick start

The decorative grid the card picker adds: six rows of mixed values with the colour cascade.

```yaml live
type: custom:lcards-data-grid
data_mode: decorative
format: mixed
grid:
  grid-template-rows: repeat(6, auto)
  grid-template-columns: repeat(6, minmax(60px, 1fr))
  gap: 0px
style:
  padding: 0px
  font_size: 22px
animations:
  - trigger: on_load
    preset: cascade-color
```

A small status table. The first row is a header; the middle column shows each entity's state; the last column is a template.

```yaml live
type: custom:lcards-data-grid
data_mode: data
rows:
  - values: [System, Value, Status]
    header: true
  - [Inside, sensor.living_room_temperature, "{{ 'WARM' if states('sensor.living_room_temperature') | float > 22 else 'OK' }}"]
  - [Outside, sensor.outdoor_temperature, "{{ 'WARM' if states('sensor.outdoor_temperature') | float > 22 else 'OK' }}"]
  - [Humidity, sensor.living_room_humidity, "{{ states('sensor.living_room_humidity') | int }}%"]
grid:
  grid-template-columns: 140px 1fr 90px
  gap: 4px
style:
  font_size: 18px
columns:
  - style:
      align: left
      color: var(--lcars-orange)
```

---

## Which mode should I use?

| | Decorative | Data |
|---|---|---|
| **Shows** | Generated values: digits, decimals, letters or hex | Your rows: text, entity states, templates, data source values |
| **Set up with** | `format`, the grid size in `grid` | `rows` |
| **Changes when** | Every `refresh_interval` ms (optional) | An entity, template or data source changes |
| **Good for** | Filling space with LCARS texture, backgrounds behind other cards | Status panels, sensor tables, system readouts |

`data_mode` picks the mode. When it is left out, a card with `rows` is a data grid and anything else is decorative.

---

## Decorative mode

The grid size comes from the CSS Grid templates: `repeat(6, auto)` rows and `repeat(8, 1fr)` columns give a 6 x 8 grid. Without templates the grid is 8 rows by 12 columns.

| Option | Default | Description |
|--------|---------|-------------|
| `format` | `mixed` | `digit` (0042), `float` (42.17), `alpha` (AB), `hex` (A3F1) or `mixed` |
| `refresh_interval` | `0` | Make new values every this many milliseconds. `0` keeps them fixed. |
| `refresh_cells` | `1` | How much of the grid changes on each refresh: `1` is every cell, `0.2` a fifth of them. Small values look like data trickling in. |
| `columns[].format` | - | A different format for one column, by position |

Here only some of the hex cells change every 1.5 seconds, the first two columns are digits, and changed cells pulse:

```yaml live
type: custom:lcards-data-grid
data_mode: decorative
format: hex
refresh_interval: 1500
refresh_cells: 0.15
grid:
  grid-template-rows: repeat(5, auto)
  grid-template-columns: repeat(8, 1fr)
  gap: 0px
columns:
  - format: digit
  - format: digit
style:
  font_size: 20px
  color: var(--lcars-orange)
highlight_changes:
  preset: pulse
  duration: 400
```

Values don't change in the card picker preview, so the picker stays calm.

---

## Configuration at a glance

```yaml
type: custom:lcards-data-grid
data_mode: data              # decorative | data (default: data when rows are set)

# Data mode: see Data & Cells
rows:
  - values: [SYSTEM, VALUE]
    header: true
  - [CPU, sensor.cpu_usage]
cell_tap_action:             # optional: tapping an entity cell
  action: more-info
data_sources: {}             # optional named data sources for {datasource:...} cells

# Decorative mode
format: mixed
refresh_interval: 0
refresh_cells: 1

# Layout and styling: see Styling & Animation
grid:
  grid-template-columns: 120px 1fr
  gap: 8px
style: {}                    # every cell
header_style: {}             # header rows
columns:                     # by position
  - style: {}
    format: hex              # decorative mode only

# Animation
animations:
  - trigger: on_load
    preset: cascade-color
highlight_changes: true
filters: []
```

## Common properties

These work on every LCARdS card. See [Common Card Properties](../common.md).

| Category | Config keys | Reference |
|----------|-------------|-----------|
| Sizing | `height`, `width`, `min_height`, `min_width`, `max_height`, `max_width` | [Sizing](../common.md#sizing-height-width-min-height-min-width-max-height-max-width) |
| Overflow | `overflow`, `overflow_x`, `overflow_y` | [Overflow](../common.md#overflow-overflow-overflow-x-overflow-y) |
| Stacking | `z_index` | [Stacking](../common.md#stacking-z-index) |
| Identity | `id`, `tags` | [ID & Tags](../common.md#card-identification-id-and-tags) |
| HA grid | `grid_options` | [HA Grid Sizing](../common.md#ha-grid-sizing-grid-options) |
| Data | `data_sources`, `triggers_update` | [Data Sources](../../core/datasources/) |
| Animations | `animations` | [Animations](../../core/animations.md) |
| Rules | via `id` / `tags`; rule `style` patches apply to the grid-wide `style` | [Rules Engine](../../core/rules/) |
