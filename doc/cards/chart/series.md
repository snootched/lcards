---
description: "Chart card series: where the data comes from (entity history, long-term statistics, LCARdS data sources), series options, the time window, grouping into time buckets, state bands behind the series, linked charts, and several Y axes."
moved_anchors:
  range-charts: /cards/chart/types#range-charts
  mixing-chart-types: /cards/chart/types#mixing-chart-types
---

# Series and Time

What each series plots and where its data comes from, how much time the chart shows, how to combine points into time buckets, and how to give series their own Y axes. Chart types and mixing them are on [Chart Types](./types).

## Where the data comes from

**Each entry under `sources` is one series (one line, area or set of columns), and it gets its data from one of three places.** Start with entity history; the table below helps you pick.

- **Entity history** is the simplest and shows exactly what Home Assistant recorded.
- **Long-term statistics** suit charts that span more than a few days, or sensors that change so often that history gets slow. They also last beyond the recorder's history limit.
- **Every entity of a label, area or device** is one source written once with a Home Assistant `target`: it becomes a series per entity, as [Entities from Home Assistant](#entities-from-home-assistant) shows. It works with entity history and long-term statistics.
- **An LCARdS data source** plots a processed value (a smoothed line, a rate of change, a converted unit), or shares one live value between several cards. Data sources keep a limited number of recent points (up to 1,000), so they suit short windows.

| | Entity history | Long-term statistics | LCARdS data source |
|---|---|---|---|
| **Write it as** | `entity: sensor.x` | `entity: sensor.x` plus `statistics:` | `datasource: name` |
| **What it is** | Every state change Home Assistant recorded | Home Assistant's own 5-minute and hourly summaries (mean, min, max, sum) | A live buffer LCARdS keeps in your browser, with optional processing |
| **Stored by** | Home Assistant's recorder database | Home Assistant's recorder database | Your browser, while the dashboard is open |
| **How far back** | As long as the recorder keeps history (10 days by default) | Hourly summaries are kept indefinitely | What was preloaded (6 hours by default, up to 7 days) plus what arrived since the page loaded |
| **Live updates** | Yes | Refreshed every 5 minutes (hourly for daily and longer periods) | Yes |
| **Works for** | Any entity with numeric (or on/off) values | Sensors with a `state_class` (most energy, power and climate sensors) | Any entity |
| **Best for** | Hours to days of detail | Weeks, months, years | Processed values: smoothing, rates, unit conversion, statistics |

## Entity history

**`entity` plots what Home Assistant recorded for that entity over the time window, and keeps the line live as new states arrive.** Add `attribute` to plot one of its attributes instead of its state.

- Charts plot numbers. The states `on`/`off`, `open`/`closed`, `true`/`false` and `active`/`inactive` plot as 1 and 0; `curve: stepline` draws them as steps.
- Other text states (`heat`, `home`, `docked` ...) don't plot. Pick a numeric attribute instead, or use a [data source](#data-sources) with `enum_mapping` to turn each state into a number. Chart Studio warns you when a series won't plot.

```yaml live
# an attribute instead of the state
type: custom:lcards-chart
sources:
  - entity: climate.living_room
    attribute: current_temperature
    name: Thermostat reading
```

```yaml live
# an on/off entity drawn as steps
type: custom:lcards-chart
sources:
  - entity: light.living_room
    name: Living room light
    curve: stepline
    type: area
    opacity: 0.4
```

::: details More about entity history
- **Edges of the window:** the last value before the window is drawn from its left edge, and the latest value is carried on to now, so a value that hasn't changed in the window still draws a line (as Home Assistant's history graph does).
- **Units:** the series takes the entity's `unit_of_measurement`, except when it plots an attribute; set `unit` on the series then.
- **Reconnects:** when the connection to Home Assistant drops and comes back, the chart loads the window again.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `entity` | string | required | The entity to plot |
| `attribute` | string | the state | Plot this attribute instead of the state |

## Long-term statistics

**`statistics` plots Home Assistant's own summaries of a sensor instead of every state change: the average, low or high of each period, or how much a meter went up.** It works for sensors with a `state_class`, and suits charts of weeks, months or years.

- `type` picks which summary to plot. Three series of the same sensor can show each day's low, average and high.
- The chart fetches the statistics again every 5 minutes for `5minute` and `hour` periods, and every hour for `day`, `week` and `month`.

```yaml live
type: custom:lcards-chart
graph_span: 14d
sources:
  - entity: sensor.outdoor_temperature
    name: Low
    color: var(--lcars-blue)
    stroke_dash: 4
    statistics:
      type: min
      period: day
  - entity: sensor.outdoor_temperature
    name: Average
    color: var(--lcars-orange)
    stroke_width: 3
    statistics:
      type: mean
      period: day
  - entity: sensor.outdoor_temperature
    name: High
    color: var(--lcars-red)
    stroke_dash: 4
    statistics:
      type: max
      period: day
style:
  legend:
    show: true
```

| `type` | Each period shows | Typical sensors |
|--------|-------------------|-----------------|
| `mean`, `min`, `max` | The average, lowest or highest value | Temperature, humidity, power (`state_class: measurement`) |
| `change` | How much a meter increased | Energy, water, gas (`total` / `total_increasing`) |
| `sum`, `state` | The meter's running total, or its reading at the end of the period | Same |

::: details More about statistics
- **Grouping or statistics:** for long spans of a sensor with a `state_class`, statistics are usually better: Home Assistant has already done the summarising. [Grouping](#grouping) works on any series, including entity history and data sources.
- **Range areas:** on a `rangeArea` chart, a statistics series without `group_by` plots each period's minimum to maximum as a band, whatever its `type`: see [Range charts](./types#range-charts).
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `statistics.type` | string | `mean` | `mean`, `min`, `max`, `sum`, `state` or `change` |
| `statistics.period` | string | `hour` | `5minute`, `hour`, `day`, `week` or `month` |

## Data sources

**`datasource` plots an LCARdS data source: a live buffer in your browser that can smooth, convert or otherwise process an entity's values.** Use it to plot a processed value, or to share one value between several cards.

- `buffer` picks one of the data source's processors to plot instead of its raw values.
- Data sources are created when the dashboard loads, preload some history, then follow live changes. See [Data Sources](../../core/datasources/) for the keys and processors.

```yaml live
type: custom:lcards-chart
sources:
  - datasource: living_room
    buffer: smoothed
    name: Smoothed
data_sources:
  living_room:
    entity: sensor.living_room_temperature
    processing:
      smoothed:
        type: smooth
        method: exponential
        alpha: 0.3
```

::: details More about data source series
- **In these docs:** the previews plot the data source's entity; processors only run on a real dashboard.
- **Sources from other cards:** a series can name a data source another card defines. If it doesn't exist yet, the chart tries again after 2 seconds.
- **A missing buffer:** when the data source has no processor called `buffer`, the series plots the raw values and logs a warning.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `datasource` | string | required | The name of a data source, in this card's `data_sources` or defined by another card |
| `buffer` | string | the raw values | The processor whose values to plot |

## Entities from Home Assistant

**A source with a `target` plots every entity of a Home Assistant label, area or device, one series each, so the chart follows what you label in Home Assistant.** Write the source once; each entity it includes becomes a series.

- `target` is Home Assistant's target object: `label_id`, `area_id`, `device_id`, `floor_id`, `entity_id`, each one id or a list. A label counts on the entity, its device or its area.
- Each series is named by its entity's name and takes the next colour of `style.colors.series`. The source's other keys (`statistics`, `attribute`, `type`, `curve`, `stroke_width`, `unit` ...) apply to every series; `name` is not used.
- `sort` orders the series (and so their colours and legend entries): `name` (default), `state` (current value, low to high) or `none`. `max_items` keeps the first ones.
- The chart loads again when a label, area or device change in Home Assistant adds or removes an entity, not on every state change.

```yaml live
type: custom:lcards-chart
sources:
  # one line for each entity with the label
  - target:
      label_id: lcards_test_engine
    stroke_width: 2
```

::: details More about entities from Home Assistant
- **Which entities:** hidden entities and configuration or diagnostic entities are left out unless named in `entity_id`, as in Home Assistant's own sections.
- **Timelines:** on a `rangeBar` timeline, a `color` map (a colour per state) applies to every series. A single `color` is not used.
- **Many entities:** every series is one more history fetch; use `max_items` on a label with many entities.
- **In Chart Studio:** a series' Entities choice switches between one entity and every entity of a label, area or device.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `sources[].target` | object | - | Home Assistant's target: `label_id`, `area_id`, `device_id`, `floor_id`, `entity_id` (each an id or a list). One series per entity |
| `sources[].sort` | string | `name` | `name`, `state` or `none` |
| `sources[].max_items` | number | - | At most this many series |

## Series options

**Every series, whatever its data, takes the same keys for its name, colour, line, units and axis.** Set them on the series when one series should look different; `style` sets them for the whole chart.

- `name` is shown in the legend and the tooltip. Without it the series takes the entity's friendly name.
- `type` draws this series as another chart type than the chart's, for a chart of columns and lines: see [Mixing chart types](./types#mixing-chart-types).

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
style:
  legend:
    show: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `name` | string | the entity's friendly name | Name in the legend and tooltip. A data source series is named after the data source (and its buffer) |
| `type` | string | `chart_type` | `line`, `area`, `column` or `scatter`: draw this series differently from the chart |
| `yaxis_id` | string | the first axis | The `id` of the [Y axis](#y-axes) this series uses |
| `group_by` | object | - | Combine points into time buckets: see [Grouping](#grouping) |
| [Line styles](#line-styles) | | | `color`, `curve`, `stroke_width`, `stroke_dash` and `opacity` |
| [Units and decimals](#units-and-decimals) | | | `unit` and `float_precision` |

### Line styles

**`curve`, `stroke_width`, `stroke_dash`, `color` and `opacity` style one series' line or fill.** They win over the chart-wide [`style.stroke`](./styling#style-stroke), [`style.fill`](./styling#style-fill) and [`style.colors.series`](./styling#colours) for that series.

```yaml live
# each series averaged over 30 minutes, so the lines are easy to tell apart
type: custom:lcards-chart
graph_span: 12h
sources:
  - entity: sensor.attic_temperature
    name: smooth
    curve: smooth
    group_by:
      duration: 30min
  - entity: sensor.kitchen_temperature
    name: straight, dashed
    curve: straight
    stroke_dash: 6
    group_by:
      duration: 30min
  - entity: sensor.office_temperature
    name: stepline, thick
    curve: stepline
    stroke_width: 4
    group_by:
      duration: 30min
style:
  legend:
    show: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `color` | colour | the next colour in `style.colors.series` | Series colour: any colour, `var(--lcars-...)` or `theme:` token |
| `curve` | string | `style.stroke.curve` | `smooth`, `straight`, `stepline` or `monotoneCubic` |
| `stroke_width` | number | `style.stroke.width` | Line width, px (0 to 20) |
| `stroke_dash` | number | `style.stroke.dash_array` | Dash length, px; `0` is a solid line (0 to 20) |
| `opacity` | number | `style.fill.opacity` | Fill opacity for areas and columns, 0 to 1 |

### Units and decimals

**`unit` and `float_precision` set how a series' values read in the tooltip (hover the chart).** Without them the entity's own unit is used, and values show up to two decimal places.

- An axis label shows the unit too, when every series on that axis has the same unit.

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

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `unit` | string | the entity's unit | Unit in tooltips and axis labels. Not taken from the entity when the series plots an attribute |
| `float_precision` | number | up to 2 places | Decimal places in the tooltip (0 to 6). Without it, `style.yaxis.decimals` applies when set |

## Time window

**`graph_span` sets how much time the chart shows, and `span` lines that window up with the calendar or moves it back in time.** Without `span` the window ends now and moves along as time passes.

- `span.start: day` starts the window at midnight today. With a `24h` span it shows today so far: the window runs to midnight, so the line stops at now.
- `span.offset` moves the window, so `start: day` with `offset: -1d` shows all of yesterday.
- The calendar follows your Home Assistant profile: days start at midnight in the time zone it uses (the server's or your device's), and weeks start on its first weekday.

```yaml live
# all of yesterday
type: custom:lcards-chart
graph_span: 24h
span:
  start: day
  offset: -1d
sources:
  - entity: sensor.outdoor_temperature
    name: Yesterday
```

```yaml live
# this week so far, from daily statistics
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

::: details More about the time window
- **Durations:** a number and a unit: `s`, `min` (or `m`), `h`, `d`, `w`, `mo` or `y`. Spelled out (`hour`, `day`, `week`, `month`, `year`) and plurals (`2days`) work too, and so do decimals (`1.5h`). A month is 30 days and a year 365 days.
- **Time zone:** days, weeks, months and years line up in the time zone set in your Home Assistant profile (Settings > Profile > Time zone): the server's zone (Settings > System > General) or your device's. A browser in another zone than Home Assistant still shows the same "today", and the axis labels and tooltip times use the same zone.
- **Weeks** start on the first weekday set in your profile: "Language" takes it from your language (Sunday for `en`, Monday for `de` or `en-GB`), or pick a day. Without a profile setting, weeks start on Monday.
- **Hours** line up with the hour in that zone too, so in a zone such as India's (UTC+5:30) `start: hour` begins at half past the UTC hour.
- **Rolling over:** an aligned window (`start` or `end`) is checked every minute; when it rolls over (at midnight for `day`), the chart loads the new window.
- **Both start and end:** when both are set, `start` is used.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `graph_span` | string | `24h` | How much time the chart shows, such as `30min`, `6h`, `2d`, `1w`, `1mo`, `1y` |
| `span.start` | string | - | Start the window at the beginning of the current `minute`, `hour`, `day`, `week`, `month` or `year`; it lasts `graph_span` |
| `span.end` | string | - | End the window at the end of the current unit (same units); it starts `graph_span` earlier |
| `span.offset` | string | - | Move the window, with a sign: `-1d` (a day earlier) or `+2h` |

## Grouping

**`group_by` combines the points in each time bucket into one value.** Use it to smooth out a busy sensor, to show hourly averages over a week, or to turn a meter's readings into totals per hour.

- `func` decides how each bucket is combined; the table below lists them. `minmax`, `box` and `ohlc` build the data the [range charts](./types#range-charts) need.
- `delta` is how much a meter went up within each bucket, so a meter that only counts up gives energy per hour.

```yaml live
type: custom:lcards-chart
graph_span: 12h
sources:
  # the raw readings
  - entity: sensor.house_power
    name: Raw
    stroke_width: 1
    color: var(--lcars-gray)
  # the same sensor, averaged over 30 minutes
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

```yaml live
# energy per hour from a meter that only counts up
type: custom:lcards-chart
chart_type: column
graph_span: 24h
sources:
  - entity: sensor.energy_consumption
    name: kWh per hour
    group_by:
      func: delta
      duration: 1h
      fill: zero
```

| `func` | Each bucket shows |
|--------|-------------------|
| `avg` | The average |
| `min`, `max`, `median` | The lowest, highest or middle value |
| `sum` | The total |
| `first`, `last` | The first or last reading |
| `delta` | How much the value changed within the bucket |
| `diff` | How much the value changed since the previous bucket (useful for meters) |
| `minmax` | The low and high value, for [range areas](./types#range-charts) |
| `box` | Min, quartiles, median and max, for [box plots](./types#range-charts) |
| `ohlc` | Open, high, low and close, for [candlesticks](./types#range-charts) |

::: details More about grouping
- **Buckets** start at the window's start, one every `duration`, and stop at now; each value is drawn at the start of its bucket.
- **Empty buckets with `fill: last`:** `delta`, `diff` and `sum` give `0` (nothing changed); the other functions repeat the last reading.
- **`diff` in the first bucket** compares with the last reading before the window, and is `0` when there is none.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `group_by.duration` | string | required | Bucket length, such as `10min`, `1h` or `1d` |
| `group_by.func` | string | `avg` | How each bucket is combined: see the table above |
| `group_by.fill` | string | `last` | Buckets with no readings: `last` (repeat the last value), `null` (leave a gap) or `zero` |

## State bands

**`state_bands` shades an entity's states behind the series, a band for each stretch of time it held one: a thermostat heating behind its temperature, a window open behind the humidity.**

- Each band is an entity's history, drawn state by state on the chart's time axis. Bands work on time charts: `line`, `area`, `column`, `scatter`, `rangeArea`, `rangeBar`, `candlestick` and `boxPlot`.
- Only active states are shaded unless `states` says otherwise, so an `off` thermostat leaves the chart clear. `states` takes exact states and the words `active`, `inactive` and `unavailable`, as on a [timeline](./types#timelines).
- Bands take the theme's state colours, as Home Assistant's history does: HA-LCARS shades heating orange and cooling blue. `color` sets one colour or a colour per state, with the same keys as the other cards' state colours.
- `label: true` writes the state at the top of each band.

```yaml live
# when the thermostat heated and cooled, behind the room's temperature
type: custom:lcards-chart
chart_type: line
graph_span: 24h
sources:
  - entity: sensor.demo_temperature
    name: Hall
state_bands:
  - entity: climate.demo_hall
    states:
      - heat
      - cool
    min_duration: 10min
    label: true
```

::: details More about state bands
- **Several bands** overlap where their states do; give each its own `color` and a lower `opacity` to tell them apart.
- **An attribute** can be shaded instead of the state: `attribute: hvac_action` shades `heating` and `cooling`, what the thermostat is really doing rather than its mode.
- **The last band** runs to now and grows while the state holds.
- **Colours follow the alert mode**, like the rest of the chart.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `state_bands` | list | - | The bands, each with the keys below |
| `entity` | string | required | The entity whose states are shaded |
| `attribute` | string | - | Shade this attribute's values instead of the state |
| `states` | list | `[active]` | The states to shade: exact states and `active`, `inactive`, `unavailable` |
| `min_duration` | string | - | A state shorter than this joins the one before it (`30s`, `10min`) |
| `color` | colour / map | the theme's state colours | One colour, or a colour per state (`heat`, `active`, `inactive`, `unavailable`, `default`) |
| `opacity` | number | `0.2` | How strongly the bands are shaded (0 to 1) |
| `label` | boolean | `false` | Write the state at the top of each band |

## Linked charts

**`sync_group` links chart cards: hovering one shows the same moment on all of them, so a temperature and the thermostat's timeline read together.**

- Give every chart the same `sync_group` name. Charts with the same time window show their tooltips together, as one; the others (timelines, or a chart over a shorter window) show a dashed line at that moment.
- The plots line up when the cards are stacked: the y-axis labels of linked charts are at least 60 px wide.
- Drag across a chart to zoom in: the other linked charts zoom to the same time, each with a reset button, and resetting any of them resets them all. New data keeps the zoom until you reset it.

```yaml live
# hover this chart, then the next one: their tooltips move together; drag across one to zoom both
type: custom:lcards-chart
chart_type: line
graph_span: 12h
sync_group: hall
sources:
  - entity: sensor.demo_temperature
    name: Hall temperature
```

```yaml live
type: custom:lcards-chart
chart_type: area
graph_span: 12h
sync_group: hall
sources:
  - entity: sensor.demo_humidity
    name: Hall humidity
```

::: details More about linked charts
- **Same window** means the same `graph_span` (and `span`, if set). A linked chart's rolling window ends on the next whole minute, so cards that load a few seconds apart still match.
- **The dashed line** comes from LCARdS, so it also works between a timeline and a line chart, or a 12 hour chart and a 6 hour one; it shows only where the moment is inside that chart's window.
- **Wider labels:** set `style.chart_options.yaxis.labels.minWidth` for labels wider than 60 px, on every chart in the group.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `sync_group` | string | - | A name shared by the charts that move together |

## Y axes

**`yaxis` gives series their own Y axes, for series with very different ranges such as temperature and humidity.** Without it all series share one axis that scales itself.

- Each series picks an axis by its `id` with `yaxis_id`. Series without one use the first axis.
- `min` and `max` fix the range, so the scale stays steady as values change; leave them out to scale automatically.

```yaml live
type: custom:lcards-chart
yaxis:
  - id: temperature
  # drawn on the right, pinned to 0 to 100
  - id: humidity
    opposite: true
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

::: details More about Y axes
- **Labels:** an axis shows the series' unit when every series on it has the same unit. Without `decimals` it uses [`style.yaxis.decimals`](./labels#style-xaxis-and-style-yaxis), or up to two decimal places.
- **Styling** (label visibility, axis line, ticks) is in [`style.yaxis`](./labels#style-xaxis-and-style-yaxis), and applies to every axis.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `yaxis[].id` | string | required | The name series use in `yaxis_id` |
| `yaxis[].show` | boolean | `true` | Show the axis |
| `yaxis[].opposite` | boolean | `false` | Draw it on the right |
| `yaxis[].min` | number | automatic | Fixed lowest value |
| `yaxis[].max` | number | automatic | Fixed highest value |
| `yaxis[].decimals` | number | up to 2 places | Decimal places in the labels (0 to 6) |
| `yaxis_id` | string | the first axis | On a series: the axis it uses |
