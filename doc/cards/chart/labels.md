---
description: "Chart card axes and labels: reference lines at fixed values, the legend, value labels, X and Y axis styling, label and tooltip formatters, the tooltip and the toolbar."
---

# Axes and Labels

Everything on a chart that reads as text or marks a value: reference lines, the legend, value labels, the axes, formatters, the tooltip and the toolbar. Several Y axes are on [Series and Time](./series#y-axes).

## Reference lines

**`style.thresholds` draws horizontal lines at fixed values, such as a target, a limit or a comfort band, and `style.zero_line` draws one at 0.** A line with a `label` names itself on the right.

- The label is drawn in dark text on a tab of the line's colour.

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

::: details More about reference lines
- **The zero line** is a thin dashed line at half opacity, labelled "Zero".
- **Per series:** reference lines belong to the chart, not to a series; with several [Y axes](./series#y-axes) they are measured on the first.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.zero_line` | boolean | `false` | Draw a line at 0 |
| `style.zero_line_color` | colour | `var(--lcars-gray)` | The zero line's colour |
| `style.thresholds` | list | - | Lines at fixed values, each with the keys below |
| `style.thresholds[].value` | number | required | Where the line goes, on the Y axis |
| `style.thresholds[].label` | string | - | Text on the line |
| `style.thresholds[].color` | colour | `var(--lcars-red)` | Line and label colour |
| `style.thresholds[].width` | number | `2` | Line width, px |
| `style.thresholds[].dash` | boolean | `false` | Dashed line |
| `style.thresholds[].opacity` | number | `0.7` | Line opacity, 0 to 1 |

## style.legend

**`style.legend` shows the series names and colours, and sets where they go.** It is off on most charts and on for pie, donut, polar area and gauge charts, because there it names the slices.

- A gauge chart's legend also shows each gauge's value.

```yaml live
type: custom:lcards-chart
sources:
  - entity: sensor.attic_temperature
    name: Attic
  - entity: sensor.kitchen_temperature
    name: Kitchen
  - entity: sensor.office_temperature
    name: Office
style:
  legend:
    show: true
    position: right
    font_size: 13
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.legend.show` | boolean | `false` (`true` for `pie`, `donut`, `polarArea` and `radialBar`) | Show the legend |
| `style.legend.position` | string | `bottom` (`top` on scatter) | `top`, `bottom`, `left` or `right` |
| `style.legend.horizontalAlign` | string | `center` | `left`, `center` or `right` |
| `style.legend.font_size` | number | font size + 2 (`12` on scatter and polar area) | Legend font size, px (8 to 24) |

The legend's text colours are [`style.colors.legend`](./styling#colours).

## style.data_labels

**`style.data_labels` writes each value on the chart, on its column or point.** It suits a chart with few values, such as a week of daily columns.

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

::: details More about value labels
- **Decimals:** `style.yaxis.decimals` rounds the labels too.
- **Treemaps** show their labels (the series names) unless `show` is `false`.
- **Colours** are [`style.colors.data_labels`](./styling#colours).
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.data_labels.show` | boolean | `false` | Show value labels |
| `style.data_labels.offsetY` | number | `0` | Move the labels down (or up, negative), px (-50 to 50) |
| `style.data_labels.font_size` | number | the base font size | Label font size, px (8 to 24) |

## style.xaxis and style.yaxis

**`style.xaxis` and `style.yaxis` show or hide each axis's labels, line and tick marks, and `style.yaxis.decimals` rounds the values.** The X axis shows time by default.

- `style.yaxis.decimals` rounds the Y axis labels, the tooltip and the value labels together. Without it labels show up to two decimal places.
- Set `xaxis_type: category` or `xaxis_type: numeric` at the top level for other kinds of X values. For several Y axes, use [`yaxis`](./series#y-axes); `style.yaxis` styles them all.

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

::: details More about axes
- **Time labels:** the X axis picks its own time format to suit the window. Set your own with [`style.formatters.xaxis_label`](#formatters).
- **Rotating labels** works on category axes only; time axes don't rotate.
- **Colours** are [`style.colors.axis`](./styling#colours).
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.xaxis.labels.show` | boolean | `true` | Show the X axis labels |
| `style.xaxis.labels.rotate` | number | `0` | Label rotation, degrees (-90 to 90) |
| `style.xaxis.border.show` | boolean | `false` | Show the X axis line |
| `style.xaxis.ticks.show` | boolean | `false` | Show the X axis tick marks |
| `style.yaxis.labels.show` | boolean | `true` | Show the Y axis labels |
| `style.yaxis.decimals` | number | up to 2 places | Decimal places for the labels, the tooltip and value labels (0 to 10) |
| `style.yaxis.border.show` | boolean | `false` | Show the Y axis line |
| `style.yaxis.ticks.show` | boolean | `false` | Show the Y axis tick marks |

## Formatters

**`style.formatters` sets the text of the axis labels and the tooltip with short format strings.** They use a small chart-only syntax; they are not LCARdS templates.

- An X axis format without `{` is a date format: `HH:mm`, `MMM DD`, `ddd HH:mm`. A Y axis format puts the value into text: `{value}°C`.
- A tooltip format replaces the whole tooltip: `{seriesName}: {y}`, or `{x|MMM DD HH:mm}: {y}°C` to format the time.
- Units and decimal places usually need no formatter: set `unit` and `float_precision` on the [series](./series#units-and-decimals).

```yaml live
type: custom:lcards-chart
sources:
  - entity: sensor.outdoor_temperature
    name: Outside
style:
  formatters:
    xaxis_label: ddd HH:mm
    yaxis_label: "{value}°"
    tooltip: "{x|ddd [at] HH:mm}: {y}°C"
```

::: details More about formatters
- **Date tokens:** `YYYY`, `YY`, `MMMM` (October), `MMM` (Oct), `MM`, `M`, `dddd` (Tuesday), `ddd` (Tue), `DD`, `D`, `HH`, `H`, `hh`, `h`, `mm`, `m`, `ss`, `s`, `A` (PM), `a` (pm). Month and day names follow your Home Assistant language. Put literal text in square brackets: `[at] HH:mm`.
- **Values:** `{value}` in axis labels; `{y}`, `{x}`, `{x|format}` and `{seriesName}` in tooltips. `{value}` and `{y}` show up to one decimal place, and a plain `{x}` reads like `Oct 07 14:30`.
- **Quote** a format that starts with `{`, or YAML reads it as a map.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.formatters.xaxis_label` | string | a time format to suit the window | X axis labels: a date format, or text with `{value}` |
| `style.formatters.yaxis_label` | string | - | Y axis labels: text with `{value}`. Applies to every axis in [`yaxis`](./series#y-axes) |
| `style.formatters.tooltip` | string | the standard tooltip | The tooltip's whole text, with `{x}`, `{x\|format}`, `{y}` and `{seriesName}` |

## style.display

**`style.display` turns the hover tooltip and the ApexCharts toolbar (zoom, pan, download) on or off.** The toolbar is off, because most dashboards don't need it.

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

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.display.toolbar` | boolean | `false` | Show the zoom, pan and download toolbar |
| `style.display.tooltip.show` | boolean | `true` | Show the tooltip on hover |
| `style.display.tooltip.theme` | string | `dark` | `dark` or `light` |
