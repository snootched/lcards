# Chart Card

`custom:lcards-chart`

Plots your Home Assistant sensors over time: lines, areas, columns, gauges, range bands, candlesticks and more. Charts pick up your LCARS theme colours and fonts automatically, so most charts need nothing more than a list of entities.

The card is built on [ApexCharts](https://apexcharts.com/), a very capable charting library. You don't need to know ApexCharts to use it: these pages cover everything LCARdS sets up for you.

::: tip Try it
- In the card editor, **Open Configuration Studio** gives you a live preview while you add series, pick a chart type and adjust colours.
- The [Playground](./playground) lets you edit chart YAML right here in the docs and see the result.
:::

The charts on these pages are live previews drawn by the card's own code, using generated sample data.

| Page | Covers |
|------|--------|
| [Series & Time](./series) | Series options, time window, grouping, range charts, mixed charts, Y axes |
| [Styling](./styling) | Colours, lines, legend, axes, reference lines, formatters, animation |
| [Playground](./playground) | Edit YAML and see the chart live |
| [Upgrading](./upgrading) | Older chart configs, and coming from apexcharts-card |

---

## Quick start

One sensor, last 24 hours:

```yaml live
type: custom:lcards-chart
sources:
  - entity: sensor.living_room_temperature
```

Two sensors as filled areas, with names in the legend:

```yaml live
type: custom:lcards-chart
chart_type: area
sources:
  - entity: sensor.living_room_temperature
    name: Living room
  - entity: sensor.outdoor_temperature
    name: Outside
style:
  legend:
    show: true
```

A week of daily energy use, from Home Assistant's long-term statistics:

```yaml live
type: custom:lcards-chart
chart_type: column
graph_span: 7d
sources:
  - entity: sensor.energy_consumption
    name: Energy per day
    statistics:
      type: change
      period: day
```

---

## Where the data comes from

Each entry under `sources` is one **series** (one line, area or set of columns). A series gets its data from one of three places:

| | Entity history | Long-term statistics | LCARdS data source |
|---|---|---|---|
| **Write it as** | `entity: sensor.x` | `entity: sensor.x` plus `statistics:` | `datasource: name` |
| **What it is** | Every state change Home Assistant recorded | Home Assistant's own 5-minute and hourly summaries (mean, min, max, sum) | A live buffer LCARdS keeps in your browser, with optional processing |
| **Stored by** | Home Assistant's recorder database | Home Assistant's recorder database | Your browser, while the dashboard is open |
| **How far back** | As long as the recorder keeps history (10 days by default) | Hourly summaries are kept indefinitely | What was preloaded (6 hours by default, up to 7 days) plus what arrived since the page loaded |
| **Live updates** | Yes | Refreshed every 5 minutes (hourly for daily and longer periods) | Yes |
| **Works for** | Any entity with numeric (or on/off) values | Sensors with a `state_class` (most energy, power and climate sensors) | Any entity |
| **Best for** | Hours to days of detail | Weeks, months, years | Processed values: smoothing, rates, unit conversion, statistics |

**Which should I use?**

- Start with **entity history**. It is the simplest and shows exactly what Home Assistant recorded.
- Switch to **long-term statistics** when the chart spans more than a few days, or the sensor changes so often that history gets slow. Statistics also last beyond the recorder's history limit.
- Use an **LCARdS data source** when you want to plot a *processed* value (a smoothed line, a rate of change, a converted unit), or share one live value between several cards. Data sources are created when the dashboard loads and keep a limited number of recent points (up to 1,000), so they suit short windows. See [Data Sources](../../core/datasources/).

```yaml
type: custom:lcards-chart
sources:
  # Entity history
  - entity: sensor.living_room_temperature

  # An attribute instead of the state
  - entity: climate.living_room
    attribute: current_temperature

  # Long-term statistics
  - entity: sensor.energy_consumption
    statistics:
      type: sum        # mean | min | max | sum | state | change
      period: day      # 5minute | hour | day | week | month

  # An LCARdS data source, plotting its smoothed values
  - datasource: living_room
    buffer: smoothed
data_sources:
  living_room:
    entity: sensor.living_room_temperature
    processing:
      smoothed:
        type: smooth
        method: exponential
        alpha: 0.3
```

::: tip Non-numeric entities
Charts plot numbers. States like `on`/`off`, `open`/`closed` and `true`/`false` are plotted as 1 and 0 automatically; use `curve: stepline` to draw them as steps. Other states (`heat`, `home`, `docked`, ...) don't plot on their own: pick a numeric attribute instead, or use a data source with `enum_mapping` to turn each state into a number. Chart Studio warns you when a series won't plot.
:::

```yaml live
type: custom:lcards-chart
sources:
  - entity: light.living_room
    name: Living room light
    curve: stepline
    type: area
    opacity: 0.4
```

---

## Chart types

Set the chart type with `chart_type` (default `line`).

| Type | Shows | Data |
|------|-------|------|
| `line` | Values over time as lines | Any series |
| `area` | Lines with the area below filled | Any series |
| `column` | Vertical bars | Any series; works well with [grouping](./series#grouping) |
| `bar` | Horizontal bars | Any series |
| `scatter` | Individual points | Any series |
| `heatmap` | One row per series, colour by value | Any series; works well with grouping |
| `radialBar` | Circular gauges, one per series | The latest value of each series (0 to 100 works best) |
| `pie`, `donut` | Slices of a whole | The latest value of each series (use two or more) |
| `polarArea` | Slices sized by value | The latest value of each series |
| `radar` | Values around a polygon | The latest value of each series |
| `treemap` | Rectangles sized by value | The latest value of each series |
| `rangeArea` | A shaded band from low to high | See [Range charts](./series#range-charts) |
| `boxPlot` | Spread of values per time bucket | See [Range charts](./series#range-charts) |
| `candlestick` | Open, high, low and close per time bucket | See [Range charts](./series#range-charts) |
| `rangeBar` | Timeline bars from a start to an end time | Not built from entities yet; supply data through [raw options](./styling#raw-apexcharts-options) |

### Gallery

Columns of hourly averages:

```yaml live
type: custom:lcards-chart
chart_type: column
sources:
  - entity: sensor.house_power
    name: Power
    group_by:
      func: avg
      duration: 1h
```

A heatmap of several sensors, one row each:

```yaml live
type: custom:lcards-chart
chart_type: heatmap
sources:
  - entity: sensor.kitchen_temperature
    name: Kitchen
    group_by: { func: avg, duration: 2h }
  - entity: sensor.bedroom_temperature
    name: Bedroom
    group_by: { func: avg, duration: 2h }
  - entity: sensor.outdoor_temperature
    name: Outside
    group_by: { func: avg, duration: 2h }
```

Gauges showing each sensor's current value:

```yaml live
type: custom:lcards-chart
chart_type: radialBar
sources:
  - entity: sensor.phone_battery
    name: Phone
  - entity: sensor.living_room_humidity
    name: Humidity
```

A donut of current values:

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
style:
  legend:
    show: true
```

Individual readings as points:

```yaml live
type: custom:lcards-chart
chart_type: scatter
graph_span: 6h
sources:
  - entity: sensor.house_power
    name: Power readings
```

Room temperatures compared on a radar:

```yaml live
type: custom:lcards-chart
chart_type: radar
sources:
  - entity: sensor.kitchen_temperature
    name: Kitchen
  - entity: sensor.bedroom_temperature
    name: Bedroom
  - entity: sensor.office_temperature
    name: Office
  - entity: sensor.outdoor_temperature
    name: Outside
  - entity: sensor.garage_temperature
    name: Garage
```

Where the power is going right now, as a treemap and as polar areas:

```yaml live
type: custom:lcards-chart
chart_type: treemap
sources:
  - entity: sensor.kitchen_power
    name: Kitchen
  - entity: sensor.office_power
    name: Office
  - entity: sensor.garage_power
    name: Garage
  - entity: sensor.laundry_power
    name: Laundry
```

```yaml live
type: custom:lcards-chart
chart_type: polarArea
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
  legend:
    show: true
```

A range band (the daily low to high):

```yaml live
type: custom:lcards-chart
chart_type: rangeArea
graph_span: 3d
sources:
  - entity: sensor.outdoor_temperature
    name: Outside
    group_by:
      func: minmax
      duration: 3h
```

---

## Full examples

### Weather panel

Outdoor temperature as a filled area with humidity on its own axis, frost and heat lines, and a tooltip that reads naturally:

```yaml live
type: custom:lcards-chart
chart_type: area
graph_span: 48h
yaxis:
  - id: temperature
  - id: humidity
    opposite: true
    min: 0
    max: 100
    decimals: 0
sources:
  - entity: sensor.outdoor_temperature
    name: Temperature
    unit: °C
    float_precision: 1
    group_by:
      func: avg
      duration: 30min
  - entity: sensor.outdoor_humidity
    name: Humidity
    type: line
    yaxis_id: humidity
    stroke_dash: 4
    group_by:
      func: avg
      duration: 30min
style:
  colors:
    series:
      - "var(--lcars-orange)"
      - "var(--lcars-blue)"
  fill:
    type: gradient
    gradient:
      opacityFrom: 0.6
      opacityTo: 0.05
  thresholds:
    - value: 0
      label: Frost
      color: var(--lcars-blue)
      dash: true
    - value: 20
      label: Warm
      color: var(--lcars-red)
  legend:
    show: true
    position: top
  formatters:
    xaxis_label: "ddd HH:mm"
    tooltip: "{seriesName}, {x|ddd [at] HH:mm}: {y}"
```

### Energy fortnight

Daily energy use from long-term statistics, with each bar labelled and a line for the daily target:

```yaml live
type: custom:lcards-chart
chart_type: column
graph_span: 14d
span:
  end: day
sources:
  - entity: sensor.energy_consumption
    name: Energy per day
    unit: kWh
    float_precision: 1
    statistics:
      type: change
      period: day
style:
  colors:
    series:
      - "var(--lcars-yellow)"
  data_labels:
    show: true
    font_size: 10
  yaxis:
    decimals: 0
  thresholds:
    - value: 5
      label: Target
      color: var(--lcars-green)
  chart_options:
    plotOptions:
      bar:
        borderRadius: 4
```

### Power monitor

The last six hours of a busy power sensor: the 10-minute average as an area, and the 10-minute peak as a thin line above it:

```yaml live
type: custom:lcards-chart
graph_span: 6h
sources:
  - entity: sensor.house_power
    name: Average
    type: area
    opacity: 0.35
    group_by:
      func: avg
      duration: 10min
  - entity: sensor.house_power
    name: Peak
    stroke_width: 1
    curve: stepline
    group_by:
      func: max
      duration: 10min
style:
  legend:
    show: true
  thresholds:
    - value: 2000
      label: High load
      color: var(--lcars-red)
      dash: true
  display:
    toolbar: true
```

A longer example with an LCARdS data source is at the end of [Styling](./styling#a-complete-example).

---

## Card options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | - | `custom:lcards-chart` (required) |
| `sources` | list | - | The series: see [Where the data comes from](#where-the-data-comes-from) and [Series options](./series#series-options) |
| `chart_type` | string | `line` | See [Chart types](#chart-types) |
| `graph_span` | string | `24h` | See [Time window](./series#time-window) |
| `span` | object | - | See [Time window](./series#time-window) |
| `yaxis` | list | - | See [Y axes](./series#y-axes) |
| `xaxis_type` | string | `datetime` | `datetime`, `category` or `numeric` |
| `data_sources` | object | - | LCARdS data sources: see [Data Sources](../../core/datasources/) |
| `style` | object | - | See [Styling](./styling) |

Older options (`source`, `series_names`, `history_hours`, ...) still work: see [Upgrading](./upgrading).

### Common properties

Shared by all LCARdS cards. See [Common Card Properties](../common.md) for details.

| Category | Config keys | Reference |
|----------|-------------|-----------|
| Sizing | `height`, `width`, `min_height`, `min_width`, `max_height`, `max_width` | [Sizing](../common.md#sizing-height-width-min-height-min-width-max-height-max-width) |
| Overflow | `overflow`, `overflow_x`, `overflow_y` | [Overflow](../common.md#overflow-overflow-overflow-x-overflow-y) |
| Stacking | `z_index` | [Stacking](../common.md#stacking-z-index) |
| Identity | `id`, `tags` | [ID & Tags](../common.md#card-identification-id-and-tags) |
| HA Grid | `grid_options` | [HA Grid Sizing](../common.md#ha-grid-sizing-grid-options) |
| Data | `data_sources`, `triggers_update` | [Data Sources](../../core/datasources/) |
| Rules | via `id` / `tags` | [Rules Engine](../../core/rules/) |
