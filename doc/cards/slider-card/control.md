---
description: "Slider card control: what each entity domain controls, min, max and step, read-only sliders, value easing (value_tween) and the drag value badge."
---

# Control and Motion

What the slider sets and how it moves: the `control` block, what each kind of entity controls, the glide to a new value, and the badge you see while dragging.

## Control options

**`control` changes what the slider can set: its range, its step, or whether it can be dragged at all.** The slider works all of this out from the entity, so you only need `control` to change something, such as a cover that should never close below 20 %.

- `control.min` and `control.max` limit what the slider can set. The scale the track shows can be different: set it with [`style.track.display`](./styles#style-track).
- A light's brightness is set in percent (0 to 100), and a media player's volume too, whatever the entity stores.

```yaml live
type: custom:lcards-slider
entity: cover.living_room_blinds
preset: pills-left-border
control:
  min: 20 # never close the blinds fully
  max: 100
  step: 5
```

::: details More about control
- **Another attribute:** `attribute` picks what the slider shows and sets, such as a light's colour temperature or a cover's tilt. The attributes it can set are in [Automatic domain behaviour](#automatic-domain-behaviour); any other attribute is shown read-only. It also takes a token or a `[[[JavaScript]]]` template that returns an attribute name.
- **Read-only sliders:** a slider with nothing to set (a sensor, or an attribute no action sets) stays read-only even with `locked: false`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `min` | number | by domain | Lowest value the slider can set |
| `max` | number | by domain | Highest value the slider can set |
| `step` | number | by domain | Smallest change, at least 0.01 |
| `attribute` | string | by domain | The attribute the slider shows and sets |
| `locked` | boolean | `false` when it can set its attribute, else `true` | `true`: only show the value |
| `invert_value` | boolean | `false` | Swap the ends: the minimum at the right (or top), so dragging right lowers the value. To only draw the fill from the other end, use [`style.track.invert_fill`](./styles#style-track) |

### Automatic domain behaviour

**The entity's domain decides what a slider controls and its range.** These are the defaults that the `control` keys above change.

- Without a [preset](./#presets), the draggable domains draw a pill bar and every other domain draws a gauge.
- A climate entity or water heater without `min_temp` and `max_temp` falls back to 15 to 30 (15 to 60 for a water heater), in steps of `target_temp_step` or 0.5.

```yaml live
type: custom:lcards-slider
entity: climate.living_room # the range comes from its min_temp and max_temp
preset: pills-left-border-rounded
```

| Domain | Draggable | Controls | Range |
|--------|-----------|----------|-------|
| `light` | Yes | `brightness` | 0–100 (%) |
| `cover` | Yes | `current_position` | 0–100 |
| `fan` | Yes | `percentage` | 0–100 |
| `climate` | Yes | `temperature` | the entity's `min_temp`–`max_temp` |
| `water_heater` | Yes | `temperature` | the entity's `min_temp`–`max_temp` |
| `media_player` | Yes | `volume_level` | 0–100 (%) |
| `humidifier` | Yes | `humidity` | the entity's `min_humidity`–`max_humidity` |
| `valve` | Yes | `current_valve_position` | 0–100 |
| `input_number` | Yes | its state | the entity's `min`, `max`, `step` |
| `number` | Yes | its state | the entity's `min`, `max`, `step` |
| `sensor` | No | its state | 0–100, or the entity's `min` and `max` |

Every other domain is read-only, like a sensor.

**Other attributes it can set** with `control.attribute`:

```yaml live controls
type: custom:lcards-slider
entity: light.living_room
preset: pills-left-border
control:
  attribute: color_temp_kelvin # warm to cool, instead of brightness
```

| Domain | `attribute` | Range |
|--------|-------------|-------|
| `light` | `color_temp_kelvin` | the light's `min_color_temp_kelvin`–`max_color_temp_kelvin` (K), steps of 50 |
| `cover` | `current_tilt_position` | 0–100 (%) |
| `climate` | `target_temp_low`, `target_temp_high` | the entity's `min_temp`–`max_temp`; the other target is sent with it, so it works in heat/cool mode |
| `climate` | `humidity` | the entity's `min_humidity`–`max_humidity` |

## Value tween

**The fill and markers glide to a new value instead of jumping.** It is on by default, and it only runs when the value changes from outside the slider: an automation, another card or the device itself.

- Dragging stays instant: the fill follows your finger. Only positions glide; text and colours change at once.
- The glide is off when the device asks for reduced motion, whatever `enabled` says.

In this example the fill follows your drag at once, and the marker follows the number's state. Drag and let go: when the entity reports its new value, the marker glides there over 1.5 seconds, as the fill would for a change from outside.

```yaml live
type: custom:lcards-slider
entity: input_number.demo_level
preset: gauge-basic
value_tween:
  duration: 1500
  ease: outBack
style:
  ranges:
    # follows the entity's state, so it glides after a drag
    - value: "{entity.state}"
      indicator:
        color: var(--lcars-orange)
```

::: details More about value tween
- **`spring`:** a springy glide that overshoots and bounces back. Its speed follows `duration`, but the last small bounces take longer to settle: about three times `duration`.
- **A shaped slider** has no markers, so `targets.markers` does nothing there.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | boolean | `true` | Glide to new values |
| `duration` | number | `500` | Milliseconds, 0 to 5000 |
| `ease` | string | `outQuad` | `linear`, `spring`, `in`, `out`, `inOut`, `outIn`, or those joined to `Quad`, `Cubic`, `Quart`, `Quint`, `Sine`, `Expo`, `Circ`, `Back`, `Elastic` or `Bounce` (`inQuad`, `outCubic`, `inOutSine` ...) |
| `targets.track` | boolean | `true` | Glide the fill and indicator (gauge, shaped, ring) or the lit pills (pills) |
| `targets.markers` | boolean | `true` | Glide [value markers](./ranges#value-marker-fields) and their captions |

## Drag value badge

**A small badge shows the value you are dragging to, like Home Assistant's own sliders.** It is off by default; turn it on with `drag_badge.enabled: true`.

- The badge sits below a flat track, beside an upright one (to the left on the Picard gauge), and in the centre of a ring. It draws outside the track, so leave room below or beside the card.
- It shows only while you drag, never for changes from elsewhere, and only on a slider you can drag.

```yaml live
type: custom:lcards-slider
entity: light.bedroom
preset: pills-left-border
drag_badge:
  enabled: true
  format:
    decimals: 0
  background:
    color:
      default: var(--lcars-blue)
```

::: details More about the drag badge
- **Unit:** the badge uses the unit the track shows: `style.track.display.unit`, else the entity's unit, else `%` for lights, covers, fans, media players, humidifiers and valves.
- **Release:** the badge appears at once when a drag starts. On release it fades out over `release.duration`, or hides at once with `behavior: instant` or when the device asks for reduced motion.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | boolean | `false` | Show the badge while dragging |
| `format.decimals` | number | locale default | Decimal places, 0 to 4 |
| `format.show_unit` | boolean | `true` | Show the unit |
| `format.unit` | string | the track's unit | Unit to show instead |
| `font_size` | number | `14` | Text size, px (8 to 48) |
| `offset.x` | number | `0` | Nudge right, px |
| `offset.y` | number | `0` | Nudge down, px. Write `"y"` in quotes: Home Assistant's editor reads a bare `y` as `true` |
| `color` | colour / object | `var(--lcars-text-light)` | Text colour; a [state map](/core/colours) works |
| `background.enabled` | boolean | `true` | A chip behind the text |
| `background.color` | colour / object | see-through surface | Chip colour |
| `border.enabled` | boolean | `true` | A border round the chip |
| `border.width` | number | `1` | Border width, px (0 to 10) |
| `border.color` | colour / object | theme border | Border colour |
| `release.behavior` | string | `fade` | On release: `fade` fades the badge out, `instant` hides it at once |
| `release.duration` | number | `500` | Fade time, ms, 0 to 2000 (`fade` only) |
