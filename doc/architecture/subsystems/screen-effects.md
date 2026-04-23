# Screen Effect System

> **Singleton**: `window.lcards.core.screenEffectManager`
> **Console API**: `window.lcards.screenEffect.*`
> **Source**: `src/core/screen-effects/`

---

## Overview

The Screen Effect System provides a full-screen composited effect layer that sits above all other LCARdS and Home Assistant UI elements. It is the single authoritative surface for any visual effect that should cover the entire viewport — blur, pixelation, TV static, glitch artefacts, colour tints, and so on.

Effects are declaratively registered as named **presets** in a shared registry. The same preset name works consistently across all consumers:

- Alert overlay backdrop (`backdrop_effect` config key — Phase 2)
- Console API (`window.lcards.screenEffect.play('pixelate')`)
- HA automation service (`lcards.trigger_effect`)

---

## Architecture

### Portal stack

On first use `ScreenEffectManager` appends a single `position:fixed; inset:0; z-index:9100` div to `document.body`. This portal contains a set of named **slot** elements rendered in stacking order:

| Slot | Element | Rendering mechanism |
|---|---|---|
| `backdrop` | `<div>` | CSS `backdrop-filter` — blurs/filters whatever is behind it |
| `canvas` | `<canvas>` | Canvas2D rAF loop — draws directly above all content |
| `color` | `<div>` | CSS `background` — semi-transparent colour overlay |

Z-index 9100 places the portal above the alert overlay portal (9000) and all HA UI.

### Preset API shape

```js
// Standard preset (single slot)
{
  slot:     'canvas' | 'backdrop' | 'color',
  defaults: { /* default param values */ },
  enter(slotEl, resolvedParams) {
    // activate: set CSS, start rAF loop, etc.
    return () => { /* cleanup */ };
  },
}

// Compound preset (multiple slots activated together)
{
  compound: true,
  layers: [
    { preset: 'blur',       params: { amount: '8px' } },
    { preset: 'color-tint', params: { color: 'rgba(200,0,0,0.35)' } },
  ],
}
```

`enter()` must return a cleanup function. The manager stores it and calls it when the effect is removed.

---

## Built-in Presets

### Backdrop (CSS `backdrop-filter`)

| Preset | Default params | Description |
|---|---|---|
| `blur` | `amount: '8px'` | Gaussian blur of content behind the overlay |
| `saturate` | `amount: '200%'` | Colour saturation boost |
| `grayscale` | `amount: '100%'` | Full colour desaturation |
| `contrast` | `amount: '200%'` | High contrast |
| `hue-rotate` | `angle: '180deg'` | Hue rotation |

### Color tint

| Preset | Default params | Description |
|---|---|---|
| `color-tint` | `color: 'rgba(0,0,0,0.5)'` | Solid/semi-transparent colour fill |
| `vignette` | `opacity: 0.7` | Dark radial gradient at edges |

### Canvas (Canvas2D, runs above all content)

| Preset | Default params | Description |
|---|---|---|
| `static` | `opacity: 0.55, scale: 4` | TV static noise; `scale` controls block size |
| `pixelate` | `pixelSize: 8, opacity: 0.75, variance: 0.35, baseLight: 80` | Mosaic dark blocks; `multiply` blend — simulates low-res signal degradation |
| `glitch` | `intensity: 0.08, maxShift: 40, bandHeight: 4, opacity: 0.85, fps: 20` | Sparse horizontal displacement bands + thin chroma edges; `overlay` blend |
| `scanlines` | `lineHeight: 4, opacity: 0.25, scroll: 0` | CRT horizontal line overlay; `scroll` px/s for animation |

### Compound

| Preset | Composed from |
|---|---|
| `alert-red` | `blur` (10px) + `color-tint` (rgba 180,0,0,0.35) |
| `alert-yellow` | `blur` (8px) + `color-tint` (rgba 200,160,0,0.35) |
| `alert-blue` | `blur` (8px) + `color-tint` (rgba 0,80,200,0.35) |
| `alert-gray` | `blur` (6px) + `color-tint` (rgba 80,80,80,0.40) |
| `alert-black` | `blur` (4px) + `color-tint` (rgba 0,0,0,0.60) |

---

## Console API

```js
// Play a transient effect (auto-dismisses after duration ms, default 1000)
window.lcards.screenEffect.play('pixelate', { duration: 2000, pixelSize: 32 })
window.lcards.screenEffect.play('static',   { duration: 800, scale: 6 })
window.lcards.screenEffect.play('alert-red',{ duration: 1500 })

// Apply a persistent effect (stays until explicitly removed)
window.lcards.screenEffect.apply('blur',   { amount: '12px' })
window.lcards.screenEffect.apply('vignette')

// Remove effects
window.lcards.screenEffect.clearSlot('backdrop')   // remove one slot
window.lcards.screenEffect.clear()                  // remove all

// Register a custom preset at runtime
window.lcards.screenEffect.registerPreset('my-effect', {
  slot: 'color',
  defaults: { color: 'rgba(0,255,0,0.2)' },
  enter(el, params) {
    el.style.background = params.color;
    return () => { el.style.background = ''; };
  },
})

// List all registered preset names
window.lcards.screenEffect.list()
```

---

## HA Service: `lcards.trigger_effect`

Fire a screen effect from an automation or script, with optional per-device / per-user targeting:

```yaml
service: lcards.trigger_effect
data:
  effect: pixelate
  params:
    duration: 1500
    pixelSize: 32
  target_device_ids:
    - "abc123def456"     # specific browser UUID
```

```yaml
# Broadcast to all connected browsers
service: lcards.trigger_effect
data:
  effect: static
  params:
    duration: 600
    scale: 8
```

```yaml
# Target a specific user
service: lcards.trigger_effect
data:
  effect: glitch
  params:
    duration: 1000
    intensity: 0.8
  target_user_ids:
    - "a1b2c3d4e5f6"
```

### Common params by effect

| Effect | Key params |
|---|---|
| `blur` | `amount` (e.g. `"12px"`) |
| `pixelate` | `pixelSize` (default 8), `opacity`, `variance`, `baseLight` |
| `static` | `scale` (default 4), `opacity`, `tintStrength`, `color` |
| `glitch` | `intensity` (0–1, default 0.08), `maxShift` (px, default 40), `bandHeight`, `opacity`, `fps` |
| `scanlines` | `lineHeight`, `opacity`, `scroll` (px/s) |
| `saturate` | `amount` (e.g. `"300%"`) |
| `grayscale` | `amount` (e.g. `"80%"`) |
| `hue-rotate` | `angle` (e.g. `"90deg"`) |
| `contrast` | `amount` (e.g. `"150%"`) |
| `vignette` | `opacity` (0–1) |
| All | `duration` — auto-dismiss ms. **Omit entirely** for a persistent effect (no auto-clear). Including `duration` routes through `play()`; omitting it routes through `apply()`. |

To find device and user IDs for targeting:

```js
window.lcards.targeting.getMyIds()
// → { deviceId: 'abc123...', userId: 'a1b2c3...' }
```

---

## Programmatic API (singleton)

```js
const sem = window.lcards.core.screenEffectManager;

// Returns true if activated
sem.apply('blur', { amount: '16px' })

// Returns Promise<void> that resolves when effect auto-dismisses
await sem.play('glitch', { duration: 800 })

// Remove a slot or all slots
sem.clearSlot('canvas')
sem.clear()

// Register or replace a preset
sem.registerPreset('my-fx', { ... })

// List registered presets
sem.listPresets()
// → ['blur', 'static', 'pixelate', 'glitch', ...]
```

---

## Adding a New Effect

1. Create `src/core/screen-effects/effects/MyEffect.js`:

```js
// enter(slotEl, params) → cleanup()
export function MyEffect(canvas, params = {}) {
  const { opacity = 0.8 } = params;
  canvas.style.opacity = String(opacity);
  let rafId = null;
  let running = true;
  function draw() {
    if (!running) return;
    // ... draw to canvas ...
    rafId = requestAnimationFrame(draw);
  }
  rafId = requestAnimationFrame(draw);
  return () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    canvas.style.opacity = '';
  };
}
```

2. Register in `ScreenEffectPresetRegistry.js`:

```js
import { MyEffect } from './effects/MyEffect.js';

screenEffectPresetRegistry.register('my-effect', {
  slot: 'canvas',
  defaults: { opacity: 0.8 },
  enter: MyEffect,
});
```

3. If the effect introduces new CSS variables, add them to the allowlist first (see [CSS variable governance](../../development/css-variable-governance.md)).

4. Build and test:

```bash
npm run build
# Copy dist/lcards.js → HA www/community/lcards/
# window.lcards.screenEffect.play('my-effect', { duration: 2000 })
```

---

## Relationship to Other Systems

| System | Relationship |
|---|---|
| **Alert overlay** (`lcards-alert-overlay`) | Currently owns its own portal (blur + tint + content). Phase 2 refactor: will delegate portal DOM to `ScreenEffectManager`. Config authority stays in the card. |
| **Alert transitions** (`alertTransitions.js`) | Separate system — animates `home-assistant-main` during the CSS variable swap that changes the global theme colour. Not screen-level compositing. |
| **Background animations** | Card-scoped Canvas2D renders on the card element. No relationship to the screen-level portal. |
| **Animation system** (`AnimationManager`) | Element-scoped anime.js animations. Not suitable for screen-wide effects. |

---

## Implementation Notes

**`backdrop-filter` stacking context**: The `backdrop` slot div creates its own stacking context. Elements behind the portal are filtered; elements above (other portal slots) are not. This is the desired behaviour — the `canvas` slot draws above the blurred content.

**Canvas security**: Canvas2D cannot call `ctx.drawWindow()` or sample arbitrary DOM content in the browser for security reasons. The `pixelate` preset therefore generates synthetic colour blocks rather than true pixel-sampling of the viewport content. The visual result is an obscuring mosaic overlay, which is consistent with what the alert transition system already does.

**Portal creation is lazy**: The portal div is appended to `document.body` on the first call to `apply()` or `play()`. It is not created at singleton initialization. This avoids any risk of interfering with HA's own DOM setup.

**`prefers-reduced-motion`**: Canvas effects (`static`, `pixelate`, `glitch`, `scanlines`) run continuous rAF loops. If your automation targets all users, consider checking `window.matchMedia('(prefers-reduced-motion: reduce)')` before calling backdrop effects and using the backdrop slot instead.
