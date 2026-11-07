---
description: "Slider card ranges: coloured value bands and live value markers with captions, on pill bars, gauges and ring gauges."
---

# Ranges and Markers

**`style.ranges` is a list of coloured bands and live markers drawn on the track.** Use a band to show a comfort zone or a danger zone, and a marker to show a second value, such as the room temperature next to the thermostat setting. An item with `min` and `max` is a band; an item with `value` is a marker.

```yaml live
type: custom:lcards-slider
entity: climate.living_room
preset: gauge-basic
control:
  min: 10
  max: 30
style:
  gauge:
    progress_bar:
      height: 8 # a thin fill, so the bands show
      align: end
  ranges:
    # three bands: cold, comfortable, hot
    - min: 10
      max: 17
      color: var(--lcards-blue)
      opacity: 0.5
    - min: 17
      max: 24
      color: theme:colors.status.success
      opacity: 0.5
    - min: 24
      max: 30
      color: theme:colors.status.error
      opacity: 0.5
    # a marker at the room temperature, with a caption
    - value: "{entity.attributes.current_temperature}"
      indicator:
        color: var(--lcars-orange)
      label:
        text: NOW
        offset:
          x: 26
          "y": 30
```

## Range band fields

**A band colours the stretch of the track between `min` and `max`.** On a gauge it is a coloured block behind the scale; on pills it recolours the pills inside it; on a [ring](./components#ring-gauge) it colours that part of the ring, and on a [shaped](./components#shaped-component) slider that part of the shape.

- Bands sit under the fill, so a full-height fill hides them. Use a thin fill (`style.gauge.progress_bar.height`) or a low `opacity` to keep them visible.
- `min` and `max` can follow other entities, so a band can show a range that changes, such as a target set elsewhere.

```yaml live
type: custom:lcards-slider
entity: sensor.temperature
preset: gauge-basic
style:
  track:
    display:
      min: -10
      max: 40
      unit: "°C"
  gauge:
    progress_bar:
      height: 8
      align: end
  ranges:
    - min: -10
      max: 0
      color: var(--lcards-blue)
    - min: 30
      max: 40
      color: theme:colors.status.error
      opacity: 0.6
```

::: details More about bands
- **Templates:** `min` and `max` take only the quick template kinds: tokens such as `{entity.state}`, `{entity.attributes.x}`, `{states.domain.object_id.state}`, `{datasource:name}`, `{config.x}`, `{variables.x}`, and `[[[JavaScript]]]`. Jinja2 is not supported there, because positions are worked out again on every state change.
- **Scale:** `min` and `max` are measured on the scale the track shows (`style.track.display`), not on the range the slider sets.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `min` | number / string | required | Where the band starts: a number or a quick [template](/core/templates/) |
| `max` | number / string | required | Where the band ends, as `min` |
| `color` | colour / object | - | Band colour; a [state map](/core/colours) works |
| `opacity` | number | `0.3` on a gauge, `1` on a ring or shaped slider | Band opacity, 0 to 1. On pills it sets the pills' opacity inside the band; without it they keep their usual opacity |

## Value marker fields

**A marker points at one value on the track and moves when that value changes.** On a gauge it is a triangle at the value; on pills the pill at the value is filled and outlined; on a [ring](./components#value-markers) it sits on the band. A [shaped](./components#shaped-component) slider draws bands only, no markers.

- A gauge or ring marker takes its colour from `indicator.color`, not from the marker's `color`. Pills are the other way round: the marked pill uses the marker's `color`.
- Defaults for every marker on the card go in [`style.gauge.marker_indicator`](./styles#style-gauge); a marker's own `indicator` keys win.

```yaml live
type: custom:lcards-slider
entity: light.bedroom
preset: pills-left-border
style:
  ranges:
    # pills: the pill at 75 is filled with this colour and outlined
    - value: 75
      color: var(--lcars-orange)
      pill_style:
        stroke_color: var(--lcars-yellow)
        stroke_width: 3
```

```yaml live
type: custom:lcards-slider
entity: sensor.temperature
preset: gauge-basic
style:
  track:
    display:
      min: -10
      max: 40
      unit: "°C"
  ranges:
    # gauge: a round marker at 20 and a line marker at 30
    - value: 20
      indicator:
        type: round
        color: var(--lcars-yellow)
        size:
          width: 12
    - value: 30
      indicator:
        type: line
        color: theme:colors.status.error
        size:
          width: 3
          height: 24
```

::: details More about markers
- **Templates:** `value` takes the same quick template kinds as a band's `min`, so a marker can follow another entity's state or attribute.
- **On a ring:** markers size themselves by type (`round` uses `width` only), `rotation` is not used, and `offset` takes `y` only, which moves the marker outward.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | number / string | required | Where the marker sits: a number or a quick [template](/core/templates/), as a band's `min` |
| `color` | colour / object | `var(--lcars-text-light)` | Pills: the marked pill's colour. Not used on a gauge or ring: set `indicator.color` |
| `indicator.type` | string | `triangle` (`line` on a ring) | `line`, `round` or `triangle` |
| `indicator.align` | string | `start` | Where across the track: `start`, `center` or `end`. On a ring: `start` for `line`, `end` for `triangle`, `center` for `round` |
| `indicator.color` | colour / object | theme | The marker's colour on a gauge or ring; a [state map](/core/colours) works |
| `indicator.size.width` | number | `20` | Width, px |
| `indicator.size.height` | number | `20` | Height, px |
| `indicator.rotation` | number | `180` | Turn, degrees (not on a ring) |
| `indicator.offset.x` | number | `0` (`20` on `picard-gauge-vertical`) | Nudge right, px |
| `indicator.offset.y` | number | `10` on a flat gauge (`20` with the left-border gauge presets), else `0` | Nudge down, px (on a ring: outward) |
| `indicator.border.enabled` | boolean | `false` | Outline the marker |
| `indicator.border.color` | colour / object | theme | Outline colour |
| `indicator.border.width` | number | `1` | Outline width, px |
| `pill_style.stroke` | boolean | `true` | Pills: outline the marked pill |
| `pill_style.stroke_width` | number | `2` | Pills: outline width, px |
| `pill_style.stroke_color` | colour / object | the marker's `color` | Pills: outline colour |

## Label fields

**A label is a caption on a marker, such as NOW or TARGET, or the value itself.** It sits beside the marker on a gauge, beside the marked pill on pills, and outside the scale on a ring. Nothing shows unless `label.text` is set.

- On a flat track the caption sits above the marker; on an upright track it sits beside it.
- Captions on a gauge or pills don't move out of the way of tick labels, the value text or each other. A caption above the track of a flat gauge is cut off by the card's top edge, even on a taller card, so move it beside the marker with `offset`.

```yaml live
type: custom:lcards-slider
entity: sensor.temperature
preset: gauge-basic
style:
  track:
    display:
      min: -10
      max: 40
      unit: "°C"
  ranges:
    - value: 25
      indicator:
        color: var(--lcars-orange)
      label:
        text: TARGET 25
        color: var(--lcars-orange)
        font_size: 16
        offset:
          x: 50 # right of the marker
          "y": 16 # level with the marker
```

::: details More about labels
- **Templates:** `label.text` takes every [template](/core/templates/) kind, Jinja2 and data sources included, unlike a marker's `value`.
- **Offsets replace the default spot:** setting `offset.y` on a flat track (or `offset.x` on an upright one) replaces the default distance from the marker, so the number you give is measured from the marker itself.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `label.text` | string | - | The caption: any [template](/core/templates/), Jinja2 and data sources included |
| `label.color` | colour / object | theme | Caption colour; a [state map](/core/colours) works |
| `label.font_size` | number | `14` (`12` on a ring) | Size, px |
| `label.offset.x` | number | beside the marker | Nudge sideways, px |
| `label.offset.y` | number | above the marker | Nudge down, px |
