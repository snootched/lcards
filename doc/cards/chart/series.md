# Series & Time

What each series plots, how much time the chart shows, and how to combine points, mix chart types and add Y axes. For where series data comes from (entity history, long-term statistics or an LCARdS data source), see the [Overview](./#where-the-data-comes-from).

---

## Series options

These work on every kind of series.

| Option | What it does |
|--------|--------------|
| `name` | Name in the legend and tooltip (default: the entity's friendly name) |
| `unit` | Unit in tooltips and axis labels (default: the entity's unit) |
| `float_precision` | Decimal places in tooltips |
| `color` | Series colour: any colour, `var(--lcars-...)` or theme token |
| `type` | Draw this series differently from the chart: `line`, `area`, `column` or `scatter` |
| `curve` | `smooth` (default), `straight`, `stepline` or `monotoneCubic` |
| `stroke_width` | Line width |
| `stroke_dash` | Dash length; `0` is a solid line |
| `opacity` | Fill opacity for areas and columns (0 to 1) |
| `yaxis_id` | Put the series on another Y axis: see [Y axes](#y-axes) |
| `group_by` | Combine points into time buckets: see [Grouping](#grouping) |

```yaml live
type: custom:lcards-chart
sources:
  - entity: sensor.house_power
    name: Power
    color: var(--lcars-orange)
    stroke_width: 3
  - entity: sensor.solar_power
    name: Solar
    type: area
    opacity: 0.3
    curve: straight
```

### Line styles

`curve`, `stroke_width` and `stroke_dash` per series:

```yaml live
type: custom:lcards-chart
graph_span: 12h
sources:
  - entity: sensor.kitchen_temperature
    name: smooth
    curve: smooth
  - entity: sensor.bedroom_temperature
    name: straight, dashed
    curve: straight
    stroke_dash: 6
  - entity: sensor.office_temperature
    name: stepline, thick
    curve: stepline
    stroke_width: 4
style:
  legend:
    show: true
```

### Units and decimals

`unit` and `float_precision` set what the tooltip shows (hover the chart). Without them, the entity's own unit is used:

```yaml live
type: custom:lcards-chart
sources:
  - entity: sensor.house_power
    name: Power
    unit: watts
    float_precision: 0
  - entity: sensor.outdoor_temperature
    name: Outside
    float_precision: 2
    yaxis_id: temperature
yaxis:
  - id: power
  - id: temperature
    opposite: true
```

---

## Time window

`graph_span` sets how much time the chart shows. It defaults to `24h`, and the window always ends now, moving along as time passes.

```yaml
graph_span: 6h     # also: 30min, 2d, 1w, 1mo, 1y
```

Use `span` to line the window up with the calendar, or to look back in time. This chart shows all of yesterday:

```yaml live
type: custom:lcards-chart
graph_span: 24h
span:
  start: day        # start at midnight today
  offset: -1d       # then move the window back one day
sources:
  - entity: sensor.outdoor_temperature
```

Today so far (the window runs to midnight, so the line stops at "now"):

```yaml live
type: custom:lcards-chart
graph_span: 24h
span:
  start: day
sources:
  - entity: sensor.outdoor_temperature
    name: Today
```

The last hour, in detail:

```yaml live
type: custom:lcards-chart
graph_span: 1h
sources:
  - entity: sensor.house_power
    name: Power
    curve: straight
```

This week so far, Monday to Sunday, from daily statistics:

```yaml live
type: custom:lcards-chart
chart_type: column
graph_span: 7d
span:
  start: week
sources:
  - entity: sensor.outdoor_temperature
    name: Daily high
    statistics:
      type: max
      period: day
```

| `span` option | What it does |
|---------------|--------------|
| `start` | The window starts at the beginning of the current `minute`, `hour`, `day`, `week`, `month` or `year` and lasts `graph_span` |
| `end` | The window ends at the end of the current unit (and starts `graph_span` earlier) |
| `offset` | Moves the window, e.g. `-1d` (a day earlier) or `+2h` |

---

## Grouping

`group_by` combines the points in each time bucket into one value. Use it to smooth out busy sensors, to show hourly averages over a week, or to turn readings into daily totals.

```yaml live
type: custom:lcards-chart
chart_type: column
graph_span: 24h
sources:
  - entity: sensor.house_power
    name: Peak power per hour
    group_by:
      func: max        # how each bucket is combined
      duration: 1h     # bucket length
      fill: last       # buckets with no readings: last | null (leave a gap) | zero
```

| `func` | Each bucket shows |
|--------|-------------------|
| `avg` | The average |
| `min`, `max`, `median` | The lowest, highest or middle value |
| `sum` | The total |
| `first`, `last` | The first or last reading |
| `delta` | How much the value changed within the bucket |
| `diff` | How much the value changed since the previous bucket (useful for meters) |
| `minmax` | The low and high value, for [range areas](#range-charts) |
| `box` | Min, quartiles, median and max, for [box plots](#range-charts) |
| `ohlc` | Open, high, low and close, for [candlesticks](#range-charts) |

Smoothing a noisy sensor: the raw readings, and the same sensor averaged over 30 minutes:

```yaml live
type: custom:lcards-chart
graph_span: 12h
sources:
  - entity: sensor.house_power
    name: Raw
    stroke_width: 1
    color: var(--lcars-gray)
  - entity: sensor.house_power
    name: 30 min average
    stroke_width: 3
    group_by:
      func: avg
      duration: 30min
style:
  legend:
    show: true
```

Energy per hour from a meter that only counts up, using `delta`:

```yaml live
type: custom:lcards-chart
chart_type: column
graph_span: 24h
sources:
  - entity: sensor.energy_consumption
    name: kWh per hour
    group_by:
      func: delta
      duration: 1h
```

::: tip Grouping or statistics?
For long spans of a sensor with a `state_class`, [long-term statistics](./#where-the-data-comes-from) are usually better: Home Assistant has already done the summarising. Grouping works on any series, including entity history and data sources.
:::

---

## Long-term statistics

The `type` picks which of Home Assistant's summaries to plot. Three series of the same sensor show each day's low, average and high over two weeks:

```yaml live
type: custom:lcards-chart
graph_span: 14d
sources:
  - entity: sensor.outdoor_temperature
    name: Low
    color: var(--lcars-blue)
    statistics: { type: min, period: day }
    stroke_dash: 4
  - entity: sensor.outdoor_temperature
    name: Average
    color: var(--lcars-orange)
    statistics: { type: mean, period: day }
    stroke_width: 3
  - entity: sensor.outdoor_temperature
    name: High
    color: var(--lcars-red)
    statistics: { type: max, period: day }
    stroke_dash: 4
style:
  legend:
    show: true
```

| `type` | Each period shows | Typical sensors |
|--------|-------------------|-----------------|
| `mean`, `min`, `max` | The average, lowest or highest value | Temperature, humidity, power (`state_class: measurement`) |
| `change` | How much a meter increased | Energy, water, gas (`total` / `total_increasing`) |
| `sum`, `state` | The meter's running total, or its reading at the end of the period | Same |

---

## Range charts

Range charts need several values per point: a low and a high, or open/high/low/close. `group_by` builds them from any series.

```yaml live
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

A range band straight from statistics, no grouping needed:

```yaml live
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
| `rangeArea` | `minmax`. Or use long-term statistics: the band runs from each period's minimum to maximum |
| `boxPlot` | `box` |
| `candlestick` | `ohlc` |

---

## Mixing chart types

A series' `type` overrides the chart type, so one chart can show columns and lines together:

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

::: tip Columns next to lines
In a mixed chart, columns are sized by the closest pair of points in *any* series. If the line has a reading every few minutes, the columns become thin lines. Group the line to the same bucket length as the columns (here `1h`), as above.
:::

---

## Y axes

All series share one Y axis that scales automatically. When series have very different ranges (temperature and humidity, say), give them their own axes:

```yaml live
type: custom:lcards-chart
yaxis:
  - id: temperature
  - id: humidity
    opposite: true      # draw it on the right
    min: 0
    max: 100
    decimals: 0
sources:
  - entity: sensor.living_room_temperature
    name: Temperature
  - entity: sensor.living_room_humidity
    name: Humidity
    yaxis_id: humidity
```

Series without a `yaxis_id` use the first axis. Axis labels show the series' unit.

A fixed range keeps the scale steady as values change, here a humidity axis pinned to 0 to 100:

```yaml live
type: custom:lcards-chart
chart_type: area
yaxis:
  - id: humidity
    min: 0
    max: 100
    decimals: 0
sources:
  - entity: sensor.living_room_humidity
    name: Humidity
    opacity: 0.3
```

| Axis option | What it does |
|-------------|--------------|
| `id` | Name the series refer to with `yaxis_id` (required) |
| `show` | Show the axis (default `true`) |
| `opposite` | Draw it on the right |
| `min`, `max` | Fixed range; leave them out to scale automatically |
| `decimals` | Decimal places in the labels |
