# Animation Manager

> **`window.lcards.core.animationManager`** — Central anime.js v4 coordinator for card and overlay animations.

---

## Overview

`AnimationManager` extends `BaseService`. It manages animation **scopes** per overlay, integrates with `DataSourceManager` for reactive value-driven animations, with `RulesEngine` for rule-triggered animations, and provides a full runtime/debug API surface.

---

## Key Classes

| Class | File | Role |
|---|---|---|
| `AnimationManager` | `core/animation/AnimationManager.js` | Scope management, trigger coordination, lifecycle |
| `AnimationRegistry` | `core/animation/AnimationRegistry.js` | Caches compiled anime.js instances; avoids re-parsing |
| `TriggerManager` | `core/animation/TriggerManager.js` | Manages trigger subscriptions (entity_change, datasource) |
| `AnimationPerformanceMonitor` | `core/animation/PerformanceMonitor.js` | Tracks active animation count and frame budget |
| `resolveAnimations` | `core/animation/resolveAnimations.js` | Merges preset defaults with overlay animation config |
| `resolveTimelines` | `core/animation/resolveTimelines.js` | Resolves timeline steps from config or preset |

---

## Architecture

```
AnimationManager
    ├─ scopes Map (overlayId → scope)
    │   ├─ scope.triggerManager  (TriggerManager per overlay)
    │   └─ scope.activeAnimations (Set<anime instance>)
    │
    ├─ AnimationRegistry  (shared, caches anime instances by key)
    ├─ datasourceSubscriptions (datasource_id → cleanup fn)
    └─ timelines Map (timelineId → createTimeline() instance)
```

---

## Trigger Types

| Trigger | When fires |
|---|---|
| `on_load` | Once on card initialisation |
| `on_tap` | When the card is tapped/clicked |
| `on_hold` | When the card is held (long press) |
| `on_hover` | When the mouse enters the card |
| `on_leave` | When the mouse leaves the card |
| `on_entity_change` | When a watched entity changes state |
| `on_datasource_change` | When a DataSource value crosses a threshold or changes |
| `on_rule` | Internally-synthesized — never set this directly via `trigger:` in your own config. It's applied automatically when an animation is executed via a rule's `apply.animations` targeting; author rule-driven animations through the Rules Engine, not by hand-setting this trigger. |

---

## anime.js v4 Note

LCARdS uses **anime.js v4**. The timeline API (`anime.createTimeline()`, renamed from v3's `anime.timeline()`) changed from v3. Always pass targets as CSS selectors or DOM element references resolved at runtime — not stale references cached at config time.

---

## Preset Animations

Presets are named animation parameter bundles distributed via packs. Built-in presets include:

| Preset | Effect |
|---|---|
| `pulse` | Scale + brightness breathing (use for alert emphasis) |
| `glow` | Animated drop-shadow bloom |
| `slide` | Slide in from a direction |
| `fade` | Opacity transition |
| `bounce` | Elastic scale bounce |

Custom presets are registered via `animation_presets` in pack definitions.

---

## Public API

| Method | Returns | Description |
|---|---|---|
| `playAnimation(overlayId, animDef)` | `Promise<Object\|null>` | Resolve and play one animation definition against an overlay's scope; returns the resolved `animDef` or `null` on failure |
| `triggerAnimations(overlayId, trigger)` | `Promise<void>` | Fire every animation registered for an overlay + trigger pair (used internally by `ActionHandler` on tap/hold/hover/etc.) |
| `stopAnimation(overlayId)` | `void` | Revert the overlay's entire anime.js scope (all running instances) |
| `stopAnimations(overlayId, trigger?)` | `void` | Stop animations for one overlay, optionally filtered to a single trigger |
| `pauseOverlay(overlayId)` / `resumeOverlay(overlayId)` | `void` | Pause/resume the anime.js scope for an overlay |
| `getActiveAnimations()` | `Object` | `{ [overlayId]: [{ preset, trigger, duration }, ...] }` — only overlays with running animations |
| `getAllAnimationDefinitions()` | `Array` | Every registered animation definition, each tagged with its `overlayId` |
| `inspectOverlay(overlayId)` | `Object\|null` | Debug snapshot: `{ overlayId, hasScope, activeAnimations, registeredAnimations, hasTriggerManager }` |
| `dispose()` | `void` | Tear down the manager and all scopes |
| `scopes` | `Map` | Internal scope registry keyed by overlay ID |

Custom animation presets are registered via `animation_presets` in pack definitions (see [Pack System](pack-system.md)). `ScreenEffectManager` has its own, unrelated `registerPreset()` for full-screen effect presets — don't confuse the two.

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('animationManager')
// → { type: 'AnimationManager', initialized: true, scopesCount: 4, customPresetsCount: 0,
//      timelinesCount: 0, activeAnimationsCount: 1, registeredAnimationsCount: 3,
//      hasMountEl: true, hasSystemsManager: true }
```
```javascript [Live object]
const am = window.lcards.core.animationManager

await am.playAnimation('my-overlay', { trigger: 'on_tap', preset: 'pulse' })
am.stopAnimation('my-overlay')
am.stopAnimations('my-overlay', 'on_tap')
am.getActiveAnimations()         // { overlayId: [{ preset, trigger, duration }, ...] }
am.getAllAnimationDefinitions()  // all registered animation defs, tagged with overlayId
am.inspectOverlay('my-overlay')  // { overlayId, hasScope, activeAnimations, ... }
am.scopes                        // Map<overlayId, scopeData>
```
:::

---

## See Also

- [Animation Manager — Triggers (Entity Change)](../../core/animations/entity-change-triggers.md)
- [Rule-Based Animations](../../core/animations/rule-based-animations.md)
- [Pack System](pack-system.md)
