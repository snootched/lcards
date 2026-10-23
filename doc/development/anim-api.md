# Animation API

Pack and card developer reference for `window.lcards.anim`, the LCARdS interface to anime.js v4.

::: info anime.js v4
LCARdS bundles **anime.js v4**. The v4 API differs from v3 in several important ways: always use `ease` not `easing`, and the timeline API has changed. Refer to the [anime.js v4 docs](https://animejs.com) for the full reference.
:::

---

## `window.lcards.anim` Namespace

All anime.js primitives and LCARdS animation utilities live here.

### Core anime.js exports

| Property | Source | Description |
|---|---|---|
| `anim.animejs` | `anime` (full module) | Full anime.js module, all exports available |
| `anim.anime` | `anime.animate` | Create a single animation (most common call) |
| `anim.stagger` | `anime.stagger` | Stagger function for sequenced delays |
| `anim.spring` | `anime.createSpring` | Spring physics easing generator |
| `anim.createScope` | `anime.createScope` | Scope factory for overlay-scoped animations |
| `anim.utils` | `anime.utils` | anime.js utility functions |
| `anim.splitText` | `anime.splitText` | Native text splitter (v4.1+) |
| `anim.scrambleText` | `anime.scrambleText` | Text scramble/decode as a function-based value (v4.4+). On SVG text, animate a proxy object and copy its `textContent` (anime.js writes unknown SVG properties as attributes); the `text-decode` preset does this |
| `anim.eases` | `anime.eases` | Built-in and advanced easing functions |

```javascript
// Direct anime.js v4 call
window.lcards.anim.anime('.my-element', {
  x: [0, 100],            // v4: use 'x', not 'translateX'
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
window.lcards.anim.anime('.panel', { y: [-20, 0], ease: spring, duration: 1000 });

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

// Generators live on window.lcards.anim, not on eases
// (e.linear is the plain linear curve, not the points generator)
const a = window.lcards.anim;
a.cubicBezier(x1, y1, x2, y2)
a.steps(count, fromStart?)
a.linear(...points)
a.irregular(steps, randomness)
a.spring({ stiffness, damping, mass, velocity })
```

Card YAML reaches these through `ease` plus `params.ease_params` (for example `ease: steps` with `params: { ease_params: { steps: 4 } }`; without `ease_params` the defaults apply), or `ease: custom` with `params.ease_params.customString` holding an expression pasted from the anime.js easing editor such as `spring({ bounce: 0.4, duration: 500 })`.

---

## LCARdS animation helpers

These wrappers live on `window.lcards.anim` and handle shadow-DOM target resolution and preset expansion.

### `anim.animateElement(scope, options, hass?, onInstanceCreated?)`

Full-featured card animation entry point. Resolves targets within a scope's shadow root, expands presets, handles stagger batching, timeline markers, and CSS variable resolution.

```javascript
// scope - anime.js scope object (from AnimationManager or createScope)
// options - { type, targets, root?, ...animOptions }
//   type     (required) - preset name or anime.js property key
//   targets  (required) - CSS selector string, Element, or array
//   root     (optional) - shadow root or element to query within (default: document)
// hass - HA hass object (optional, unused currently, reserved)
// onInstanceCreated - callback(animInstance) called after the animation is created; the promise
//   resolves once every instance exists. The anime.js scope does not track them: keep the
//   instances from this callback to stop or revert them.

await window.lcards.anim.animateElement(scope, {
  type: 'pulse',
  targets: '#my-rect',
  root: myCard.shadowRoot,
  duration: 600,
  ease: 'inOutSine',
  loop: true,
});
```

### Animating elements inside a card

anime.js resolves a string selector against `document`, so `'.button-bg'` finds nothing inside a card's shadow root. Pass elements instead, or give a scope the card's root:

```javascript
const card = document.querySelector('lcards-button');           // or the element from the editor/console
const { animate, createScope } = window.lcards.anim.animejs;

// Pass the element itself
animate(card.shadowRoot.querySelector('.button-bg'), { opacity: [1, 0.3, 1], duration: 600 });

// Or resolve selectors against the card's root
const scope = createScope({ root: card.shadowRoot }).add(() => {
  animate('.button-bg', { opacity: [1, 0.3, 1], duration: 600 });
});
scope.revert(); // later: stops it and restores the element
```

Animations made this way are not tracked by AnimationManager (no `stopAnimations`, no reduced-motion gate); for anything a card config should own, use `animateElement` or an `animations:` entry. The former `anim.animateWithRoot()` helper was removed in 2026.10: it predates `createScope({ root })` and its `scopeId` option never worked.

### `anim.waitForElement(selector, root?, timeout?)`

Waits for a CSS selector to appear in the DOM using `MutationObserver`. Returns a `Promise<Element>`.

```javascript
// selector - CSS selector string
// root - Element or Document to search within (default: document)
// timeout - ms before rejection (default: 2000)

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

## Background effects as anime.js targets

Background effects (`background_animation`) draw on a canvas in their own loop, so anime.js can't see them as elements. LCARdS registers an anime.js 4.5 adapter for them (`registerAdapter` from the `animejs/adapters` sub-path, in `src/core/packs/backgrounds/effect-adapter.js`, called once from `lcards-main.js`). That gives every anime.js feature (easing, springs, timelines, `revert()`) and so every LCARdS trigger, rule and the reduced-motion gate on effect parameters. Users reach it with `target: background` ([Animating the background](../core/effects/background-animations.md#animating-the-background)).

**The target is an `EffectHandle`, not the effect** (`effect-handle.js`): one per `background_animation` entry, owned by `BackgroundAnimationRenderer` (`renderer.getHandles(index?)`). A zoomed starfield is one object per layer, and an effect can be rebuilt (an alert-mode palette change on an effect that bakes its colours, a WebGL fallback); the handle outlives both, re-attaches the new objects and re-applies the numeric values set so far. It has `isConnected` (true while its renderer lives), so `AnimationManager`'s target filters and re-render carry-over treat it like an element.

```javascript
const card = document.querySelector('lcards-button');
const [handle] = card._backgroundRenderer.getHandles(0);
const anim = window.lcards.anim.anime(handle, { speed: [1, 8], duration: 2000 });
anim.revert(); // speed back to 1, through the same setters
```

**Declaring what an effect can animate.** Each effect class has `static animatableProps`, keyed by the YAML config key, built with the helpers in `effects/animatable-props.js`:

```javascript
import { numProp, colorProp } from './animatable-props.js';

export class MyEffect extends BaseEffect {
  static animatableProps = {
    ...BaseEffect.animatableProps,                 // opacity, speed
    scroll_speed_x: numProp('scrollSpeedX'),
    density: numProp('density', { min: 0, after: (e) => e._rebuildCache() }),
    color: colorProp('color')                      // concrete colour string
  };
}
```

- Declare only what is cheap to change every frame. A key that needs a rebuild or a re-bake stays out; an entity binding on it falls back to the effect's `updateConfig()` (a snap).
- `after` is the cache invalidation hook. Colour setters get an `rgba()` string (the adapter turns anime.js's `tween._numbers` back into one).
- Honour `this.speed` wherever the effect moves by `deltaTime` (`BaseEffect.update` already runs the elapsed clock at `speed`).
- `x`, `y`, `rotate`, `scale` are handled by the handle and `Canvas2DRenderer` (around each drawn object), not by the effect.
- `tests/core/background-effect-adapter.test.js` fails if a declared key is not a config key of a preset that builds the effect.

**Entity bindings** use the same path: `BackgroundAnimationRenderer.updateHass` resolves the `map_range` or template value, then glides a declared key with `animate(handle, { [key]: value, duration: transition })` (snapping the first value, with `transition: 0` and under reduced motion; `Canvas2DRenderer.requestFrame()` redraws the held reduced-motion frame).

**Alert mode recolours in place.** `BackgroundAnimationRenderer.refreshColors()` builds each entry again with the new palette and calls `effect.recolorFrom(fresh)` on the live effects, so layouts, scroll offsets and zoom clocks carry on. The default copies `static recolorFields` and calls `_afterRecolor()`; starfield and nebula copy per star/cloud (same seed, same colour slot). An effect that returns false (it bakes its colours, like the texture effects) is swapped for the fresh copy in its own slot with its clocks carried. A preset with a `seed` param gets one random seed per entry, kept across rebuilds.

## three.js background scenes

`warp-starfield` and `grid-floor` are three.js scenes (`src/core/packs/backgrounds/webgl/`):

- **One WebGL context per page** (`three-runtime.js`, lazy chunk with three.js and `animejs/adapters/three`). Browsers keep about 16 live contexts and drop the oldest, so a scene renders on the shared context (an `OffscreenCanvas`) and its `ThreeSceneEffect` draws the frame into the card's Canvas2D canvas (`transferToImageBitmap`). The scene is one more entry in `Canvas2DRenderer`, so pausing, the reduced-motion held frame, transforms and zoom apply unchanged. The last scene out disposes the context; a disconnected card releases its scene (`releaseGPU()`) and rebuilds it on the next draw.
- **Scene motion runs on the effect clock.** A scene builds its anime.js animations on three.js objects (cameras, meshes, `getInstances(instancedMesh)`, materials, uniforms, timelines) with `autoplay: false`, and `seek(time)` runs every frame with the effect's elapsed time, which already runs at `speed`. So `speed` warps a scene without a jump, and a paused card is a paused scene.
- **Users still target the handle.** `static animatableProps` on the effect class (`sceneProp()`, `sceneColorProp()`) forwards keys such as `camera_tilt` to the scene's `setParam()`, which writes through the adapter (`utils.set(camera, { rotateX })`).
- **Fallback:** a preset declares `renderer: 'webgl'` and `fallback: '<canvas2d preset>'`. Without WebGL the fallback is built from the same config; a failed chunk load or a lost context swaps the entry for it.
- **Cost:** per-instance anime.js loops cost about 1 µs per object per frame (500 stars 0.5 ms, 5,000 stars 7 ms), fine for hundreds of objects; for thousands use a shader uniform (the `shader` variant).
- Debug: `await lcards.debug.webgl.stats()` (users, context, contexts created), `lcards.debug.webgl.frameStats(reset?)` (background update+draw ms per card frame on the page), `lcards.debug.webgl.loseContext()`.

---

## Active scopes

`anim.scopes` is a `Map` maintained by `AnimationManager`. Overlays register a scope entry here on creation. Pack code should generally not interact with this directly; use `AnimationManager.createScopeForOverlay()` instead.

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
| `window.lcards.waitForElement` | `window.lcards.anim.waitForElement` |

---

## See Also

- [Card Animations](../core/animations.md): YAML-level animation config for LCARdS cards
- [Animation Manager](../architecture/subsystems/animation-manager.md): core singleton that owns scopes
- [Debug API](debug-api.md)
