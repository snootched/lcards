---
description: "Chart card styling: colours, lines, fills, markers, grid, fonts, ApexCharts theme, animation presets and raw ApexCharts options."
moved_anchors:
  reference-lines: /cards/chart/labels#reference-lines
  lines-and-fills: /cards/chart/styling#style-stroke
  grid-legend-and-labels: /cards/chart/labels
  style-legend: /cards/chart/labels#style-legend
  style-data-labels: /cards/chart/labels#style-data-labels
  style-xaxis-and-style-yaxis: /cards/chart/labels#style-xaxis-and-style-yaxis
  style-display: /cards/chart/labels#style-display
  chart-type-options: /cards/chart/types#gauges
  fitted-by-default: /cards/chart/types#current-value-charts
  formatters: /cards/chart/labels#formatters
  a-complete-example: /cards/chart/examples#smoothed-temperature
---

# Styling

Colours, lines, fills, markers, the grid, fonts and animation for the whole chart. Charts use your theme's colours and fonts without any `style` at all, so everything on this page is optional. The legend, axes, labels and reference lines are on [Axes and Labels](./labels).

For one series' colour and line, the [series options](./series#line-styles) (`color`, `stroke_width`, `curve` ...) are usually simpler than the lists below. Colours accept every format in [Colours](../../core/colours): `var(--lcars-*)`, `theme:` tokens, computed colours like `alpha()`, hex and rgba.

## Colours

**`style.colors` sets the colours of everything on the chart: the series, lines and fills, the background, the text, the grid, the axes and the legend.** The lists (`series`, `stroke`, `fill` ...) give one colour per series, in order.

- Without `style.colors` the chart uses your theme's chart colours: LCARS orange, blue, yellow and green for the series, grey for the grid.
- A series' own `color` wins over `style.colors.series` for that series.

```yaml live
type: custom:lcards-chart
chart_type: area
sources:
  - entity: sensor.attic_temperature
    name: Attic
  - entity: sensor.office_temperature
    name: Office
style:
  colors:
    series:
      - var(--lcars-yellow)
      - var(--lcars-violet)
    grid: var(--lcars-gray)
  fill:
    type: gradient
    gradient:
      opacityFrom: 0.5
      opacityTo: 0.05
  legend:
    show: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.colors.series` | list | your theme's chart colours | Series colours, used in order |
| `style.colors.stroke` | list | the series colours (black on polar area, the axis colour on box plots) | Line and outline colours |
| `style.colors.fill` | list | the series colours | Area and column fill colours |
| `style.colors.background` | colour | `transparent` | Chart background |
| `style.colors.foreground` | colour | `var(--lcars-text-light)` | Default text and label colour |
| `style.colors.grid` | colour | your theme's grid colour | Grid line colour |
| `style.colors.marker.fill` | list | the series colours | Point fill colours |
| `style.colors.marker.stroke` | list | the foreground colour | Point outline colours |
| `style.colors.axis.x` | colour | your theme's axis colour | X axis label colour |
| `style.colors.axis.y` | colour | your theme's axis colour | Y axis label colour |
| `style.colors.axis.border` | colour | the grid colour | Axis line colour |
| `style.colors.axis.ticks` | colour | the grid colour | Tick mark colour |
| `style.colors.legend.default` | colour | the foreground colour | Legend text colour |
| `style.colors.legend.items` | list | - | Legend text colour for each series, in order |
| `style.colors.data_labels` | list | the foreground colour | Value label colours |

## style.stroke

**`style.stroke` sets how every line is drawn: its width, its curve and its dashes.** It also draws the outline of columns and slices.

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

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.stroke.width` | number | `2` | Line width, px (0 to 10) |
| `style.stroke.curve` | string | `smooth` | `smooth`, `straight`, `stepline` or `monotoneCubic` |
| `style.stroke.dash_array` | number | `0` | Dash length, px; `0` is solid (0 to 20) |

## style.fill

**`style.fill` sets how areas and columns are filled: solid, a gradient, or a pattern.** A gradient that fades out towards the bottom is the classic look for an area chart.

- A gradient's `opacityFrom` and `opacityTo` fade the fill from the line down to the axis.

```yaml live
type: custom:lcards-chart
chart_type: area
graph_span: 12h
sources:
  - entity: sensor.outdoor_temperature
    name: Outside
style:
  fill:
    type: gradient
    gradient:
      shade: dark
      type: vertical
      opacityFrom: 0.7
      opacityTo: 0.05
```

::: details More about fills
- **Pattern and image:** `pattern` draws ApexCharts' default stripes. `image` needs the image in [`style.chart_options`](#raw-apexcharts-options) (`fill.image.src`).
- **Per series:** a series' own `opacity` wins over `style.fill.opacity` for that series.
- **Chart types with their own fill:** range areas use opacity `0.35` and polar area charts `0.8` unless `style.fill.opacity` is set.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.fill.type` | string | `solid` | `solid`, `gradient`, `pattern` or `image` |
| `style.fill.opacity` | number | `0.7` | Fill opacity, 0 to 1 |
| `style.fill.gradient.shade` | string | - | `light` or `dark` |
| `style.fill.gradient.type` | string | - | `horizontal`, `vertical`, `diagonal1` or `diagonal2` |
| `style.fill.gradient.shadeIntensity` | number | - | How strong the shading is, 0 to 1 |
| `style.fill.gradient.opacityFrom` | number | - | Opacity where the gradient starts, 0 to 1 |
| `style.fill.gradient.opacityTo` | number | - | Opacity where the gradient ends, 0 to 1 |

## style.markers

**`style.markers` draws a point on each value.** Points are off on line and area charts; they help on a grouped series with few values.

- Points take the series colours unless [`style.colors.marker`](#colours) says otherwise.

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

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.markers.size` | number | `0` (`6` on scatter) | Point size, px (0 to 20); `0` hides them |
| `style.markers.shape` | string | `circle` | `circle`, `square`, `rect`, `diamond`, `triangle`, `star`, `cross`, `plus` or `line` |
| `style.markers.stroke.width` | number | `2` (`0` on scatter) | Point outline width, px (0 to 10) |

## style.grid

**`style.grid` draws the dashed lines behind the chart, and can shade alternate rows or columns.** Its colour is [`style.colors.grid`](#colours).

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
      - var(--lcars-gray)
      - transparent
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.grid.show` | boolean | `true` | Show the grid lines |
| `style.grid.stroke_dash_array` | number | `4` | Dash length, px; `0` is solid (0 to 20) |
| `style.grid.row_colors` | list | - | Background colours for alternate rows, repeated in turn |
| `style.grid.column_colors` | list | - | Background colours for alternate columns, repeated in turn |

## style.typography

**`style.typography` sets the font and base size of all the chart's text.** Without it the chart uses your theme's LCARS font at 12 px.

- The legend is 2 px larger than the base size, and reference line labels 2 px smaller.

```yaml live
type: custom:lcards-chart
sources:
  - entity: sensor.outdoor_temperature
    name: Outside
style:
  typography:
    font_size: 16
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.typography.font_family` | string | your theme's font | Font for all chart text |
| `style.typography.font_size` | number | `12` | Base font size, px (8 to 24) |

## style.theme

**`style.theme` passes ApexCharts' own theme options: light or dark mode, and a monochrome palette made from shades of one colour.** Explicit colours take priority.

- Monochrome suits a donut or pie of several parts that belong together.

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
      color: var(--lcars-orange)
      shade_to: dark
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.theme.mode` | string | `dark` | `dark` or `light` |
| `style.theme.monochrome.enabled` | boolean | `false` | Colour the series in shades of one colour |
| `style.theme.monochrome.color` | colour | the first series colour | The base colour |
| `style.theme.monochrome.shade_to` | string | `dark` | `dark` or `light` |
| `style.theme.monochrome.shade_intensity` | number | `0.65` | How far the shades spread, 0 to 1 |

## Animation

**`style.animation.preset` picks how the chart animates in when it first draws, and how it moves when new values arrive.** Without a preset charts animate like `lcars_standard`.

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

| Preset | Entrance | Updates |
|--------|----------|---------|
| `lcars_standard` | Smooth, 800 ms, series one after another | 350 ms |
| `lcars_dramatic` | Slower and more theatrical, 1200 ms | 500 ms |
| `lcars_minimal` | Quick and subtle, 400 ms, all at once | 200 ms |
| `lcars_realtime` | None | 100 ms, for live data |
| `lcars_alert` | Fast, 600 ms, for alert displays | 250 ms |
| `none` | None | None |

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.animation.preset` | string | - | One of the presets above |

## Raw ApexCharts options

**`style.chart_options` passes options straight to ApexCharts, for anything LCARdS doesn't cover.** It overrides everything else on these pages: see the [ApexCharts options reference](https://apexcharts.com/docs/options/).

- Only plain values work here; ApexCharts options that expect JavaScript functions can't be written in YAML.

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
        columnWidth: 60%
```

::: details More about raw options
- **Chart type:** `chart.type` here can't switch the chart to a type LCARdS doesn't support; use `chart_type`.
- **Series data** always comes from `sources`; a `series` list here is replaced.
- **Colours** here can be `var(--lcars-*)` names and `theme:` tokens too: they are resolved before ApexCharts sees them.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.chart_options` | object | - | ApexCharts options, deep-merged over everything LCARdS sets |
