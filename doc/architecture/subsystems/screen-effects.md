# Screen Effect System

> **Singleton**: `window.lcards.core.screenEffectManager`
> **Console API**: `window.lcards.screenEffect.*` (`src/lcards-main.js:752-829`)
> **Source**: `src/core/screen-effects/` (`ScreenEffectManager.js`, `ScreenEffectPresetRegistry.js`, `effects/`)
> **User docs**: [Screen Effects](../../core/effects/screen-effects.md) (every preset and its settings)

---

## Overview

The Screen Effect System is the full-screen composited effect layer that sits above the Home Assistant UI. It is the one surface for any visual effect that covers the whole viewport: blur, pixelation, TV static, glitch artefacts, colour tints, the Borg assimilation intro.

Effects are registered as named **presets** in a shared registry, and each preset targets one of three **slots**. The same preset name works for every consumer:

- The alert overlay and connection overlay backdrops, through `PortalOverlayManager` (`layers` config)
- The Borg assimilation (`BorgAssimilationManager`)
- The `lcards.trigger_effect` / `lcards.clear_effect` actions (through `IntegrationService`)
- The console API (`window.lcards.screenEffect.play('pixelate')`)
- The Alert Studio's mock screen, which runs presets on its own element (`enterPreset()`)

`ScreenEffectManager` (SEM) extends `BaseService`; it is created in `LCARdSCore._performInitialization()` (`src/core/lcards-core.js:295`) and gets no HASS updates.

---

## Architecture

### Portal stack

On first use SEM builds a single portal element (`_ensurePortal()`, `ScreenEffectManager.js:76-104`): a `div[data-lcards-screen-effect-portal]` with `position:fixed; inset:0; z-index:9100; pointer-events:none`, hidden (`display:none`) until something uses it. It holds three slot elements, in this order:

| Slot | Element | Rendering mechanism |
|---|---|---|
| `backdrop` | `div[data-lcards-se-slot="backdrop"]` | CSS `backdrop-filter`: filters whatever is behind the portal (applied on the portal itself, see [Implementation notes](#implementation-notes)) |
| `canvas` | `canvas[data-lcards-se-slot="canvas"]` | Canvas2D `requestAnimationFrame` loop (or a worker, for `borg-assimilation`) |
| `color` | `div[data-lcards-se-slot="color"]` | CSS `background`: a semi-transparent colour over everything |

The portal is mounted with `mountDialogNearHomeAssistant()` (`src/utils/lcards-shared-helpers.js:64`), inside the shadow root of `<home-assistant>` (falling back to `document.body`), not in `document.body`. Cards that `PortalOverlayManager` shows inside the portal then get Home Assistant's Lit contexts, and their `hass-action` / `more-info` events reach Home Assistant.

There is only one portal per page. `PortalOverlayManager` (POM) appends its overlay slots (`'alert-overlay'`, `'connection-overlay'`, `'ha-service'`) after the three effect slots, so overlay content always draws above the effects; see [Portal Overlay Manager](portal-overlay-manager.md#dom-structure).

The portal is visible (`_syncPortalVisibility()`) while any effect slot is active **or** an overlay has marked it occupied (`setOverlayOccupied(true)`).

### Slot state

Each slot keeps `{ el, cleanup, active, timer, resolve }` in `sem._slots` (`Map`). `_applySlot()` releases the slot first (one effect per slot), merges `params` over the preset's `defaults`, resolves colour params, shows the slot and the portal (so the effect can measure its size), then calls `preset.enter(el, params)` and keeps the returned cleanup. `_releaseSlot()` clears the slot's timer, resolves a pending `play()` promise, calls the cleanup and hides the element.

### Preset API shape

```js
{
  slot:     'canvas' | 'backdrop' | 'color',
  label:    'Human-readable name',        // shown in the visual editor dropdown
  defaults: { /* default param values */ },
  params_schema: [                         // optional: drives the editor UI
    {
      key:         'amount',              // param key in the resolved params
      type:        'text' | 'number' | 'color-text' | 'select' | 'boolean',
      label:       'Field label',
      placeholder: '8px',                 // hint text in the editor
      helper:      'Blur radius in px',   // help text below the field
      // number only:
      min: 0, max: 1, step: 0.05,
      // select only:
      options: [{ value: 'auto', label: 'Auto' }],
    },
  ],
  enter(el, resolvedParams) {
    // activate: set CSS, start a rAF loop, start a worker, ...
    // el is the slot element, EXCEPT for 'backdrop' presets, which get the portal
    // element itself (see Implementation notes)
    return () => { /* cleanup */ };
  },
}
```

`color-text` params are resolved to concrete colours before `enter()` is called; see [Implementation notes](#implementation-notes). The registry (`ScreenEffectPresetRegistry`, module singleton `screenEffectPresetRegistry`) has `register(name, preset)`, `get(name)`, `has(name)` and `list()`; registering an existing name replaces it.

## Built-in presets

Registered at module load in `src/core/screen-effects/ScreenEffectPresetRegistry.js`.

### Backdrop (CSS `backdrop-filter`)

All five come from one factory, `_backdropFilterPreset()`, which sets `backdrop-filter` (and `-webkit-backdrop-filter`) to `<fn>(<value>)`.

| Preset | Default params | Description |
|---|---|---|
| `blur` | `amount: '8px'` | Gaussian blur of the content behind the overlay |
| `saturate` | `amount: '200%'` | Colour saturation boost |
| `grayscale` | `amount: '100%'` | Colour desaturation |
| `contrast` | `amount: '200%'` | High contrast |
| `hue-rotate` | `angle: '180deg'` | Hue rotation |

### Color tint

| Preset | Default params | Description |
|---|---|---|
| `color-tint` | `color: 'rgba(0,0,0,0.5)'` | Solid or semi-transparent colour fill |
| `vignette` | `opacity: 0.7` | Dark radial gradient at the edges |

### Canvas

| Preset | Default params | Description |
|---|---|---|
| `static` | `opacity: 0.55, scale: 4, color: '#ffffff', tintStrength: 0` | TV static noise (`effects/StaticEffect.js`); `scale` sets the grain size; `color` / `tintStrength` blend toward a tint |
| `pixelate` | `pixelSize: 8, opacity: 0.75, variance: 0.35, baseLight: 80, color: '#8c9aa6', tintStrength: 0` | Mosaic of dark blocks (`effects/PixelateEffect.js`), `multiply` blend, about 8 fps; simulates low-res signal degradation |
| `glitch` | `intensity: 0.08, maxShift: 40, bandHeight: 4, opacity: 0.85, fps: 20` | Sparse horizontal displacement bands with thin chroma edges (`effects/GlitchEffect.js`); `overlay` blend |
| `scanlines` | `lineHeight: 4, opacity: 0.25, scroll: 0` | CRT line overlay (`effects/ScanlineEffect.js`); `scroll` in px/s; redraws only on resize while still |
| `borg-assimilation` | `siteCount: 7, tendrilsPerSite: 8, tendrilLength: 600, particleCount: 2, color: '#00cc44', glowColor: '#00ff66', renderer: 'auto', cube: true, cubeStyle: 'detailed', corruption: 0.5, overrun: 0.65` | Borg assimilation intro (`effects/BorgAssimilationEffect.js`); runs until cleared, so use `apply()` / `applySlot()`, not `play()`. See below |

**`borg-assimilation` renderers.** `BorgAssimilationEffect` creates its own canvas next to the SEM canvas slot (`pointer-events: none`, so clicks still reach the slot) and transfers it to a worker with `transferControlToOffscreen()`. With `renderer: auto` or `webgl` it runs the WebGL2 worker (`BorgAssimilationGLWorker.js`), which draws the layout computed on the main thread by `borg-layout.js` (seeded): pass 1 adds tendril strips, site glows and the Borg cube's edges into a framebuffer, pass 2 draws the assimilation front with procedural circuitry behind it, then the pass 1 picture with signal corruption. With `renderer: canvas`, no WebGL2 or a failed context, it runs the classic Canvas2D worker (`BorgAssimilationWorker.js`). Both worker sources are `?raw` strings in a lazy chunk (`borg-worker-sources.js`). The running canvas carries `data-lcards-renderer` (`webgl` or `canvas`). `borgIntroSupported()` (exported) reports whether `OffscreenCanvas` transfer and `Worker` exist; `BorgAssimilationManager` skips its intro when they don't.

---

## Console API

`window.lcards.screenEffect` delegates to the singleton (`src/lcards-main.js:752-829`):

```js
// Play a transient effect: it clears after duration ms (default 1000)
window.lcards.screenEffect.play('pixelate', { duration: 2000, pixelSize: 32 })
window.lcards.screenEffect.play('static',   { duration: 800, scale: 6 })

// Apply persistent slot effects (they stay until removed)
window.lcards.screenEffect.applySlot('backdrop', 'blur',       { amount: '12px' })
window.lcards.screenEffect.applySlot('color',    'color-tint', { color: 'rgba(180,0,0,0.35)' })

// apply() uses the preset's own slot
window.lcards.screenEffect.apply('blur',   { amount: '12px' })
window.lcards.screenEffect.apply('vignette')

// Remove effects
window.lcards.screenEffect.clearSlot('backdrop')   // one slot
window.lcards.screenEffect.clear()                  // all slots

// Register a custom preset at runtime
window.lcards.screenEffect.registerPreset('my-effect', {
  slot: 'color',
  defaults: { color: 'rgba(0,255,0,0.2)' },
  enter(el, params) {
    el.style.background = params.color;
    return () => { el.style.background = ''; };
  },
})

window.lcards.screenEffect.getPreset('blur')   // the full preset definition
window.lcards.screenEffect.catalog()           // [{ name, label, slot, params_schema, defaults }, ...]
window.lcards.screenEffect.list()              // registered names (also logged)
```

---

## Home Assistant actions: `lcards.trigger_effect` and `lcards.clear_effect`

**`trigger_effect` sets one or more slots on the targeted browsers, each slot on its own.** The action (`custom_components/lcards/services.py`, `handle_trigger_effect`) fires a targeted `lcards_event` `{ action: 'trigger_effect', layers, duration? }`; `IntegrationService._handleLcardsEvent()` (`src/core/services/IntegrationService.js:484-510`) applies it:

| `layers.<slot>` | What happens on that slot |
|---|---|
| left out | nothing: an effect already running there keeps running, with its own timer |
| `null` | `sem.clearSlot(slot)` |
| `{ preset, ...params }` | `sem.applySlotFor(slot, preset, params, duration)` when `duration` is set, else `sem.applySlot(slot, preset, params)` (until cleared) |
| an unknown slot name | warning, skipped |

`duration` is per slot: `applySlotFor()` (`ScreenEffectManager.js:310-321`) starts a timer on that slot alone, and applying or clearing the slot again cancels it (`_releaseSlot()`). So a later call that sets another slot, or the same slot again, is never cut short by an earlier call's timer, and a slot the call left out keeps whatever it had. The backend only adds `duration` to the payload when it is set (`services.py:336-341`).

```yaml
# Red alert: blur, red tint and static, each cleared after 5 s
action: lcards.trigger_effect
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
  duration: 5000
  target_device_ids:
    - "abc123def456"
```

```yaml
# Swap the canvas effect for 1 s; the backdrop and tint above keep their timers
action: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: glitch
      intensity: 0.15
  duration: 1000
```

```yaml
# Clear the tint now, leave the other slots alone
action: lcards.trigger_effect
data:
  layers:
    color: null
```

**`clear_effect`** fires `{ action: 'clear_effect', slot? }`; the browser calls `screenEffect.clearSlot(slot)`, or `clear()` without a slot (`IntegrationService.js:443-461`).

Device and user ids for targeting: `window.lcards.targeting.getMyIds()` → `{ deviceId, userId }`. User-facing reference: [Home Assistant actions](../../configuration/ha-actions.md#screen-effect-actions).

Effects set this way share the slots with the overlays: a `PortalOverlayManager` slot shown with `layers` replaces only the slots its layers set, and when it hides (or a newer overlay with layers takes over) it clears only the effects it applied, so a `trigger_effect` on another slot, or applied after the overlay on the same slot, keeps running. `BorgAssimilationManager.deassimilate()` ends with `sem.clear()`, which clears everything.

---

## Programmatic API (singleton)

| Method | Returns | Description |
|---|---|---|
| `applySlot(slot, preset, params?)` | `boolean` | Apply a preset to a slot until it is cleared. `false` for an unknown preset or slot, or when `enter()` throws. |
| `applySlotFor(slot, preset, params, duration)` | `boolean` | As `applySlot()`, then clear that slot alone after `duration` ms (used by `trigger_effect`). |
| `apply(preset, params?)` | `boolean` | `applySlot()` on the preset's own slot. |
| `play(preset, params?)` | `Promise<void>` | `apply()`, then release the slot after `params.duration` (default 1000) ms. The promise resolves when the slot is released, also when it is cleared or replaced early. Resolves at once for an unknown preset. |
| `clearSlot(slot)` | `void` | Release one slot and update the portal visibility. |
| `slotToken(slot)` | `number` | Which application of an effect runs on the slot: a new number each time an effect is applied there, `0` while it is empty. |
| `clearSlotIfToken(slot, token)` | `boolean` | Clear the slot only while it still runs the effect `token` names (used by POM, so an overlay never clears an effect applied after its own). |
| `clear()` | `void` | Release all three slots. |
| `enterPreset(el, preset, params?)` | `function\|null` | Run a preset on the caller's own element (the Alert Studio mock screen); defaults merged and colours resolved as for a slot. Returns the cleanup, or `null` for an unknown preset or a failed `enter()`. |
| `registerPreset(name, preset)` | `void` | Register or replace a preset (`screenEffectPresetRegistry.register`). |
| `listPresets()` | `string[]` | Registered names. |
| `getPreset(name)` | `Object\|undefined` | One preset definition. |
| `catalog()` | `Array` | `[{ name, label, slot, params_schema, defaults }]`, for the editors. |
| `portal` | `HTMLDivElement` | Getter; creates the portal when needed. |
| `setOverlayOccupied(bool)` | `void` | Keep the portal visible while overlay content is in it, with no effect running. |

```js
const sem = window.lcards.core.screenEffectManager;

sem.applySlot('backdrop', 'blur',       { amount: '16px' })
sem.applySlot('color',    'color-tint', { color: 'rgba(180,0,0,0.35)' })
sem.applySlotFor('canvas', 'static', { opacity: 0.4 }, 3000)
await sem.play('glitch', { duration: 800 })
sem.clearSlot('canvas')
sem.clear()
```

### Portal access for overlays

`sem.portal` and `sem.setOverlayOccupied()` are meant for `PortalOverlayManager` only; it is the one caller. The alert overlay and the connection overlay do not touch the portal: they call `portalOverlayManager.show()` / `hide()`. New full-screen content should be a POM slot too, not elements appended to the portal by hand.

---

## Adding a new effect

1. Create `src/core/screen-effects/effects/MyEffect.js`:

```js
import { prefersReducedMotion } from '../../../utils/reduced-motion.js';

// enter(canvas, params) → cleanup()
export function MyEffect(canvas, params = {}) {
  const { opacity = 0.8 } = params;
  canvas.style.opacity = String(opacity);
  let rafId = null;
  function draw() {
    // ... draw to canvas ...
    if (prefersReducedMotion()) return;   // reduced motion: hold this frame
    rafId = requestAnimationFrame(draw);
  }
  rafId = requestAnimationFrame(draw);
  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    canvas.style.opacity = '';
  };
}
```

2. Register it in `ScreenEffectPresetRegistry.js`:

```js
import { MyEffect } from './effects/MyEffect.js';

screenEffectPresetRegistry.register('my-effect', {
  label:    'My Effect',
  slot:     'canvas',
  defaults: { opacity: 0.8 },
  params_schema: [
    { key: 'opacity', type: 'number', label: 'Opacity', min: 0, max: 1, step: 0.05 },
  ],
  enter: MyEffect,
});
```

3. Add it to the user docs ([Screen Effects](../../core/effects/screen-effects.md#preset-reference)) and the `trigger_effect` description in `custom_components/lcards/services.yaml`.

4. Build and try it:

```bash
npm run build      # writes custom_components/lcards/lcards.js; hard-refresh the browser
```

```js
window.lcards.screenEffect.play('my-effect', { duration: 2000 })
```

---

## Relationship to other systems

| System | Relationship |
|---|---|
| **PortalOverlayManager** | The only user of `sem.portal` and `setOverlayOccupied()`. Applies a slot's `layers` with `applySlot()` and owns the effects it applied (last overlay shown with layers wins), clearing them by token with `clearSlotIfToken()`. See [Portal Overlay Manager](portal-overlay-manager.md#screen-effect-ownership). |
| **Alert overlay** (`lcards-alert-overlay`) | Passes `layers: { backdrop, color, canvas }` (card config plus per-condition overrides) to `portalOverlayManager.show('alert-overlay')`. Config stays in the card; SEM owns the effect DOM. |
| **ConnectionOverlayService** | The same, through slot `'connection-overlay'` (`layers`). |
| **BorgAssimilationManager** | Calls `apply('borg-assimilation')`, `applySlot()`, `clearSlot()` and `clear()` directly, and listens for clicks on the canvas slot. See [Borg Assimilation](borg-assimilation.md). |
| **Alert Studio, connectivity tab** | The Alert Studio previews layers on its mock screen with `enterPreset()` (`src/editor/components/alert-overlay/lcards-alert-preview.js`); the editors list presets with `catalog()`. |
| **Alert transitions** (`alertTransitions.js`) | Separate: animates `home-assistant-main` while the alert palette swaps. Not screen-level compositing. |
| **Background animations** | Card-scoped renders inside the card. No link to the screen portal. |
| **AnimationManager** | Element-scoped anime.js animations. Not for screen-wide effects. |

---

## Implementation notes

**Colour resolution for `color-text` params.** Before `enter()`, `_resolveColorParams()` (`ScreenEffectManager.js:382-395`) passes every param whose `params_schema` type is `color-text` through `resolveColor(raw, { concrete: true })` (`src/core/themes/resolve-color.js`). That turns `var(--lcars-*)`, `theme:` tokens and computed colours (`alpha(...)`, `darken(...)`) into a concrete colour the element styles and canvases can use. Concrete mode reads the live values each time and never caches, so a palette change from an alert mode applies to the next effect started; an effect already running keeps the colour it started with. Params of other types are passed as given, and presets without a `params_schema` get none of this (a custom preset that takes colours should declare them as `color-text`).

**`backdrop-filter` and `mix-blend-mode` compositing.** Canvas presets that set `mix-blend-mode` (`static`, `glitch`, `pixelate`, the classic Borg renderer) make the browser give the portal its own compositing layer. A `backdrop-filter` on a child of the portal then filters an already-composited surface and no longer reaches the dashboard behind it. So `_applySlot()` hands `backdrop` presets the **portal element itself** instead of the slot `<div>` (`ScreenEffectManager.js:211-222`, `enterEl`); the portal-level filter is resolved before the children composite, and the canvas blend modes render correctly on top of the filtered page. `scanlines` sets no blend mode and is not affected.

**Canvas security.** Canvas2D cannot read arbitrary page pixels, so `pixelate` draws synthetic blocks instead of sampling the screen: an obscuring mosaic, not a true pixelation of the content.

**Lazy portal.** The portal is built on the first call that needs it: `applySlot()`, `applySlotFor()`, `apply()`, `play()` or the `portal` getter (POM's first `show()`). `enterPreset()` does not create it. It is never built at singleton construction, so nothing touches Home Assistant's DOM before an effect or overlay is used.

**Reduced motion.** With `prefers-reduced-motion: reduce` (`src/utils/reduced-motion.js`), `static`, `pixelate` and `glitch` draw one frame and hold it, `scanlines` stops scrolling, and `borg-assimilation` shows its finished picture (the main thread sends the setting to the worker, also when it changes). SEM itself does not check the setting; each effect does. A custom canvas effect should do the same (see the example above).
