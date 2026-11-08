---
description: "Data grid card cells: decorative values, rows, what a cell can show (text, entity states, templates, data sources), cell objects, header rows, conditional colours and tap actions."
moved_anchors:
  showing-an-attribute: /cards/data-grid/data#cell-objects
---

# Data and Cells

What the cells show: generated values in decorative mode, or the rows you write in data mode. How the cells look is on [Styling and Animation](./styling).

## Decorative mode

**A decorative grid fills itself with generated values: digits, decimals, letters or hex codes.** Use it for LCARS texture: a panel of numbers, a background behind other cards.

- The grid size comes from the CSS Grid templates in `grid`: `repeat(5, auto)` rows and `repeat(8, 1fr)` columns give a 5 by 8 grid. Without templates the grid is 8 rows by 12 columns.
- With `refresh_interval` the values change on a timer; a small `refresh_cells` changes only a few cells each time, which looks like data trickling in.
- `columns` gives one column, by position, a format of its own.

```yaml live
# hex values, a few changing every 1.5 seconds; the first two columns are digits
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

::: details More about decorative mode
- **Card picker:** values don't change (and the cascade doesn't run) in the card picker preview, so the picker stays calm. The card editor's preview does animate.
- **Refreshing few cells:** each refresh changes at least one cell, so `refresh_cells: 0` with a `refresh_interval` still changes one cell at a time.
- **Grid size:** `repeat(auto-fill, ...)` and other track lists without a fixed count fall back to 8 rows or 12 columns.
- **Highlighting:** with [highlight_changes](./styling#highlighting-changes) the cells that changed animate briefly, as in the example.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `format` | string | `mixed` | `digit` (0042), `float` (42.17), `alpha` (AB), `hex` (A3F1), or `mixed` (any of the four, picked per cell) |
| `refresh_interval` | number | `0` | New values every this many milliseconds. `0` keeps them fixed |
| `refresh_cells` | number | `1` | How much of the grid changes on each refresh, `0` to `1`: `1` is every cell, `0.2` a fifth of them |
| `columns[].format` | string | `format` | A different format for one column, by position |
| `grid.grid-template-rows` | string | `repeat(8, auto)` | The number of rows (and their heights): see [Grid layout](./styling#grid-layout) |
| `grid.grid-template-columns` | string | `repeat(12, 1fr)` | The number of columns (and their widths) |

## rows

**In data mode you write the grid row by row: each row is a list of cells, and the card works out what each cell is.** A row can also be written as an object with `values`, to give it options.

- Rows can have different lengths; the grid is as wide as the longest row, and shorter rows end in empty cells.
- `header: true` makes a row a [header row](#header-rows); `style` styles the whole row (see [Style layers](./styling#style-layers)).

```yaml live
type: custom:lcards-data-grid
data_mode: data
rows:
  # a row with options
  - values: [Room, Temperature, Humidity]
    header: true
  # plain rows
  - [Living room, sensor.living_room_temperature, sensor.living_room_humidity]
  - [Outside, sensor.outdoor_temperature, sensor.outdoor_humidity]
grid:
  grid-template-columns: 1fr 1fr 1fr
style:
  font_size: 18px
```

::: details More about rows
- **No rows:** a data grid with an empty `rows` list shows "Data mode needs at least one row". Without `data_mode`, an empty `rows` makes a decorative grid.
- **Other shapes:** an entry that is neither a list nor an object with `values` becomes an empty row.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `rows` | list | - | The rows, top to bottom. Each is a list of cells, or an object with the keys below |
| `rows[].values` | list | required | The row's cells, left to right |
| `rows[].header` | boolean | `false` | A header row: header defaults plus `header_style` |
| `rows[].style` | object | - | Style for every cell in this row: the [style keys](./styling#style-keys) |

## What a cell can be

**A cell shows text, an entity's state, a template or a data source value, and the card works out which from what you write.** Cells update by themselves when their entity, template or data source changes.

- Put templates in quotes in YAML: `"{{ ... }}"`. An entity id or plain text needs no quotes.
- A JavaScript template does not know which entities it reads, so list them in `triggers_update` for it to update.

| You write | The cell shows |
|-----------|----------------|
| `Living room` | The text as written |
| `sensor.living_room_temperature` | The entity's state, formatted by Home Assistant with its unit (`21.4 °C`, `Open`, `On`) |
| `"{{ states('sensor.x') }} W"` | A Home Assistant template (Jinja2), rendered by Home Assistant |
| `"{datasource:net_tx:.1f} MB/s"` | A value from an LCARdS [data source](../../core/datasources/). With a format (`:.1f`) you get the number only; without one, the value with its unit |
| `"[[[ return states['sensor.x'].state ]]]"` | A JavaScript template |

```yaml live
type: custom:lcards-data-grid
data_mode: data
rows:
  # text, then an entity state
  - [Inside, sensor.living_room_temperature]
  # text, then a Home Assistant template
  - [Comfort, "{{ 'WARM' if states('sensor.living_room_temperature') | float > 22 else 'OK' }}"]
  - [Battery, "{{ states('sensor.phone_battery') | int }}%"]
grid:
  grid-template-columns: 1fr 1fr
style:
  font_size: 20px
```

::: details More about cell values
- **Entity ids:** a cell is read as an entity id when it is all lower case: a domain, a dot and an object id (`sensor.cpu_temp`). Anything else is text.
- **Missing entities:** an entity Home Assistant doesn't know shows `-`.
- **Braces mean a template:** any text with `{` or `[[[` in it is treated as a template, so a literal brace in plain text is read as one too.
- **Numbers:** a number cell shows as written.
- **JavaScript templates:** `entity` in a JavaScript template is not the cell's entity; read states through `states['sensor.x']` (or `hass.states`).
:::

## Cell objects

**Write a cell as an object to show an attribute, style one cell, or give it an entity for colours and actions.** Plain cells and cell objects mix freely in a row.

- Without `value`, the cell shows its `entity`'s state, or the `attribute` of it.
- With a template or text in `value`, `entity` is only the context: the entity that [conditional colours](#conditional-colours) and [tap actions](#tap-actions) follow.

```yaml live
type: custom:lcards-data-grid
data_mode: data
rows:
  # an attribute of an entity
  - - Outside
    - entity: weather.home
      attribute: temperature
  # one cell styled on its own
  - - Battery
    - value: sensor.phone_battery
      style:
        color: var(--lcars-yellow)
grid:
  grid-template-columns: 1fr 1fr
style:
  font_size: 20px
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | string / number | - | What the cell shows: text, an entity id or a template |
| `entity` | string | the `value`, when that is an entity id | Show this entity's state when `value` is empty, and use it for [conditional colours](#conditional-colours) and [actions](#tap-actions) |
| `attribute` | string | - | Show this attribute of `entity` instead of its state |
| `style` | object | - | Style for this cell only: see [Style layers](./styling#style-layers) |
| `tap_action` | action | - | What tapping the cell does: see [Tap actions](#tap-actions) |
| `hold_action` | action | - | What holding the cell does |
| `double_tap_action` | action | - | What double-tapping the cell does |

## Data sources

**A data source can smooth, scale or convert a sensor before the grid shows it.** Define it under `data_sources` and use it in a cell by name: `{datasource:name}`.

- With a format such as `:.0f` the cell gets the number only, so add the unit yourself; without a format it gets the value with its unit, as Home Assistant shows it.
- See [Data Sources](../../core/datasources/) for the processing options and [Templates](../../core/templates/) for every format.

```yaml live
type: custom:lcards-data-grid
data_mode: data
data_sources:
  power:
    entity: sensor.kitchen_power
rows:
  - [Kitchen, "{datasource:power:.0f} W"]
grid:
  grid-template-columns: 1fr 1fr
style:
  font_size: 20px
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `data_sources` | object | - | Named data sources: see [Data Sources](../../core/datasources/) |

## Header rows

**A header row labels the grid or a group of rows: bold, uppercase and smaller, with a divider line, in the theme's header colours.** Write the row as an object with `values` and `header: true`.

- Any number of rows can be headers, so a long table can have one per group.
- Change their look for the whole grid with `header_style` ([Styling](./styling#header-rows)), or for one row with that row's `style`.

```yaml live
type: custom:lcards-data-grid
data_mode: data
rows:
  - values: [Deck, Section, Status]
    header: true
  - [Deck 1, Bridge, Nominal]
  - [Deck 5, Sickbay, Nominal]
  - values: [Engineering]
    header: true
  - [Deck 12, Warp core, Online]
grid:
  grid-template-columns: 1fr 1fr 1fr
style:
  font_size: 18px
header_style:
  color: var(--lcars-orange)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `rows[].header` | boolean | `false` | Make this row a header row |
| `header_style` | object | header defaults | Style for every header row: see [Header rows](./styling#header-rows) |

## Conditional colours

**A cell's `color` or `background` can change with the state of the cell's entity, using the same state map as other LCARdS cards.** Use it to turn a reading yellow or red past a limit.

- The cell's entity is its `entity`, or the `value` when that is an entity id. For a template cell, add `entity:` to say which entity the colours follow; cells without an entity use `default`.
- State maps work on row, column and grid-wide styles too; they resolve against each cell's own entity. See [Colours](../../core/colours.md) for every colour format.
- A running [cascade](./styling#the-cascade) animates the text colour of every cell, so text-colour state maps only show when there is no cascade. Background state maps always show.

```yaml live
type: custom:lcards-data-grid
data_mode: data
rows:
  - values: [Load, Watts]
    header: true
  - - Kitchen
    - value: sensor.kitchen_power
      style:
        color:
          default: var(--lcars-green)
          above:300: var(--lcars-yellow)
          above:1000: var(--lcars-red)
  - - Phone battery
    - value: sensor.phone_battery
      style:
        background:
          default: transparent
          below:30: var(--lcars-red)
          at_least:80: var(--lcards-green-darkest)
grid:
  grid-template-columns: 1fr 1fr
style:
  font_size: 20px
```

| State key | Matches when the entity state |
|-----------|-------------------------------|
| `on`, `off`, `open`, `heat`, ... | is exactly that state |
| `above:N`, `below:N`, `at_least:N`, `at_most:N` | is a number past N (the closest match wins) |
| `between:A:B` | is a number from A to B; `between_exclusive:A:B` leaves out A and B |
| `zero`, `non_zero` | is 0, or any other number |
| `active`, `inactive`, `unavailable` | is on/off style active, inactive, or unavailable/unknown |
| `default` | none of the above |

::: details More about conditional colours
- **Order:** an exact state wins, then `zero`, then the number ranges, then `non_zero`, then `active`/`inactive`/`unavailable`, then `default`.
- **Closest match:** among `above` and `at_least` keys the highest threshold that matches wins, among `below` and `at_most` the lowest, and among `between` keys the narrowest.
:::

## Tap actions

**Cells do nothing when tapped unless you ask: `cell_tap_action` for every entity cell, or actions on one cell object.** The most common choice is `more-info`, which opens the entity's dialog.

- `tap_action`, `hold_action` or `double_tap_action` on a cell object are for that cell only; a cell's own `tap_action` replaces `cell_tap_action` for it.
- Actions use the cell's entity by default, and take every standard [action](../../core/actions.md). Cells with an action show a pointer cursor.
- Cell actions work in data mode only; decorative cells have none.

```yaml live
type: custom:lcards-data-grid
data_mode: data
# every entity cell opens its dialog
cell_tap_action:
  action: more-info
rows:
  - [Inside, sensor.living_room_temperature]
  # this cell toggles its light instead
  - - Kitchen light
    - value: light.kitchen
      tap_action:
        action: toggle
grid:
  grid-template-columns: 1fr 1fr
style:
  font_size: 20px
```

::: details More about tap actions
- **Own actions win:** a cell's own `tap_action` replaces `cell_tap_action`; a cell with only a `hold_action` or `double_tap_action` still taps with `cell_tap_action`.
- **Text cells:** `cell_tap_action` applies to cells with an entity, including a text cell object that sets `entity`.
- **Tap animations:** a tap anywhere on the grid also fires the card's `on_tap` [animations](../../core/animations.md), with the tap point.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `cell_tap_action` | action | - | What tapping any entity cell does, unless the cell has its own `tap_action` |
| `tap_action` | action | - | On a cell object: what tapping that cell does |
| `hold_action` | action | - | On a cell object: what holding that cell does |
| `double_tap_action` | action | - | On a cell object: what double-tapping that cell does |

## In the Configuration Studio

**The Studio's Grid Structure tab shows your rows as a spreadsheet you can edit.**

- Click a **cell** to choose Entity (with an optional attribute) or Text or template, and to set the cell's style, conditional colours and actions.
- Click a **row** or **column** header to insert, move or delete it, set its style, or mark a row as a header.
- **Add Row** and **Add Column** grow the grid. Custom column widths such as `100px 1fr 80px` are kept when you add, move or remove columns.
- Saving keeps your YAML short: rows without options stay plain lists, and cells without options stay plain values.
