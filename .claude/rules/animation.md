---
paths:
  - "src/cards/**"
  - "src/msd/**"
  - "src/core/animation/**"
  - "src/core/packs/animations/**"
  - "src/utils/lcards-anim-helpers.js"
  - "src/base/LCARdSActionHandler.js"
---

# LCARdS Animation Rules

These rules apply to all card and MSD source files. LCARdS uses **anime.js v4** — the API is different from v3 and many online examples are v3. Always verify against v4 before using any pattern. The full v4 API reference (patched for the 4.5.0 we ship) is the `animejs` project skill; load it before writing anime.js calls.

---

## anime.js v4 — Critical API Differences from v3

| Feature | v3 (WRONG) | v4 (CORRECT) |
|---------|------------|--------------|
| Basic tween | `anime({ targets, translateX: 100 })` | `anime.animate(targets, { x: 100 })` |
| Timeline create | `anime.timeline()` | `anime.createTimeline()` |
| Add to timeline | `.add({ targets, ... })` | `.add(targets, { ... })` |
| Easing names | `'easeInOutQuad'` | `'inOutQuad'` |
| Stagger | `anime.stagger(100)` | `anime.stagger(100)` _(unchanged)_ |
| Play/pause | `anim.play()` / `anim.pause()` | `anim.play()` / `anim.pause()` _(unchanged)_ |
| Parametric eases | `easing: 'steps(5)'`, `'cubicBezier(...)'` | Function from a top-level export: `ease: anime.steps(5)`, `anime.cubicBezier(...)`. String form removed in 4.3; these are NOT on `anime.eases` (also exposed as `window.lcards.anim.cubicBezier/steps/linear/irregular`). Config YAML goes through `resolveEasing()` |
| Function-based values | `(el, i, total)` | `(el, i, targets, prevTween)`: `targets` is an Array since 4.4 (`targets.length` for the count) |
| Stop an animation | `anim.pause()` + reset | `revert()` restores styles, attributes and object props to their pre-animation values (4.4+); `cancel()` stops where it is; `utils.cleanInlineStyles(anim)` clears styles only |
| Transform order | As written | Always perspective, translate, rotate, scale, skew (4.4+) |
| Pause all when tab hidden | `anime.running` forEach | `anime.engine.pauseOnDocumentHidden` (boolean, default `true`) |

animejs v4 has no default export; import it as a namespace: `import * as anime from 'animejs'` (matches actual usage in `src/lcards-main.js`, which exposes it as `window.lcards.anim`). LCARdS ships animejs 4.5.0. Full v4 reference: the `animejs` project skill (`.claude/skills/animejs/`), with the 4.4/4.5 changes in its `references/changes-4.4-4.5.md`.

---

## AnimationManager — Singleton Access

Access via `this._singletons.animationManager` (inside a card) or `window.lcards.core.animationManager` (global).

```javascript
const animManager = this._singletons.animationManager;

// Register animation for an overlay
animManager.onOverlayRendered(overlayId, element, overlayConfig, systemsManager);

// Play a named animation
// (called by TriggerManager and the card's action handler, src/base/LCARdSActionHandler.js; prefer the trigger-based approach)
```

Cards wire `config.animations[]` through `setupActions()` (`LCARdSCard.js`), which calls `AnimationManager.onOverlayRendered()` for the element; `_registerOverlayForRules()` is for the rules engine only.

---

## Animation presets

The built-in presets live in `src/core/packs/animations/presets/` and register through `registerAnimationPreset(name, builder, { pack, category })` in `src/core/animation/presets.js` (`listAnimationPresets()`, `listAnimationPresetInfo()`). There is no instance cache: the old `AnimationRegistry` (`window.lcards.core.animationRegistry`) was removed in 2026.11. There are no user-defined presets (the CB-LCARS MSD `animation_presets` map was removed in 2026.11).

---

## Declaring Animations in Card Config

Use the `animations:` key. Each entry ties a preset/params to a trigger:

```yaml
animations:
  - trigger: on_load
    preset: fade
    params:
      duration: 400

  - trigger: on_tap        # interactive: handled by the card's action handler
    preset: pulse
    params:
      scale: [1, 1.1, 1]
      duration: 300

  - trigger: on_entity_change
    entity: light.kitchen  # watch this entity for changes
    preset: blink
    params:
      duration: 200
```

**Supported triggers:**

| Trigger | Handler |
|---------|---------|
| `on_load` | `AnimationManager`: fires once when the overlay first registers |
| `on_show` | `AnimationManager`: each time the card is attached |
| `on_tap` / `on_hold` / `on_hover` / `on_leave` / `on_double_tap` | The card's action handler (`LCARdSActionHandler`) calls `AnimationManager.triggerAnimations()` |
| `on_entity_change` | `TriggerManager` — HA entity state subscription |
| `on_datasource_change` | `AnimationManager` — DataSource subscription |

---

## `prefers-reduced-motion` Guard

`AnimationManager.playAnimation()` gates every animation it creates, so trigger-based animations (`animations:` in card config, rules, segments) need nothing extra: under `prefers-reduced-motion: reduce` a finite animation jumps to its end state (`complete()`, so entrance and `on_show` animations still leave content visible and `onComplete` fires) and a looping one is reverted and never tracked. Switching the setting on while a dashboard is open settles the running ones (`_settleAllForReducedMotion()`); switching it off lets the next trigger play.

Code that moves things outside the manager guards itself with the shared helper, read at the moment motion would start (never cached at startup):

```javascript
import { prefersReducedMotion, onReducedMotionChange } from '../utils/reduced-motion.js';
if (!prefersReducedMotion()) {
  // direct anime.js call, WAAPI el.animate(), requestAnimationFrame loop
}
const unsubscribe = onReducedMotionChange((reduced) => { /* pause or resume a loop */ });
```

Existing guards: the slider value tween and release fade, the data-grid change flash, `stagger-flash` (WAAPI), `Canvas2DRenderer` and the Glitch/Pixelate/Static/Scanline screen effects (these draw one frame and hold it), and the Borg assimilation effect (its worker has no `matchMedia`, so the main thread sends `reducedMotion` in `start` and `motion` messages; the worker draws its settled picture and holds it). An animation with `essential_motion: true` skips the gate (playAnimation, `_settleAllForReducedMotion`, and `stagger-flash`'s own WAAPI check): only for motion that carries meaning, such as an alert flash.

---

## Alert Mode

Alert mode rewrites the palette CSS variables (`themeManager.setAlertMode()`; console: `window.lcards.alert.red()`, `.yellow()`, `.off()`). It is not an animation system: there are no alert triggers and no alert animation presets.

- Cards whose colours resolve to CSS targets (`var()`, see the state-color rule) follow with no code.
- Cards that hold concrete colours (Canvas2D, SVG attributes, anime.js values) override `_onAlertModeChanged(mode)`; LCARdSCard subscribes via `themeManager.subscribeToAlertMode()` (see [Theme System](../../doc/architecture/subsystems/theme-system.md#alert-mode-integration)). Non-card code subscribes directly.
- An animation that should play during an alert uses `on_entity_change` on the alert helper with `essential_motion: true`.

## Background effects as targets

`target: background`)

`target: background` (+ optional `effect: N`) resolves, in `AnimationManager.playAnimation`, to the card's `EffectHandle`s (`BackgroundAnimationRenderer.getHandles()`), not elements; `animateElement` sends them down `_animateEffectHandles` (no DOM work). anime.js reaches the effect parameters through the adapter in `src/core/packs/backgrounds/effect-adapter.js`. A new effect declares what it can animate in `static animatableProps` (YAML config keys, cheap to change per frame) and multiplies its motion by `this.speed`. Never animate effect objects directly: an alert-mode palette change replaces them; the handle survives it. Reference: `doc/development/anim-api.md#background-effects-as-anime-js-targets`.

## Anti-patterns

❌ Don't use v3 `anime.timeline().add({ targets })` syntax — it's broken in v4
❌ Don't use easing strings like `'easeInOutQuad'` — use `'inOutQuad'` (v4 dropped the prefix)
❌ Don't fire anime.js animations directly during `_renderCard()` — trigger via `on_load` or `_handleFirstUpdate` after the element exists in the DOM
❌ Don't skip the `prefersReducedMotion()` check on direct `anime.animate()`, WAAPI or `requestAnimationFrame` motion outside `AnimationManager`
❌ Don't create timeline instances in constructors — the DOM elements they target don't exist yet
❌ Don't add a raw `window` listener for alert changes: use `_onAlertModeChanged()` or `themeManager.subscribeToAlertMode()`
