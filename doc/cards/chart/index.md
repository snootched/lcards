# Chart Card

`custom:lcards-chart`

Data visualization using ApexCharts. Plots entity history, real-time sensor data, and processed data source buffers as line, area, bar, pie, and many other chart types.

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

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | — | `custom:lcards-chart` (required) |
| `source` | string | — | Single entity ID (simple mode) |
| `attribute` | string | — | Entity attribute to track (with `source`) |
| `sources` | list | — | Multiple entities or data source references |
| `data_sources` | object | — | Named data source definitions — see [Data Sources](../../core/datasources/) |
| `chart_type` | string | `line` | Chart type — see [Chart Types](#chart-types) |
| `series_names` | list | — | Display names for each series (matches `sources` order) |
| `xaxis_type` | string | `datetime` | X-axis scale: `datetime`, `category`, or `numeric` |
| `max_points` | number | `0` | Maximum history points to render; `0` = unlimited |
| `show_legend` | boolean | `false` | **Deprecated** — use `style.legend.show` instead |
| `height` | string/number | — | Card height — see [Sizing](../../cards/common.md#sizing-height-and-width) |
| `width` | string/number | — | Card width — see [Sizing](../../cards/common.md#sizing-height-and-width) |
| `min_height` | string/number | — | Minimum card height — see [Sizing](../../cards/common.md#sizing-height-and-width) |
| `min_width` | string/number | — | Minimum card width — see [Sizing](../../cards/common.md#sizing-height-and-width) |
| `id` | string | — | Card ID for rule targeting — see [Rules Engine](../../core/rules/) |
| `tags` | list | — | Tags for rule targeting — see [Rules Engine](../../core/rules/) |
| `style` | object | — | All chart appearance config — see [style Object](#style-object) |

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
| `rangeArea` | Range area (shaded band between two values) |
| `polarArea` | Polar area chart |
| `treemap` | Treemap chart |
| `boxPlot` | Box plot |

> **Note**: `candlestick`, `rangeBar`, `rangeArea`, `polarArea`, `treemap`, and `boxPlot` require datasource data in the ApexCharts-specific format for those types (e.g. OHLC arrays for `candlestick`). They are advanced chart types — refer to the [ApexCharts documentation](https://apexcharts.com/docs) for data format details.

---

## Data Sources

Three levels of data configuration:

### Level 1: Simple entity

```yaml
source: sensor.temperature
```

Auto-creates a data source with 6 hours of history.

### Level 2: Multiple entities

```yaml
sources:
  - sensor.temperature
  - sensor.humidity
series_names: [Temperature, Humidity]
```

### Level 3: Named Data Sources with processing

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

See [Data Sources](../../core/datasources/) for full processing options.

---

## `style` Object

All chart appearance configuration lives under `style`. Colour values accept all formats supported by [Colours](../../core/colours.md) — `var(--lcars-*)`, `{theme:...}`, hex, and rgba.

### `style.colors`

Controls colours for every visual element. All sub-keys are optional.

| Field | Type | Description |
|-------|------|-------------|
| `style.colors.series` | list | Series fill/line colours — cycles through array |
| `style.colors.stroke` | list | Series stroke/outline colours — cycles through array |
| `style.colors.fill` | list | Area fill colours — cycles through array |
| `style.colors.background` | string | Chart background colour |
| `style.colors.foreground` | string | Default text and label colour |
| `style.colors.grid` | string | Grid line colour |
| `style.colors.marker.fill` | list | Data point fill colours — defaults to `series` colours |
| `style.colors.marker.stroke` | list | Data point stroke colours |
| `style.colors.axis.x` | string | X-axis label colour |
| `style.colors.axis.y` | string | Y-axis label colour |
| `style.colors.axis.border` | string | Axis border line colour |
| `style.colors.axis.ticks` | string | Axis tick mark colour |
| `style.colors.legend.default` | string | Legend text colour |
| `style.colors.legend.items` | list | Per-series legend item colours |
| `style.colors.data_labels` | list | Data label colours |

```yaml
style:
  colors:
    series:
      - "var(--lcars-orange)"
      - "var(--lcars-blue-light)"
    background: "transparent"
    foreground: "var(--lcars-moonlight)"
    grid: "var(--lcars-gray)"
```

---

### `style.stroke`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.stroke.width` | number | `2` | Line/border stroke width in px |
| `style.stroke.curve` | string | `smooth` | `smooth`, `straight`, `stepline`, `monotoneCubic` |
| `style.stroke.dash_array` | number | `0` | Dash gap length; `0` = solid line |

---

### `style.fill`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.fill.type` | string | `solid` | `solid`, `gradient`, `pattern`, `image` |
| `style.fill.opacity` | number | `0.7` | Fill opacity |
| `style.fill.gradient.shade` | string | — | `light` or `dark` |
| `style.fill.gradient.type` | string | — | `horizontal`, `vertical`, `diagonal1`, `diagonal2` |
| `style.fill.gradient.shadeIntensity` | number | — | Shade intensity |
| `style.fill.gradient.opacityFrom` | number | — | Gradient start opacity |
| `style.fill.gradient.opacityTo` | number | — | Gradient end opacity |

```yaml
style:
  fill:
    type: gradient
    gradient:
      opacityFrom: 0.5
      opacityTo: 0.05
```

---

### `style.markers`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.markers.size` | number | `4` | Marker size in px; `0` = hidden |
| `style.markers.shape` | string | `circle` | `circle`, `square`, `rect`, `rhombus` |
| `style.markers.stroke.width` | number | `2` | Marker stroke width in px |

---

### `style.grid`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.grid.show` | boolean | `true` | Show/hide grid lines |
| `style.grid.opacity` | number | `0.3` | Grid line opacity |
| `style.grid.stroke_dash_array` | number | `4` | Grid line dash gap |
| `style.grid.row_colors` | list | — | Alternating row background colours |
| `style.grid.column_colors` | list | — | Alternating column background colours |

---

### `style.legend`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.legend.show` | boolean | `false` | Show/hide legend |
| `style.legend.position` | string | `bottom` | `top`, `bottom`, `left`, `right` |
| `style.legend.horizontalAlign` | string | `center` | `left`, `center`, `right` |
| `style.legend.font_size` | number | `14` | Legend font size in px |

---

### `style.data_labels`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.data_labels.show` | boolean | `false` | Show value labels on data points |
| `style.data_labels.offsetY` | number | `0` | Vertical offset in px |
| `style.data_labels.font_size` | number | `12` | Label font size in px |

---

### `style.xaxis`

Controls x-axis display. The x-axis scale type is set by the top-level `xaxis_type` field, not here.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.xaxis.labels.show` | boolean | `true` | Show/hide axis labels |
| `style.xaxis.labels.rotate` | number | `0` | Label rotation in degrees |
| `style.xaxis.border.show` | boolean | `false` | Show/hide axis border line |
| `style.xaxis.ticks.show` | boolean | `false` | Show/hide tick marks |

```yaml
xaxis_type: datetime
style:
  xaxis:
    labels:
      show: true
      rotate: -45
```

---

### `style.yaxis`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.yaxis.labels.show` | boolean | `true` | Show/hide axis labels |
| `style.yaxis.decimals` | number | — | Decimal places on labels |
| `style.yaxis.border.show` | boolean | `false` | Show/hide axis border line |
| `style.yaxis.ticks.show` | boolean | `false` | Show/hide tick marks |

> **Advanced y-axis config** (e.g. `min`, `max`, `opposite`, `seriesName` for multi-axis charts) can be passed directly to ApexCharts via [`style.chart_options`](#stylechart_options).

---

### `style.display`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.display.toolbar` | boolean | `false` | Show ApexCharts toolbar (download/zoom controls) |
| `style.display.tooltip.show` | boolean | `true` | Show/hide hover tooltip |
| `style.display.tooltip.theme` | string | `dark` | `dark` or `light` |

---

### `style.typography`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.typography.font_family` | string | `"Antonio, Helvetica Neue, sans-serif"` | Font family for all chart text |
| `style.typography.font_size` | number | `12` | Base font size in px |

---

### `style.theme`

Controls ApexCharts' built-in theme/palette engine. Takes lower precedence than explicit colour settings.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.theme.mode` | string | `dark` | `dark` or `light` |
| `style.theme.palette` | string | — | ApexCharts palette name (e.g. `palette1`-`palette10`) |
| `style.theme.monochrome.enabled` | boolean | `false` | Use a single-hue monochrome palette |
| `style.theme.monochrome.color` | string | — | Base colour for monochrome palette |
| `style.theme.monochrome.shade_to` | string | `dark` | `dark` or `light` |
| `style.theme.monochrome.shade_intensity` | number | `0.65` | Shade spread |

---

### `style.formatters`

Template strings evaluated by LCARdS' [Template Engine](../../core/templates/) to format axis labels and tooltip values.

| Field | Type | Description |
|-------|------|-------------|
| `style.formatters.xaxis_label` | string | Template for x-axis label text |
| `style.formatters.yaxis_label` | string | Template for y-axis label text |
| `style.formatters.tooltip` | string | Template for tooltip value text |

---

### `style.animation`

| Field | Type | Description |
|-------|------|-------------|
| `style.animation.preset` | string | Animation preset name — see table below |

```yaml
style:
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

### `style.chart_options`

Raw ApexCharts options object, merged on top of all other style settings. Use this for advanced ApexCharts configuration that has no LCARdS-level equivalent — such as multi-axis `yaxis` arrays, `plotOptions`, `annotations`, etc.

```yaml
style:
  chart_options:
    yaxis:
      - seriesName: Temperature
        min: 15
        max: 30
        decimalsInFloat: 1
      - seriesName: Humidity
        min: 0
        max: 100
        opposite: true
    plotOptions:
      bar:
        borderRadius: 4
```

Refer to the [ApexCharts documentation](https://apexcharts.com/docs/options/) for all available keys.

---

## Annotated Example

24-hour dual-series chart with named data source, custom colours, dual Y-axes (via `style.chart_options`), gradient fill, and animation preset:

```yaml
type: custom:lcards-chart
xaxis_type: datetime

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

style:
  colors:
    series:
      - "var(--lcars-orange)"
      - "var(--lcars-blue-light)"

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
    labels:
      show: true

  legend:
    show: true
    position: bottom

  animation:
    preset: lcars_standard

  chart_options:
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
```

---

