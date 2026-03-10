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
| `data_sources` | object | Named DataSource definitions — see [DataSources](../../core/datasources/README.md) |
| `chart_type` | string | Chart type (see table below) |
| `series_names` | list | Display names for each series |
| `id` | string | Card ID for rule targeting |
| `tags` | list | Tags for rule targeting |
| `title` | object | Chart title config — see below |
| `colors` | list | Array of series colours |
| `stroke` | object | Line stroke options |
| `fill` | object | Area fill options |
| `markers` | object | Data point markers |
| `legend` | object | Legend config |
| `grid` | object | Grid lines config |
| `xaxis` | object | X-axis config — see below |
| `yaxis` | object / list | Y-axis config (list for multiple axes) — see below |
| `tooltip` | object | Tooltip config |
| `animation` | object | Chart render animation — see below |

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
| `polarArea` | Polar area chart |
| `treemap` | Treemap chart |
| `boxPlot` | Box plot |

> **Note**: `candlestick`, `rangeBar`, `polarArea`, `treemap`, and `boxPlot` require datasource data in the ApexCharts-specific format for those types (e.g. OHLC arrays for `candlestick`). They are advanced chart types — refer to the [ApexCharts documentation](https://apexcharts.com/docs) for data format details.

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

## `title` Object

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Title text |
| `align` | string | `left`, `center`, `right` |
| `style.fontSize` | string | CSS font size, e.g. `"14px"` |
| `style.color` | string | Title colour |
| `style.fontFamily` | string | CSS font family |
| `offsetY` | number | Vertical offset in px |

```yaml
title:
  text: "Outdoor Temperature"
  align: left
  style:
    fontSize: "14px"
    color: "var(--lcards-moonlight)"
    fontFamily: "Antonio, sans-serif"
```

---

## Colours and Styling

```yaml
colors:
  - "var(--lcards-blue-light)"
  - "var(--lcards-orange)"
  - "var(--lcards-moonlight)"

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

Colour values accept all formats supported by [Colours](../../core/colours.md) — `var(--lcards-*)`, `{theme:...}`, hex, and rgba.

---

## `xaxis` Object

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | `category` | `datetime`, `category`, or `numeric` |
| `labels.show` | boolean | `true` | Show/hide axis labels |
| `labels.rotate` | number | `0` | Label rotation in degrees |
| `border.show` | boolean | `true` | Show/hide axis border line |
| `ticks.show` | boolean | `true` | Show/hide tick marks |

```yaml
xaxis:
  type: datetime
  labels:
    show: true
    rotate: -45
```

## `yaxis` Object (single)

| Field | Type | Description |
|-------|------|-------------|
| `min` | number | Axis minimum value |
| `max` | number | Axis maximum value |
| `decimalsInFloat` | number | Decimal places on labels |
| `labels.show` | boolean | Show/hide labels |
| `labels.formatter` | string | Label format string: `"{value}°C"` |
| `opposite` | boolean | Place axis on the right side |
| `seriesName` | string | Tie this axis to a series by name |

### Multiple Y-axes

```yaml
yaxis:
  - seriesName: Temperature
    min: -10
    max: 40
    decimalsInFloat: 1
    labels:
      formatter: "{value}°C"
  - seriesName: Humidity
    min: 0
    max: 100
    opposite: true        # Second axis on right side
    labels:
      formatter: "{value}%"
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
  preset: lcars_standard
```

| Preset | Description |
|--------|-------------|
| `lcars_standard` | Smooth LCARS entrance with slight elastic ease |
| `lcars_dramatic` | Longer, more theatrical entrance |
| `lcars_minimal` | Quick, subtle fade-in |
| `lcars_realtime` | Optimised for frequently updating real-time data |
| `lcars_alert` | Rapid entrance for alert/status displays |
| `none` | Disable animation |

---

## Annotated Example

24-hour dual-series chart with named DataSource, custom colours, dual Y-axes, gradient fill, and animation preset:

```yaml
type: custom:lcards-chart
title:
  text: "Living Room Climate"
  align: left
  style:
    color: "var(--lcards-moonlight)"
    fontSize: "13px"

data_sources:
  climate:
    entity: sensor.living_room_temperature
    history:
      hours: 24
    processing:
      smooth:
        type: smooth
        method: exponential
        alpha: 0.2

sources:
  - datasource: climate
    buffer: main
    name: Temperature
  - sensor.living_room_humidity
series_names: [Temperature, Humidity]

chart_type: area

colors:
  - "var(--lcards-orange)"
  - "var(--lcards-blue-light)"

stroke:
  curve: smooth
  width: 2

fill:
  type: gradient
  gradient:
    opacityFrom: 0.5
    opacityTo: 0.05

markers:
  size: 0

xaxis:
  type: datetime
  labels:
    show: true

yaxis:
  - seriesName: Temperature
    min: 15
    max: 30
    decimalsInFloat: 1
    labels:
      formatter: "{value}°C"
  - seriesName: Humidity
    min: 0
    max: 100
    opposite: true
    labels:
      formatter: "{value}%"

legend:
  show: true
  position: bottom

animation:
  preset: lcars_standard
```

---

## Related

- [DataSources](../../core/datasources/README.md)
- [Templates](../../core/templates/README.md)
- [Colours](../../core/colours.md)
- [Rules Engine](../../core/rules/README.md)
