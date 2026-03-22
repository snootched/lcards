# Systems Manager

> **`window.lcards.core.systemsManager`** — Centralised entity state subscriptions and push notifications.

---

## Overview

`CoreSystemsManager` is the shared entity state cache for all LCARdS cards. Instead of every card individually subscribing to HASS state updates, cards register with the Systems Manager and receive targeted callbacks only when entities they care about actually change.

---

## File

`src/core/systems-manager/index.js`

---

## Responsibilities

- Maintain a `Map<entityId, stateObject>` cache updated on every HASS push
- Allow cards to subscribe per entity ID with a callback
- Deduplicate subscriptions — N cards watching the same entity = one internal subscription
- Provide overlay registry used by the `RulesEngine` for cross-card targeting
- Batch rapid state changes using a microtask queue

---

## Overlay Registry

Cards register their overlays here so the Rules Engine can target them by ID, tag, or type:

```javascript
const sm = window.lcards.core.systemsManager;

sm.registerOverlay({
  id: `button-${this._cardGuid}`,
  tags: ['temp', 'status'],
  type: 'button',
  element: this
});

// On disconnect:
sm.unregisterOverlay(`button-${this._cardGuid}`);
```

---

## Entity Subscription API

```javascript
const sm = window.lcards.core.systemsManager;

// Subscribe — returns unsubscribe function
const unsub = sm.subscribeToEntity('sensor.temperature', (state) => {
  this._temp = state;
  this.requestUpdate();
});

// Get cached state (synchronous, no subscription)
const state = sm.getEntityState('sensor.temperature');

// In disconnectedCallback:
unsub();
```

---

## HASS Update Flow

```
card.set hass(newHass)
    → LCARdSNativeCard.ingestHass(newHass)
    → CoreSystemsManager.updateHass(newHass)
    → diff entity states
    → notify subscribers for changed entities only
```

---

## Public API

| Method | Returns | Description |
|---|---|---|
| `getEntityState(entityId)` | `HassEntity\|null` | Cached HASS entity state (synchronous, no subscription) |
| `subscribeToEntity(entityId, cb)` | `() => void` | Subscribe to state changes; returns unsubscribe fn |
| `registerOverlay(opts)` | `void` | Register an overlay descriptor `{ id, tags?, type, element }` |
| `unregisterOverlay(overlayId)` | `void` | Remove an overlay from the registry |
| `getRegisteredOverlays()` | `Object[]` | All currently registered overlay descriptors |

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('systemsManager')
// → { type: 'CoreSystemsManager', entityCount: 12, overlayCount: 8, subscriberCount: 24 }
```
```javascript [Live object]
const sm = window.lcards.core.systemsManager

sm.getEntityState('sensor.temperature')   // cached entity state object
sm.getRegisteredOverlays()                // all overlay registrations
sm.subscribeToEntity('sensor.temp', cb)  // returns unsubscribe fn
sm.registerOverlay({ id, tags, type, element })
sm.unregisterOverlay('my-overlay-id')
```
:::

---

## See Also

- [Card Foundation](../cards/lcards-card-foundation.md)
- [Rules Engine](rules-engine.md)
