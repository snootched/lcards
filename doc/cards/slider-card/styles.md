---
description: "Slider card pill bars and ruler gauges: track, segments, tick marks, scale labels, the value indicator, border caps and text labels."
---

# Pills and Gauges

**The two flat looks of the slider card: a row of pills that light up to the value, or a ruler gauge with a fill bar.** Pick one with a `pills-*` or `gauge-*` preset, or set `style.track.type`.

- Both looks lie flat by default. Set `style.track.orientation: vertical` to stand one upright; the fill then rises from the bottom.
- Every colour key on this page takes a colour, a CSS variable, a theme token or a state map (`default`, `active`, `inactive` ...), as described on the [Colours](/core/colours) page.

The [ring, shaped and Picard](./components) looks have their own page.

---

## `style.track`

**The track is the bar both looks are drawn in: its size, the scale it shows and, for pills, the pills themselves.**

- Leave `segments.count` out and the card fits as many pills of `segments.size.width` as the width allows. Set it and that many pills stretch to share the space.
- `display` changes only the scale the card shows. What the slider sets on the entity is [`control.min` and `max`](./control#control-options).

```yaml live
type: custom:lcards-slider
entity: light.bedroom
preset: pills-basic
style:
  track:
    segments:
      count: 10
      gap: 6
      gradient:
        start: var(--lcars-orange)
        end: var(--lcards-moonlight)
```

::: details More about style.track
- **Upright pills:** with no `count`, an upright track fits as many pills of `segments.size.height` as the height allows, then stretches them a little so they fill it exactly. A flat track keeps the pill width you set and leaves any spare room at the end.
- **Inverted fill:** with `invert_fill: true` the pill gradient swaps ends too, so the `start` colour stays where the fill starts.
- **Border caps and margin:** the track starts inside any [border caps](#style-border); `margin` adds space inside them.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | string | preset | `pills` or `gauge`. `shaped` is set for you by the [shaped component](./components#shaped-component) |
| `orientation` | string | `horizontal` | `horizontal` or `vertical` |
| `height` | number / string | theme | Track height: px, a `px` or `rem` string, or a theme token |
| `invert_fill` | boolean | `false` | Fill from the other end (right, or top when upright) |
| `margin` | number | `0` | Space on every side of the track, px. Or set each side with the keys below |
| `margin.top` | number | `0` (pills presets: `5`) | Space above the track, px |
| `margin.right` | number | `0` | Space right of the track, px |
| `margin.bottom` | number | `0` | Space below the track, px |
| `margin.left` | number | `0` (pills presets: `5`) | Space left of the track, px |
| `display.min` | number | `control.min` | Lowest value on the scale |
| `display.max` | number | `control.max` | Highest value on the scale |
| `display.unit` | string | entity unit | Unit shown, instead of the entity's `unit_of_measurement` |
| `segments.count` | number | as many as fit | Number of pills, 2 to 200. Unset, as many `size`-wide pills as fit; set, the pills stretch to fill |
| `segments.gap` | number / string | `4` | Gap between pills, px |
| `segments.shape.radius` | number | `0` (pills presets) | Pill corner radius, px |
| `segments.size.width` | number | `10` (pills presets) | Pill width, px. Flat tracks, and only when `count` is unset |
| `segments.size.height` | number | `12` | Pill height, px. Upright tracks, and only when `count` is unset |
| `segments.gradient.start` | colour | theme | Colour of the first pill; a [state map](/core/colours) works |
| `segments.gradient.end` | colour | theme | Colour of the last pill |
| `segments.appearance.filled.opacity` | number | `1` | Opacity of lit pills, 0–1 |
| `segments.appearance.unfilled.opacity` | number | `0.2` | Opacity of unlit pills, 0–1 |

## `style.gauge`

**The gauge's fill bar, its ruler of ticks and labels, the value indicator, and the defaults for value markers.** `progress_bar` is the fill, `scale` the ruler, `indicator` the mark at the current value.

- The value indicator is off until you set `indicator.type`, `color` or `size`, or `enabled: true`. A triangle points down; `rotation: 180` points it up at the ruler.
- [Value markers](./ranges#value-marker-fields) (ranges with a `value`) take their shape from `marker_indicator`, and a marker's own `indicator` keys win over it. A marker's colour is its range's `color` (or its `indicator.color`); `marker_indicator.color` is the default when it sets neither.

```yaml live
type: custom:lcards-slider
entity: sensor.temperature
preset: gauge-basic
style:
  track:
    height: 48
    display:
      min: -20
      max: 45
      unit: "°C"
  gauge:
    progress_bar:
      color: var(--lcards-blue)
      radius: 4
      background:
        color: var(--lcards-gray-darkest)
    scale:
      tick_marks:
        major:
          interval: 10
          color: var(--lcards-moonlight)
          height: 12
        minor:
          interval: 5
          color: var(--lcards-gray)
          height: 6
      labels:
        color: var(--lcards-moonlight)
    indicator:
      type: triangle
      rotation: 180 # point up at the ruler
      size:
        width: 18
        height: 16
      color: var(--lcars-orange)
```

::: details More about style.gauge
- **Per-end radius:** `progress_bar.radius` and `progress_bar.background.radius` take a number for both ends, or `start` and `end` keys. `start` is the left end (bottom when upright), `end` the right end (top when upright).
- **Turning the indicator on with a template:** `indicator.enabled` takes a [template](/core/templates/) that gives true or false, for example `"{{ not is_state('sensor.x', 'unavailable') }}"`.
- **Marker defaults on a ring:** a [ring](./components#ring-gauge) takes only `marker_indicator.color` from this block.
- **Marker offset on bordered gauges:** the `gauge-left-border` presets set `marker_indicator.offset.y: 20`, so the marker clears the top cap and its tip meets the minor ticks.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `progress_bar.color` | colour | theme | Fill colour; a [state map](/core/colours) works |
| `progress_bar.height` | number | the track | Fill thickness, px |
| `progress_bar.layer` | string | `background` | `background` (behind the ticks) or `foreground` (in front) |
| `progress_bar.align` | string | `middle` | Where the fill sits across the track: `start`, `middle` or `end` |
| `progress_bar.padding.top` | number | `0` | Nudge from the aligned place, px |
| `progress_bar.padding.right` | number | `0` | Nudge from the aligned place, px |
| `progress_bar.padding.bottom` | number | `0` | Nudge from the aligned place, px |
| `progress_bar.padding.left` | number | `0` | Nudge from the aligned place, px |
| `progress_bar.radius` | number | `2` | Corner radius, px |
| `progress_bar.radius.start` | number | `2` | Radius at the start end only, px |
| `progress_bar.radius.end` | number | `2` | Radius at the far end only, px |
| `progress_bar.background.color` | colour | - | The empty track behind the fill. Unset, there is none |
| `progress_bar.background.height` | number | as the bar | Empty track thickness, px |
| `progress_bar.background.radius` | number | as the bar | Empty track corner radius, px. Takes `start` and `end` as the bar does |
| `progress_bar.background.min` | number | `control.min` | Value where the empty track starts |
| `progress_bar.background.max` | number | `control.max` | Value where the empty track ends |
| `scale.tick_marks.major.enabled` | boolean | `true` | Show major ticks |
| `scale.tick_marks.major.interval` | number | `10` | A major tick every this many value units |
| `scale.tick_marks.major.color` | colour | theme | Major tick colour |
| `scale.tick_marks.major.height` | number | the track | Major tick length, px |
| `scale.tick_marks.major.width` | number | `2` | Major tick width, px |
| `scale.tick_marks.minor.enabled` | boolean | `true` | Show the minor ticks between the major ones |
| `scale.tick_marks.minor.interval` | number | `2` | A minor tick every this many value units |
| `scale.tick_marks.minor.color` | colour | theme | Minor tick colour |
| `scale.tick_marks.minor.height` | number | `10` | Minor tick length, px |
| `scale.tick_marks.minor.width` | number | `1` | Minor tick width, px |
| `scale.labels.enabled` | boolean | `true` | Show the value labels |
| `scale.labels.show_unit` | boolean | `true` | Add the unit to each label |
| `scale.labels.unit` | string | entity unit | Unit on the labels |
| `scale.labels.color` | colour | theme | Label colour |
| `scale.labels.font_size` | number | `14` | Label size, px |
| `scale.labels.padding` | number | `3` | Space round the labels, px |
| `indicator.enabled` | boolean / string | off | Show the value indicator. Setting `type`, `color` or `size` also turns it on |
| `indicator.type` | string | `line` | `line`, `round` or `triangle` |
| `indicator.color` | colour | theme | Indicator colour; a [state map](/core/colours) works |
| `indicator.size.width` | number | `4` | Indicator width, px |
| `indicator.size.height` | number | `25` | Indicator height, px |
| `indicator.rotation` | number | `0` | Turn, degrees, -180 to 180. `180` points a triangle up |
| `indicator.offset.x` | number | `0` | Nudge sideways, px |
| `indicator.offset.y` | number | `0` | Nudge up or down, px |
| `indicator.border.enabled` | boolean | `true` | An outline round the indicator; `false` removes it |
| `indicator.border.width` | number | `1` | Outline width, px |
| `indicator.border.color` | colour | theme | Outline colour |
| `marker_indicator.type` | string | `triangle` | Marker shape: `line`, `round` or `triangle` |
| `marker_indicator.align` | string | `start` | Where the marker sits across the track: `start`, `center` or `end` |
| `marker_indicator.size.width` | number | `20` | Marker width, px |
| `marker_indicator.size.height` | number | `20` | Marker height, px |
| `marker_indicator.rotation` | number | `180` | Turn, degrees; `180` points a triangle at the ticks |
| `marker_indicator.offset.x` | number | `0` | Nudge from the aligned place, px (used on upright gauges) |
| `marker_indicator.offset.y` | number | `10` (flat), `0` (upright) | Nudge from the aligned place, px (used on flat gauges) |
| `marker_indicator.color` | colour | theme | Marker colour |
| `marker_indicator.border.enabled` | boolean | `false` | An outline round each marker |
| `marker_indicator.border.width` | number | `1` | Outline width, px |
| `marker_indicator.border.color` | colour | theme | Outline colour |

## `style.border`

**LCARS caps on the ends and sides of the track, with an optional rounded card outline.** A left cap alone is the classic LCARS end.

- A cap is drawn only when its side has `enabled: true` and a `size` above 0. The track then starts inside it.
- Text fields without a `zone` go into the first cap that is on, in the order `left`, `right`, `top`, `bottom`. See [Text labels](#text-labels).
- `radius` rounds the corners of the whole card, caps and track together.

```yaml live
type: custom:lcards-slider
entity: light.bedroom
preset: pills-basic
style:
  border:
    radius: 8
    left:
      enabled: true
      size: 20
      color:
        default: var(--lcards-gray)
        active: var(--lcars-orange)
```

::: details More about style.border
- **Rounding one end:** set the corner keys instead of one number, for example `top_right: 12` and `bottom_right: 12` with the left corners at `0`. The `*-left-border-rounded` presets do this, so the capped end stays square.
- **Large radii:** a corner's radius is capped at half the card's shorter side.
- **Hover and press:** a cap's state map also takes `hover` and `pressed` colours.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `radius` | number / string | - | Corner radius of the card: px, a `px` or `rem` string, or a CSS variable such as `var(--ha-card-border-radius, var(--ha-border-radius-lg))` (a theme variable: give it a fallback). Unset, the corners are square |
| `radius.top_left` | number / string | `0` | One corner only, px or a CSS variable |
| `radius.top_right` | number / string | `0` | One corner only |
| `radius.bottom_right` | number / string | `0` | One corner only |
| `radius.bottom_left` | number / string | `0` | One corner only |
| `left.enabled` | boolean | `false` | Draw the left cap |
| `left.size` | number | `0` | Left cap width, px |
| `left.color` | colour | theme | Left cap colour; a [state map](/core/colours) works |
| `right.enabled` | boolean | `false` | Draw the right cap |
| `right.size` | number | `0` | Right cap width, px |
| `right.color` | colour | theme | Right cap colour |
| `top.enabled` | boolean | `false` | Draw the top cap |
| `top.size` | number | `0` | Top cap height, px |
| `top.color` | colour | theme | Top cap colour |
| `bottom.enabled` | boolean | `false` | Draw the bottom cap |
| `bottom.size` | number | `0` | Bottom cap height, px |
| `bottom.color` | colour | theme | Bottom cap colour |

## Text labels

**Text fields of your own, such as a label and a read-out of the value.** The pills and gauge presets show no text until you add some.

- A field without a `zone` goes into the first [border cap](#style-border) that is on. Set `zone: track` to put it over the track instead.
- The presets already hold a `name` field (the entity's name) and a `state` field (the value) that are hidden. Turn one on with `show: true`; the ring and shaped presets already show both.
- Every [text field](/core/text-fields) key works here, including templates in `content`.

```yaml live controls
type: custom:lcards-slider
entity: light.bedroom
preset: pills-left-border
text:
  default:
    color: var(--lcards-moonlight)
  label:
    content: Brightness
    zone: track
    position: top-left
    font_size: 11
  value:
    content: "[[[return Math.round(entity.attributes.brightness / 255 * 100) + '%']]]"
    zone: track
    position: top-right
    font_size: 11
```

::: details More about text labels
- **Missing zones:** a `zone` that does not exist on the card, such as a cap that is off, puts the field over the track.
- **Preset text style:** the presets set `text.default` to the theme's LCARS font in upper case.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `text.<name>` | object | - | A text field of your own; any name except `default` |
| `text.<name>.content` | string | - | The text; [templates](/core/templates/) work |
| `text.<name>.zone` | string | first cap | `left`, `right`, `top` or `bottom` (a cap that is on), or `track`. With no cap on, `track` |
| `text.<name>.position` | string | from `default` | Where in the zone: `top-left`, `center`, `bottom-right` ... (see [Placing text](/core/text-fields-placement#position)) |
| `text.<name>.show` | boolean | `true` | Show or hide the field |
| `text.default` | object | theme font, upper case | Style every field inherits. It is not drawn itself |
| `text.name.show` | boolean | `false` | Show the entity's name |
| `text.state.show` | boolean | `false` | Show the value: a light's brightness as a percentage, otherwise the entity's state |
| [Text field keys](/core/text-fields) | | | `font_size`, `color`, `font_weight`, `text_transform` and the rest |

## Putting it together

**A thermostat: a gauge with its own scale, coloured comfort bands, a state-coloured fill and a left cap.**

```yaml live
type: custom:lcards-slider
entity: climate.living_room
preset: gauge-basic
control:
  attribute: temperature
  min: 15
  max: 30
  step: 0.5
text:
  label:
    content: Living Room
    zone: track # over the track, not in the left cap
    position: top-left
    font_size: 11
    text_transform: uppercase
  value:
    content: "[[[return entity.attributes.current_temperature + '°C']]]"
    zone: track
    position: top-right
    font_size: 11
style:
  track:
    height: 52
    display:
      unit: "°C"
  gauge:
    progress_bar:
      color:
        default: var(--lcards-blue)
        heat: var(--lcars-alert-red)
        cool: var(--lcards-blue)
      radius: 3
    scale:
      tick_marks:
        major:
          interval: 5
        minor:
          interval: 1
    indicator:
      type: triangle
      rotation: 180
      size:
        width: 18
        height: 16
      color: var(--lcars-orange)
  ranges:
    - min: 15
      max: 19
      color: var(--lcards-blue)
      opacity: 0.25
    - min: 19
      max: 24
      color: theme:colors.status.success
      opacity: 0.25
    - min: 24
      max: 30
      color: theme:colors.status.error
      opacity: 0.25
  border:
    radius: 8
    left:
      enabled: true
      size: 20
      color:
        default: var(--lcards-gray)
        active: var(--lcars-orange)
tap_action:
  action: more-info
```
