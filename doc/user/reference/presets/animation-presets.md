# Animation Presets Reference

Complete reference for all built-in animation presets in LCARdS.

## Overview

LCARdS includes 15 built-in animation presets optimized for LCARS-style interfaces. All presets support standard anime.js parameters and can be extended with additional properties.

## Standard Parameters

All presets support these common parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `trigger` | string | (required) | When to play: `on_load`, `on_tap`, `on_hold`, `on_hover`, `on_leave`, `on_entity_change` |
| `duration` | number | varies | Animation duration in milliseconds |
| `easing` | string | varies | Anime.js easing function (see [Easing Functions](#easing-functions)) |
| `loop` | boolean/number | varies | `true` (infinite), `false` (once), or number (e.g., `3` for 3 iterations) |
| `alternate` | boolean | varies | If `true`, animation reverses direction on alternate loops |
| `delay` | number | 0 | Delay before animation starts (ms) |

## Core Animation Presets

### pulse

Breathing effect with scale and opacity animation. Great for attention-grabbing elements.

**Default Values:**
- `duration`: 1200
- `loop`: `true`
- `alternate`: `true`
- `easing`: `easeInOutSine`

**Parameters:**
- `max_scale` (or `scale`): Maximum scale factor (default: 1.2)
- `min_opacity`: Minimum opacity (default: 0.7)

**Example:**
```yaml
animations:
  - preset: pulse
    trigger: on_hover
    max_scale: 1.5
    min_opacity: 0.8
    duration: 1000
```

---

### fade

Simple opacity transition.

**Default Values:**
- `duration`: 1000
- `loop`: `false`
- `alternate`: `false`
- `easing`: `linear`

**Parameters:**
- `from`: Starting opacity (default: 0)
- `to`: Ending opacity (default: 1)

**Example:**
```yaml
animations:
  - preset: fade
    trigger: on_load
    from: 0
    to: 1
    duration: 600
```

---

### glow

Animated drop-shadow effect for glowing elements.

**Default Values:**
- `duration`: 1500
- `loop`: `true`
- `alternate`: `true`
- `easing`: `easeInOutSine`

**Parameters:**
- `color` (or `glow_color`): Glow color (default: `var(--lcars-blue, #66ccff)`)
- `blur_min`: Minimum blur radius (default: 0)
- `blur_max`: Maximum blur radius (default: 10)

**Example:**
```yaml
animations:
  - preset: glow
    trigger: on_entity_change
    color: '#ff9900'
    blur_max: 20
    duration: 500
    loop: 3
```

---

### scale

Simple scale transform animation. Ideal for button feedback.

**Default Values:**
- `duration`: 200
- `loop`: `false`
- `alternate`: `false`
- `easing`: `easeOutQuad`

**Parameters:**
- `scale`: Target scale factor (default: 1.1)
- `from`: Starting scale (default: 1)

**Example:**
```yaml
animations:
  - preset: scale
    trigger: on_hover
    scale: 1.15
    duration: 300
```

---

### scale-reset

Returns element to original scale (1.0). Use with `on_leave` to reset hover animations.

**Default Values:**
- `duration`: 200
- `easing`: `easeOutQuad`

**Parameters:**
- None (always resets to scale: 1.0)

**Example:**
```yaml
animations:
  - preset: scale
    trigger: on_hover
    scale: 1.1
  - preset: scale-reset
    trigger: on_leave
```

---

## Visual Effect Presets

### blink

Rapid opacity toggle effect.

**Default Values:**
- `duration`: 1200
- `loop`: `true`
- `alternate`: `true`
- `easing`: `linear`

**Parameters:**
- `max_opacity`: Maximum opacity (default: 1)
- `min_opacity`: Minimum opacity (default: 0.3)

**Example:**
```yaml
animations:
  - preset: blink
    trigger: on_load
    min_opacity: 0
    max_opacity: 1
    duration: 500
    loop: 10
```

---

### shimmer

Fill color and opacity animation for shimmering effects.

**Default Values:**
- `duration`: 1500
- `loop`: `true`
- `alternate`: `true`
- `easing`: `easeInOutSine`

**Parameters:**
- `color_from`: Starting color (default: current fill)
- `color_to` (or `shimmer_color`): Target color (required)
- `opacity_from`: Starting opacity (default: 1)
- `opacity_to`: Ending opacity (default: 0.5)

**Example:**
```yaml
animations:
  - preset: shimmer
    trigger: on_hover
    color_to: '#ffffff'
    opacity_to: 0.7
    duration: 1000
```

---

### strobe

Fast opacity strobe effect.

**Default Values:**
- `duration`: 100
- `loop`: `true`
- `alternate`: `true`
- `easing`: `linear`

**Parameters:**
- `max_opacity`: Maximum opacity (default: 1)
- `min_opacity`: Minimum opacity (default: 0)

**Example:**
```yaml
animations:
  - preset: strobe
    trigger: on_tap
    duration: 80
    loop: 5
```

---

### flicker

Randomized opacity animation for flickering effects.

**Default Values:**
- `duration`: 1000
- `loop`: `true`
- `easing`: `linear`

**Parameters:**
- `max_opacity`: Maximum opacity (default: 1)
- `min_opacity`: Minimum opacity (default: 0.3)

**Example:**
```yaml
animations:
  - preset: flicker
    trigger: on_load
    duration: 800
    min_opacity: 0.5
```

---

### cascade

Staggered animation for multiple targets.

**Default Values:**
- `duration`: 1000
- `loop`: `false`
- `easing`: `easeOutExpo`

**Parameters:**
- `stagger`: Delay between elements in ms (default: 100)
- `property`: Property to animate (default: `opacity`)
- `from`: Starting value (default: 0)
- `to`: Ending value (default: 1)

**Example:**
```yaml
animations:
  - preset: cascade
    trigger: on_load
    stagger: 150
    property: scale
    from: 0
    to: 1
    duration: 600
```

---

### ripple

Expanding scale with opacity fade effect.

**Default Values:**
- `duration`: 1000
- `loop`: `false`
- `easing`: `easeOutExpo`

**Parameters:**
- `scale_max`: Maximum scale (default: 1.5)
- `opacity_min`: Minimum opacity (default: 0)

**Example:**
```yaml
animations:
  - preset: ripple
    trigger: on_tap
    scale_max: 2.0
    duration: 800
```

---

## SVG-Specific Presets

### draw

SVG path drawing animation using strokeDashoffset.

**Default Values:**
- `duration`: 2000
- `loop`: `false`
- `alternate`: `false`
- `easing`: `linear`

**Parameters:**
- `reverse`: Draw in reverse direction (default: `false`)

**Example:**
```yaml
animations:
  - preset: draw
    trigger: on_load
    duration: 3000
    reverse: false
```

---

### march

CSS-based marching dashed line animation. More performant than anime.js for continuous animations.

**Default Values:**
- `speed`: 2 (seconds per cycle)
- `direction`: `forward`

**Parameters:**
- `dash_length`: Length of dashes (default: 10)
- `gap_length`: Gap between dashes (default: 5)
- `speed`: Animation speed in seconds (default: 2)
- `direction`: `forward` or `reverse` (default: `forward`)

**Example:**
```yaml
animations:
  - preset: march
    trigger: on_load
    dash_length: 15
    gap_length: 8
    speed: 1.5
    direction: reverse
```

---

## Utility Presets

### set

Immediately set properties without animation. Useful for initial states.

**Parameters:**
- `properties`: Object with CSS properties to set

**Example:**
```yaml
animations:
  - preset: set
    trigger: on_load
    properties:
      opacity: 0.5
      fill: red
      transform: scale(1.2)
```

---

### motionpath

Path following animation (placeholder - full implementation pending).

**Default Values:**
- `duration`: 4000
- `loop`: `true`
- `easing`: `linear`

**Parameters:**
- `path_selector`: CSS selector for path element (required)

**Example:**
```yaml
animations:
  - preset: motionpath
    trigger: on_load
    path_selector: '#motion-path'
    duration: 5000
```

---

## Extending Presets

### Additional Anime.js Parameters

You can pass any anime.js v4 parameter alongside preset parameters:

```yaml
animations:
  - preset: pulse
    trigger: on_hover
    max_scale: 1.3
    # Additional anime.js parameters:
    autoplay: true
    begin: function() { console.log('started'); }
    complete: function() { console.log('done'); }
```

**Supported additional parameters:**
- `autoplay`: Whether to start automatically (default: `true`)
- `endDelay`: Delay after animation completes (ms)
- `begin`: Callback function when animation begins
- `update`: Callback function on each frame
- `complete`: Callback function when animation completes
- `loopBegin`: Callback at start of each loop
- `loopComplete`: Callback at end of each loop
- `changeBegin`: Callback when property value changes
- `changeComplete`: Callback when property change completes

### Property Override

Preset parameters can be overridden to customize behavior:

```yaml
animations:
  - preset: glow
    trigger: on_hover
    # Override preset defaults:
    color: '#ff00ff'
    blur_max: 25
    duration: 2000
    # Add anime.js parameters:
    easing: 'spring(1, 80, 10, 0)'
```

---

## Easing Functions

Anime.js v4 supports these easing functions:

### Basic Easings
- `linear`
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic`
- `easeInQuart`, `easeOutQuart`, `easeInOutQuart`
- `easeInQuint`, `easeOutQuint`, `easeInOutQuint`
- `easeInSine`, `easeOutSine`, `easeInOutSine`
- `easeInExpo`, `easeOutExpo`, `easeInOutExpo`
- `easeInCirc`, `easeOutCirc`, `easeInOutCirc`
- `easeInBack`, `easeOutBack`, `easeInOutBack`

### Advanced Easings
- `easeInElastic`, `easeOutElastic`, `easeInOutElastic`
- `easeInBounce`, `easeOutBounce`, `easeInOutBounce`

### Parametric Easings
- `spring(mass, stiffness, damping, velocity)`
- `elastic(amplitude, period)`
- `steps(numberOfSteps)`
- `cubicBezier(x1, y1, x2, y2)`

**Examples:**
```yaml
# Bouncy effect
easing: easeOutElastic(1, .5)

# Spring physics
easing: spring(1, 80, 10, 0)

# Custom bezier
easing: cubicBezier(.5, .05, .1, .3)
```

---

## Common Patterns

### Hover with Reset
```yaml
animations:
  - preset: scale
    trigger: on_hover
    scale: 1.1
  - preset: scale-reset
    trigger: on_leave
```

### Entity Change Alert
```yaml
animations:
  - preset: glow
    trigger: on_entity_change
    color: '#ff9900'
    loop: 3
    duration: 400
```

### Button Tap Feedback
```yaml
animations:
  - preset: pulse
    trigger: on_tap
    max_scale: 1.05
    duration: 200
    loop: 1
```

### Loading Indicator
```yaml
animations:
  - preset: pulse
    trigger: on_load
    loop: true
    duration: 1500
    max_scale: 1.1
```

### Warning Flash
```yaml
animations:
  - preset: blink
    trigger: on_load
    loop: 5
    duration: 300
    min_opacity: 0.3
```

---

## Performance Tips

1. **Use CSS animations for continuous effects**: `march` preset uses CSS, which is more performant than JS-based animations
2. **Limit simultaneous animations**: Keep to 2-3 animations per element
3. **Use appropriate loop counts**: Prefer finite loops (`loop: 3`) over infinite for entity changes
4. **Optimize duration**: Shorter durations (200-500ms) feel more responsive
5. **Choose simple presets**: `scale` and `fade` are more performant than `glow` or complex effects

---

## Troubleshooting

### Animation doesn't play
- Verify `trigger` is spelled correctly
- Check that target element exists in DOM
- For `on_entity_change`, ensure `datasource` property is set

### Loop count ignored
- Ensure you're using the correct syntax: `loop: 3` (not `iterations: 3`)
- Check that preset supports numeric loops (all built-in presets do)

### Animation doesn't reset
- Add `on_leave` trigger with reset animation (e.g., `scale-reset`)
- Verify `alternate` is set correctly for looping animations

### Poor performance
- Reduce simultaneous animations
- Use simpler presets (avoid filters like `glow` on many elements)
- Consider CSS animations (`march`) for continuous effects

---

## See Also

- [Animation System Guide](../guides/animations.md) - Complete guide to animation system
- [Segment Animation Guide](../../../segment-animation-guide.md) - Using animations with SVG segments
- [Anime.js Documentation](https://animejs.com/documentation/) - Full anime.js reference
