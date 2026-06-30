# Screen Effect System

> **Singleton**: `window.lcards.core.screenEffectManager`
> **Console API**: `window.lcards.screenEffect.*`
> **Source**: `src/core/screen-effects/`

---

## Overview

The Screen Effect System provides a full-screen composited effect layer that sits above all other LCARdS and Home Assistant UI elements. It is the single authoritative surface for any visual effect that should cover the entire viewport — blur, pixelation, TV static, glitch artefacts, colour tints, and so on.

Effects are declaratively registered as named **presets** in a shared registry. The same preset name works consistently across all consumers:

- Alert overlay backdrop (via `layers` config in card config and per-condition overrides)
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

Z-index 9100 places the portal above all HA UI. The alert overlay card (`lcards-alert-overlay`), `ConnectionOverlayService`, and the `show_portal_card` HA service all inject content into this shared portal via `PortalOverlayManager` — there is only one portal div on the page at any given time. Each consumer owns an independent named slot (`'alert-overlay'`, `'connection-overlay'`, `'ha-service'`) so their DOM subtrees are separate and can coexist.

### Preset API shape

```js
// Standard preset (single slot)
{
  slot:     'canvas' | 'backdrop' | 'color',
  label:    'Human-readable name',        // shown in the visual editor dropdown
  defaults: { /* default param values */ },
  params_schema: [                         // optional — drives the editor UI
    {
      key:         'amount',              // param key in resolvedParams
      type:        'text' | 'number' | 'color-text',
      label:       'Field Label',
      placeholder: '8px',                 // shown as hint text in editor
      helper:      'Blur radius in px',   // help text below field
      // number only:
      min: 0, max: 1, step: 0.05,
    },
  ],
  enter(slotEl, resolvedParams) {
    // activate: set CSS, start rAF loop, etc.
    // slotEl is the slot's <div>/<canvas> — EXCEPT for 'backdrop' presets
    // where slotEl is the portal element itself (see Implementation Notes).
    return () => { /* cleanup */ };
  },
}
```

`color-text` params automatically go through three-step color resolution before `enter()` is called — see Implementation Notes.

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
| `static` | `opacity: 0.55, scale: 4, color: '#ffffff', tintStrength: 0` | TV static noise; `scale` controls block size; `color`/`tintStrength` blend toward a tint |
| `pixelate` | `pixelSize: 8, opacity: 0.75, variance: 0.35, baseLight: 80, color: '#8c9aa6', tintStrength: 0` | Mosaic dark blocks; `multiply` blend — simulates low-res signal degradation; `color`/`tintStrength` blend toward a tint |
| `glitch` | `intensity: 0.08, maxShift: 40, bandHeight: 4, opacity: 0.85, fps: 20` | Sparse horizontal displacement bands + thin chroma edges; `overlay` blend |
| `scanlines` | `lineHeight: 4, opacity: 0.25, scroll: 0` | CRT horizontal line overlay; `scroll` px/s for animation |
| `borg-assimilation` | `siteCount: 7, tendrilsPerSite: 8, tendrilLength: 600, particleCount: 2, color: '#00cc44', glowColor: '#00ff66'` | Borg nano-tube assimilation lattice — tapered gradient tendrils branch outward from staggered injection sites, interconnect via cross-bridge arcs with junction nodes, and carry nano-probe particles; runs indefinitely until dismissed |

---

## Console API

```js
// Play a transient effect (auto-dismisses after duration ms, default 1000)
window.lcards.screenEffect.play('pixelate', { duration: 2000, pixelSize: 32 })
window.lcards.screenEffect.play('static',   { duration: 800, scale: 6 })

// Apply persistent slot effects (stay until explicitly removed)
window.lcards.screenEffect.applySlot('backdrop', 'blur',       { amount: '12px' })
window.lcards.screenEffect.applySlot('color',    'color-tint', { color: 'rgba(180,0,0,0.35)' })

// apply() is a per-name shorthand for single-slot presets
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

Fire one or more layered screen effects from an automation or script. Effects are specified per **slot** (`backdrop`, `color`, `canvas`), each independently.

```yaml
# Red alert — blur + red tint + static noise
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
  duration: 5000          # auto-clear after 5 s
  target_device_ids:
    - "abc123def456"      # specific browser UUID
```

```yaml
# Just a canvas effect broadcast to all browsers
service: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: glitch
      intensity: 0.15
  duration: 1000
```

```yaml
# Borg assimilation — persistent until manually cleared (no duration)
service: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: borg-assimilation
      siteCount: 9
      tendrilLength: 800
      particleCount: 3
      color: "#00cc44"
      glowColor: "#00ff66"
```

```yaml
# Persistent blur targeting a user — must be cleared manually
service: lcards.trigger_effect
data:
  layers:
    backdrop:
      preset: blur
      amount: "16px"
  target_user_ids:
    - "a1b2c3d4e5f6"
```

To find device and user IDs for targeting:

```js
window.lcards.targeting.getMyIds()
// → { deviceId: 'abc123...', userId: 'a1b2c3...' }
```

---

## Programmatic API (singleton)

```js
const sem = window.lcards.core.screenEffectManager;

// Apply individual slots (preferred for multi-slot combos)
sem.applySlot('backdrop', 'blur',       { amount: '16px' })
sem.applySlot('color',    'color-tint', { color: 'rgba(180,0,0,0.35)' })

// apply() is a shorthand for single-slot presets by name
sem.apply('blur', { amount: '16px' })   // returns true if activated

// Transient effect — Returns Promise<void> that resolves when auto-dismissed
await sem.play('glitch', { duration: 800 })

// Remove a slot or all slots
sem.clearSlot('canvas')
sem.clear()

// Register or replace a preset
sem.registerPreset('my-fx', { ... })

// List registered preset names
sem.listPresets()
// → ['blur', 'static', 'pixelate', 'glitch', ...]

// Retrieve a single preset definition (label, slot, params_schema, defaults)
sem.getPreset('blur')

// Return a catalog array for all presets — used by the visual editor
sem.catalog()
// → [ { name, label, slot, params_schema }, ... ]
```

### Trusted Consumer API (for overlay systems)

The alert overlay and connection overlay inject their own DOM elements directly into the shared portal rather than using slots. Two methods support this pattern:

```js
// Get (and lazily create) the portal element.
// Alert overlay and ConnectionOverlayService use this to appendChild their wrappers.
const portal = sem.portal;

// Notify SEM that the portal is in use even when no effect slots are active.
// Prevents _syncPortalVisibility() from hiding the portal while overlay content is showing.
sem.setOverlayOccupied(true);
// … overlay removed …
sem.setOverlayOccupied(false);
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

3. Build and test:

```bash
npm run build
# Copy dist/lcards.js → HA www/community/lcards/
# window.lcards.screenEffect.play('my-effect', { duration: 2000 })
```

---

## Relationship to Other Systems

| System | Relationship |
|---|---|
| **Alert overlay** (`lcards-alert-overlay`) | Delegates its blur/tint backdrop to `ScreenEffectManager` via `applySlot()`. Card config uses `layers: { backdrop, color, canvas }`. Config authority stays in the card; SEM owns the DOM. |
| **Alert transitions** (`alertTransitions.js`) | Separate system — animates `home-assistant-main` during the CSS variable swap that changes the global theme colour. Not screen-level compositing. |
| **Background animations** | Card-scoped Canvas2D renders on the card element. No relationship to the screen-level portal. |
| **Animation system** (`AnimationManager`) | Element-scoped anime.js animations. Not suitable for screen-wide effects. |

---

## Implementation Notes

**Color resolution for `color-text` params**: Before `enter()` is called, `ScreenEffectManager` resolves all `color-text` params through a three-step process: (1) substitute `var()` references from live computed DOM style; (2) route through `ThemeTokenResolver` for computed expressions (`alpha()`, `darken()`, token paths); (3) materialise any `var()` the resolver itself emits. This order prevents cache-poisoning — the resolver's cache key becomes a concrete colour string rather than a raw `var()` reference that could be stale from before the LCARS theme committed its CSS variables.

**`backdrop-filter` and `mix-blend-mode` compositing**: Canvas presets that set `mix-blend-mode` (`static`, `glitch`, `pixelate`) cause the browser to promote the portal into its own compositing layer. When this happens, a `backdrop-filter` applied to a *child element inside the portal* cannot reach through to the content behind the portal — the filter is resolved against an already-composited surface. To avoid this, `ScreenEffectManager` applies the backdrop-filter from the `backdrop` slot **directly on the portal element itself** rather than on the slot's child `<div>`. The portal-level filter is resolved before child compositing, so canvas blend-modes render correctly on top of the already-filtered background. The `scanlines` preset does not set `mix-blend-mode` and is not affected by this constraint.

**Canvas security**: Canvas2D cannot call `ctx.drawWindow()` or sample arbitrary DOM content in the browser for security reasons. The `pixelate` preset therefore generates synthetic colour blocks rather than true pixel-sampling of the viewport content. The visual result is an obscuring mosaic overlay, which is consistent with what the alert transition system already does.

**Portal creation is lazy**: The portal div is appended to `document.body` on the first call to `apply()` or `play()`. It is not created at singleton initialization. This avoids any risk of interfering with HA's own DOM setup.

**`prefers-reduced-motion`**: Canvas effects (`static`, `pixelate`, `glitch`, `scanlines`) run continuous rAF loops. If your automation targets all users, consider checking `window.matchMedia('(prefers-reduced-motion: reduce)')` before calling backdrop effects and using the backdrop slot instead.
