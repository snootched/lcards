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
- **A blind that fills from the top:** set `invert_value: true` here and `style.track.invert_fill: true`. The fill then comes down from the top as the lowered part of the blind and dragging up opens it, while the drag badge and the scale still show the blind's own position.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `min` | number | by domain | Lowest value the slider can set |
| `max` | number | by domain | Highest value the slider can set |
| `step` | number | by domain | Smallest change, at least 0.01 |
| `attribute` | string | by domain | The attribute the slider shows and sets |
| `locked` | boolean | `false` when it can set its attribute, else `true` | `true`: only show the value |
| `invert_value` | boolean | `false` | Swap the ends: the minimum at the right (or top), so dragging right lowers the value. The drag badge, the scale, ranges and value markers still use the entity's own values |
| `live_update` | boolean | `true` for a light, else `false` | The entity follows the handle while it is dragged. See [Live update](#live-update) |

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

## Live update

**A light follows the slider while you drag it, not only when you let go.** You see the lamp brighten, dim or warm as you move the handle, the way a dimmer feels.

- It is on for a light, whichever attribute the slider sets (brightness, colour temperature), and off for every other domain: a thermostat, a cover motor or an automation on an `input_number` would get a burst of changes. Set `control.live_update` to turn it on or off for one slider.
- One change goes out at a time, at most five a second, and the value you let go at is always sent last, so a slow light or a busy mesh network never gets a queue of old values.
- The handle stays where you put it while the light catches up: the light's late replies don't pull it back.

```yaml live controls
type: custom:lcards-slider
entity: light.living_room
preset: pills-left-border
control:
  live_update: true # the default for a light; false sends only when you let go
```

::: details More about live update
- **Switching off:** a light is not switched off mid-drag at the bottom of the brightness range (it would go off and on again as you pass through). Let go at the bottom to switch it off.
- **Slow lights:** each change waits for the one before it to be accepted, so a light that answers slowly simply gets fewer, later steps; it never falls behind by more than one change.
- **Other domains:** `live_update: true` works for any slider that can set its entity, such as a fan's speed or a media player's volume. Leave it off where every change triggers something (heating, a motor, an automation).
- **Credit:** the idea comes from the live updates in the [Hue-like light card](https://github.com/Gh61/lovelace-hue-like-light-card); LCARdS has its own implementation.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `control.live_update` | boolean | `true` for a light, else `false` | The entity follows the handle while it is dragged: one change at a time, at most five a second, the last value always sent on release |

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
