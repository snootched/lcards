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
| `input_select.lcards_alert_mode` | `input_select` | Current alert state (`green`/`red`/`yellow`/`blue`/`gray`/`black`) |
| `input_select.lcards_sound_scheme` | `input_select` | Active sound scheme |
| `input_boolean.lcards_sounds_enabled` | `input_boolean` | Global sound on/off |
| `input_number.lcards_sound_volume` | `input_number` | Master volume 0–1 |

Helpers are defined in `HELPER_REGISTRY` and can be auto-created from the [Config Panel](../../configuration/).

---

## Value API

```javascript
const hm = window.lcards.core.helperManager;

// Read (synchronous from cache, or live from HASS)
const mode = hm.getValue('lcards_alert_mode');   // 'green'

// Write (WebSocket call)
await hm.setValue('lcards_alert_mode', 'red');

// Subscribe to changes
const unsub = hm.subscribe('lcards_alert_mode', (value) => {
  console.log('Alert mode changed to', value);
});
```

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
// → { type: 'LCARdSHelperManager', initialized: true, helperCount: 12, missingCount: 0 }
```
```javascript [Live object]
const hm = window.lcards.core.helperManager

hm.getValue('alert_mode')             // current value of a helper
hm.setValue('lcards_brightness', 80)  // update helper value
hm.subscribe('alert_mode', cb)        // listen for value changes
await hm.ensureAllHelpers()           // create any missing HA helpers
await hm.getMissingHelpers()          // list helpers not yet created
```
:::

---

## See Also

- [Configuration — Helpers](../../configuration/persistent-helpers.md)
- [Alert Mode](../../core/alert-mode.md)
- [Config Panel](../../configuration/config-panel.md)
