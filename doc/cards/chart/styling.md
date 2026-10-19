# Styling

Charts use your theme's colours and fonts without any `style` at all, so everything on this page is optional. Colours accept every format in [Colours](../../core/colours.md): `var(--lcars-*)`, `theme:` tokens, hex and rgba.

For per-series colours and line styles, the [series options](./series#series-options) (`color`, `stroke_width`, `curve`, ...) are usually simpler than the lists below.

---

## Reference lines

Horizontal lines at fixed values:

```yaml live
type: custom:lcards-chart
sources:
  - entity: sensor.outdoor_temperature
    name: Outside
style:
  zero_line: true
  thresholds:
    - value: 18
      label: Warm
      color: var(--lcars-red)
    - value: 8
      label: Cold
      color: var(--lcars-blue)
      dash: true
```

| Option | What it does |
|--------|--------------|
| `style.zero_line` | Draw a line at 0 |
| `style.zero_line_color` | Its colour |
| `style.thresholds` | A list of lines, each with the options below |

| Threshold option | What it does |
|------------------|--------------|
| `value` | Where the line goes (required) |
| `label` | Text on the line |
| `color` | Line colour |
| `width` | Line width (default 2) |
| `dash` | Dashed line |
| `opacity` | Line opacity (default 0.7) |

---

## Colours

| Field | Type | Description |
|-------|------|-------------|
| `style.colors.series` | list | Series colours, used in order |
| `style.colors.stroke` | list | Line/outline colours |
| `style.colors.fill` | list | Area fill colours |
| `style.colors.background` | string | Chart background |
| `style.colors.foreground` | string | Default text and label colour |
| `style.colors.grid` | string | Grid line colour |
| `style.colors.marker.fill` | list | Point fill colours (default: the series colours) |
| `style.colors.marker.stroke` | list | Point outline colours |
| `style.colors.axis.x` | string | X-axis label colour |
| `style.colors.axis.y` | string | Y-axis label colour |
| `style.colors.axis.border` | string | Axis line colour |
| `style.colors.axis.ticks` | string | Tick mark colour |
| `style.colors.legend.default` | string | Legend text colour |
| `style.colors.legend.items` | list | Per-series legend colours |
| `style.colors.data_labels` | list | Value label colours |

```yaml live
type: custom:lcards-chart
chart_type: area
sources:
  - entity: sensor.kitchen_temperature
    name: Kitchen
  - entity: sensor.bedroom_temperature
    name: Bedroom
style:
  colors:
    series:
      - "var(--lcars-yellow)"
      - "var(--lcars-violet)"
    grid: "var(--lcars-gray)"
  fill:
    type: gradient
    gradient:
      opacityFrom: 0.5
      opacityTo: 0.05
  legend:
    show: true
```

---

## Lines and fills

### `style.stroke`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.stroke.width` | number | `2` | Line width in px |
| `style.stroke.curve` | string | `smooth` | `smooth`, `straight`, `stepline`, `monotoneCubic` |
| `style.stroke.dash_array` | number | `0` | Dash length; `0` is solid |

### `style.fill`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.fill.type` | string | `solid` | `solid`, `gradient`, `pattern`, `image` |
| `style.fill.opacity` | number | `0.7` | Fill opacity |
| `style.fill.gradient.shade` | string | - | `light` or `dark` |
| `style.fill.gradient.type` | string | - | `horizontal`, `vertical`, `diagonal1`, `diagonal2` |
| `style.fill.gradient.shadeIntensity` | number | - | Shade intensity |
| `style.fill.gradient.opacityFrom` | number | - | Opacity where the gradient starts |
| `style.fill.gradient.opacityTo` | number | - | Opacity where the gradient ends |

```yaml live
type: custom:lcards-chart
graph_span: 12h
sources:
  - entity: sensor.outdoor_temperature
    name: Outside
style:
  stroke:
    width: 3
    dash_array: 8
    curve: straight
```

### `style.markers`

Points drawn on each value.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.markers.size` | number | `0` | Point size in px; `0` hides them |
| `style.markers.shape` | string | `circle` | `circle`, `square`, `rect`, `diamond`, `triangle`, `star`, `cross`, `plus` |
| `style.markers.stroke.width` | number | `2` | Point outline width in px |

```yaml live
type: custom:lcards-chart
graph_span: 12h
sources:
  - entity: sensor.outdoor_temperature
    name: Outside
    group_by:
      func: avg
      duration: 1h
style:
  markers:
    size: 6
    shape: diamond
    stroke:
      width: 1
```

---

## Grid, legend and labels

### `style.grid`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.grid.show` | boolean | `true` | Show grid lines |
| `style.grid.stroke_dash_array` | number | `4` | Grid line dash length |
| `style.grid.row_colors` | list | - | Alternating row background colours |
| `style.grid.column_colors` | list | - | Alternating column background colours |

```yaml live
type: custom:lcards-chart
chart_type: column
sources:
  - entity: sensor.house_power
    name: Power
    group_by:
      func: avg
      duration: 2h
style:
  grid:
    stroke_dash_array: 0
    row_colors:
      - "rgba(255, 153, 0, 0.08)"
      - "transparent"
```

### `style.legend`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.legend.show` | boolean | `false` (`true` for `pie`, `donut`, `polarArea` and `radialBar`) | Show the legend. The slice and gauge charts turn it on because it names the series |
| `style.legend.position` | string | `bottom` | `top`, `bottom`, `left`, `right` |
| `style.legend.horizontalAlign` | string | `center` | `left`, `center`, `right` |
| `style.legend.font_size` | number | font size + 2 | Legend font size in px |

```yaml live
type: custom:lcards-chart
sources:
  - entity: sensor.kitchen_temperature
    name: Kitchen
  - entity: sensor.bedroom_temperature
    name: Bedroom
  - entity: sensor.office_temperature
    name: Office
style:
  legend:
    show: true
    position: right
    font_size: 13
```

### `style.data_labels`

Values written on the chart.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.data_labels.show` | boolean | `false` | Show value labels |
| `style.data_labels.offsetY` | number | `0` | Vertical offset in px |
| `style.data_labels.font_size` | number | font size | Label font size in px |

```yaml live
type: custom:lcards-chart
chart_type: column
graph_span: 7d
sources:
  - entity: sensor.outdoor_temperature
    name: Daily high
    statistics:
      type: max
      period: day
style:
  data_labels:
    show: true
    font_size: 11
  yaxis:
    decimals: 0
```

### `style.xaxis` and `style.yaxis`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.xaxis.labels.show` | boolean | `true` | Show X-axis labels |
| `style.xaxis.labels.rotate` | number | `0` | Label rotation in degrees (category axes only; time axes don't rotate) |
| `style.xaxis.border.show` | boolean | `false` | Show the X-axis line |
| `style.xaxis.ticks.show` | boolean | `false` | Show X-axis tick marks |
| `style.yaxis.labels.show` | boolean | `true` | Show Y-axis labels |
| `style.yaxis.decimals` | number | - | Decimal places for labels, tooltips and value labels |
| `style.yaxis.border.show` | boolean | `false` | Show the Y-axis line |
| `style.yaxis.ticks.show` | boolean | `false` | Show Y-axis tick marks |

The X axis shows time by default. Set `xaxis_type: category` or `xaxis_type: numeric` at the top level for other kinds of X values. For several Y axes, use [`yaxis`](./series#y-axes).

```yaml live
type: custom:lcards-chart
graph_span: 48h
sources:
  - entity: sensor.outdoor_temperature
    name: Outside
style:
  xaxis:
    border:
      show: true
    ticks:
      show: true
  yaxis:
    decimals: 1
    border:
      show: true
```

### `style.display`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.display.toolbar` | boolean | `false` | Show the zoom/download toolbar |
| `style.display.tooltip.show` | boolean | `true` | Show the hover tooltip |
| `style.display.tooltip.theme` | string | `dark` | `dark` or `light` |

```yaml live
type: custom:lcards-chart
graph_span: 6h
sources:
  - entity: sensor.house_power
    name: Power
style:
  display:
    toolbar: true
    tooltip:
      theme: light
```

### `style.typography`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.typography.font_family` | string | your theme's font | Font for all chart text |
| `style.typography.font_size` | number | `12` | Base font size in px |

```yaml live
type: custom:lcards-chart
sources:
  - entity: sensor.outdoor_temperature
    name: Outside
style:
  typography:
    font_size: 16
```

### `style.theme`

ApexCharts' own palette options. Explicit colours take priority.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.theme.mode` | string | `dark` | `dark` or `light` |
| `style.theme.palette` | string | - | ApexCharts palette (`palette1` to `palette10`) |
| `style.theme.monochrome.enabled` | boolean | `false` | Shades of a single colour |
| `style.theme.monochrome.color` | string | - | The base colour |
| `style.theme.monochrome.shade_to` | string | `dark` | `dark` or `light` |
| `style.theme.monochrome.shade_intensity` | number | `0.65` | How far the shades spread |

```yaml live
type: custom:lcards-chart
chart_type: donut
sources:
  - entity: sensor.kitchen_power
    name: Kitchen
  - entity: sensor.office_power
    name: Office
  - entity: sensor.garage_power
    name: Garage
  - entity: sensor.laundry_power
    name: Laundry
style:
  theme:
    monochrome:
      enabled: true
      color: "#ff9900"
      shade_to: dark
  legend:
    show: true
```

---

## Chart-type options

| Field | Chart type | Default | Description |
|-------|------------|---------|-------------|
| `style.gauge_start_angle` | `radialBar` | `-90` | Where the gauge arc starts, in degrees |
| `style.gauge_end_angle` | `radialBar` | `90` | Where it ends |
| `style.gauge_total` | `radialBar` | `false` | Show the sum of all gauges in the centre |
| `style.value_format` | `radialBar` | - | `percent` adds a % sign to the values |
| `style.group_rows` | `rangeBar` | `true` | Put bars with the same label on one row |
| `style.show_labels` | `rangeBar` | `true` | Show labels on the bars |

### Fitted by default

Some chart types are laid out by the card rather than left to ApexCharts' defaults, which waste space in wide cards. These follow the card when it changes size; [raw options](#raw-apexcharts-options) still override them.

| Chart type | Default |
|------------|---------|
| `radar` | The web is sized to fill the card (with room for the axis names) and centred, so a three-axis triangle doesn't leave the bottom empty. No line-chart grid behind it. Set `plotOptions.radar.size` (radius in px) and `offsetY` in `chart_options` to place it yourself |
| `radialBar` | A half-circle gauge (start and end angles within -90 to 90) fills the card's height instead of reserving room for the missing lower half |
| `polarArea` | The ring values are hidden (they sit on the vertical spoke). `style.yaxis.labels.show: true` brings them back |
| `candlestick` | One series: green candles for up, red for down. Two or more: each series' candles take its own colour (full for up, darker for down), so they match the legend and stay apart. Set `plotOptions.candlestick.colors.upward` and `downward` in `chart_options` to choose |
| `bar` | Horizontal bars over time label each bar with its time on the vertical axis and put the values along the bottom |

```yaml live
type: custom:lcards-chart
chart_type: radialBar
sources:
  - entity: sensor.phone_battery
    name: Phone
  - entity: sensor.tablet_battery
    name: Tablet
style:
  gauge_start_angle: -135
  gauge_end_angle: 135
  value_format: percent
  legend:
    show: true
```

---

## Formatters

Format strings for axis labels and tooltips. These use a small chart-only syntax; they are **not** LCARdS templates.

| Field | Examples |
|-------|----------|
| `style.formatters.xaxis_label` | `HH:mm` · `MMM DD` · `ddd HH:mm` |
| `style.formatters.yaxis_label` | `{value}°C` · `{value}%` |
| `style.formatters.tooltip` | `{seriesName}: {y}` · `{x\|MMM DD HH:mm}: {y}°C` |

- **Dates:** `YYYY`, `YY`, `MMMM` (October), `MMM` (Oct), `MM`, `M`, `dddd` (Tuesday), `ddd` (Tue), `DD`, `D`, `HH`, `H`, `hh`, `h`, `mm`, `m`, `ss`, `s`, `A` (PM), `a` (pm). Put literal text in square brackets: `[at] HH:mm`.
- **Values:** `{value}` in axis labels; `{y}`, `{x}`, `{x|format}` and `{seriesName}` in tooltips.

Units and decimal places usually need no formatter: set `unit` and `float_precision` on the series.

```yaml live
type: custom:lcards-chart
sources:
  - entity: sensor.outdoor_temperature
    name: Outside
style:
  formatters:
    xaxis_label: "ddd HH:mm"
    yaxis_label: "{value}°"
    tooltip: "{x|ddd [at] HH:mm}: {y}°C"
```

---

## Animation

```yaml
style:
  animation:
    preset: lcars_standard
```

The chart below uses `lcars_dramatic`; reload the page to see it again.

```yaml live
type: custom:lcards-chart
chart_type: column
sources:
  - entity: sensor.house_power
    name: Power
    group_by:
      func: avg
      duration: 1h
style:
  animation:
    preset: lcars_dramatic
```

| Preset | Description |
|--------|-------------|
| `lcars_standard` | Smooth entrance (the default feel) |
| `lcars_dramatic` | Slower, more theatrical entrance |
| `lcars_minimal` | Quick, subtle entrance |
| `lcars_realtime` | No entrance animation; quick updates for live data |
| `lcars_alert` | Fast entrance for alert displays |
| `none` | No animation |

---

## Raw ApexCharts options

`style.chart_options` passes options straight to ApexCharts and overrides everything above. Use it only for things LCARdS doesn't cover: see the [ApexCharts options reference](https://apexcharts.com/docs/options/).

```yaml live
type: custom:lcards-chart
chart_type: column
sources:
  - entity: sensor.house_power
    name: Power
    group_by:
      func: avg
      duration: 2h
style:
  chart_options:
    plotOptions:
      bar:
        borderRadius: 6
        columnWidth: "60%"
```

Only plain values work here; ApexCharts options that expect JavaScript functions can't be written in YAML.

---

## A complete example

```yaml live
type: custom:lcards-chart
chart_type: area
graph_span: 24h

sources:
  - datasource: living_room
    buffer: smoothed
    name: Temperature
    unit: °C
    float_precision: 1
  - entity: sensor.living_room_humidity
    name: Humidity
    yaxis_id: humidity
    type: line

data_sources:
  living_room:
    entity: sensor.living_room_temperature
    history:
      hours: 24
    processing:
      smoothed:
        type: smooth
        method: exponential
        alpha: 0.2

yaxis:
  - id: temperature
  - id: humidity
    opposite: true
    min: 0
    max: 100

style:
  colors:
    series:
      - "var(--lcars-orange)"
      - "var(--lcars-blue)"
  fill:
    type: gradient
    gradient:
      opacityFrom: 0.5
      opacityTo: 0.05
  legend:
    show: true
  thresholds:
    - value: 22
      label: Warm
      color: var(--lcars-red)
  animation:
    preset: lcars_standard
```
