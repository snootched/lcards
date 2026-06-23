# Slider Card

`custom:lcards-slider`

Interactive sliders and read-only gauges for entities like lights, covers, fans, climate, and sensors. Three main visual styles: segmented pill bars, ruler gauges, and shaped (clip-path fill).

---

## Quick Start

```yaml
# Light brightness slider
type: custom:lcards-slider
entity: light.bedroom
preset: pills-left-border
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

## Common Properties

The following properties are shared across all LCARdS cards. See [Common Card Properties](../common.md) for full details.

| Category | Config keys | Reference |
|----------|-------------|-----------|
| Sizing | `height`, `width`, `min_height`, `min_width`, `max_height`, `max_width` | [Sizing](../common.md#sizing-height-width-min_height-min_width-max_height-max_width) |
| Overflow | `overflow`, `overflow_x`, `overflow_y` | [Overflow](../common.md#overflow-overflow-overflow_x-overflow_y) |
| Stacking | `z_index` | [Stacking](../common.md#stacking-z_index) |
| Identity | `id`, `tags` | [ID & Tags](../common.md#card-identification-id-and-tags) |
| HA Grid | `grid_options` | [HA Grid Sizing](../common.md#ha-grid-sizing-grid_options) |
| Data | `data_sources`, `triggers_update` | [Data Sources](../../core/datasources/) |
| Text labels | `text` | [Text Fields](../../core/text-fields.md) |
| Actions | `tap_action`, `hold_action`, `double_tap_action` | [Actions](../../core/actions.md) |
| Animations | `animations`, `background_animation` | [Animations](../../core/animations.md) |
| Sounds | `sounds` | [Sounds](../../core/sounds.md) |
| Rules | via `id` / `tags` | [Rules Engine](../../core/rules/) |

---

## Config Structure

Annotated map of all top-level keys.

```yaml
type: custom:lcards-slider

# ── Entity & mode ─────────────────────────────────────────────────────────────────
entity: light.bedroom      # entity to display / control
ranges_attribute: ""       # entity attribute for range conditions
preset: pills-left-border  # visual preset — see Presets
component: shaped          # advanced: 'shaped' or 'picard'

# ── Control ─────────────────────────────────────────────────────────────────────
control:
  attribute: brightness    # entity attribute to control
  min: 0
  max: 100
  step: 1
  locked: false            # force read-only
  invert_value: false

# ── Text labels ────────────────────────────────────────────────────────────────
text:
  label:
    content: Brightness
    position: top-left

# ── Style ───────────────────────────────────────────────────────────────────────
style:
  track:
    type: pills              # pills | gauge | shaped
    height: 40
    display:
      min: 0
      max: 100
      unit: "%"
    segments:
      gradient:
        start:               # string or state-based object
          default: "var(--lcars-orange)"
          inactive: "alpha(var(--lcars-orange), 0.3)"
        end:                 # string or state-based object
          default: "var(--lcars-moonlight)"
  gauge:
    color:                   # string or state-based object (gauge fill)
      default: "var(--lcars-orange)"
      inactive: "var(--lcars-gray)"
  border:
    left:
      enabled: true
      size: 12
      color:                 # string or state-based object
        default: "var(--lcars-orange)"

# ── Actions, animations & effects ────────────────────────────────────────────
tap_action:
  action: more-info
animations: []
background_animation: []
sounds: {}

# ── Layout ─────────────────────────────────────────────────────────────────────
height: 60
width: 300
min_height: 40
max_height: 120
overflow: hidden
z_index: 0
grid_options:
  columns: 6
  rows: 1
id: my-slider
tags: [controls]
data_sources: {}
triggers_update: []
```

---

## Card Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | `custom:lcards-slider` (required) |
| `entity` | string | Entity to display and/or control |
| `ranges_attribute` | string | Entity attribute for range conditions — see [Range Conditions](../../core/colours.md#range-conditions-on-non-numeric-entities-ranges_attribute) |
| `preset` | string | Visual style preset — see [Presets](#presets) |
| `component` | string | Advanced SVG component: `shaped` or `picard` |
| `control` | object | Control behaviour — see [Control Options](#control-options) |
| `text` | object | Text label definitions — see [Text Fields](../../core/text-fields.md) |
| `style` | object | Visual style overrides — see [Style Object](#style-object) |

---

## Presets

| Preset | Description |
|--------|-------------|
| `pills-basic` | Segmented pill slider (horizontal, default) |
| `pills-left-border` | Pills slider with left border cap |
| `pills-left-border-rounded` | Pills + left border, right end rounded for LCARS end-cap look |
| `gauge-basic` | Ruler-style gauge with tick marks and progress bar |
| `gauge-left-border` | Gauge with left border cap; marker indicators pinned to tick edge |
| `gauge-left-border-rounded` | Gauge + left border, right end rounded |
| `shaped-vertical` | Vertical lozenge fill with top/bottom text bands (component: `shaped`) |
| `shaped-horizontal` | Horizontal lozenge fill with left/right text bands (component: `shaped`) |
| `picard-gauge-vertical` | Picard-style vertical gauge (component: `picard`) |

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

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `attribute` | string | domain default | Entity attribute to control |
| `min` | number | domain default | Minimum value |
| `max` | number | domain default | Maximum value |
| `step` | number | domain default | Value increment |
| `locked` | boolean | auto | Force read-only (`true`) or interactive (`false`) |
| `invert_value` | boolean | `false` | Flip the min↔max mapping |

### Automatic Domain Behaviour

The slider auto-detects interactivity and default attribute from the entity domain:

| Domain | Interactive | Default attribute | Control range |
|--------|-------------|-------------------|---------------|
| `light` | Yes | `brightness` | 0 – 100 (%) |
| `cover` | Yes | `current_position` | 0 – 100 |
| `fan` | Yes | `percentage` | 0 – 100 |
| `climate` | Yes | `temperature` | `min_temp` – `max_temp` from entity |
| `water_heater` | Yes | `temperature` | `min_temp` – `max_temp` from entity |
| `media_player` | Yes | `volume_level` | 0.0 – 1.0 |
| `humidifier` | Yes | `humidity` | `min_humidity` – `max_humidity` |
| `valve` | Yes | `current_valve_position` | 0 – 100 |
| `input_number` | Yes | state | entity `min`/`max`/`step` |
| `number` | Yes | state | entity `min`/`max`/`step` |
| `sensor` | No (read-only) | state | — |

All other domains default to read-only (locked). Set `control.locked: true/false` to override.

---

## Style Object

### `style.track`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | preset default | `pills`, `gauge`, or `shaped` |
| `orientation` | string | `horizontal` | `horizontal` or `vertical` |
| `height` | number / string | theme | Track height in px or CSS value |
| `margin` | number / object | theme | Space around track — number (all sides) or `{ top, right, bottom, left }` |
| `invert_fill` | boolean | `false` | Fill from the opposite end (right/top instead of left/bottom) |
| `display.min` | number | `control.min` | Minimum value shown on visual scale |
| `display.max` | number | `control.max` | Maximum value shown on visual scale |
| `display.unit` | string | entity unit | Display unit — overrides entity `unit_of_measurement` |
| `segments.enabled` | boolean | `true` | Enable pill segments (pills mode) |
| `segments.count` | number | `15` | Number of pill segments |
| `segments.gap` | number / string | `4` | Gap between pills in px |
| `segments.shape.radius` | number | `4` | Pill corner radius in px |
| `segments.size.width` | number | `12` | Fixed pill width in px (horizontal orientation) |
| `segments.size.height` | number | `12` | Fixed pill height in px (vertical orientation) |
| `segments.gradient.start` | string | — | Gradient start colour |
| `segments.gradient.end` | string | — | Gradient end colour |
| `segments.appearance.filled.opacity` | number | — | Opacity of filled pills (0–1) |
| `segments.appearance.unfilled.opacity` | number | — | Opacity of unfilled pills (0–1) |

### `style.gauge`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `progress_bar.color` | string / object | theme | Filled bar colour — [state map](../../core/colours.md) supported |
| `progress_bar.height` | number | theme | Bar cross-sectional thickness in px |
| `progress_bar.layer` | string | `background` | `background` (behind ticks) or `foreground` (in front) |
| `progress_bar.align` | string | `middle` | Cross-axis alignment: `start`, `middle`, or `end` |
| `progress_bar.padding` | object | — | Fine-tune offset from aligned position: `{ top, right, bottom, left }` |
| `progress_bar.radius` | number / object | — | Corner radius in px, or `{ start, end }` per-end |
| `progress_bar.background.color` | string / object | — | Background track colour (drawn behind fill) |
| `progress_bar.background.height` | number | same as bar | Background track cross-section in px |
| `progress_bar.background.radius` | number / object | — | Background track corner radius or `{ start, end }` |
| `progress_bar.background.min` | number | `control.min` | Value where background track starts |
| `progress_bar.background.max` | number | `control.max` | Value where background track ends |
| `scale.tick_marks.major.enabled` | boolean | `true` | Show major ticks |
| `scale.tick_marks.major.interval` | number | — | Major tick interval in value units |
| `scale.tick_marks.major.color` | string / object | theme | Major tick colour |
| `scale.tick_marks.major.height` | number | — | Major tick height in px |
| `scale.tick_marks.major.width` | number | — | Major tick width in px |
| `scale.tick_marks.minor.enabled` | boolean | `true` | Show minor ticks |
| `scale.tick_marks.minor.interval` | number | — | Minor tick interval in value units |
| `scale.tick_marks.minor.color` | string / object | theme | Minor tick colour |
| `scale.tick_marks.minor.height` | number | — | Minor tick height in px |
| `scale.tick_marks.minor.width` | number | — | Minor tick width in px |
| `scale.labels.enabled` | boolean | `true` | Show scale value labels |
| `scale.labels.show_unit` | boolean | `true` | Append unit suffix to labels |
| `scale.labels.unit` | string | entity unit | Override unit suffix on labels |
| `scale.labels.color` | string / object | theme | Label colour |
| `scale.labels.font_size` | number | — | Label font size in px |
| `scale.labels.padding` | number | — | Label padding in px |
| `indicator.enabled` | boolean | `true` | Show current value indicator |
| `indicator.type` | string | `line` | `line`, `round`, or `triangle` |
| `indicator.color` | string / object | theme | Indicator colour — [state map](../../core/colours.md) supported |
| `indicator.size.width` | number | — | Indicator width in px |
| `indicator.size.height` | number | — | Indicator height in px |
| `indicator.rotation` | number | `0` | Rotation angle in degrees (triangle type) |
| `indicator.offset.x` | number | — | Horizontal position offset in px |
| `indicator.offset.y` | number | — | Vertical position offset in px |
| `indicator.border.enabled` | boolean | — | Show indicator border |
| `indicator.border.width` | number | — | Indicator border width in px |
| `indicator.border.color` | string / object | — | Indicator border colour |
| `marker_indicator.type` | string | `triangle` | Default shape for value-marker range indicators |
| `marker_indicator.align` | string | `center` | Cross-axis alignment for markers: `start`, `center`, `end` |
| `marker_indicator.size.width` | number | `20` | Default marker width in px |
| `marker_indicator.size.height` | number | `20` | Default marker height in px |
| `marker_indicator.rotation` | number | `180` | Default marker rotation in degrees |
| `marker_indicator.offset.x` | number | — | Horizontal offset in px |
| `marker_indicator.offset.y` | number | — | Vertical offset in px |
| `marker_indicator.color` | string / object | range colour | Default marker colour |
| `marker_indicator.border.enabled` | boolean | — | Show marker border |
| `marker_indicator.border.width` | number | — | Marker border width in px |
| `marker_indicator.border.color` | string / object | — | Marker border colour |

```yaml
style:
  track:
    type: gauge
    orientation: horizontal
    height: 48
    display:
      min: -20
      max: 45
      unit: "°C"
  gauge:
    color: "var(--lcards-blue)"
    progress_bar:
      layer: background
      align: middle
      radius: 4
      background:
        color: "var(--lcards-black-medium)"
    scale:
      tick_marks:
        major:
          interval: 10
          color: "var(--lcards-moonlight)"
          height: 12
          width: 2
        minor:
          interval: 5
          color: "var(--lcards-gray)"
          height: 6
          width: 1
      labels:
        enabled: true
        show_unit: true
        color: "var(--lcards-moonlight)"
        font_size: 10
    indicator:
      type: line
      color: "var(--lcards-orange)"
```

---

## Ranges

Define colour-coded value bands and point markers on the track. Two item types:

- **Band** (`min` + `max`): coloured background zone
- **Marker** (`value`): live point indicator that tracks a value

```yaml
style:
  ranges:
    - min: 0
      max: 20
      color: "var(--error-color)"
      opacity: 0.3
    - min: 20
      max: 80
      color: "var(--success-color)"
      opacity: 0.3
    - min: 80
      max: 100
      color: "var(--warning-color)"
      opacity: 0.3
    # Value marker — triangle at a live entity value
    - value: "{entity.attributes.target_temp}"
      color: "var(--lcards-orange)"
```

### Range band fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `min` | number / string | required | Band start value — supports templates: `{entity.attributes.x}`, `[[[JS]]]` |
| `max` | number / string | required | Band end value — supports templates |
| `color` | string / object | — | Band fill colour — [state map](../../core/colours.md) supported |
| `opacity` | number | `0.3` | Band opacity (0–1) |

### Value marker fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `value` | number / string | required | Position value — supports templates: `{entity.attributes.x}`, `{states.id.state}`, `[[[JS]]]` |
| `color` | string / object | — | Marker colour — [state map](../../core/colours.md) supported |
| `indicator.type` | string | `triangle` | Shape: `line`, `round`, `triangle` |
| `indicator.align` | string | `center` | Cross-axis pin: `start`, `center`, `end` |
| `indicator.color` | string / object | range colour | Indicator fill colour — overrides the range's own `color` for the indicator only |
| `indicator.size.width` | number | `20` | Width in px |
| `indicator.size.height` | number | `20` | Height in px |
| `indicator.rotation` | number | `180` | Rotation in degrees |
| `indicator.offset.x` | number | — | Horizontal offset in px |
| `indicator.offset.y` | number | — | Vertical offset in px |
| `indicator.border.enabled` | boolean | — | Show border on indicator |
| `indicator.border.color` | string / object | — | Border colour |
| `indicator.border.width` | number | — | Border width in px |
| `pill_style.stroke` | boolean | `true` | Pills mode: outline on marker pill |
| `pill_style.stroke_width` | number | `2` | Pills mode: outline thickness in px |
| `pill_style.stroke_color` | string/object | — | Pills mode: outline colour. Falls back to the pill fill colour (`color`) if unset. Supports state-object syntax |

Global marker defaults can be set at `style.gauge.marker_indicator` — individual range entries override per field.

---

## Shaped Component

Use `component: shaped` for a solid fill clipped to a geometric shape.

```yaml
type: custom:lcards-slider
entity: light.bedroom
component: shaped
style:
  shaped:
    type: lozenge       # lozenge | rect | rounded | diamond | hexagon | polygon | path
    fill:
      color: "var(--lcards-blue)"
    track:
      background: "var(--lcards-black-medium)"
    text_bands:
      top:
        size: 36
      bottom:
        size: 28
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.shaped.type` | string | `lozenge` | Shape: `lozenge`, `rect`, `rounded`, `diamond`, `hexagon`, `polygon`, `path` |
| `style.shaped.radius` | number | auto | Corner radius override in px |
| `style.shaped.fill.color` | string / object | theme | Fill colour for the active portion — [state map](../../core/colours.md) supported |
| `style.shaped.track.background` | string / object | theme | Interior background (empty portion) colour — [state map](../../core/colours.md) supported |
| `style.shaped.text_bands.top.size` | number | `36` | Top text band height in px (vertical mode) |
| `style.shaped.text_bands.bottom.size` | number | `36` | Bottom text band height in px (vertical mode) |
| `style.shaped.text_bands.left.size` | number | `60` | Left text band width in px (horizontal mode) |
| `style.shaped.text_bands.right.size` | number | `60` | Right text band width in px (horizontal mode) |
| `style.shaped.polygon.points` | array | — | `[[xPct, yPct], ...]` vertices (0–1) for polygon shape |
| `style.shaped.path.d` | string | — | Raw SVG path `d` attribute (absolute coords) |
| `style.shaped.path.translate` | boolean | `false` | Translate path to shape body origin |

---

## Picard Component

Use `component: picard` for the Picard-style gauge rendering — a decorative range frame, a dedicated solid value bar, and a scanning activity indicator alongside the standard gauge elements. Requires `component: picard` explicitly; presets like `picard-gauge-vertical` only declare compatibility, they don't set it for you.

```yaml
type: custom:lcards-slider
entity: sensor.temperature
component: picard
preset: picard-gauge-vertical
style:
  range:
    border:
      color: "theme:components.slider.range.border.color"
    frame:
      color:
        active: "#00ffff"
        inactive: "#333333"
  solid_bar:
    color:
      active: "var(--lcards-green)"
      inactive: "var(--lcards-gray)"
  animation:
    indicator:
      color: "lighten(var(--lcards-orange), 0.2)"
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `style.range.border.color` | string / object | theme | Range track border colour — [state map](../../core/colours.md) supported |
| `style.range.frame.color` | string / object | range border colour | Decorative outline colour around the range track. Falls back to `range.border.color` if unset |
| `style.solid_bar.color` | string / object | range border colour | Solid value-bar colour. Falls back to `range.border.color` if unset |
| `style.animation.indicator.color` | string / object | theme | Colour of the scanning/activity indicator shown during the built-in animation, if enabled on the preset |

---

## Text Labels

Sliders support the full text field system. See [Text Fields](../../core/text-fields.md) for the complete reference.

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

---

## `style.border`

The slider border is a **per-side cap** system — each side is configured independently. This differs from the button card border structure.

| Field | Type | Description |
|-------|------|-------------|
| `border.radius` | number / string / object | Uniform corner radius in px, a CSS variable string, or `{ top_left, top_right, bottom_right, bottom_left }` per-corner |
| `border.left.enabled` | boolean | Enable left border cap |
| `border.left.size` | number | Left border width in px |
| `border.left.color` | string / object | Left border colour — [state map](../../core/colours.md) supported |
| `border.right.enabled` | boolean | Enable right border cap |
| `border.right.size` | number | Right border width in px |
| `border.right.color` | string / object | Right border colour |
| `border.top.enabled` | boolean | Enable top border cap |
| `border.top.size` | number | Top border height in px |
| `border.top.color` | string / object | Top border colour |
| `border.bottom.enabled` | boolean | Enable bottom border cap |
| `border.bottom.size` | number | Bottom border height in px |
| `border.bottom.color` | string / object | Bottom border colour |

```yaml
style:
  border:
    radius: 8
    left:
      enabled: true
      size: 20
      color:
        default: "var(--lcards-gray)"
        active: "var(--lcards-orange)"
    right:
      enabled: false
```

---

## Annotated Example

A climate thermostat slider with gauge style, tick marks, ranges, text labels, and a tap action:

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
    orientation: horizontal
    height: 52
    display:
      min: 15
      max: 30
      unit: "°C"
  gauge:
    color:
      default: "var(--lcards-blue)"
      heat: "var(--lcards-alert-red)"
      cool: "var(--lcards-blue)"
    progress_bar:
      layer: background
      radius: 3
    scale:
      tick_marks:
        major:
          interval: 5
          color: "var(--lcards-moonlight)"
          height: 14
          width: 2
        minor:
          interval: 1
          color: "var(--lcards-gray)"
          height: 7
          width: 1
      labels:
        enabled: true
        show_unit: true
        color: "var(--lcards-moonlight)"
        font_size: 10
    indicator:
      type: triangle
      color: "var(--lcards-orange)"
  ranges:
    - min: 15
      max: 19
      color: "var(--lcards-blue)"
      opacity: 0.25
    - min: 19
      max: 24
      color: "var(--success-color)"
      opacity: 0.25
    - min: 24
      max: 30
      color: "var(--error-color)"
      opacity: 0.25
  border:
    radius: 8
    left:
      enabled: true
      size: 20
      color:
        default: "var(--lcards-gray)"
        active: "var(--lcards-orange)"

tap_action:
  action: more-info
```

---
