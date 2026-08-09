# Helper Manager

> **`window.lcards.core.helperManager`** — Lifecycle management for LCARdS `input_*` helper entities.

---

## Overview

`LCARdSHelperManager` extends `BaseService` and manages the set of HA `input_select`, `input_boolean`, and `input_number` entities that LCARdS requires for features like alert mode and sound schemes. It detects missing helpers, can create them via the WebSocket API, and provides a typed read/write interface.

---

## Key Files

| File | Role |
|---|---|
| `core/helpers/lcards-helper-manager.js` | Service — lifecycle, subscriptions, value cache |
| `core/helpers/lcards-helper-registry.js` | Schema registry — defines all required helpers with types/defaults |
| `core/helpers/lcards-helper-api.js` | WebSocket operations — `ensureHelper`, `getHelperValue`, `setHelperValue` |

---

## Required Helpers

| Helper entity | Type | Purpose |
|---|---|---|
| `input_select.lcards_alert_mode` | `input_select` | Current alert state (`green_alert`/`red_alert`/`yellow_alert`/`blue_alert`/`gray_alert`/`black_alert` — note the `_alert` suffix on every option) |
| `input_select.lcards_sound_scheme` | `input_select` | Active sound scheme |
| `input_boolean.lcards_sounds_enabled` | `input_boolean` | Global sound on/off |
| `input_number.lcards_sound_volume` | `input_number` | Master volume 0–1 |

This is a commonly-used subset, not the full list — `HELPER_REGISTRY` defines around 49 helpers total, grouped into three categories: `alert_system` (~36, incl. per-alert-color LAB tuning knobs), `ha_lcars_theme` (~7), and `sound` (~6). Helpers can be auto-created from the [Config Panel](../../configuration/).

---

## Value API

```javascript
const hm = window.lcards.core.helperManager;

// Read (synchronous from cache, or live from HASS)
const mode = hm.getHelperValue('alert_mode');   // 'green_alert'

// Write (WebSocket call)
await hm.setHelperValue('alert_mode', 'red_alert');

// Subscribe to changes
const unsub = hm.subscribeToHelper('alert_mode', (newValue, oldValue) => {
  console.log('Alert mode changed to', newValue);
});

// Later — call the returned unsub() to remove just this callback,
// or hm.unsubscribeFromHelper('alert_mode') to clear ALL callbacks for that key.
```

Keys passed to these methods are the short `HELPER_REGISTRY` keys (e.g. `alert_mode`), not the full `input_select.lcards_alert_mode` entity ID.

---

## Auto-Create

```javascript
// Ensure all required helpers exist; create any missing ones
await hm.ensureAllHelpers();

// Check individual
const missing = await hm.getMissingHelpers();
```

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('helperManager')
// → { type: 'HelperManager', subscriptionsCount: 3, stateListeners: 49, cachedValues: 49,
//      autoSwitchInitialized: true }
```
```javascript [Live object]
const hm = window.lcards.core.helperManager

hm.getHelperValue('alert_mode')              // current value of a helper
await hm.setHelperValue('alert_mode', 'red_alert')  // update helper value
hm.subscribeToHelper('alert_mode', cb)       // listen for value changes
await hm.ensureAllHelpers()                  // create any missing HA helpers
await hm.getMissingHelpers()                 // list helpers not yet created
```
:::

---

## See Also

- [Configuration — Helpers](../../configuration/persistent-helpers.md)
- [Alert Mode](../../core/alert-mode.md)
- [Config Panel](../../configuration/index.md)
