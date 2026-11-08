---
description: "Chart card upgrades: how older chart configs (source, series_names, series_N data sources) keep working and are converted to sources, and how apexcharts-card options map to lcards-chart."
---

# Upgrading

How older chart configs keep working and get converted, and how to move a chart over from apexcharts-card.

## Older chart configs

**Earlier versions of the chart card used a different layout for series (`source`, `series_names`, numbered `series_1` data sources, and so on), and those charts keep working as they are.** You don't need to change anything.

- **On your dashboard** an older chart is read in the old layout and drawn exactly as before. Nothing is saved or changed.
- **When you open it in the card editor**, the editor converts it to the current layout and shows a notice saying so; the YAML tab shows the new layout. Press **Save** to keep the converted version, or **Cancel** to leave your config exactly as it was.
- **If you type the old layout by hand** in the YAML editor, it still works. The editor shows a warning naming the current option to use, and doesn't rewrite your text while you type.
- To see a conversion explained step by step, pick **Older format (converted)** in the [Playground](./playground).

```yaml no-validate
# Before: a chart made with the old Chart Studio
type: custom:lcards-chart
sources: [series_1]
series_names: [Living room]
data_sources:
  series_1:
    entity: sensor.living_room_temperature
    attribute: state
    history:
      preload: true
      hours: 48
```

```yaml live
# After
type: custom:lcards-chart
graph_span: 48h
sources:
  - entity: sensor.living_room_temperature
    name: Living room
```

### What changes

**Each older key maps to a current one; the editor makes these changes for you.**

- LCARdS data sources you named yourself (anything other than the old editor's `series_1`, `series_2`, ...) are never moved or removed, because other cards may use them too.

| Older layout | Current layout |
|--------------|----------------|
| `source: sensor.x` with `attribute: a` | `sources: [{ entity: sensor.x, attribute: a }]` |
| `data_source: x` (one name or a list) | the same as `source` / `sources` |
| `sources: [sensor.x, sensor.y]` | `sources: [{ entity: sensor.x }, { entity: sensor.y }]` |
| `sources: [my_source]` (an LCARdS data source) | `sources: [{ datasource: my_source }]` |
| `series_1`, `series_2`, ... entries the old editor added to `data_sources` | moved into the series as `{ entity: ..., name: ... }` |
| `{ datasource: x, buffer: transformation, key: smooth }` | `{ datasource: x, buffer: smooth }` |
| `series_names: [A, B]` | `name:` on each series |
| `history_hours: 12` (or `history.hours` on a `series_N`) | `graph_span: 12h` |
| `show_legend: true` | `style.legend.show: true` |
| `yaxis` on a series | removed: it never had an effect. Use [`yaxis_id`](./series#y-axes) |
| `max_points` | removed: it never had an effect. Use [`group_by`](./series#grouping) |
| `style.grid.opacity` | not an ApexCharts option and never had an effect; use a semi-transparent `style.colors.grid` |

## Coming from apexcharts-card

**Many options have the same names as in the popular [apexcharts-card](https://github.com/RomRider/apexcharts-card), so most charts move over by renaming `series` to `sources`.** JavaScript transforms become LCARdS data sources.

```yaml no-validate
# apexcharts-card
type: custom:apexcharts-card
graph_span: 7d
series:
  - entity: sensor.energy_consumption
    statistics:
      type: change
      period: day
```

```yaml live
# lcards-chart
type: custom:lcards-chart
chart_type: column
graph_span: 7d
sources:
  - entity: sensor.energy_consumption
    statistics:
      type: change
      period: day
```

| apexcharts-card | lcards-chart |
|-----------------|--------------|
| `graph_span` | `graph_span` |
| `span.start`, `span.end`, `span.offset` | `span.start`, `span.end`, `span.offset` |
| `series:` | `sources:` |
| `series[].entity`, `attribute` | `sources[].entity`, `attribute` |
| `series[].statistics.type`, `period` | `sources[].statistics.type`, `period` |
| `series[].group_by.func`, `duration`, `fill` | `sources[].group_by.func`, `duration`, `fill` |
| `yaxis[]`, `series[].yaxis_id` | `yaxis[]`, `sources[].yaxis_id` |
| `series[].name`, `unit`, `float_precision`, `curve`, `stroke_width`, `color`, `opacity`, `type` | the same names on `sources[]` |
| `apex_config` | `style.chart_options` |
| `transform`, `data_generator` (JavaScript) | an [LCARdS data source](../../core/datasources/) with processors |
