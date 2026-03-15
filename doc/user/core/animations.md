# Card Animations

LCARdS cards support anime.js-powered animations triggered by user interactions or entity state changes. Each card can have multiple animations with different triggers.

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
| `id` | string | — | Optional identifier for this animation — alphanumeric, hyphens, and underscores only |
| `enabled` | boolean | `true` | Set to `false` to disable without removing |
| `duration` | number | preset default | Duration in ms (0–10 000) |
| `delay` | number | `0` | Delay before starting (ms) |
| `loop` | boolean / number | preset default | `true` = infinite loop, `false` = once, number = iteration count |
| `alternate` | boolean | preset default | Reverse direction on each loop |
| `ease` | string / object | preset default | Easing function — see below |
| `params` | object | — | Preset-specific parameters — see preset tables |
| `target` | string | — | CSS selector or `data-field-id` attribute to restrict which element animates |
| `entity` | string | card entity | Entity to watch (for `on_entity_change`) |
| `from_state` | string | — | Only fire when transitioning FROM this state |
| `to_state` | string | — | Only fire when transitioning TO this state |
| `check_on_load` | boolean | `false` | Check entity state immediately on load and fire if it matches `to_state` |

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

## Easing Functions

```yaml
ease: "easeInOutQuad"       # Standard in-out
ease: "easeOutElastic"      # Elastic bounce out
ease: "easeInOutSine"       # Smooth sine curve
ease: "linear"              # Constant speed
ease:                       # Spring physics
  type: spring
  params:
    stiffness: 150
    damping: 20
```

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
    params:
      max_scale: 1.05
      duration: 1000
    loop: true

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
