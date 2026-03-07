# Data Grid Card

`custom:lcards-data-grid`

A grid of cells displaying real entity data, templates, or decorative auto-generated data — with cascade colour animations for that authentic LCARS data display look.

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
    start: "#FF9900"
    text: "#884400"
    end: "#FFCC44"
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
| `style` | object | Cell and grid styles |
| `animation` | object | Cascade and change animations |
| `id` | string | Card ID for rule targeting |
| `tags` | list | Tags for rule targeting |

---

## Data Mode: Rows

Each row is an array of cell values. Cells are auto-detected:

| Cell value | Type | How it's shown |
|------------|------|---------------|
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
      background: "#1a1a2e"
      color: "#FF9900"
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

## Cascade Animation

The cascade effect cycles colours through each row in sequence, creating a waterfall effect.

```yaml
animation:
  type: cascade
  pattern: default       # default | niagara | fast | custom
  speed_multiplier: 1.5  # Multiply speed (1.0 = normal)
  colors:
    start: "#FF9900"
    text: "#884400"
    end: "#FFCC44"
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
    start: "#99CCFF"
    text: "#4466AA"
    end: "#AACCFF"
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
    # color: "#FF9900"     # For glow
    # blur_max: 12         # For glow
```

---

## Style

```yaml
style:
  cell:
    background: "#111"
    color: "#cccccc"
    font_size: 12
    font_family: "Antonio, sans-serif"
    padding: "4px 8px"
    border_radius: 4
  header_row:
    background: "#1a1a2e"
    color: "#FF9900"
    font_weight: bold
```

---

## Examples

### System status panel

```yaml
type: custom:lcards-data-grid
data_mode: data
rows:
  - values: [SYSTEM STATUS]
    style:
      color: "#FF9900"
      font_weight: bold
      font_size: 13
  - [CPU, sensor.cpu_usage, "{{ states('sensor.cpu_usage') }}%"]
  - [RAM, sensor.memory_used_percent, "{{ states('sensor.memory_used_percent') }}%"]
  - [Disk, sensor.disk_use_percent, "{{ states('sensor.disk_use_percent') }}%"]
grid:
  grid-template-columns: "80px 1fr 60px"
  gap: 6px
```

### Decorative data wall

```yaml
type: custom:lcards-data-grid
data_mode: decorative
format: hex
refresh_interval: 3000
grid:
  grid-template-columns: repeat(20, 1fr)
  grid-template-rows: repeat(10, auto)
  gap: 3px
animation:
  type: cascade
  pattern: niagara
  colors:
    start: "#3377CC"
    text: "#112244"
    end: "#99CCFF"
```

---

## Related

- [DataSources](../../core/datasources/README.md)
- [Templates](../../core/templates/README.md)
- [Animations](../../core/animations.md)
