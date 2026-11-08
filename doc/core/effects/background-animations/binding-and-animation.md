---
description: "Background animations that react: config values that follow an entity (map_range and templates), animating the background from triggers and rules, and which keys can move."
---

# Binding and Animation

A background can react to Home Assistant in two ways: a `config` value can follow an entity, and an animation can change the background when a trigger fires or a rule matches. The keys of one entry are on the [Background Animations](/core/effects/background-animations#effect-options) page.

## Entity binding

**Any value in an effect's `config` can follow an entity: give it a `map_range` or a template instead of a fixed value.** Use it for a grid that scrolls faster as power rises, or a level that fills with a tank sensor.

- [`map_range`](#map-range) maps a number from the entity onto the key's range, with no template to write. [Templates](#templates) are for anything else.
- The [animatable keys](#animatable-keys) glide to the new value over the entry's `transition` (500 ms unless you set it); other keys snap or stay fixed, see [Which keys follow an entity](#which-keys-follow-an-entity).
- The card editor shows this as a tip; you write the binding in the card's YAML.

```yaml live controls
type: custom:lcards-button
preset: outline
entity: input_number.lcards_test_value
text:
  name:
    content: SCAN RATE
    show: true
grid_options:
  rows: 3
background_animation:
  # scroll speed follows the value, gliding over 1.5 s
  - preset: grid
    transition: 1500
    config:
      color: alpha(var(--lcars-orange), 0.4)
      scroll_speed_x:
        map_range:
          input: [0, 100]
          output: [0, 120]
```

::: details More about entity binding
- **Also in `shape_texture`:** a button's or elbow's [shape texture](/cards/button/textures#shape-texture) reads `map_range` and template strings in its `config` the same way, without the glide.
- **The first value snaps:** the value the card loads with is applied at once; only later changes glide. `transition: 0` and reduced motion always snap.
- **When it updates:** bound values are worked out again on every Home Assistant update.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `config.<key>` | value / object / string | - | A fixed value, a [`map_range`](#map-range) object, or a [template](#templates) |
| `transition` | number | `500` | Milliseconds a bound animatable key takes to glide to a new value; `0` snaps |

### map_range

**`map_range` reads a number from an entity and maps it from the `input` range onto the `output` range.** `brightness` 0 to 255 onto a scroll speed of -200 to 200, say.

- Without `attribute` it reads the entity's state; the value must be a number.
- Without `entity` it reads the card's own `entity`. On the MSD and astrometrics cards, which have no card entity, set it.
- A value outside `input` is held at the ends of `output` unless `clamp: false`.

```yaml live controls
type: custom:lcards-button
preset: outline
entity: light.bridge
text:
  name:
    content: PLASMA FLOW
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: plasma
    config:
      # the light's brightness sets how fast the plasma drifts
      scroll_speed_x:
        map_range:
          attribute: brightness
          input: [0, 255]
          output: [-200, 200]
      scroll_speed_y:
        map_range:
          attribute: brightness
          input: [0, 255]
          output: [5, 60]
```

::: details More about map_range
- **Colours too:** with two colours as `output`, a colour key is blended between them, transparency too. Each can be any colour LCARdS accepts (a hex of any length, a named colour, `rgb()` or `hsl()`, a CSS variable, a `theme:` token or a computed colour such as `alpha()`); colours always hold at the ends of `output`.
- **A value that isn't a number:** the key keeps its current value and a warning is logged in the browser console.
- **The older name:** `entity_id` still works in place of `entity`, as in earlier versions.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `map_range.entity` | string | the card's `entity` | The entity to read |
| `map_range.attribute` | string | the state | The attribute to read instead of the state |
| `map_range.input` | `[min, max]` | required | The range of the entity's value |
| `map_range.output` | `[min, max]` | required | The range of the key's value: two numbers or two colours |
| `map_range.clamp` | boolean | `true` | Hold the result inside `output` |

### Templates

**A template string works out the value in JavaScript (`[[[ ... ]]]`) or from tokens (`{entity.state}`).** The result is a number when it looks like one, otherwise a string such as a colour.

- In JavaScript, `entity` is the card's entity, and `hass`, `config` and `variables` are there too. Home Assistant (Jinja) templates are not evaluated in a background.
- The object form, `template` with `default`, always gives a number: `default` when the template's result isn't one.

```yaml live controls
type: custom:lcards-button
preset: outline
entity: input_number.lcards_test_value
text:
  name:
    content: TANK
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: level
    config:
      # the fill follows the value
      fill_pct: "[[[ return Number(entity.state) ]]]"
      # faster waves as it fills, 20 until the value is known
      wave_speed:
        template: "[[[ return 10 + Number(entity.state) / 2 ]]]"
        default: 20
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `config.<key>` | string | - | A `[[[ JavaScript ]]]` or `{token}` template |
| `config.<key>.template` | string | required | The template, in the object form |
| `config.<key>.default` | number | `0` | The value when the template's result isn't a number |

### Which keys follow an entity

**How a bound value is applied depends on the key: it glides, it snaps, or it can't change after the effect starts.**

- **Glides:** the [animatable keys](#animatable-keys) move to the new value over `transition`.
- **Snaps:** other keys of `level`, `fluid`, `plasma`, `flow`, `shimmer`, `scanlines`, `image` and `contour-field` change at once (the field is worked out again, the image reloads).
- **Fixed:** other keys of `grid`, `grid-diagonal`, `grid-hexagonal`, `starfield`, `nebula`, `cascade`, `solid`, `warp-starfield` and `holo-sphere` (a star `count`, a grid `pattern`) are set when the effect is created. A binding on one is logged once in the browser console and does nothing.

```yaml live controls
type: custom:lcards-button
preset: outline
entity: input_number.lcards_test_value
text:
  name:
    content: STARS
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: starfield
    config:
      count: 200 # fixed: set once
      # glides: an animatable key
      scroll_speed_x:
        map_range:
          input: [0, 100]
          output: [10, 200]
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `transition` | number | `500` | Glide time for the animatable keys, ms |

## Animating the background

**An animation can change the card's background effects instead of a part of the card: set `target: background`.** A trigger, a `while` condition or a rule (`apply.animations`) can then ramp a starfield to warp on red alert, or tint a grid.

- `effect` picks one entry by its place in the list (`0` is the first, the bottom layer, and disabled entries count); without it, every entry is animated.
- Use `preset: custom` and put the effect's keys in `params`, written like any anime.js property: `[from, to]`, a single end value, or keyframes. Only the [animatable keys](#animatable-keys) can move.
- Easing, `loop`, `alternate` and reduced motion work as for any [animation](/core/animations). Stopping a running animation puts the values back.

```yaml live controls
type: custom:lcards-button
preset: outline
entity: input_select.lcards_alert_mode
text:
  name:
    content: WARP
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: starfield
    zoom:
      layers: 4
      duration: 12
    config:
      scroll_speed_x: 0
animations:
  # ramp the stars (and the zoom cycle) to 8x over 2 s when red alert starts
  - trigger: on_entity_change
    entity: input_select.lcards_alert_mode
    to_state: red_alert
    target: background
    effect: 0
    preset: custom
    params:
      speed: [1, 8]
      duration: 2000
      ease: inOutQuad
  # and back down when it ends
  - trigger: on_entity_change
    entity: input_select.lcards_alert_mode
    from_state: red_alert
    target: background
    effect: 0
    preset: custom
    params:
      speed: 1
      duration: 3000
      ease: outQuad
```

::: details More about animating the background
- **Through an alert:** the animation keeps running when an alert mode recolours the background; the effects are rebuilt with the new palette and pick up the animated values.
- **Without animations:** the same warp works with a binding. A template picks the speed and `transition` sets the glide:

  ```yaml
  background_animation:
    - preset: starfield
      transition: 2000
      config:
        speed: "[[[ return entity.state === 'red_alert' ? 8 : 1 ]]]"
  ```
- **A key that can't move:** naming one in `params` is logged once in the browser console.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `target` | string | - | `background`: animate the card's background effects |
| `effect` | number | every entry | The entry to animate, by its place in the list (`0` is the first) |
| `preset` | string | - | `custom`, with the effect's keys in `params` |
| `params` | object | - | The [animatable keys](#animatable-keys) to change, plus `duration`, `ease` and the other animation timing keys |

## Animatable keys

**These are the keys an animation can move and a binding can glide.** Every effect also takes `opacity` and the transform keys `x` and `y` (offset in px), `rotate` (degrees) and `scale` (about the centre); every effect that moves takes `speed`. Colour keys accept every LCARdS colour form.

- Other keys are left out on purpose: changing them means rebuilding the effect (a new star layout, a field worked out again), too slow to do every frame.
- The WebGL versions of the noise presets have nothing to rebuild, so their noise keys are animatable there; under `renderer: canvas` or without WebGL they have the Canvas2D list.

| Preset | Keys |
|---|---|
| `grid`, `grid-diagonal`, `grid-hexagonal` | `scroll_speed_x`, `scroll_speed_y`, `line_spacing`, `line_width`, `line_width_minor`, `line_width_major`, `color`, `color_major`, `fill_color` (those the preset takes); `grid` also `spoke_count`, `polar_x`, `polar_y`; on WebGL also `camera_tilt`, `camera_yaw`, `camera_roll`, `camera_distance`, `fov`, `scan_color`, `surface_size`, `surface_length`, `back_opacity`, `surface_rotate_x`, `surface_rotate_y`, `surface_rotate_z`, `well_throat`, `well_morph`, `well_ripple`, `well_ripple_waves`, `well_ripple_speed` |
| `starfield` | `scroll_speed_x`, `scroll_speed_y`, `color` (one colour for every star) |
| `nebula` | `scroll_speed_x`, `scroll_speed_y`, `turbulence` |
| `contour-field` | `scroll_speed_x`, `scroll_speed_y`; on WebGL also `noise_scale`, `num_bands`, `fill_level` |
| `cascade` | (the common keys) |
| `level` | `fill_pct`, `wave_height`, `wave_speed`, `wave2_height`, `wave2_speed`, `slosh_amount` |
| `fluid` | `scroll_speed_x`, `scroll_speed_y`; on WebGL also `base_frequency`, `color` |
| `plasma` | `scroll_speed_x`, `scroll_speed_y`; on WebGL also `base_frequency`, `color_a`, `color_b` |
| `flow` | `scroll_speed_x`, `scroll_speed_y`, `wave_scale` |
| `scanlines` | `scroll_speed_x`, `scroll_speed_y`, `line_spacing`, `line_width` |
| `shimmer` | `highlight_width`, `angle` |
| `image` | `opacity` and the transform keys (no `speed`) |
| `solid` | `opacity`, `color` and the transform keys (no `speed`) |
| `warp-starfield` | `streak`, `camera_tilt`, `camera_yaw`, `camera_roll`, `fov`, `color` |
| `holo-sphere` | `rotate_speed`, `tilt`, `size`, `position_x`, `position_y`, `back_opacity`, `line_width`, `color`, `scan_color` |
