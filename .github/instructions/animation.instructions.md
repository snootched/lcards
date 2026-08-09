---
applyTo: "src/cards/**, src/msd/**"
---

# LCARdS Animation Rules

These rules apply to all card and MSD source files. LCARdS uses **anime.js v4** — the API is different from v3 and many online examples are v3. Always verify against v4 before using any pattern.

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
| Pause all when tab hidden | `anime.running` forEach | `anime.engine.pauseOnDocumentHidden` (boolean, default `true`) |

animejs v4 has no default export — import it as a namespace: `import * as anime from 'animejs'` (matches actual usage in `src/lcards.js`).

---

## AnimationManager — Singleton Access

Access via `this._singletons.animationManager` (inside a card) or `window.lcards.core.animationManager` (global).

```javascript
const animManager = this._singletons.animationManager;

// Register animation for an overlay
animManager.onOverlayRendered(overlayId, element, overlayConfig, systemsManager);

// Play a named animation
// (called by TriggerManager/ActionHelpers internally; prefer trigger-based approach)
```

Cards register their overlays via `_registerOverlayForRules()` — animations declared in `config.animations[]` are automatically wired by `AnimationManager.onOverlayRendered()` when the overlay is ready.

---

## AnimationRegistry — Instance Caching

`AnimationRegistry` caches animation instances by semantic hash of their definition. Use it to avoid re-parsing identical animation configs on every render.

```javascript
const registry = window.lcards.core.animationRegistry;

// getOrCreateInstance(definition, targets) → reuses if semantically identical
const instance = registry.getOrCreateInstance(
  { preset: 'pulse', duration: 600, ease: 'inOutQuad', loop: true },
  this.shadowRoot.querySelector('.my-element')
);

instance.play();
```

---

## Declaring Animations in Card Config

Use the `animations:` key. Each entry ties a preset/params to a trigger:

```yaml
animations:
  - trigger: on_load
    preset: fade_in
    params:
      duration: 400

  - trigger: on_tap        # interactive — handled by ActionHelpers
    preset: pulse
    params:
      scale: [1, 1.1, 1]
      duration: 300

  - trigger: on_entity_change
    entity: light.kitchen  # watch this entity for changes
    preset: flash
    params:
      duration: 200
```

**Supported triggers:**

| Trigger | Handler |
|---------|---------|
| `on_load` | `TriggerManager` — fires once when overlay first renders |
| `on_tap` / `on_hold` / `on_hover` / `on_double_tap` | `ActionHelpers` — interactive events |
| `on_entity_change` | `TriggerManager` — HA entity state subscription |
| `on_datasource_change` | `AnimationManager` — DataSource subscription |

---

## `prefers-reduced-motion` Guard

All animation code must respect the browser accessibility setting. Check before registering or firing animations:

```javascript
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reducedMotion) {
  // register / play animation
}
```

For `AnimationManager`-driven animations, the manager checks this internally — but **any direct anime.js calls you make must guard manually**.

---

## Alert Mode

Alert mode broadcasts a color/pulse state across all registered cards simultaneously.

```javascript
// Trigger from console or automation card
window.lcards.alert.red();    // red alert
window.lcards.alert.yellow(); // yellow alert
window.lcards.alert.off();    // clear

// Cards listen for the lcards:alert-mode event and apply preset animations
// Do NOT implement separate alert listeners — the AnimationManager handles distribution
```

MSD alert animation presets live in `src/msd/presets/alert-mode/`. Cards that need custom alert behavior should register an animation with the `alert_red` / `alert_yellow` trigger (if defined) rather than listening for the raw event.

This is distinct from repainting **static resolved colors** that reference an alert-mode CSS var (e.g. a state color map using `var(--lcars-alert-red)`) — those aren't animations, so they don't go through AnimationManager's distribution. For that case, subscribe directly via `themeManager.subscribeToAlertMode(cb)` (see [Theme System](../../doc/architecture/subsystems/theme-system.md#alert-mode-integration); `LCARdSButton._subscribeToAlertMode()` is a reference implementation) — this is not a "duplicate alert listener" in the sense the anti-pattern below warns against, since it doesn't re-implement animation distribution.

---

## Anti-patterns

❌ Don't use v3 `anime.timeline().add({ targets })` syntax — it's broken in v4
❌ Don't use easing strings like `'easeInOutQuad'` — use `'inOutQuad'` (v4 dropped the prefix)
❌ Don't fire anime.js animations directly during `_renderCard()` — trigger via `on_load` or `_handleFirstUpdate` after the element exists in the DOM
❌ Don't skip `prefers-reduced-motion` check on direct `anime.animate()` calls
❌ Don't create timeline instances in constructors — the DOM elements they target don't exist yet
❌ Don't duplicate alert mode listeners — `AnimationManager` distributes alert events to all registered overlays automatically
