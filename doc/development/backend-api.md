# Backend API

Developer reference for calling LCARdS WebSocket commands from JS card code — cards, services, and the Config Panel.

::: tip Integration availability
Always check `window.lcards.core.integrationService.available` before calling `lcards/*` commands. When the Python integration is absent, commands will reject. Cards should degrade gracefully — see [Degraded mode](#degraded-mode).
:::

---

## Calling Pattern

Use `sendMessagePromise()` on the HASS connection you already have — inside a card that's `this.hass.connection`; inside a core singleton/service (which holds its own `this._hass`) it's `this._hass.connection`. Every example below is written from inside a card method.

```javascript
class MyCard extends LCARdSCard {
  async _loadPreferences() {
    const integration = window.lcards.core.integrationService;

    if (integration.available) {
      const result = await this.hass.connection.sendMessagePromise({
        type: 'lcards/storage/get',
        key: 'user.preferences',
      });
      // result → { key: 'user.preferences', value: { theme: 'dark' } }
    }
  }
}
```

For one-off calls from the browser console (debugging / testing), use `window.hassConnection` instead — see [browser console testing](../architecture/internals/storage#browser-console-testing).

---

## `lcards/info`

Backend availability probe. Normally you do not call this directly — `IntegrationService` probes it once on startup and exposes the result as `integrationService.available`. Useful for diagnostic tooling.

```javascript
const result = await this.hass.connection.sendMessagePromise({
  type: 'lcards/info',
});
// → { available: true, version: '2026.3.25' }
```

→ See [Integration Service](../architecture/subsystems/integration-service) for the full probe lifecycle.

---

## Storage API

All storage commands are under `lcards/storage/*`. The store is a flat key/value namespace persisted to `.storage/lcards` in the HA config directory — survives HA restarts and HACS upgrades.

→ Full schema reference: [Persistent Storage](../architecture/internals/storage).

### `lcards/storage/get`

Read a single key, or the entire `data` dict if `key` is omitted.

```javascript
// Read one key
const { value } = await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/get',
  key: 'user.preferences',
});
// value → { theme: 'dark' }  or  null if missing

// Read everything
const { value: allData } = await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/get',
});
// value → { 'user.preferences': { theme: 'dark' }, ... }
```

---

### `lcards/storage/set`

Shallow-merge one or many key→value pairs. Existing keys not in `data` are preserved.

```javascript
await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/set',
  data: {
    'user.preferences': { theme: 'dark', animations: true },
    'dashboard.layout': { cols: 3 },
  },
});
// → { ok: true, keys: ['user.preferences', 'dashboard.layout'] }
```

::: warning Shallow merge
`set` merges at the top level only — if `user.preferences` already exists, it is **replaced**, not deep-merged. Read first, spread, then write if you need to update one sub-key:
```javascript
const { value: prefs } = await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/get', key: 'user.preferences',
});
await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/set',
  data: { 'user.preferences': { ...prefs, theme: 'dark' } },
});
```
:::

---

### `lcards/storage/delete`

Remove a single key. Returns `existed: false` if the key was not present — not an error.

```javascript
const { existed } = await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/delete',
  key: 'cache.stale',
});
// existed → true | false
```

---

### `lcards/storage/reset`

Wipe the entire store. **Irreversible.** Use only in dev tooling or with explicit user confirmation.

```javascript
await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/reset',
});
// → { ok: true }
```

---

### `lcards/storage/dump`

Return full store contents including schema version. Intended for debug panels and dev tooling.

```javascript
const store = await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/dump',
});
// → { version: 1, data: { 'user.preferences': { theme: 'dark' } } }
```

---

## HA Service Targeting

All sixteen `lcards.*` HA services accept four optional fields that limit which browser sessions act on the event. Any combination may be used together.

| Field | Type | Resolved by |
|-------|------|-------------|
| `target_device_ids` | `list[string]` | Used as-is — browser device UUIDs (`lcards_device_id` from `localStorage`) |
| `target_device_names` | `list[string]` | Resolved server-side — matched case-insensitively against the device display name set in the LCARdS config panel or `?lcards_device=` URL param |
| `target_user_ids` | `list[string]` | Used as-is — HA user IDs |
| `target_user_names` | `list[string]` | Resolved server-side — matched case-insensitively against the HA user display name |

Omitting all four fields produces a **broadcast** — identical to the existing behaviour before targeting was added. Fully backward-compatible.

**Union semantics**: a session accepts the event if it appears in *any* of the resolved lists.

**Non-unique device display names**: if two devices share the same display name, `target_device_names` will match both. This is intentional — it makes a useful grouping mechanism for identically-configured kiosk pairs.

### Alert mode: global vs. local state

This mirrors the sound system model. Without targeting, alert services write `input_select.lcards_alert_mode` — shared persistent state for everyone. With targeting, the `input_select` is **not written**; a `set_alert_mode` event is pushed directly to matching sessions as a transient, local-only state change.

| Call | What changes |
|------|-------------|
| `lcards.red_alert` | `input_select.lcards_alert_mode` → all browsers in red alert |
| `lcards.red_alert` + any target field | `input_select` untouched; only matching sessions enter red alert |

### Finding IDs and names

**Browser console** — run this on any target device or user session to get the exact values to paste into service calls:

```javascript
window.lcards.targeting.getMyIds()
// → { deviceId: "a1b2c3d4-...", userId: "e71f94a8..." }
```

**Device display names** are set per-browser in the LCARdS Config Panel → **Device** tab, or by appending `?lcards_device=my-name` to any HA URL.

**User display names** are the names shown in **HA → Settings → People → Users**.

All registered device names are visible from the LCARdS Config Panel → **Users & Devices** tab (admin view).

### Example: target by display name

`target_device_names` and `target_user_names` work the same way on any service — resolved server-side against the display names set in the Config Panel / HA Users page:

```yaml
action: lcards.reload
data:
  target_device_names:
    - Kitchen Tablet
    - Hallway Display
```

### Example: target by UUID

`target_device_ids` and `target_user_ids` take the exact values from `window.lcards.targeting.getMyIds()` — useful for automations that need a stable identifier instead of a display name:

```yaml
action: lcards.red_alert
data:
  target_device_ids:
    - "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### Example: combine multiple targeting fields

All four fields are merged with union semantics — useful when you want to target a named device group plus one specific user:

```yaml
action: lcards.yellow_alert
data:
  target_device_names:
    - Kitchen Tablet
  target_user_names:
    - jane
```

---

## Error Handling

All commands reject if the integration is unavailable or the storage instance is not yet initialised. Always wrap calls:

```javascript
async _loadPreferences(defaultPreferences) {
  try {
    const { value } = await this.hass.connection.sendMessagePromise({
      type: 'lcards/storage/get',
      key: 'user.preferences',
    });
    return value ?? defaultPreferences;
  } catch (err) {
    // err.code === 'storage_unavailable' — integration not ready
    // err.code === 'unknown_command'     — old integration version without storage
    lcardsLog.warn('[MyCard] Storage unavailable, using defaults', err);
    return defaultPreferences;
  }
}
```

---

## Degraded Mode

When `integrationService.available === false` (integration not installed or failed to load):

- All `lcards/*` commands will reject
- Cards must fall back gracefully — use `localStorage` or in-memory defaults for non-critical state
- Core card rendering continues to work — JS injection and integration availability are independent

```javascript
async _loadPreferences() {
  const integration = window.lcards.core.integrationService;

  if (integration.available) {
    try {
      const { value } = await this.hass.connection.sendMessagePromise({
        type: 'lcards/storage/get',
        key: 'user.preferences',
      });
      return value ?? {};
    } catch {
      // fall through
    }
  }
  // Degrade: read from localStorage
  const raw = localStorage.getItem('lcards.user.preferences');
  return raw ? JSON.parse(raw) : {};
}
```

---

## Key Naming Convention

Use dot-separated namespaces to avoid collisions between cards and services:

| Prefix | Intended use |
|---|---|
| `dashboard.*` | Dashboard layout and persistent state |
| `user.*` | User preferences (theme, animation settings, etc.) |
| `panel.*` | Config panel UI state |
| `cache.*` | Transient computed values (safe to reset freely) |
| `card.<type>.*` | Card-specific state (e.g. `card.msd.last_route`) |

---

## Command Summary

| Command | Required params | Optional params | Returns |
|---|---|---|---|
| `lcards/info` | — | — | `{ available, version }` |
| `lcards/storage/get` | — | `key: string` | `{ key, value }` |
| `lcards/storage/set` | `data: object` | — | `{ ok, keys }` |
| `lcards/storage/delete` | `key: string` | — | `{ ok, existed }` |
| `lcards/storage/reset` | — | — | `{ ok }` |
| `lcards/storage/dump` | — | — | `{ version, data }` |
