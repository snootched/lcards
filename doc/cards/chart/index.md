---
description: "Chart card: plot Home Assistant sensors over time as lines, areas, columns, gauges, range bands and more, from entity history, long-term statistics or LCARdS data sources."
moved_anchors:
  where-the-data-comes-from: /cards/chart/series#where-the-data-comes-from
  gallery: /cards/chart/types
  full-examples: /cards/chart/examples
  weather-panel: /cards/chart/examples#weather-panel
  energy-fortnight: /cards/chart/examples#energy-fortnight
  power-monitor: /cards/chart/examples#power-monitor
  common-properties: /cards/common
---

# Chart Card

`custom:lcards-chart`

![Chart card: a 24-hour temperature history as an orange area with a gradient fill, a blue smoothed line from a data source, and a dashed comfort threshold](/img/cards/chart.webp)

**A chart of your Home Assistant sensors over time: lines, areas, columns, gauges, range bands, candlesticks and more.** It picks up your LCARS theme's colours and fonts, so most charts need nothing more than a list of entities.

- Each entry under `sources` is one series: an entity's history, Home Assistant's long-term statistics, or an LCARdS data source.
- The card is built on [ApexCharts](https://apexcharts.com/). You don't need to know ApexCharts to use it: these pages cover everything LCARdS sets up for you.

::: tip Try it
- In the card editor, **Open Configuration Studio** gives you a live preview while you add series, pick a chart type and adjust colours.
- The [Playground](./playground) lets you edit chart YAML here in the docs and see the result.
:::

The charts on these pages are drawn by the card's own code from generated sample data.

| Page | Covers |
|------|--------|
| [Series and Time](./series) | Where the data comes from, series options, the time window, grouping, Y axes |
| [Chart Types](./types) | Every chart type with an example, gauges, range charts, mixing types in one chart |
| [Styling](./styling) | Colours, lines, fills, markers, grid, fonts, theme, animation, raw ApexCharts options |
| [Axes and Labels](./labels) | Reference lines, legend, value labels, axes, formatters, tooltip and toolbar |
| [Examples](./examples) | Complete charts to copy |
| [Playground](./playground) | Edit YAML and see the chart live |
| [Upgrading](./upgrading) | Older chart configs, and coming from apexcharts-card |

---

## Quick start

**Three charts to start from: one sensor, two sensors as areas, and a week of daily energy from long-term statistics.**

- Without `graph_span` a chart shows the last 24 hours, and it moves along as time passes.
- Statistics suit long spans: see [Long-term statistics](./series#long-term-statistics).

```yaml live
type: custom:lcards-chart
sources:
  - entity: sensor.living_room_temperature
```

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

## Chart types

**`chart_type` picks how the series are drawn.** Time charts plot each series over the time window; the round charts, the radar and the treemap show each series' latest value.

- A series can override the chart type with its own `type`, so one chart can show columns and a line together: see [Mixing chart types](./types#mixing-chart-types).
- Every type is shown with an example on [Chart Types](./types).

```yaml live
type: custom:lcards-chart
chart_type: radialBar
sources:
  - entity: sensor.phone_battery
    name: Phone
  - entity: sensor.living_room_humidity
    name: Humidity
```

| Type | Shows | Data |
|------|-------|------|
| `line` | Values over time as lines | Any series |
| `area` | Lines with the area below filled | Any series |
| `column` | Vertical bars | Any series; works well with [grouping](./series#grouping) |
| `bar` | Horizontal bars, one per point, labelled with its time | Any series; group it so there are only a few bars |
| `scatter` | Individual points | Any series |
| `heatmap` | One row per series, colour by value | Any series; works well with grouping |
| `radialBar` | Circular gauges, one per series | The latest value of each series (0 to 100 works best) |
| `pie`, `donut` | Slices of a whole | The latest value of each series (use two or more) |
| `polarArea` | Slices sized by value | The latest value of each series |
| `radar` | Values around a polygon | The latest value of each series |
| `treemap` | Rectangles sized by value | The latest value of each series |
| `rangeArea` | A shaded band from low to high | See [Range charts](./types#range-charts) |
| `boxPlot` | Spread of values per time bucket | See [Range charts](./types#range-charts) |
| `candlestick` | Open, high, low and close per time bucket | See [Range charts](./types#range-charts) |
| `rangeBar` | Timeline bars from a start to an end time | Not offered in the Chart Studio: the card can't build its data yet; see [Range charts](./types#range-charts) |

## Card options

**The chart's own top-level keys.** Each block has its own page; this table links to it.

- The chart also takes the keys every LCARdS card takes (`height`, `width`, `id`, `tags`, `grid_options`, `data_sources` ...): see [Common card properties](../common). Rules can restyle a chart through its `id` and `tags`: see the [Rules Engine](../../core/rules/).
- In a sections view the chart takes 6 columns and 4 rows unless `grid_options` says otherwise, and can't be made smaller than 4 by 2.

```yaml live
type: custom:lcards-chart
chart_type: area
graph_span: 12h
yaxis:
  - id: temperature
    min: -10
    max: 30
sources:
  - entity: sensor.outdoor_temperature
    name: Outside
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | string | required | `custom:lcards-chart` |
| `sources` | list | - | The series: see [Series and Time](./series#where-the-data-comes-from) and [Series options](./series#series-options) |
| `chart_type` | string | `line` | How the series are drawn: see [Chart types](#chart-types) |
| `graph_span` | string | `24h` | How much time the chart shows: see [Time window](./series#time-window) |
| `span` | object | - | Line the window up with the calendar, or move it back: see [Time window](./series#time-window) |
| `yaxis` | list | one shared axis | Several Y axes: see [Y axes](./series#y-axes) |
| `xaxis_type` | string | `category` for `bar`, else `datetime` | `datetime`, `category` or `numeric` |
| `data_sources` | object | - | LCARdS data sources the series can plot: see [Data Sources](../../core/datasources/) |
| `style` | object | your theme's chart style | Colours, lines, labels and more: see [Styling](./styling) and [Axes and Labels](./labels) |

Older options (`source`, `series_names`, `history_hours`, ...) still work: see [Upgrading](./upgrading).
