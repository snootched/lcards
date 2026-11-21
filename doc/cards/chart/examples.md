---
description: "Complete chart card examples to copy: a weather panel with two Y axes, a fortnight of daily energy from statistics, a power monitor with average and peak, and a smoothed temperature from an LCARdS data source."
---

# Examples

Complete charts that combine the options from the other pages. Copy one, then swap in your own entities.

## Weather panel

**Outdoor temperature as a filled area with humidity on its own axis, frost and warm lines, and a tooltip that reads naturally.** Two days, averaged every 30 minutes.

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
    opacity: 0.35
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
      - var(--lcars-orange)
      - var(--lcars-blue)
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
    xaxis_label: ddd HH:mm
    tooltip: "{seriesName}, {x|ddd [at] HH:mm}: {y}"
```

## Energy fortnight

**Daily energy use from long-term statistics, with each column labelled and a line for the daily target.** The window ends at midnight tonight, so today is the last column.

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
      - var(--lcars-yellow)
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

## Power monitor

**The last six hours of a busy power sensor: the 10-minute average as an area, and the 10-minute peak as a thin line above it.** The toolbar lets you zoom in on a spike.

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

## Smoothed temperature

**A living room temperature smoothed by an LCARdS data source, with humidity on a second axis and a warm line.** In these docs the smoothing doesn't run (processors only run on a real dashboard), so the preview plots the raw temperature.

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
    opacity: 0.35
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
      - var(--lcars-orange)
      - var(--lcars-blue)
  legend:
    show: true
  thresholds:
    - value: 22
      label: Warm
      color: var(--lcars-red)
  animation:
    preset: lcars_standard
```
