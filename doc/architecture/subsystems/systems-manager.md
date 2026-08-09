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
- Notify subscribers synchronously on each HASS push (only changed entities are dispatched)

---

## Overlay Registry

Cards register their overlays here so the Rules Engine can target them by ID, tag, or type. `registerOverlay()` takes the overlay ID and its metadata as two **separate positional arguments** — the ID is not repeated inside the metadata object:

```javascript
const sm = window.lcards.core.systemsManager;

sm.registerOverlay(`button-${this._cardGuid}`, {
  tags: ['temp', 'status'],
  type: 'button',
  sourceCardId: this._cardGuid,   // which card owns this overlay
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

"Changed" is `state` string change **or** `last_updated` change — the latter
also bumps on attribute-only updates (e.g. `brightness` changing while a
light stays `"on"`), so attribute-driven subscribers fire correctly.
`last_changed` alone is not sufficient: HA only bumps it on a `state` string
transition, not on attribute-only changes.

---

## Public API

| Method | Returns | Description |
|---|---|---|
| `getEntityState(entityId)` | `HassEntity\|null` | Cached HASS entity state (synchronous, no subscription) |
| `subscribeToEntity(entityId, cb)` | `() => void` | Subscribe to state changes; returns unsubscribe fn |
| `registerOverlay(overlayId, metadata)` | `void` | Register an overlay: `metadata` is `{ type?, tags?, sourceCardId?, element? }` |
| `unregisterOverlay(overlayId)` | `void` | Remove an overlay from the registry |
| `getOverlay(overlayId)` | `Object\|null` | A single overlay's metadata by ID |
| `getAllTargetableOverlays()` | `Object[]` | All registered overlay metadata objects — used by `RulesEngine` for selector resolution |
| `getOverlayRegistry()` | `Map<string, Object>` | The raw `overlayId → metadata` map |
| `getOverlaysBySource(cardId)` | `Object[]` | All overlays registered by a specific card |
| `getOverlaysByTag(tag)` | `Object[]` | All overlays with a given tag |
| `getAllTags()` | `string[]` | All unique tags across every registered overlay, sorted |

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('systemsManager')
// → {
//   initialized: true,
//   destroyed: false,
//   registeredCards: ['card-abc123', 'card-def456'],
//   totalCards: 2,
//   registeredOverlays: ['button-abc123', 'button-def456'],
//   totalOverlays: 8,
//   entityStateCount: 142,
//   entitySubscriptionCount: 12,
//   globalChangeListeners: 0,
//   hasHass: true
// }
```
```javascript [Live object]
const sm = window.lcards.core.systemsManager

sm.getEntityState('sensor.temperature')   // cached entity state object
sm.getAllTargetableOverlays()             // all overlay metadata objects (array)
sm.getOverlayRegistry()                   // raw Map<overlayId, metadata>
sm.subscribeToEntity('sensor.temp', cb)  // returns unsubscribe fn
sm.registerOverlay('my-overlay-id', { type, tags, sourceCardId, element })
sm.unregisterOverlay('my-overlay-id')
```
:::

---

## See Also

- [Card Foundation](../cards/lcards-card-foundation.md)
- [Rules Engine](rules-engine.md)
