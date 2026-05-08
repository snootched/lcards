# Screen Effects

> **Full-screen visual effects that sit above all HA and LCARdS UI**

Screen effects cover the entire viewport with composited overlays — blur, colour tints, TV static, pixelation, glitch artefacts, CRT scanlines, and more. They are designed for alert states, dramatic transitions, and automation-triggered feedback.

---

## Quick Start

```js
// Browser console — play for 2 seconds then auto-dismiss
window.lcards.screenEffect.play('static', { duration: 2000 })

// Apply slot effects persistently (stays until cleared)
window.lcards.screenEffect.applySlot('backdrop', 'blur', { amount: '12px' })
window.lcards.screenEffect.applySlot('color', 'color-tint', { color: 'rgba(180,0,0,0.35)' })
window.lcards.screenEffect.clear()
```

```yaml
# HA automation
service: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: glitch
  duration: 1500
```

---

## Preset Reference

### Backdrop presets

These use the CSS `backdrop-filter` property — they filter the browser content visually without obscuring it with an opaque layer. Works best on content-rich dashboards.

#### `blur`

Applies a Gaussian blur to everything behind the overlay.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `amount` | string | `'8px'` | CSS blur radius, e.g. `'4px'`, `'20px'` |

```yaml
service: lcards.trigger_effect
data:
  layers:
    backdrop:
      preset: blur
      amount: "12px"
  duration: 3000
```

---

#### `saturate`

Boosts colour saturation of the screen behind the overlay.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `amount` | string | `'200%'` | CSS saturation, e.g. `'150%'`, `'400%'` |

---

#### `grayscale`

Desaturates the screen behind the overlay.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `amount` | string | `'100%'` | CSS grayscale amount. `'100%'` = full B&W, `'50%'` = partial |

---

#### `contrast`

Increases or decreases contrast.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `amount` | string | `'200%'` | CSS contrast amount, e.g. `'150%'`, `'300%'` |

---

#### `hue-rotate`

Rotates all hues on screen.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `angle` | string | `'180deg'` | CSS hue rotation, e.g. `'90deg'`, `'-45deg'` |

---

### Color tint presets

These render a `<div>` with a CSS background above all screen content.

#### `color-tint`

Semi-transparent colour flood over the entire screen.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `color` | string | `'rgba(0,0,0,0.5)'` | Any CSS colour — hex, rgb, rgba, hsl |

```yaml
service: lcards.trigger_effect
data:
  layers:
    color:
      preset: color-tint
      color: "rgba(180, 0, 0, 0.4)"
  duration: 2000
```

---

#### `vignette`

Dark radial gradient at the screen edges — like a cinematic vignette.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `opacity` | number | `0.7` | Darkness of the edge fade (0–1) |

---

### Canvas presets

These draw directly above all content using a Canvas2D rAF loop. They blend with the underlying screen using CSS `mix-blend-mode` so content shows through.

::: info Canvas and screen content
For browser security reasons, canvas effects cannot read the actual pixels of the HA dashboard — they generate synthetic overlays. The visual result is an obscuring or distorting texture layered over the real content.
:::

#### `static`

TV static noise. Chunky random pixel noise scaled up with `image-rendering: pixelated`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `opacity` | number | `0.55` | Overall canvas opacity (0–1) |
| `scale` | number | `4` | Down-sample factor. Higher = larger/chunkier pixels. `2` = fine grain, `8` = very coarse |
| `color` | string | `'#ffffff'` | Tint colour for noise pixels |
| `tintStrength` | number | `0` | 0–1 blend toward `color`. `0` = pure noise, `1` = solid colour |

```yaml
service: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: static
      scale: 6
      opacity: 0.7
  duration: 800
```

---

#### `pixelate`

Mosaic of small dark blocks with subtle lightness variance. Simulates low-resolution signal degradation. Uses `mix-blend-mode: multiply` — blocks darken content proportionally.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pixelSize` | number | `8` | Block size in px. Larger = chunkier mosaic |
| `opacity` | number | `0.75` | Overall canvas opacity (0–1) |
| `variance` | number | `0.35` | Lightness jitter per block (0–1). `0` = uniform, `1` = max contrast |
| `baseLight` | number | `80` | Base grey lightness (0–255). Lower = darker blocks |

```yaml
service: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: pixelate
      pixelSize: 12
      opacity: 0.6
  duration: 2000
```

---

#### `glitch`

Sparse horizontal displacement bands with thin chroma-aberration edge lines. Uses `mix-blend-mode: overlay`. Keeps only a small fraction of rows active per frame for an authentic data-corruption look.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `intensity` | number | `0.08` | Fraction of row-bands glitched per frame (0–1). Keep low (0.05–0.15) for subtle effect |
| `maxShift` | number | `40` | Maximum horizontal offset in px |
| `bandHeight` | number | `4` | Height of each glitch band in px |
| `opacity` | number | `0.85` | Overall canvas opacity (0–1) |
| `fps` | number | `20` | Target frame rate |

```yaml
service: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: glitch
      intensity: 0.12
      maxShift: 60
  duration: 1000
```

---

#### `scanlines`

CRT-style horizontal line overlay. Optionally scrolls vertically.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `lineHeight` | number | `4` | Height of each line pair in px |
| `opacity` | number | `0.25` | Dark line opacity (0–1) |
| `scroll` | number | `0` | Scroll speed in px/s. `0` = static, positive = downward |

```yaml
service: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: scanlines
      lineHeight: 3
      opacity: 0.35
      scroll: 40
```

---

## HA Service

### `lcards.trigger_effect`

Fire one or more layered screen effects from an automation, script, or developer tools. Each of the three **slots** is configured independently — include only the slots you want.

```yaml
# Full red alert — blur + red tint + TV static
service: lcards.trigger_effect
data:
  layers:
    backdrop:
      preset: blur
      amount: "12px"
    color:
      preset: color-tint
      color: "rgba(180, 0, 0, 0.35)"
    canvas:
      preset: static
      opacity: 0.3
  duration: 5000              # auto-clear after 5 s
```

```yaml
# Canvas-only effect, broadcast to all browsers
service: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: glitch
      intensity: 0.15
  duration: 1200
```

```yaml
# Persistent blur on a specific user — stays until lcards.clear_effect
service: lcards.trigger_effect
data:
  layers:
    backdrop:
      preset: blur
      amount: "16px"
  target_user_ids:
    - "a1b2c3d4e5f6"
```

```yaml
# Target a specific browser device by UUID
service: lcards.trigger_effect
data:
  layers:
    color:
      preset: vignette
      opacity: 0.8
  duration: 3000
  target_device_ids:
    - "abc123def456"
```

#### Slots

| Slot | Presets | Rendering |
|------|---------|-----------|
| `backdrop` | `blur`, `grayscale`, `saturate`, `contrast`, `hue-rotate` | CSS `backdrop-filter` |
| `color` | `color-tint`, `vignette` | Transparent `<div>` overlay |
| `canvas` | `static`, `pixelate`, `glitch`, `scanlines` | Canvas2D rAF loop |

Omit a slot to leave it unchanged. Set a slot to `null` to explicitly clear it:

```yaml
# Clear only the canvas slot, leave blur alone
service: lcards.trigger_effect
data:
  layers:
    canvas: null
```

### `lcards.clear_effect`

Clear one or all active screen effects.

```yaml alternatives
# Clear everything on all browsers
service: lcards.clear_effect

# Clear only the canvas slot (leaves blur/tint active)
service: lcards.clear_effect
data:
  slot: canvas

# Clear on a specific device only
service: lcards.clear_effect
data:
  target_device_ids:
    - "abc123def456"
```

To find your browser's device ID and user ID:

```js
window.lcards.targeting.getMyIds()
// → { deviceId: 'abc123...', userId: 'a1b2c3...' }
```

---

## Console API

All methods are also available on `window.lcards.screenEffect`:

```js
// Apply a single slot persistently (stays until clear)
window.lcards.screenEffect.applySlot('backdrop', 'blur', { amount: '12px' })
window.lcards.screenEffect.applySlot('color', 'color-tint', { color: 'rgba(180,0,0,0.35)' })
window.lcards.screenEffect.applySlot('canvas', 'static', { opacity: 0.3 })

// apply() is a shorthand for single-slot presets by name
window.lcards.screenEffect.apply('blur', { amount: '12px' })

// Transient single-slot effect — auto-dismisses after duration ms
window.lcards.screenEffect.play('static', { duration: 2000, scale: 6 })

// Remove effects
window.lcards.screenEffect.clearSlot('backdrop')   // one slot only
window.lcards.screenEffect.clear()                  // all slots

// List all registered preset names
window.lcards.screenEffect.list()

// Register a custom preset at runtime
window.lcards.screenEffect.registerPreset('my-green', {
  slot: 'color',
  defaults: { color: 'rgba(0,255,100,0.3)' },
  enter(el, params) {
    el.style.background = params.color;
    return () => { el.style.background = ''; };
  },
})
```

---

## Related

- [Background Animations](./background-animations.md) — card-scoped canvas animations
- [Card Animations](../animations.md) — anime.js per-element animations
- [Alert Overlay](../../cards/alert-overlay/) — full-screen alert card that uses screen effects for its backdrop
