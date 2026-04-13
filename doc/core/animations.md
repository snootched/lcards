# Card Animations

LCARdS cards support anime.js-powered animations triggered by user interactions or entity state changes. Each card can have multiple animations with different triggers.

::: info anime.js v4
LCARdS uses **anime.js v4**, which has a different API from v3. Key differences users should know:
- The `ease` property uses v4 naming convention: `inOutQuad`, `outElastic`, `inOutSine` (no `ease` prefix). v3-style names like `easeInOutQuad` are passed through as-is and may work, but v4 names are preferred.
- The `easing` property from v3 is not supported — always use `ease`.
- Spring physics: `{ type: 'spring', params: { stiffness: 150, damping: 20 } }` syntax is the same.
:::

---

## Basic Structure

Animations are defined in a card's `animations` array:

```yaml
animations:
  - id: tap-pulse           # Optional identifier
    trigger: on_tap
    preset: pulse
  - trigger: on_entity_change
    preset: glow
    entity: binary_sensor.motion
    to_state: "on"
    params:
      color: "{theme:colors.alert.red}"
```

---

## Triggers

| Trigger | When it fires |
|---------|--------------|
| `on_tap` | Card is tapped or clicked |
| `on_hold` | Long-press on the card |
| `on_hover` | Mouse enters the card |
| `on_leave` | Mouse leaves the card |
| `on_load` | Card is rendered on page load |
| `on_entity_change` | A watched entity changes state |

---

## Animation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `trigger` | string | — | When to run (required) |
| `preset` | string | — | Animation preset name (required) |
| `id` | string | — | Optional identifier — alphanumeric, hyphens, and underscores only |
| `enabled` | boolean | `true` | Set to `false` to disable without removing |
| `duration` | number | preset default | Duration in ms (0–10 000). Accepts a `map_range` descriptor. |
| `delay` | number | `0` | Delay before starting (ms). Accepts a `map_range` descriptor. |
| `loop` | boolean / number | preset default | `true` = infinite loop, `false` = once, number = iteration count |
| `alternate` | boolean | preset default | Reverse direction on each loop |
| `ease` | string / object | preset default | Easing function — see below |
| `params` | object | — | Preset-specific parameters. Each value may be a `map_range` descriptor. |
| `target` | string | — | CSS selector or `data-field-id` to restrict which element animates |
| `entity` | string | card entity | Entity to watch (for `on_entity_change`) |
| `attribute` | string | — | Attribute to read instead of entity state. Applies to `from_state`, `to_state`, and `while`. Use `brightness_pct` for a 0–100 light brightness percentage. |
| `from_state` | string | — | **Fire-and-forget gate:** only trigger when transitioning FROM this value |
| `to_state` | string | — | **Fire-and-forget gate:** only trigger when transitioning TO this value |
| `while` | object | — | **Lifecycle condition** (`loop: true` required): plays while true, stops when false — see below |
| `check_on_load` | boolean | `true` | Evaluate condition on card load. Starts a looping animation immediately if the `while` condition is already met, or fires once if already in `to_state`. Set to `false` to react only to state transitions after load. |

### `while` condition keys

Use exactly one key inside `while`:

| Key | Type | Meaning |
|---|---|---|
| `state` | string | value equals this string |
| `not_state` | string | value does NOT equal this string |
| `above` | number | numeric value strictly greater than threshold |
| `below` | number | numeric value strictly less than threshold |

```yaml
# Auto-stop loop when light turns off
- trigger: on_entity_change
  entity: light.kitchen
  preset: pulse
  loop: true
  while:
    state: 'on'
  check_on_load: true

# Attribute-based threshold with brightness_pct
- trigger: on_entity_change
  entity: light.living_room
  attribute: brightness_pct   # 0-100, computed from raw 0-255 brightness
  while:
    above: 50
  preset: glow
  loop: true
```

> **`to_state` / `from_state` vs `while`:** `to_state` and `from_state` are fire-and-forget gates — they control when an animation *starts* but will not stop a looping animation. Use `while` to auto-stop a loop when the condition clears.

### `map_range` descriptors

Parameters that accept a number (`duration`, `delay`, any `params` field) can instead be a `map_range` descriptor that maps a live entity value linearly into the parameter range:

```yaml
- trigger: on_entity_change
  entity: sensor.wind_speed
  preset: rotate
  loop: true
  params:
    speed:
      map_range:
        entity: sensor.wind_speed
        input: [0, 50]           # entity value range
        output: [2000, 200]      # animation duration — faster when windier
        clamp: true
```

`map_range` works in both inline `config.animations` and rule-based `apply.animations`.

| Field | Required | Description |
|---|---|---|
| `entity` | ✅ | HA entity to read |
| `attribute` | — | Attribute instead of state (supports `brightness_pct`) |
| `input` | ✅ | `[min, max]` input range |
| `output` | ✅ | `[min, max]` numeric, or `['#hex', '#hex']` for colour interpolation |
| `clamp` | — | Clamp input to range (default `true`) |

---

## Motion Presets

### `pulse`

Scale and brightness breathing effect.

| Param | Default | Description |
|-------|---------|-------------|
| `max_scale` | `1.15` | Peak scale factor (alias: `scale`) |
| `max_brightness` | `1.4` | Peak brightness (1.0 = normal) |
| `duration` | `1200` | ms per cycle |
| `ease` | `easeInOutSine` | Easing function |
| `loop` | `true` | Loop continuously |
| `alternate` | `true` | Reverse on each loop |

### `glow`

Animated drop-shadow bloom.

| Param | Default | Description |
|-------|---------|-------------|
| `color` | `var(--lcars-blue)` | Glow colour (alias: `glow_color`) |
| `blur_min` | `0` | Minimum shadow blur (px) |
| `blur_max` | `10` | Maximum shadow blur (px) |
| `duration` | `1500` | ms per cycle |
| `ease` | `easeInOutSine` | Easing function |
| `loop` | `true` | Loop continuously |
| `alternate` | `true` | Reverse on each loop |

### `shake`

Horizontal vibrate effect.

| Param | Default | Description |
|-------|---------|-------------|
| `intensity` | `10` | Max displacement in px |
| `duration` | `500` | Total duration (ms) |
| `frequency` | `4` | Number of side-to-side shakes |
| `ease` | `easeInOutSine` | Easing function |
| `loop` | `false` | Loop continuously |

### `bounce`

Elastic scale bounce.

| Param | Default | Description |
|-------|---------|-------------|
| `scale_max` | `1.2` | Peak scale factor |
| `duration` | `800` | Duration (ms) |
| `bounces` | `3` | Number of bounces |
| `ease` | `easeOutElastic` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |

### `rotate`

Rotation animation.

| Param | Default | Description |
|-------|---------|-------------|
| `from` | `0` | Starting angle (degrees) |
| `to` | `360` | Ending angle (degrees) |
| `direction` | — | Shorthand: `clockwise` (0→360) or `counterclockwise` (0→−360) |
| `duration` | `1000` | Duration (ms) |
| `ease` | `linear` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |

### `blink`

Slow opacity blink.

| Param | Default | Description |
|-------|---------|-------------|
| `max_opacity` | `1.0` | Peak opacity |
| `min_opacity` | `0.3` | Trough opacity |
| `duration` | `1200` | ms per half-cycle |
| `ease` | `linear` | Easing function |
| `loop` | `true` | Loop continuously |
| `alternate` | `true` | Reverse on each loop |

### `strobe`

Rapid opacity flicker.

| Param | Default | Description |
|-------|---------|-------------|
| `max_opacity` | `1.0` | Peak opacity |
| `min_opacity` | `0` | Trough opacity |
| `duration` | `100` | ms per half-cycle |
| `ease` | `linear` | Easing function |
| `loop` | `true` | Loop continuously |
| `alternate` | `true` | Reverse on each loop |

### `fade`

Simple opacity transition.

| Param | Default | Description |
|-------|---------|-------------|
| `from` | `1` | Starting opacity |
| `to` | `0.3` | Target opacity |
| `duration` | `1000` | Duration (ms) |
| `ease` | `linear` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |

### `slide`

Slide in from a direction.

| Param | Default | Description |
|-------|---------|-------------|
| `from` | `right` | Entry direction: `up`, `down`, `left`, `right` (alias: `direction`) |
| `distance` | `100` | Distance in px (or `%` string) |
| `duration` | `500` | Duration (ms) |

### `scale`

Simple scale transform animation. Ideal for button feedback.

| Param | Default | Description |
|-------|---------|-------------|
| `scale` | `1.1` | Target scale factor |
| `from` | `1` | Starting scale |
| `duration` | `200` | Duration (ms) |
| `ease` | `outQuad` | Easing function |
| `loop` | `false` | Loop continuously |

### `scale-reset`

Returns an element to its original scale (1.0). Pair with `on_leave` to reset hover effects.

| Param | Default | Description |
|-------|---------|-------------|
| `duration` | `200` | Duration (ms) |
| `ease` | `outQuad` | Easing function |

```yaml
# Typical hover + reset pair
animations:
  - preset: scale
    trigger: on_hover
    params:
      scale: 1.1
  - preset: scale-reset
    trigger: on_leave
```

---

## Text Animation Presets

Target individual text elements with `target: "[data-field-id='my-field']"`.

### `text-reveal`

Characters/words/lines appear in sequence with a stagger.

| Param | Default | Description |
|-------|---------|-------------|
| `split` | `chars` | Split unit: `chars`, `words`, or `lines` |
| `stagger` | `50` | Delay between units (ms) |
| `duration` | `800` | Duration per unit (ms) |
| `from_opacity` | `0` | Starting opacity of each unit |
| `from_y` | `20` | Starting Y offset (px) |
| `loop` | `false` | Loop continuously |

### `text-scramble`

Matrix-style character scramble before settling on the real text.

| Param | Default | Description |
|-------|---------|-------------|
| `duration` | `800` | ms each character spends scrambling |
| `stagger` | `40` | Delay between characters starting (ms) |
| `delay` | `0` | Initial delay before animation starts (ms) |
| `settle_at` | `0.85` | Fraction (0–1) of `duration` spent scrambling |
| `characters` | `A-Z 0-9 !@#$%^&*` | Pool of random characters to cycle through |
| `loop` | `false` | Loop continuously |

### `text-glitch`

Rapid position and opacity jitter for a glitch/malfunction effect.

| Param | Default | Description |
|-------|---------|-------------|
| `intensity` | `5` | Max displacement in px / SVG units |
| `duration` | `300` | ms per glitch cycle |
| `stagger` | `50` | Delay between characters (ms) |
| `loop` | `false` | Loop continuously |

### `text-typewriter`

Characters appear one at a time at a fixed speed.

| Param | Default | Description |
|-------|---------|-------------|
| `speed` | `100` | ms per character |
| `loop` | `false` | Loop continuously |

---

## Visual Effect Presets

### `shimmer`

Fill colour and opacity animation for shimmering effects.

| Param | Default | Description |
|-------|---------|-------------|
| `color_from` | current fill | Starting colour |
| `color_to` | — | Target colour (required; alias: `shimmer_color`) |
| `opacity_from` | `1` | Starting opacity |
| `opacity_to` | `0.5` | Ending opacity |
| `duration` | `1500` | Duration (ms) |
| `ease` | `inOutSine` | Easing function |
| `loop` | `true` | Loop continuously |
| `alternate` | `true` | Reverse on each loop |

### `flicker`

Randomised opacity animation for flickering effects.

| Param | Default | Description |
|-------|---------|-------------|
| `max_opacity` | `1` | Maximum opacity |
| `min_opacity` | `0.3` | Minimum opacity |
| `duration` | `1000` | Duration (ms) |
| `ease` | `linear` | Easing function |
| `loop` | `true` | Loop continuously |

### `cascade`

Staggered animation for multiple target elements.

| Param | Default | Description |
|-------|---------|-------------|
| `stagger` | `100` | Delay between elements (ms) |
| `property` | `opacity` | Property to animate |
| `from` | `0` | Starting value |
| `to` | `1` | Ending value |
| `duration` | `1000` | Duration (ms) |
| `ease` | `outExpo` | Easing function |
| `loop` | `false` | Loop continuously |

### `ripple`

Expanding scale with opacity fade.

| Param | Default | Description |
|-------|---------|-------------|
| `scale_max` | `1.5` | Maximum scale |
| `opacity_min` | `0` | Minimum opacity at peak |
| `duration` | `1000` | Duration (ms) |
| `ease` | `outExpo` | Easing function |
| `loop` | `false` | Loop continuously |

---

## SVG-Specific Presets

### `draw`

SVG path drawing animation using `strokeDashoffset`. Apply to `<path>` elements.

| Param | Default | Description |
|-------|---------|-------------|
| `reverse` | `false` | Draw in reverse direction |
| `duration` | `2000` | Duration (ms) |
| `ease` | `linear` | Easing function |
| `loop` | `false` | Loop continuously |

### `march`

CSS-based marching dashed line animation. More performant than JS for continuous animations.

| Param | Default | Description |
|-------|---------|-------------|
| `dash_length` | `10` | Length of each dash |
| `gap_length` | `5` | Gap between dashes |
| `speed` | `2` | Seconds per cycle |
| `direction` | `forward` | `forward` or `reverse` |

---

## Utility Presets

### `set`

Immediately sets properties without animation. Useful for establishing initial state before other animations.

| Param | Default | Description |
|-------|---------|-------------|
| `properties` | — | Object with CSS properties to set |

```yaml
animations:
  - preset: set
    trigger: on_load
    params:
      properties:
        opacity: 0.5
        fill: red
```

### `motionpath`

Path-following animation (requires a `<path>` element in the SVG).

| Param | Default | Description |
|-------|---------|-------------|
| `path_selector` | — | CSS selector for path element (required) |
| `duration` | `4000` | Duration (ms) |
| `ease` | `linear` | Easing function |
| `loop` | `true` | Loop continuously |

---

## Easing Functions

LCARdS uses **anime.js v4** easing names (without the `ease` prefix used in v3):

```yaml
ease: "inOutQuad"       # Standard in-out (v4) — was easeInOutQuad in v3
ease: "outElastic"      # Elastic bounce out
ease: "inOutSine"       # Smooth sine curve
ease: "linear"          # Constant speed
ease:                    # Spring physics
  type: spring
  params:
    stiffness: 150
    damping: 20
```

**Common easing names (v4):**

| Category | Names |
|----------|-------|
| Quad | `inQuad`, `outQuad`, `inOutQuad` |
| Cubic | `inCubic`, `outCubic`, `inOutCubic` |
| Sine | `inSine`, `outSine`, `inOutSine` |
| Expo | `inExpo`, `outExpo`, `inOutExpo` |
| Elastic | `inElastic`, `outElastic`, `inOutElastic` |
| Back | `inBack`, `outBack`, `inOutBack` |
| Bounce | `inBounce`, `outBounce`, `inOutBounce` |
| Other | `linear`, `steps(N)` |

---

## Comprehensive Example

A button showing: load animation, tap feedback, hover glow, entity change with state filter, and a text scramble targeted to a specific field.

```yaml
type: custom:lcards-button
entity: light.workbench
preset: lozenge
text:
  label:
    content: Workbench
    position: top-left
  state:
    content: "{entity.state}"
    position: center

animations:
  # Entrance animation — runs once on load
  - trigger: on_load
    preset: fade
    params:
      from: 0
      to: 1
    duration: 800

  # Tap feedback — quick bounce
  - trigger: on_tap
    preset: bounce
    params:
      scale_max: 1.08
      bounces: 2
    duration: 400

  # Hover glow — looping while mouse is over
  - trigger: on_hover
    preset: glow
    params:
      color: "var(--lcards-orange)"
      blur_max: 12

  # Entity turns on — pulse with scramble on the state label
  - trigger: on_entity_change
    entity: light.workbench
    to_state: "on"
    check_on_load: true
    preset: pulse
    duration: 1000
    loop: true
    params:
      max_scale: 1.05

  # Entity turns off — stop loop by playing once in reverse
  - trigger: on_entity_change
    entity: light.workbench
    to_state: "off"
    preset: fade
    params:
      from: 1
      to: 0.7
    duration: 300
    loop: 1
    alternate: true
```
---
