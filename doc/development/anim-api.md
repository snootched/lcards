# Animation API

Pack and card developer reference for `window.lcards.anim` — the LCARdS interface to anime.js v4.

::: info anime.js v4
LCARdS bundles **anime.js v4**. The v4 API differs from v3 in several important ways — always use `ease` not `easing`, and the timeline API has changed. Refer to the [anime.js v4 docs](https://animejs.com) for the full reference.
:::

---

## `window.lcards.anim` Namespace

All anime.js primitives and LCARdS animation utilities live here.

### Core anime.js exports

| Property | Source | Description |
|---|---|---|
| `anim.animejs` | `anime` (full module) | Full anime.js module — all exports available |
| `anim.anime` | `anime.animate` | Create a single animation (most common call) |
| `anim.stagger` | `anime.stagger` | Stagger function for sequenced delays |
| `anim.spring` | `anime.createSpring` | Spring physics easing generator |
| `anim.createScope` | `anime.createScope` | Scope factory for overlay-scoped animations |
| `anim.utils` | `anime.utils` | anime.js utility functions |
| `anim.splitText` | `anime.splitText` | Native text splitter (v4.1+) |
| `anim.eases` | `anime.eases` | Built-in and advanced easing functions |

```javascript
// Direct anime.js v4 call
window.lcards.anim.anime('.my-element', {
  translateX: [0, 100],
  duration: 800,
  ease: 'inOutQuad',      // v4: use 'ease', not 'easing'
});

// Stagger
window.lcards.anim.anime('.grid-cell', {
  scale: [0, 1],
  delay: window.lcards.anim.stagger(50, { grid: [6, 4], from: 'center' }),
  duration: 600,
});

// Spring easing
const spring = window.lcards.anim.spring({ stiffness: 150, damping: 18 });
window.lcards.anim.anime('.panel', { translateY: [-20, 0], ease: spring, duration: 1000 });

// Scope (for overlay-scoped cleanup)
const scope = window.lcards.anim.createScope({ root: myElement });
```

### Easing reference

```javascript
const e = window.lcards.anim.eases;

// Parametric built-ins (call as function)
e.in()         // ease-in (quadratic default)
e.out()
e.inOut()
e.inBack()
e.outElastic()
// ... etc.

// Generator functions
e.cubicBezier(x1, y1, x2, y2)
e.steps(count, fromStart?)
e.linear(...points)
e.irregular(steps, randomness)
```

---

## LCARdS animation helpers

These wrappers live on `window.lcards.anim` and handle shadow-DOM target resolution, scope registration, and preset expansion.

### `anim.animateElement(scope, options, hass?, onInstanceCreated?)`

Full-featured card animation entry point. Resolves targets within a scope's shadow root, expands presets, handles stagger batching, timeline markers, and CSS variable resolution.

```javascript
// scope    — anime.js scope object (from AnimationManager or createScope)
// options  — { type, targets, root?, ...animOptions }
//   type     (required) — preset name or anime.js property key
//   targets  (required) — CSS selector string, Element, or array
//   root     (optional) — shadow root or element to query within (default: document)
// hass     — HA hass object (optional, unused currently, reserved)
// onInstanceCreated — callback(animInstance) called after the animation is created

await window.lcards.anim.animateElement(scope, {
  type: 'pulse',
  targets: '#my-rect',
  root: myCard.shadowRoot,
  duration: 600,
  ease: 'inOutSine',
  loop: true,
});
```

### `anim.animateWithRoot(options)`

Simpler wrapper — resolves targets within a root and calls `anime.animate()` directly. Does not expand presets. Use when you want raw anime.js params with shadow-DOM target resolution.

```javascript
// options — { targets, root?, scopeId?, ...animeOptions }
//   targets  (required) — selector, Element, or array
//   root     (optional) — root to query within (default: document)
//   scopeId  (optional) — key in anim.scopes Map; if present, animation is registered to that scope

await window.lcards.anim.animateWithRoot({
  targets: '.status-bar',
  root: myCard.shadowRoot,
  opacity: [0, 1],
  duration: 400,
});
```

### `anim.waitForElement(selector, root?, timeout?)`

Waits for a CSS selector to appear in the DOM using `MutationObserver`. Returns a `Promise<Element>`.

```javascript
// selector  — CSS selector string
// root      — Element or Document to search within (default: document)
// timeout   — ms before rejection (default: 2000)

const el = await window.lcards.anim.waitForElement('#my-id', shadowRoot, 3000);
```

---

## Animation presets

`anim.presets` is an object populated at startup from all loaded packs.

```javascript
// List available presets
Object.keys(window.lcards.anim.presets)

// Get a preset function
const presetFn = window.lcards.anim.presets['pulse'];
```

Preset names are passed as the `type` field when using `animateElement` or in card YAML `animations[n].preset`. See [Card Animations](../core/animations.md) for the user-facing preset reference.

---

## Active scopes

`anim.scopes` is a `Map` maintained by `AnimationManager`. Overlays register a scope entry here on creation. Pack code should generally not interact with this directly — use `AnimationManager.createScopeForOverlay()` instead.

```javascript
// Inspect active scope IDs
[...window.lcards.anim.scopes.keys()]
```

---

## Backward-compatible root aliases

The following are kept on the root `window.lcards` namespace for older code. Prefer `window.lcards.anim.*` in new work.

| Root alias | Equivalent |
|---|---|
| `window.lcards.animejs` | `window.lcards.anim.animejs` |
| `window.lcards.anime` | `window.lcards.anim.anime` |
| `window.lcards.animateElement` | `window.lcards.anim.animateElement` |
| `window.lcards.animateWithRoot` | `window.lcards.anim.animateWithRoot` |
| `window.lcards.waitForElement` | `window.lcards.anim.waitForElement` |

---

## See Also

- [Card Animations](../core/animations.md) — YAML-level animation config for LCARdS cards
- [Animation Manager](../architecture/subsystems/animation-manager.md) — core singleton that owns scopes
- [Debug API](debug-api.md)
