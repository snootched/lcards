# Integration Service

> **`window.lcards.core.integrationService`** — Backend availability probe, capability flag, and storage convenience API.

---

## Overview

`IntegrationService` probes the LCARdS HA backend on startup to determine whether the Python integration is installed and active. All other services and cards that want to call backend WebSocket APIs check `integrationService.available` before doing so, allowing LCARdS to degrade gracefully when the integration is absent (e.g. legacy plugin-only setups or development without HA).

It also exposes three convenience methods — `readStorage()`, `writeStorage()`, and `deleteStorage()` — so services and cards can access the backend persistent store without reimplementing the guard-and-call pattern.

---

## File

`src/core/services/IntegrationService.js`

---

## Responsibilities

- Send the `lcards/info` WebSocket command on the first HASS update that has a live connection
- Set `this.available = true/false` based on whether the integration responds
- Surface `this.version`, `this.storageKeyCount`, and `this.options` for diagnostics
- Probe exactly once per page load — subsequent HASS updates are ignored
- Provide `readStorage()` / `writeStorage()` / `deleteStorage()` with built-in availability guards

---

## Lifecycle

The probe fires via `updateHass()`, which is called by the core on every HASS push. The service guards against re-probing with an internal `_probed` flag:

```
HA page loads → HASS first pushed to core
    → IntegrationService.updateHass(hass)
        → hass.connection available?  no → wait for next push
                                      yes → send lcards/info (once)
                                            success → available = true, version, storageKeyCount, options
                                            error   → available = false (degraded mode)
```

---

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `available` | `boolean` | `true` if the HA integration responded to `lcards/info`. Default `false`. |
| `version` | `string \| null` | Version string reported by the integration (`DOMAIN_VERSION` from `const.py`), or `null`. |
| `storageKeyCount` | `number \| null` | Number of keys currently in backend storage, or `null` if unavailable. |
| `options` | `Object \| null` | Snapshot of the integration's configured options (`show_panel`, `sidebar_title`, `sidebar_icon`, `log_level`), or `null`. |

---

## Backend Storage Convenience API

These three methods wrap the `lcards/storage/*` WebSocket commands with availability guards. They return sensible fallback values when the integration is unavailable rather than throwing.

### `readStorage(key) → Promise<any>`

Returns the stored value for `key`, or `undefined` on miss, unavailable backend, or error.

```javascript
const integration = window.lcards.core.integrationService;
const prefs = await integration.readStorage('my_service_prefs');
// prefs === undefined if key not set or integration not available
```

### `writeStorage(updates) → Promise<boolean>`

Shallow-merges `updates` (a plain `{ key: value }` object) into the store. Returns `true` on success, `false` on error or unavailable backend.

```javascript
const ok = await integration.writeStorage({ my_service_prefs: { theme: 'dark' } });
```

### `deleteStorage(key) → Promise<boolean>`

Removes a single key from the store. Returns `true` on success, `false` on error or unavailable.

```javascript
await integration.deleteStorage('my_service_prefs');
```

### `resetStorage() → Promise<boolean>`

Wipes the **entire** store — all keys removed, saved to disk. Irreversible. Returns `true` on success.

After calling this, services must invalidate their in-memory caches or they will re-write stale data on the next save operation.

```javascript
await integration.resetStorage();
// Caller is responsible for clearing service caches, e.g.:
// soundManager._overridesCache = {};
```

### Usage pattern

```javascript
const integration = window.lcards.core.integrationService;

if (integration.available) {
    // Reads / writes go to the persistent HA .storage/lcards file
    const value = await integration.readStorage('sound_overrides');
} else {
    // Integration unavailable — log a warning and operate with empty / default state
    lcardsLog.warn('[MyService] Integration unavailable — overrides will not be persisted');
}
```

---

## Push Channel

After a successful `lcards/info` probe, `IntegrationService` subscribes via the `lcards/subscribe` WS command. This gives Python service handlers a way to push instructions to all connected browser tabs — including non-admin users — without a WS request/response cycle.

The `lcards/subscribe` command is registered by the Python integration and is not admin-gated, unlike the HA-native `subscribeEvents` API which restricts custom bus event types to admin users.

### Subscription

```javascript
// Called once, after initialize() succeeds
_startEventListener() {
    if (this._eventUnsubscribe) return; // idempotent
    this._hass.connection
        .subscribeMessage(
            (data) => this._handleLcardsEvent(data),
            { type: 'lcards/subscribe' }
        )
        .then((unsub) => { this._eventUnsubscribe = unsub; });
}
```

The subscription is cleaned up automatically when the WebSocket connection closes (tab navigation or HA restart). The guard `if (this._eventUnsubscribe) return` prevents double-subscription on partial re-initialisation.

### Handled actions

| `data.action` | JS response |
|---------------------|-------------|
| `reload` | `window.location.reload()` — immediate, unconditional |
| `set_log_level` | `window.lcards.setGlobalLogLevel(data.level)` if available |
| `set_alert_mode` | `window.lcards.setAlertMode(data.mode, { skipHelperSync: true })` — targeted (local-only) alert change; skips writing back to the `input_select` helper so it doesn't re-trigger this on every tab |
| `clear_effect` | `window.lcards.screenEffect.clearSlot(data.slot)`, or `.clear()` (all slots) if `data.slot` is omitted |
| `play_sound` | `soundManager.playAsset(data.asset_key)` (exact asset, bypasses scheme) if present, else `soundManager.play(data.event_type)` (scheme/override-aware) |
| `trigger_effect` | Applies `data.layers` (`{ backdrop, color, canvas }`, each `{ preset, ...params }` or `null` to clear) via `screenEffectManager`; auto-clears after `data.duration` ms if given |
| `show_portal_card` | `pom.show('ha-service', options)` — displays a card/message via `PortalOverlayManager` |
| `clear_portal_card` | `pom.hide('ha-service')` — clears the `'ha-service'` POM slot |
| `borg_assimilate` | `borgAssimilationManager.assimilate(opts)` — starts the Borg-assimilation screen takeover |
| `borg_deassimilate` | `borgAssimilationManager.deassimilate(opts)` — reverts it, optionally with an outro |
| `reload_connection_config` | `connectionOverlayService.loadConfig()` — re-reads connection-overlay config from the scoped waterfall and re-renders if active; skipped if this device originated the save (`data.origin_device_id` matches) |
| anything else | `lcardsLog.debug` — logged and ignored |

Note: with `subscribeMessage`, the payload is delivered directly as `data` — it is not wrapped in an event envelope (no `event.data` unwrapping needed).

### Triggering from Python

Service handlers in `services.py` fire events with:

```python
hass.bus.async_fire("lcards_event", {"action": "reload"})
hass.bus.async_fire("lcards_event", {"action": "set_log_level", "level": level})
```

The event is a **broadcast by default** — every browser tab with an active `IntegrationService` subscription receives it simultaneously. Services that support targeting fields (`target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names`) filter delivery on the Python side so only matching sessions act on the event.

→ See [HA Services](../internals/ha-services) for the full Python action reference and automation examples.
→ See [HA Integration Architecture](../ha-integration#python--js-push-channel) for the sequence diagram.

---

## Degraded Mode

When `available === false` (integration not installed, or removed):

- All three storage helpers return `undefined` / `false` silently — no throws
- Services log a warning and operate with empty / in-memory-only state; they do not fall back to `localStorage`
- Cards continue to work fully — JS injection is independent of the integration probe
- `window.lcards.info()` reports `integration: { available: false, version: null }`

---

## WebSocket Endpoint

The probe hits the `lcards/info` command. The expanded response (since Phase 2C) includes storage diagnostics and the options snapshot:

```python
# custom_components/lcards/websocket_api.py — ws_lcards_info response
{
    "available":         True,
    "version":           "2026.3.25",
    "storage_key_count": 3,          # number of keys in .storage/lcards
    "options": {                     # from the config entry (None if not configured)
        "show_panel":    True,
        "sidebar_title": "LCARdS Config",
        "sidebar_icon":  "mdi:space-invaders",
        "log_level":     "warn",
    },
}
```

→ See [HA Integration Architecture](../ha-integration) for the full Python-side reference.
→ See [Backend WS API](../../development/backend-api) for the full storage command reference.

---

## `onReady()` Promise API

> Added in v1.12 (Phase 3C)

Other services that need to gate work on the probe completion should use the public `onReady()` method rather than accessing the private `_probed` flag:

```javascript
const integration = window.lcards.core.integrationService;

// Resolves immediately if already probed; otherwise waits for the probe to finish
await integration.onReady();

// Boolean — true once probe has run (pass or fail)
const alreadyRan = integration.isReady;
```

The promise **always resolves** (never rejects), even when the probe fails, so callers can proceed with graceful-degradation paths.

---

## `capabilities` Set

After a successful probe the `capabilities` Set is populated with strings advertised by the backend's `lcards/info` response:

```javascript
integration.capabilities.has('scoped_storage')  // → true on v1.12+
```

The backend populates this via:

```python
connection.send_result(msg["id"], {
    "available": True,
    "capabilities": ["scoped_storage"],
    ...
})
```

---

## See Also

- [Scoped Settings Service](scoped-settings.md)
- [Device Identity Manager](device-identity.md)
- [Sound System](sound-system.md)
