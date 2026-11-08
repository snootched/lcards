---
description: "Chart card types with examples: time charts (line, area, column, bar, scatter, heatmap), current-value charts (gauges, pie, donut, polar area, radar, treemap), range charts (range area, box plot, candlestick) and mixed charts."
---

# Chart Types

Every chart type with an example, the options some of them have, and how to mix types in one chart. `chart_type` sets the type for the whole chart; the full list is on the [Overview](./#chart-types).

## Time charts

**Line, area, column, bar, scatter and heatmap charts plot each series over the time window.** Use them for history: how a value moved over hours, days or weeks.

- Columns and heatmaps read best with [grouping](./series#grouping), one column or cell per bucket.
- A horizontal `bar` chart draws one bar per point, labelled with its time on the vertical axis, and puts the values along the bottom; group it so there are only a few bars.

```yaml live
# columns of hourly averages
type: custom:lcards-chart
chart_type: column
sources:
  - entity: sensor.house_power
    name: Power
    group_by:
      func: avg
      duration: 1h
```

```yaml live
# a heatmap of several sensors, one row each
type: custom:lcards-chart
chart_type: heatmap
sources:
  - entity: sensor.kitchen_temperature
    name: Kitchen
    group_by:
      func: avg
      duration: 2h
  - entity: sensor.bedroom_temperature
    name: Bedroom
    group_by:
      func: avg
      duration: 2h
  - entity: sensor.outdoor_temperature
    name: Outside
    group_by:
      func: avg
      duration: 2h
```

```yaml live
# individual readings as points
type: custom:lcards-chart
chart_type: scatter
graph_span: 6h
sources:
  - entity: sensor.house_power
    name: Power readings
```

::: details More about time charts
- **Scatter points** are 6 px unless `style.markers.size` says otherwise, and the legend sits at the top unless `style.legend.position` says otherwise.
- **The X axis** shows time. For other kinds of X values set `xaxis_type: category` or `numeric`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `chart_type` | string | `line` | `line`, `area`, `column`, `bar`, `scatter` or `heatmap` for a time chart |
| `xaxis_type` | string | `category` for `bar`, else `datetime` | `datetime`, `category` or `numeric` |

## Current-value charts

**Gauges (`radialBar`), `pie`, `donut`, `polarArea`, `radar` and `treemap` show the latest value of each series, not its history.** Use them for "right now": battery levels, where the power is going, rooms compared.

- Each series becomes one gauge, slice, spoke or rectangle, named after the series. Pie, donut, polar area and gauge charts show their legend unless `style.legend.show` is `false`, because it names the slices.
- Several series read better than one: a pie of one value is a full circle.

```yaml live
# a donut of current values
type: custom:lcards-chart
chart_type: donut
sources:
  - entity: sensor.kitchen_power
    name: Kitchen
  - entity: sensor.office_power
    name: Office
  - entity: sensor.garage_power
    name: Garage
```

```yaml live
# room temperatures compared on a radar
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

```yaml live
# where the power is going right now, as a treemap
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
# the same four values as polar areas
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
```

::: details More about current-value charts
- **Radar:** the web is sized to fill the card (with room for the axis names) and centred, so a three-axis triangle doesn't leave the bottom empty. There is no line-chart grid behind it. To place it yourself, set `plotOptions.radar.size` (radius in px) and `offsetY` in [`style.chart_options`](./styling#raw-apexcharts-options).
- **Polar area:** the ring values are hidden, because they sit on the vertical spoke. `style.yaxis.labels.show: true` brings them back.
- **Treemap:** each rectangle carries its series name.
- **Resizing:** these layouts follow the card when it changes size; raw options still override them.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `chart_type` | string | `line` | `radialBar`, `pie`, `donut`, `polarArea`, `radar` or `treemap` for a current-value chart |
| `style.legend.show` | boolean | on for `pie`, `donut`, `polarArea` and `radialBar` | Show the legend: see [style.legend](./labels#style-legend) |

## Gauges

**A `radialBar` chart draws one gauge per series, and a few `style` keys shape the arc and the numbers.** Values from 0 to 100 fill the arc, so it suits percentages such as batteries and humidity.

- The legend shows each gauge's value, because several gauges only show their values on hover.
- A half-circle gauge (start and end angles within -90 to 90, the default) fills the card's height instead of reserving room for the missing lower half.

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
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.gauge_start_angle` | number | `-90` | Where the arc starts, degrees (-360 to 360; `0` is the top) |
| `style.gauge_end_angle` | number | `90` | Where the arc ends, degrees |
| `style.gauge_total` | boolean | `false` | Show the sum of all gauges in the centre |
| `style.value_format` | string | - | `percent` adds a % sign to the values and rounds them |

## Range charts

**`rangeArea`, `boxPlot` and `candlestick` charts draw several values per point: a low and a high, the spread, or open, high, low and close.** `group_by` builds them from any series, one per time bucket.

- Set the series' `group_by.func` to what the chart needs (table below). Without it, the card shows a message saying which `func` to use.
- A `rangeArea` can also come straight from [long-term statistics](./series#long-term-statistics), with no grouping: the band runs from each period's minimum to maximum.

```yaml live
# open, high, low and close every 3 hours
type: custom:lcards-chart
chart_type: candlestick
graph_span: 2d
sources:
  - entity: sensor.outdoor_temperature
    name: Outside
    group_by:
      func: ohlc
      duration: 3h
```

```yaml live
# the spread of a busy sensor each day
type: custom:lcards-chart
chart_type: boxPlot
graph_span: 7d
sources:
  - entity: sensor.house_power
    name: Power spread per day
    group_by:
      func: box
      duration: 1d
```

```yaml live
# a daily low-to-high band from statistics
type: custom:lcards-chart
chart_type: rangeArea
graph_span: 14d
sources:
  - entity: sensor.outdoor_temperature
    name: Daily range
    statistics:
      type: mean
      period: day
```

| Chart type | Set the series' `group_by.func` to |
|------------|-----------------------------------|
| `rangeArea` | `minmax`. Or use long-term statistics without `group_by` |
| `boxPlot` | `box` |
| `candlestick` | `ohlc` |
| `rangeBar` | Nothing yet: the card can't build timeline data, and shows a message instead |

::: details More about range charts
- **Candlestick colours:** one series draws green candles for up and red for down. Two or more series draw each series' candles in its own colour (full for up, darker for down), so they match the legend and stay apart. Set `plotOptions.candlestick.colors.upward` and `downward` in [`style.chart_options`](./styling#raw-apexcharts-options) to choose.
- **Range areas** draw straight edges and a light fill (opacity `0.35`) unless `style.stroke.curve` or `style.fill.opacity` say otherwise.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `group_by.func` | string | `avg` | On each series: `minmax`, `box` or `ohlc` for these charts. See [Grouping](./series#grouping) |
| `style.group_rows` | boolean | `true` | `rangeBar`: put bars with the same label on one row |
| `style.show_labels` | boolean | `true` | `rangeBar`: show labels on the bars |
| `style.color` | colour | the theme's accent colour | `boxPlot`: colour of the boxes |

## Mixing chart types

**A series' `type` overrides the chart type, so one chart can show columns and lines together.** Give the line its own [Y axis](./series#y-axes) when the two have different units.

- In a mixed chart, columns are sized by the closest pair of points in any series. If the line has a reading every few minutes, the columns become thin lines: group the line to the same bucket length as the columns (here `1h`).

```yaml live
type: custom:lcards-chart
chart_type: line
sources:
  - entity: sensor.energy_consumption
    name: Energy per hour
    type: column
    unit: kWh
    group_by:
      func: delta
      duration: 1h
  - entity: sensor.outdoor_temperature
    name: Outside
    yaxis_id: temperature
    group_by:
      func: avg
      duration: 1h
yaxis:
  - id: energy
  - id: temperature
    opposite: true
```

::: details More about mixed charts
- **Scatter series** in a mixed chart get 6 px points unless `style.markers.size` is set.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | string | `chart_type` | On a series: `line`, `area`, `column` or `scatter` |
