# Chart Card

`custom:lcards-chart`

Data visualization using ApexCharts. Plots entity history, real-time sensor data, and processed DataSource buffers as line, area, bar, pie, and many other chart types.

---

## Quick Start

```yaml
# Line chart from a single entity
type: custom:lcards-chart
source: sensor.temperature
chart_type: line
```

```yaml
# Area chart with two sensors
type: custom:lcards-chart
sources:
  - sensor.temperature
  - sensor.humidity
chart_type: area
series_names: [Temperature, Humidity]
```

---

## Top-Level Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | `custom:lcards-chart` (required) |
| `source` | string | Single entity ID (simple mode) |
| `attribute` | string | Entity attribute to track |
| `sources` | list | Multiple entities or DataSource references |
| `data_sources` | object | Named DataSource definitions |
| `chart_type` | string | Chart type (see below) |
| `series_names` | list | Display names for each series |
| `id` | string | Card ID for rule targeting |
| `tags` | list | Tags for rule targeting |
| `title` | object | Chart title config |
| `colors` | list | Array of series colors |
| `stroke` | object | Line stroke options |
| `fill` | object | Area fill options |
| `markers` | object | Data point markers |
| `legend` | object | Legend config |
| `grid` | object | Grid lines config |
| `xaxis` | object | X-axis config |
| `yaxis` | object / list | Y-axis config (list for multiple axes) |
| `tooltip` | object | Tooltip config |
| `animation` | object | Chart render animation |

---

## Chart Types

| Type | Description |
|------|-------------|
| `line` | Line chart |
| `area` | Area chart (filled under line) |
| `bar` | Horizontal bar chart |
| `column` | Vertical column chart |
| `scatter` | Scatter plot |
| `pie` | Pie chart |
| `donut` | Donut chart |
| `heatmap` | Heatmap |
| `radialBar` | Radial gauge |
| `radar` | Radar/spider chart |
| `candlestick` | OHLC candlestick |
| `rangeBar` | Range bar (for time spans) |

---

## Data Sources

Three levels of data configuration:

### Level 1: Simple entity

```yaml
source: sensor.temperature
```

Auto-creates a DataSource with 6 hours of history.

### Level 2: Multiple entities

```yaml
sources:
  - sensor.temperature
  - sensor.humidity
series_names: [Temperature, Humidity]
```

### Level 3: Named DataSources with processing

```yaml
data_sources:
  temp:
    entity: sensor.temperature
    history:
      hours: 24
    processing:
      smoothed:
        type: smooth
        method: exponential
        alpha: 0.3

sources:
  - datasource: temp
    buffer: main          # Raw history
    name: Raw
  - datasource: temp
    buffer: smoothed      # Smoothed values
    name: Smoothed
```

See [DataSources](../../core/datasources/README.md) for full processing options.

---

## Colours and Styling

```yaml
colors:
  - "#FF9900"
  - "#99CCFF"
  - "#FFCC00"

stroke:
  curve: smooth          # smooth, straight, stepline, monotoneCubic
  width: 2

fill:
  type: gradient         # solid, gradient, pattern
  gradient:
    shadeIntensity: 0.5
    opacityFrom: 0.6
    opacityTo: 0.1

markers:
  size: 0                # 0 = no markers
```

---

## Axes

```yaml
xaxis:
  type: datetime         # datetime, category, numeric
  labels:
    format: "HH:mm"      # d3 time format

yaxis:
  min: 0
  max: 100
  decimalsInFloat: 1
  labels:
    formatter: "{value}°C"
```

For multiple Y-axes:

```yaml
yaxis:
  - seriesName: Temperature
    min: -10
    max: 40
  - seriesName: Humidity
    min: 0
    max: 100
    opposite: true       # Second axis on right side
```

---

## Legend and Tooltip

```yaml
legend:
  show: true
  position: bottom       # top, bottom, left, right

tooltip:
  x:
    format: "dd MMM HH:mm"
  y:
    formatter: "{value}°C"
```

---

## Chart Animation

```yaml
animation:
  preset: lcars_standard   # lcars_standard, lcars_dramatic, lcars_minimal, lcars_realtime, none
```

---

## Examples

### 24-hour temperature with smoothing

```yaml
type: custom:lcards-chart
data_sources:
  temp:
    entity: sensor.outdoor_temperature
    history:
      hours: 24
    processing:
      smooth:
        type: smooth
        method: exponential
        alpha: 0.2
sources:
  - datasource: temp
    buffer: smooth
chart_type: area
colors:
  - "#99CCFF"
fill:
  type: gradient
  gradient:
    opacityFrom: 0.5
    opacityTo: 0.05
xaxis:
  type: datetime
```

### Power usage pie chart

```yaml
type: custom:lcards-chart
sources:
  - sensor.lights_power
  - sensor.hvac_power
  - sensor.appliances_power
series_names: [Lights, HVAC, Appliances]
chart_type: donut
colors:
  - "#FF9900"
  - "#99CCFF"
  - "#FFCC00"
legend:
  show: true
  position: bottom
```

---

## Related

- [DataSources](../../core/datasources/README.md)
- [Templates](../../core/templates/README.md)
- [Rules Engine](../../core/rules/README.md)
