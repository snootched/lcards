# Data & Cells

In data mode you write the grid row by row. Each row is a list of cells, and the card works out what each cell is.

```yaml live
type: custom:lcards-data-grid
data_mode: data
rows:
  - [Room, Temperature, Humidity]
  - [Living room, sensor.living_room_temperature, sensor.living_room_humidity]
  - [Outside, sensor.outdoor_temperature, sensor.outdoor_humidity]
grid:
  grid-template-columns: 1fr 1fr 1fr
style:
  font_size: 18px
```

Rows can have different lengths; the grid is as wide as the longest row.

---

## What a cell can be

| You write | The cell shows |
|-----------|----------------|
| `Living room` | The text as written |
| `sensor.living_room_temperature` | The entity's state, formatted by Home Assistant with its unit (`21.4 °C`, `Open`, `On`) |
| `"{{ states('sensor.x') }} W"` | A Home Assistant template (Jinja2), rendered by Home Assistant |
| `"{datasource:net_tx:.1f} MB/s"` | A value from an LCARdS [data source](../../core/datasources/). With a format (`:.1f`) you get the number only; without one, the value with its unit. |
| `"[[[ return entity.state ]]]"` | A JavaScript template |

Cells update by themselves when their entity, template or data source changes.

::: tip Quotes
Put templates in quotes in YAML: `"{{ ... }}"`. An entity id or plain text needs no quotes.
:::

### Showing an attribute

For an attribute, or when the cell needs more than a value, write the cell as an object:

```yaml
rows:
  - - Uptime
    - entity: sensor.system_monitor
      attribute: hours
```

| Cell key | Description |
|----------|-------------|
| `value` | What the cell shows: text, an entity id or a template |
| `entity` | Show this entity's state (when `value` is empty), and use it for [conditional colours](#conditional-colours) and [actions](#tap-actions) |
| `attribute` | Show this attribute of `entity` instead of its state |
| `style` | Style for this cell only (see [Styling](./styling#style-layers)) |
| `tap_action`, `hold_action`, `double_tap_action` | Standard Home Assistant actions |

Plain cells and cell objects mix freely in a row.

### Data sources

A data source can smooth, scale or convert a sensor before the grid shows it. Define it under `data_sources` and refer to it by name:

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

See [Data Sources](../../core/datasources/) for processing options.

---

## Header rows

Write a row as `{ values: [...] }` to give it options. `header: true` makes it a header: bold, uppercase and smaller, with a divider line, in the theme's header colours.

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

Any number of rows can be headers. Change their look for the whole grid with `header_style` ([Styling](./styling#header-rows)), or for one row with that row's `style`.

---

## Conditional colours

A cell's `color` or `background` can change with the state of the cell's entity, using the same state map as other LCARdS cards:

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
          above:400: var(--lcars-yellow)
          above:800: var(--lcars-red)
  - - Phone battery
    - value: sensor.phone_battery
      style:
        background:
          default: transparent
          below:30: var(--lcars-red)
grid:
  grid-template-columns: 1fr 1fr
style:
  font_size: 20px
```

The cell's entity is its `entity`, or the `value` when that is an entity id. Keys you can use:

| Key | Matches when the entity state |
|-----|-------------------------------|
| `on`, `off`, `open`, `heat`, ... | is exactly that state |
| `above:N`, `below:N`, `at_least:N`, `at_most:N` | is a number past N (the closest match wins) |
| `between:A:B` | is a number from A to B |
| `zero`, `non_zero` | is 0, or any other number |
| `active`, `inactive`, `unavailable` | is on/off style active, inactive, or unavailable/unknown |
| `default` | none of the above |

For a template cell, add `entity:` to say which entity the colours follow. Cells without an entity use `default`.

State maps work on row, column and grid-wide styles too; they resolve against each cell's own entity. See [Colours](../../core/colours.md) for every colour format.

::: info With the cascade
A running cascade animates the text colour of every cell, so text-colour state maps only show when there is no cascade. Background state maps always show.
:::

---

## Tap actions

Cells do nothing when tapped unless you ask. Two ways:

- **`cell_tap_action`** for every entity cell. The most common choice is `more-info`, which opens the entity's dialog:

  ```yaml
  cell_tap_action:
    action: more-info
  ```

- **`tap_action`, `hold_action` or `double_tap_action`** on a cell object, for that cell only. These override `cell_tap_action`.

  ```yaml
  - value: light.kitchen
    tap_action:
      action: toggle
  ```

Actions use the cell's entity by default, and take every standard [action](../../core/actions.md). Cells with an action show a pointer cursor.

---

## In the Configuration Studio

The **Grid Structure** tab shows your rows as a spreadsheet:

- Click a **cell** to choose Entity (with an optional attribute) or Text or template, and to set the cell's style, conditional colours and actions.
- Click a **row** or **column** header to insert, move or delete it, set its style, or mark a row as a header.
- **Add Row** and **Add Column** grow the grid. Custom column widths such as `100px 1fr 80px` are kept when you add, move or remove columns.

Saving keeps your YAML short: rows without options stay plain lists, and cells without options stay plain values.
