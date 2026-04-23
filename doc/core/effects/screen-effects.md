# Screen Effects

> **Full-screen visual effects that sit above all HA and LCARdS UI**

Screen effects cover the entire viewport with composited overlays — blur, colour tints, TV static, pixelation, glitch artefacts, CRT scanlines, and more. They are designed for alert states, dramatic transitions, and automation-triggered feedback.

---

## Quick Start

```js
// Browser console — play for 2 seconds then auto-dismiss
window.lcards.screenEffect.play('static', { duration: 2000 })

// Apply persistently (stays until cleared)
window.lcards.screenEffect.apply('alert-red')
window.lcards.screenEffect.clear()
```

```yaml
# HA automation
service: lcards.trigger_effect
data:
  effect: glitch
  params:
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
  effect: blur
  params:
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
  effect: color-tint
  params:
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
  effect: static
  params:
    duration: 800
    scale: 6
    opacity: 0.7
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
  effect: pixelate
  params:
    duration: 2000
    pixelSize: 12
    opacity: 0.6
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
  effect: glitch
  params:
    duration: 1000
    intensity: 0.12
    maxShift: 60
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
  effect: scanlines
  params:
    lineHeight: 3
    opacity: 0.35
    scroll: 40
```

---

### Compound presets

Compound presets apply multiple slots simultaneously. They are built-in shortcuts for common alert states — each combines a `blur` backdrop with a `color-tint` overlay.

| Preset | Blur | Tint |
|--------|------|------|
| `alert-red` | `10px` | `rgba(180,0,0,0.35)` |
| `alert-yellow` | `8px` | `rgba(200,160,0,0.35)` |
| `alert-blue` | `8px` | `rgba(0,80,200,0.35)` |
| `alert-gray` | `6px` | `rgba(80,80,80,0.40)` |
| `alert-black` | `4px` | `rgba(0,0,0,0.60)` |

```yaml
service: lcards.trigger_effect
data:
  effect: alert-red
  params:
    duration: 5000
```

---

## Common parameters

These parameters work with **every** preset:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `duration` | number | — | Auto-dismiss after this many ms. **Omit entirely for a persistent effect** that stays until manually cleared (e.g. via `lcards.clear_alert` or a followup service call). Including `duration: 0` is treated as persistent. |

---

## HA Service

### `lcards.trigger_effect`

Fire a screen effect from an automation, script, or developer tools.

```yaml
service: lcards.trigger_effect
data:
  effect: <preset name>
  params:             # optional — preset-specific params
    duration: 2000
    # ... effect params ...
  target_device_ids:  # optional — list of browser device UUIDs
    - "abc123def456"
  target_user_ids:    # optional — list of HA user UUIDs
    - "a1b2c3d4e5f6"
  # omit both target fields to broadcast to all connected browsers
```

### `lcards.clear_effect`

Clear one or all active screen effects.

```yaml
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
// Persistent effect — stays until clear() or clearSlot()
window.lcards.screenEffect.apply('blur', { amount: '12px' })

// Transient effect — auto-dismisses after duration ms
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
- [Alert Overlay](../../cards/lcards-alert-overlay.md) — full-screen alert card that uses screen effects for its backdrop
