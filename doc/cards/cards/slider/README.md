# Slider Card

`custom:lcards-slider`

Interactive sliders and read-only gauges for entities like lights, covers, fans, climate, and sensors. Two main visual styles: segmented pill bars and ruler gauges.

---

## Quick Start

```yaml
# Light brightness slider
type: custom:lcards-slider
entity: light.bedroom
preset: pills-basic
control:
  attribute: brightness
```

```yaml
# Temperature gauge (read-only)
type: custom:lcards-slider
entity: sensor.temperature
preset: gauge-basic
style:
  track:
    display:
      min: -10
      max: 40
      unit: "°C"
```

---

## Top-Level Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | `custom:lcards-slider` (required) |
| `entity` | string | Entity to display and/or control |
| `preset` | string | Visual style preset |
| `component` | string | Advanced SVG component name |
| `orientation` | string | `horizontal` or `vertical` (default: `horizontal`) |
| `id` | string | Card ID for rule targeting |
| `tags` | list | Tags for rule targeting |
| `control` | object | Control behavior |
| `text` | object | Text label definitions — see [Text Fields](../../../core/text-fields.md) |
| `style` | object | Visual style overrides — see below |
| `tap_action` | object | Tap action on the card border — see [Actions](../../../core/actions.md) |
| `hold_action` | object | Hold action |
| `double_tap_action` | object | Double-tap action |
| `animations` | list | Card animations — see [Animations](../../../core/animations.md) |
| `background_animation` | list / object | Canvas background — see [Background Animations](../../../core/effects/background-animations.md) |
| `data_sources` | object | DataSource definitions — see [DataSources](../../../core/datasources/README.md) |
| `sounds` | object | Per-card sound overrides |

---

## Presets

| Preset | Description |
|--------|-------------|
| `pills-basic` | Segmented pill bar — standard interactive slider |
| `gauge-basic` | Ruler with tick marks — typically display-only |

Additional presets and components may be available from packs.

---

## Control Options

```yaml
control:
  attribute: brightness    # Entity attribute to control (default varies by domain)
  min: 0                   # Minimum value
  max: 100                 # Maximum value
  step: 1                  # Value increment
  locked: false            # Force read-only (auto-determined by entity domain)
  invert_value: false      # Flip min↔max mapping
```

### Automatic Domains

The slider automatically determines interactivity and attribute by entity domain:

| Domain | Interactive | Default attribute |
|--------|-------------|-------------------|
| `light` | Yes | `brightness` |
| `cover` | Yes | `position` |
| `fan` | Yes | `percentage` |
| `climate` | Yes | `temperature` |
| `input_number` | Yes | state |
| `number` | Yes | state |
| `sensor` | No (read-only) | state |

Set `control.locked: true` to force read-only for any domain.

---

## `style` Object

### `style.track` (pills)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | `pills` | `pills`, `gauge`, or `shaped` |
| `height` | number / string | theme | Track height in px or CSS value |
| `margin` | number / object | theme | Space around track — number (all sides) or `{ top, right, bottom, left }` |
| `display.min` | number | `control.min` | Minimum value on visual scale |
| `display.max` | number | `control.max` | Maximum value on visual scale |
| `display.unit` | string | entity unit | Display unit label |
| `invert_fill` | boolean | `false` | Fill from the opposite end |
| `segments.count` | number | `15` | Number of pill segments |
| `segments.gap` | number / string | `4` | Gap between pills in px |
| `segments.shape.radius` | number | `4` | Pill corner radius in px |
| `segments.gradient.start` | string | — | Gradient start colour |
| `segments.gradient.end` | string | — | Gradient end colour |

### `style.track` colour fields

Colour fields in `style.track` accept plain colour strings or [state-based colour maps](../../../core/colours.md):

These are set inside the preset or component's colour configuration — consult the active preset's config for exact paths. Common areas:

- Filled (active) pills: configured via the component's `color` or `fill_color` preset param
- Unfilled (empty) pills: configured via `unfilled.opacity` or the component colour preset
- Gauge progress bar: `style.gauge.progress_bar.color`
- Gauge tick marks: `style.gauge.scale.tick_marks.major.color`, `.minor.color`
- Gauge indicator: `style.gauge.indicator.color`

### `style.gauge`

| Field | Type | Description |
|-------|------|-------------|
| `progress_bar.color` | string / object | Filled bar colour — [state map](../../../core/colours.md) supported |
| `progress_bar.height` | number | Bar cross-sectional thickness in px |
| `progress_bar.layer` | string | `background` (behind ticks) or `foreground` (in front) |
| `scale.tick_marks.major.interval` | number | Major tick interval (value units) |
| `scale.tick_marks.major.color` | string / object | Major tick colour |
| `scale.tick_marks.major.height` | number | Major tick height in px |
| `scale.tick_marks.major.width` | number | Major tick width in px |
| `scale.tick_marks.minor.interval` | number | Minor tick interval |
| `scale.tick_marks.minor.color` | string / object | Minor tick colour |
| `scale.labels.enabled` | boolean | Show/hide scale labels |
| `scale.labels.color` | string / object | Label colour |
| `scale.labels.font_size` | number | Label font size |
| `indicator.type` | string | `line`, `round`, or `triangle` |
| `indicator.color` | string / object | Indicator colour — [state map](../../../core/colours.md) supported |
| `indicator.size.width` | number | Indicator width in px |
| `indicator.size.height` | number | Indicator height in px |

```yaml
style:
  track:
    type: gauge
    height: 48
    display:
      min: -20
      max: 45
      unit: "°C"
  gauge:
    progress_bar:
      color:
        default: "var(--lcards-blue)"
        active: "var(--lcards-orange)"
      layer: background
    scale:
      tick_marks:
        major:
          interval: 10
          color: "var(--lcards-moonlight)"
          height: 12
        minor:
          interval: 5
          color: "var(--lcards-gray)"
          height: 6
      labels:
        enabled: true
        color: "var(--lcards-moonlight)"
        font_size: 10
    indicator:
      type: line
      color: "var(--lcards-orange)"
```

---

## Text Labels

Sliders support the full text field system. See [Text Fields](../../../core/text-fields.md) for the complete reference.

```yaml
text:
  default:
    font_family: "Antonio, sans-serif"
    color: "var(--lcards-moonlight)"
  label:
    content: Brightness
    position: top-left
    font_size: 11
  value:
    content: "[[[return Math.round(entity.attributes.brightness / 255 * 100) + '%']]]"
    position: top-right
    font_size: 11
```

## `style.card` and `style.border`

Same structure as the [Button card](../button/README.md#style-object):

```yaml
style:
  card:
    color:
      background: "var(--ha-card-background)"
  border:
    color:
      default: "var(--lcards-gray)"
      active: "var(--lcards-orange)"
    width: 2
    radius: 8
```

---

## Annotated Example

A climate thermostat slider with custom track style, gauge ticks, text labels, and a tap action:

```yaml
type: custom:lcards-slider
entity: climate.living_room
preset: gauge-basic
control:
  attribute: temperature
  min: 15
  max: 30
  step: 0.5

text:
  default:
    font_family: "Antonio, sans-serif"
    color: "var(--lcards-moonlight)"
  label:
    content: Living Room
    position: top-left
    font_size: 11
    text_transform: uppercase
  value:
    content: "[[[return entity.attributes.current_temperature + '°C']]]"
    position: top-right
    font_size: 11

style:
  track:
    type: gauge
    height: 52
    display:
      min: 15
      max: 30
      unit: "°C"
  gauge:
    progress_bar:
      color:
        default: "var(--lcards-blue)"
        heating: "var(--lcards-alert-red)"
        cooling: "var(--lcards-blue)"
      layer: background
    scale:
      tick_marks:
        major:
          interval: 5
          color: "var(--lcards-moonlight)"
          height: 14
        minor:
          interval: 1
          color: "var(--lcards-gray)"
          height: 7
      labels:
        enabled: true
        color: "var(--lcards-moonlight)"
        font_size: 10
    indicator:
      type: triangle
      color: "var(--lcards-orange)"
  border:
    color:
      default: "var(--lcards-gray)"
      active: "var(--lcards-orange)"
    width: 1

tap_action:
  action: more-info
```

---
