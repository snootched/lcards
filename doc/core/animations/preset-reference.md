# Animation Preset Reference

All built-in animation presets, their parameters, and defaults. Pass preset-specific parameters via the `params` block in your animation config.

---

## Motion Presets

### `pulse`

Scale and brightness breathing effect.

| Param | Default | Description |
|-------|---------|-------------|
| `max_scale` | `1.15` | Peak scale factor (alias: `scale`) |
| `max_brightness` | `1.4` | Peak brightness (1.0 = normal) |
| `duration` | `1200` | ms per cycle |
| `ease` | `inOutSine` | Easing function |
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
| `ease` | `inOutSine` | Easing function |
| `loop` | `true` | Loop continuously |
| `alternate` | `true` | Reverse on each loop |

### `shake`

Horizontal vibrate effect.

| Param | Default | Description |
|-------|---------|-------------|
| `intensity` | `10` | Max displacement in px |
| `duration` | `500` | Total duration (ms) |
| `frequency` | `4` | Number of side-to-side shakes |
| `ease` | `inOutSine` | Easing function |
| `loop` | `false` | Loop continuously |

### `bounce`

Elastic scale bounce.

| Param | Default | Description |
|-------|---------|-------------|
| `scale_max` | `1.2` | Peak scale factor |
| `duration` | `800` | Duration (ms) |
| `bounces` | `3` | Number of bounces |
| `ease` | `outElastic` | Easing function |
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

Target individual text elements with `target: "[data-field-id='my-field']"` to restrict the animation to a specific text field.

### `text-reveal`

Characters, words, or lines appear in sequence with a stagger effect.

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

Staggered animation across multiple target elements.

| Param | Default | Description |
|-------|---------|-------------|
| `stagger` | `100` | Delay between elements (ms) |
| `property` | `opacity` | CSS property to animate |
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

CSS-based marching dashed line animation. More performant than JS for continuous use.

| Param | Default | Description |
|-------|---------|-------------|
| `dash_length` | `10` | Length of each dash |
| `gap_length` | `5` | Gap between dashes |
| `speed` | `2` | Seconds per cycle |
| `direction` | `forward` | `forward` or `reverse` |

---

## Utility Presets

### `set`

Immediately sets properties without animation. Useful for establishing initial state before other animations run.

| Param | Default | Description |
|-------|---------|-------------|
| `properties` | — | Object with CSS properties to set immediately |

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

Path-following animation. Requires a `<path>` element in the SVG.

| Param | Default | Description |
|-------|---------|-------------|
| `path_selector` | — | CSS selector for the path element (required) |
| `duration` | `4000` | Duration (ms) |
| `ease` | `linear` | Easing function |
| `loop` | `true` | Loop continuously |

---

## See Also

- [Animations overview](../animations.md) — structure, triggers, options, easing reference
- [Entity Change Triggers](entity-change-triggers.md) — `on_entity_change` deep-dive
- [Rule-based Animations](rule-based-animations.md) — triggering presets via the Rules Engine

