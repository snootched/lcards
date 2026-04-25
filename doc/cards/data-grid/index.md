# Data Grid Card

`custom:lcards-data-grid`

A grid of cells displaying real entity data, templates, or decorative auto-generated data — with cascade colour animations for an authentic LCARS data display look.

---

## Modes

| Mode | `data_mode` value | Use for |
|------|------------------|---------|
| **Data** | `data` | Real entity state, templates, or data source values |
| **Decorative** | `decorative` | Auto-generated random data for visual filler |

---

## Quick Start

```yaml
# Data grid with entity values
type: custom:lcards-data-grid
data_mode: data
rows:
  - [System, Value, Status]
  - [CPU, sensor.cpu_usage, "{{ 'OK' if states('sensor.cpu_usage')|float < 80 else 'HIGH' }}"]
  - [Memory, sensor.memory_usage, sensor.memory_status]
  - [Temp, sensor.cpu_temp, "{{ states('sensor.cpu_temp') }}°C"]
```

```yaml
# Decorative cascade display
type: custom:lcards-data-grid
data_mode: decorative
format: mixed
grid:
  grid-template-rows: repeat(6, auto)
  grid-template-columns: repeat(6, minmax(60px, 1fr))
  gap: 0px
style:
  font_size: 22px
animations:
  - trigger: on_load
    preset: cascade-color
```

---

## Top-Level Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | — | `custom:lcards-data-grid` (required) |
| `data_mode` | string | `decorative` | `decorative` or `data` (required). Legacy values `random`, `template`, `datasource` are auto-migrated. |
| `rows` | list | — | Row definitions — data mode only; see [Data Mode: Rows](#data-mode-rows) |
| `format` | string | `mixed` | Random data format for decorative mode: `digit`, `float`, `alpha`, `hex`, `mixed` |
| `refresh_interval` | number | `0` | Auto-refresh interval in ms for decorative mode (`0` = disabled) |
| `grid` | object | — | CSS Grid layout config — see [Grid Layout](#grid-layout) |
| `style` | object | — | Grid-wide cell styles — see [`style` Object](#style-object) |
| `header_style` | object | — | Style overrides for header rows — same fields as `style`; see [`header_style`](#header_style) |
| `columns` | list | — | Per-column style overrides — see [Column Styles](#column-styles) |
| `animations` | list | — | Card animations — see [Animations](../../core/animations.md) |
| `filters` | list | — | Visual filters applied to the entire grid — see [Filters](../../core/effects/filters.md) |
| `height` | number / string | — | Card height — see [Sizing](../../cards/common.md#sizing-height-and-width) |
| `width` | number / string | — | Card width — see [Sizing](../../cards/common.md#sizing-height-and-width) |
| `min_height` | number / string | — | Minimum card height — see [Sizing](../../cards/common.md#sizing-height-and-width) |
| `min_width` | number / string | — | Minimum card width — see [Sizing](../../cards/common.md#sizing-height-and-width) |
| `id` | string | — | Card ID for [Rules Engine targeting](../../cards/common.md#card-identification-id-and-tags) |
| `tags` | list | — | Tags for [Rules Engine targeting](../../cards/common.md#card-identification-id-and-tags) |

---

## Data Mode: Rows

Each row is an array of cell values. Cells are auto-detected:

| Cell value | Type | How it is shown |
|------------|------|----------------|
| `"Static text"` | Static | Displayed as-is |
| `sensor.entity_id` | Entity | Live state — locale-formatted + unit via `haFormatState` |
| `"{{ jinja2 }}"` | Template | HA-evaluated template |
| `"{datasource:name}"` | DataSource | HA-native: locale-formatted + unit |
| `"{datasource:name:.2f}"` | DataSource | Formatted number only — no auto-unit |

```yaml
rows:
  - [CPU Usage, sensor.cpu_usage]
  - [Memory, "{datasource:mem:.0f}%"]
  - [Uptime, "{{ state_attr('sensor.system_uptime', 'hours') }}h"]
```

### Styled Rows

Add per-row style overrides using the object form:

```yaml
rows:
  - values: [Header, Value, Unit]
    style:
      background: "var(--ha-card-background)"
      color: "var(--lcards-orange)"
      font_weight: bold
```

---

## Grid Layout

Uses CSS Grid. Specify any valid CSS Grid values:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `grid-template-columns` | string | — | CSS columns definition, e.g. `"repeat(12, 1fr)"` or `"100px 1fr 2fr"` |
| `grid-template-rows` | string | — | CSS rows definition, e.g. `"repeat(8, auto)"` |
| `gap` | string | — | Uniform cell gap, e.g. `"8px"` |
| `row-gap` | string | — | Vertical gap between rows |
| `column-gap` | string | — | Horizontal gap between columns |
| `grid-auto-flow` | string | `row` | Auto-placement algorithm: `row`, `column`, `dense`, `row dense`, `column dense` |
| `justify-items` | string | `stretch` | Horizontal alignment of cells in their areas: `stretch`, `start`, `end`, `center` |
| `align-items` | string | `stretch` | Vertical alignment of cells in their areas: `stretch`, `start`, `end`, `center` |
| `justify-content` | string | — | Horizontal alignment of the grid within the card: `start`, `end`, `center`, `space-between`, `space-around`, `space-evenly` |
| `align-content` | string | — | Vertical alignment of the grid within the card: `start`, `end`, `center`, `space-between`, `space-around`, `space-evenly` |
| `grid-auto-columns` | string | — | Width of implicit columns, e.g. `"1fr"` |
| `grid-auto-rows` | string | — | Height of implicit rows, e.g. `"auto"` |

```yaml
grid:
  grid-template-columns: "150px 1fr 80px"
  grid-template-rows: "repeat(10, auto)"
  gap: "8px"
  column-gap: "12px"
  row-gap: "6px"
  justify-items: start
```

---

## Decorative Mode Options

```yaml
data_mode: decorative
format: mixed      # digit | float | alpha | hex | mixed
refresh_interval: 2000   # Regenerate data every 2 seconds (0 = static)
grid:
  grid-template-columns: repeat(16, 1fr)
  grid-template-rows: repeat(6, auto)
  gap: 4px
```

---

## `style` Object

Applied grid-wide to every cell. All fields are optional.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `color` | string | theme default | Cell text colour (supports theme tokens) |
| `background` | string | `transparent` | Cell background colour |
| `font_size` | number / string | `24` | Font size in px or with unit, e.g. `"18px"`, `"1.2rem"` |
| `font_family` | string | `"Antonio, sans-serif"` | CSS font family |
| `font_weight` | number / string | `400` | CSS font-weight, e.g. `bold`, `700` |
| `align` | string | `right` | Text alignment: `left`, `center`, `right` |
| `padding` | number / string | `"4px"` | Cell padding in px or with unit |
| `border_width` | number | -- | Cell border width in px |
| `border_color` | string | -- | Cell border colour (supports theme tokens) |
| `border_style` | string | `solid` | Cell border style: `solid`, `dashed`, `dotted`, `double`, `groove`, `ridge`, `inset`, `outset` |

```yaml
style:
  background: "var(--ha-card-background)"
  color: "var(--lcars-moonlight)"
  font_size: 12
  font_family: "Antonio, sans-serif"
  padding: "4px 8px"
  align: left
```

---

## `header_style`

Style overrides applied to header rows. Accepts the same fields as [`style`](#style-object).

```yaml
header_style:
  background: "alpha(var(--lcars-orange), 0.08)"
  color: "var(--lcars-orange)"
  font_weight: bold
  font_size: 13
```

---

## Column Styles

Per-column style overrides. Each entry in the `columns` list corresponds to a column index (0-based) and may contain a `style` object with the same fields as [`style`](#style-object).

```yaml
columns:
  - style:
      color: "var(--lcars-orange)"
      font_weight: bold
  - style: {}
  - style:
      align: center
```

---

## Cascade Animation

The cascade effect cycles colours through each row in sequence, creating a waterfall effect. Use the standard `animations:` array with `preset: cascade-color`:

```yaml
animations:
  - trigger: on_load
    preset: cascade-color
    params:
      pattern: default       # default | niagara | fast | custom
      speed_multiplier: 1.5  # Multiply speed (1.0 = normal)
      colors:
        start: "var(--lcars-blue-light)"
        text: "var(--lcars-blue-darkest)"
        end: "var(--lcars-moonlight)"
```

### Patterns

| Pattern | Description |
|---------|-------------|
| `default` | Standard LCARS timing |
| `niagara` | Slower, smoother waterfall |
| `fast` | Rapid cycling |
| `custom` | Manual per-row timing via `timing` array |

### Custom Timing

```yaml
animations:
  - trigger: on_load
    preset: cascade-color
    params:
      pattern: custom
      timing:
        - { duration: 3000, delay: 0.1 }   # Row 0
        - { duration: 2000, delay: 0.2 }   # Row 1
        - { duration: 4000, delay: 0.3 }   # Row 2 (repeats)
      colors:
        start: "var(--lcars-blue-light)"
        text: "var(--lcars-blue-darkest)"
        end: "var(--lcars-moonlight)"
```

---

## Change Highlight Animation

Highlight cells that have just changed — draws attention to live data updates.

```yaml
animations:
  - trigger: on_load
    preset: cascade-color
    params:
      highlight_changes: true
      change_preset: pulse     # pulse | glow
      change_duration: 500
      change_params:
        max_scale: 1.08        # For pulse
        # color: "var(--lcars-orange)"   # For glow
        # blur_max: 12                    # For glow
```

---

## Consolidated Example

A system status panel with header row, entity cells, a template cell, a data source cell, cascade animation, and change highlight:

```yaml
type: custom:lcards-data-grid
data_mode: data

rows:
  # Header row — styled via header_style
  - values: [SUBSYSTEM, VALUE, STATUS]

  # Entity cells — auto-subscribed live values
  - [CPU, sensor.cpu_usage, "{{ 'OK' if states('sensor.cpu_usage')|float < 80 else 'WARN' }}"]
  - [RAM, sensor.memory_used_percent, "{{ 'OK' if states('sensor.memory_used_percent')|float < 90 else 'WARN' }}"]

  # Template cell
  - [Disk, sensor.disk_use_percent, "{{ states('sensor.disk_use_percent') }}%"]

  # DataSource cell with format specifier
  - [Net TX, "{datasource:net_tx:.1f} MB/s", "--"]

data_sources:
  net_tx:
    entity: sensor.network_transmit
    processing:
      scaled:
        type: scale
        input_range: [0, 1000000]
        output_range: [0, 1]

grid:
  grid-template-columns: "100px 1fr 80px"
  gap: 6px

style:
  background: "var(--ha-card-background)"
  color: "var(--lcars-moonlight)"
  font_size: 12
  font_family: "Antonio, sans-serif"
  padding: "4px 8px"

header_style:
  background: "alpha(var(--lcars-orange), 0.08)"
  color: "var(--lcars-orange)"
  font_weight: bold
  align: center

animations:
  - trigger: on_load
    preset: cascade-color
    params:
      pattern: niagara
      colors:
        start: "var(--lcars-blue-light)"
        text: "var(--lcars-blue-darkest)"
        end: "var(--lcars-moonlight)"
      highlight_changes: true
      change_preset: glow
      change_params:
        color: "var(--lcars-orange)"
        blur_max: 8
```

---
