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
| `TimelineDiffer` | `core/animation/TimelineDiffer.js` | Diffs timeline configs to minimise re-creation on update |
| `PerformanceMonitor` | `core/animation/PerformanceMonitor.js` | Tracks active animation count and frame budget |
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
    └─ timelines Map (timelineId → anime.timeline instance)
```

---

## Trigger Types

| Trigger | When fires |
|---|---|
| `on_load` | Once on card initialisation |
| `on_entity_change` | When a watched entity changes state |
| `on_datasource` | When a DataSource value crosses a threshold or changes |
| `on_rule` | Fired by RulesEngine when a rule matches |
| `manual` | Programmatic: `animationManager.play(id)` |

---

## anime.js v4 Note

LCARdS uses **anime.js v4**. The `anime.timeline()` API changed from v3. Always pass targets as CSS selectors or DOM element references resolved at runtime — not stale references cached at config time.

---

## Preset Animations

Presets are named animation parameter bundles distributed via packs. Built-in presets include:

| Preset | Effect |
|---|---|
| `alert_pulse` | Scale pulse, red tint |
| `glow` | Opacity + shadow flash |
| `slide_in_left` / `slide_in_right` | Translate + fade |
| `fade_in` / `fade_out` | Opacity |
| `bounce` | Scale bounce spring |

Custom presets are registered via `animation_presets` in pack definitions.

---

## Public API

| Method | Returns | Description |
|---|---|---|
| `play(overlayId, preset, opts?)` | `void` | Start a named preset animation on an overlay scope |
| `stop(overlayId)` | `void` | Stop all animations on a specific overlay |
| `stopAll()` | `void` | Stop every active animation across all overlays |
| `getActiveAnimations()` | `Map<id, Set>` | Active animation instances grouped by overlay ID |
| `registerPreset(name, config)` | `void` | Register a new named animation preset bundle |
| `scopes` | `Map` | Internal scope registry keyed by overlay ID |

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('animationManager')
// → { type: 'AnimationManager', initialized: true, scopesCount: 4, activeAnimationsCount: 1 }
```
```javascript [Live object]
const am = window.lcards.core.animationManager

am.play('my-overlay', 'alert_pulse', { loop: true })
am.stop('my-overlay')
am.stopAll()
am.getActiveAnimations()        // Map<overlayId, Set<anime instance>>
am.registerPreset('name', {...}) // register a named preset
am.scopes                        // Map<overlayId, scopeData>
am.activeAnimations              // Map<overlayId, Set>
```
:::

---

## See Also

- [Animation Manager — Triggers (Entity Change)](../animations/entity-change-triggers.md)
- [Rule-Based Animations](../animations/rule-based-animations.md)
- [Pack System](pack-system.md)
