# Data Grid Card

`custom:lcards-data-grid`

A grid of cells displaying real entity data, templates, or decorative auto-generated data — with cascade colour animations for an authentic LCARS data display look.

---

## Modes

| Mode | `data_mode` value | Use for |
|------|------------------|---------|
| **Data** | `data` | Real entity state, templates, or DataSource values |
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
format: hex
grid:
  grid-template-rows: repeat(8, auto)
  grid-template-columns: repeat(12, 1fr)
  gap: 6px
animation:
  type: cascade
  pattern: default
  colors:
    start: "var(--lcards-blue-light)"
    text: "var(--lcards-blue-darkest)"
    end: "var(--lcards-moonlight)"
```

---

## Top-Level Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | `custom:lcards-data-grid` (required) |
| `data_mode` | string | `data` or `decorative` (required) |
| `rows` | list | Row definitions (data mode) |
| `format` | string | Random data format (decorative mode) |
| `refresh_interval` | number | Auto-refresh interval in ms (decorative mode, 0 = off) |
| `grid` | object | CSS Grid layout config |
| `style` | object | Cell and header row styles — see below |
| `animation` | object | Cascade and change animations — see below |
| `id` | string | Card ID for rule targeting |
| `tags` | list | Tags for rule targeting |

---

## Data Mode: Rows

Each row is an array of cell values. Cells are auto-detected:

| Cell value | Type | How it is shown |
|------------|------|----------------|
| `"Static text"` | Static | Displayed as-is |
| `sensor.entity_id` | Entity | Live entity state (auto-subscribed) |
| `"{{ jinja2 }}"` | Template | HA-evaluated template |
| `"{datasource:name}"` | DataSource | Value from a named DataSource |

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

Uses CSS Grid — any valid CSS Grid values work:

```yaml
grid:
  grid-template-columns: "150px 1fr 80px"
  grid-template-rows: "repeat(10, auto)"
  gap: "8px"
  column-gap: "12px"
  row-gap: "6px"
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

### `style.cell`

Applied to every data cell:

| Field | Type | Description |
|-------|------|-------------|
| `background` | string | Cell background colour |
| `color` | string | Text colour |
| `font_size` | number | Font size in px |
| `font_family` | string | CSS font family |
| `padding` | string | CSS padding shorthand, e.g. `"4px 8px"` |
| `border_radius` | number | Corner radius in px |
| `text_align` | string | `left`, `center`, `right` |

### `style.header_row`

Applied to the first row when it is used as a header:

| Field | Type | Description |
|-------|------|-------------|
| `background` | string | Header row background colour |
| `color` | string | Header text colour |
| `font_weight` | string / number | CSS font-weight (`bold`, `700`, etc.) |
| `font_size` | number | Header font size in px |
| `text_align` | string | `left`, `center`, `right` |

```yaml
style:
  cell:
    background: "var(--ha-card-background)"
    color: "var(--lcards-moonlight)"
    font_size: 12
    font_family: "Antonio, sans-serif"
    padding: "4px 8px"
    border_radius: 4
    text_align: left
  header_row:
    background: "alpha(var(--lcards-orange), 0.08)"
    color: "var(--lcards-orange)"
    font_weight: bold
    font_size: 13
```

---

## Cascade Animation

The cascade effect cycles colours through each row in sequence, creating a waterfall effect.

```yaml
animation:
  type: cascade
  pattern: default       # default | niagara | fast | custom
  speed_multiplier: 1.5  # Multiply speed (1.0 = normal)
  colors:
    start: "var(--lcards-blue-light)"
    text: "var(--lcards-blue-darkest)"
    end: "var(--lcards-moonlight)"
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
animation:
  type: cascade
  pattern: custom
  timing:
    - { duration: 3000, delay: 0.1 }   # Row 0
    - { duration: 2000, delay: 0.2 }   # Row 1
    - { duration: 4000, delay: 0.3 }   # Row 2 (repeats)
  colors:
    start: "var(--lcards-blue-light)"
    text: "var(--lcards-blue-darkest)"
    end: "var(--lcards-moonlight)"
```

---

## Change Highlight Animation

Highlight cells that have just changed — draws attention to live data updates.

```yaml
animation:
  highlight_changes: true
  change_preset: pulse     # pulse | glow
  change_duration: 500
  change_params:
    max_scale: 1.08        # For pulse
    # color: "var(--lcards-orange)"   # For glow
    # blur_max: 12                    # For glow
```

---

## Consolidated Example

A system status panel with header row, entity cells, a template cell, a DataSource cell, cascade animation, and change highlight:

```yaml
type: custom:lcards-data-grid
data_mode: data

rows:
  # Header row — styled via style.header_row
  - values: [SUBSYSTEM, VALUE, STATUS]

  # Entity cells — auto-subscribed live values
  - [CPU, sensor.cpu_usage, "{{ 'OK' if states('sensor.cpu_usage')|float < 80 else 'WARN' }}"]
  - [RAM, sensor.memory_used_percent, "{{ 'OK' if states('sensor.memory_used_percent')|float < 90 else 'WARN' }}"]

  # Template cell
  - [Disk, sensor.disk_use_percent, "{{ states('sensor.disk_use_percent') }}%"]

  # DataSource cell with format specifier (note: datasource template syntax for dynamic values)
  - [Net TX, "{datasource:net_tx:.1f} MB/s", "var(--lcards-moonlight)"]

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
  cell:
    background: "var(--ha-card-background)"
    color: "var(--lcards-moonlight)"
    font_size: 12
    font_family: "Antonio, sans-serif"
    padding: "4px 8px"
  header_row:
    background: "alpha(var(--lcards-orange), 0.08)"
    color: "var(--lcards-orange)"
    font_weight: bold
    text_align: center

animation:
  type: cascade
  pattern: niagara
  colors:
    start: "var(--lcards-blue-light)"
    text: "var(--lcards-blue-darkest)"
    end: "var(--lcards-moonlight)"
  highlight_changes: true
  change_preset: glow
  change_params:
    color: "var(--lcards-orange)"
    blur_max: 8
```

---

## Related

- [DataSources](../../core/datasources/README.md)
- [Templates](../../core/templates/README.md)
- [Colours](../../core/colours.md)
- [Animations](../../core/animations.md)
