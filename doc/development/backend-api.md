# Backend API

Developer reference for calling the LCARdS integration from browser code (cards, core services, the config panel): every `lcards/*` WebSocket command with its fields, who may call it, what it returns and a call example, the push channel, and a summary of the `lcards.*` Home Assistant actions.

This page owns the per-command reference. The architecture view of the same commands (handlers, boot order, the push channel's sequence) is [Home Assistant Integration: WebSocket API](../architecture/ha-integration#websocket-api), what each storage command does to the store is [Persistent Storage](../architecture/internals/storage), and the client wrappers most code should use are [Integration Service](../architecture/subsystems/integration-service) and [Scoped Settings](../architecture/subsystems/scoped-settings).

::: tip Integration availability
Check `window.lcards.core.integrationService.available` (after `await integrationService.onReady()`) before calling `lcards/*` commands. Without the Python integration every command rejects with `unknown_command`; cards must keep working (see [Degraded Mode](#degraded-mode)).
:::

---

## Calling Pattern

**Send a command with `sendMessagePromise()` on the Home Assistant connection you already hold.**

- In a card it is `this.hass.connection`; in a core service that keeps its own `this._hass`, it is `this._hass.connection`. The examples below are written from inside a card method.
- The promise resolves with the command's result object, or rejects with `{ code, message }` (see [Error Handling](#error-handling)).
- `lcards/subscribe` is the one subscription: it uses `subscribeMessage()` instead (see [`lcards/subscribe`](#lcards-subscribe)).
- Prefer the wrappers where they fit: `integrationService.readStorage()` / `writeStorage()` / `deleteStorage()` / `resetStorage()` for the global store, and `scopedSettingsService.read()` / `write()` / `clear()` for per-user and per-device settings. They check availability, capabilities and admin rights, and return a fallback instead of throwing.
- For one-off calls from the browser console use `window.hassConnection`; see [Persistent Storage: Browser Console Testing](../architecture/internals/storage#browser-console-testing).

```javascript
class MyCard extends LCARdSCard {
  async _loadOwnThemeOverrides() {
    const integration = window.lcards.core.integrationService;
    await integration.onReady();
    if (!integration.available) return {};

    const { value } = await this.hass.connection.sendMessagePromise({
      type: 'lcards/storage/user/get',
      key: 'theme_overrides',
    });
    return value ?? {};
    // value: { 'colors.card.button': 'var(--lcars-orange)' } or null
  }
}
```

**Who may call what.** Every command needs a signed-in Home Assistant user (the WebSocket is authenticated). "Admin" below means `connection.user.is_admin`; the check is `_require_admin()` (`custom_components/lcards/websocket_api.py:90-98`) and runs before the storage check, so a non-admin always gets `unauthorized`, even before storage is ready.

---

## Command Summary

All 23 commands, registered by `async_setup_ws()` (`websocket_api.py:123-164`). A `?` marks an optional field. The [Home Assistant Integration](../architecture/ha-integration#websocket-api) table lists the same commands with their handlers.

| Command | Auth | Request fields | Result |
|---|---|---|---|
| `lcards/info` | any user | none | `{ available, version, storage_key_count, options, capabilities }` |
| `lcards/diagnostics` | admin | none | backend support facts (see [below](#lcards-diagnostics)) |
| `lcards/subscribe` | any user | none | empty result, then one event message per `lcards_event` |
| `lcards/fire_event` | admin; a non-admin only for their own `reload_connection_config` | `action`, `target_device_ids?`, `target_user_ids?`, `data?` | `null` |
| `lcards/storage/get` | any user for plain keys; a `_device_*` key as `device/get`; admin for `_user_*` keys and the whole store (no `key`) | `key?` | `{ key, value }` |
| `lcards/storage/set` | admin | `data` | `{ ok, keys }` |
| `lcards/storage/delete` | admin | `key` | `{ ok, existed }` |
| `lcards/storage/delete_many` | admin | `keys` | `{ ok, removed }` (a count) |
| `lcards/storage/reset` | admin | none | `{ ok }` |
| `lcards/storage/dump` | admin | none | `{ version, data }` |
| `lcards/storage/user/get` | any user (own record) | `key?` | `{ user_id, key, value }` |
| `lcards/storage/user/set` | any user (own record) | `data`, `replace?` | `{ ok, user_id, keys }` |
| `lcards/storage/user/delete` | any user (own record) | `key` | `{ ok, user_id, existed }` |
| `lcards/storage/users/list` | admin | none | `{ users: { <user_id>: { key_count } } }` |
| `lcards/storage/users/get` | admin | `user_id` | `{ user_id, value }` |
| `lcards/storage/users/set` | admin | `user_id`, `data`, `replace?` | `{ ok, user_id, keys }` |
| `lcards/storage/users/clear` | admin | `user_id` | `{ ok, removed, user_id }` |
| `lcards/storage/device/get` | admin, or the record's current owner (a record with no owner: any user) | `device_id`, `key?` | `{ device_id, key, value }` |
| `lcards/storage/device/set` | any user (a non-admin becomes the owner; an admin claims only an unowned record) | `device_id`, `data`, `replace?` | `{ ok, device_id, keys }` (`owner_user_id` left out) |
| `lcards/storage/devices/list` | admin | none | `{ devices: { <device_id>: { display_name, last_seen, user_agent, owner_user_id, key_count } } }` |
| `lcards/storage/devices/get` | admin | `device_id` | `{ device_id, value }` |
| `lcards/storage/devices/set` | admin | `device_id`, `data` (`owner_user_id` sets the owner), `replace?` | `{ ok, device_id, keys }` |
| `lcards/storage/devices/clear` | admin | `device_id` | `{ ok, removed, device_id }` |

---

## `lcards/info`

**The backend probe: is the integration there, which version, which options and capabilities.**

- Any user. `IntegrationService` sends it once per page load (with retries) and exposes the result as `available`, `version`, `storageKeyCount`, `options` and `capabilities`; call it yourself only from diagnostic tooling, or use `await window.lcards.refreshOptions()` to re-read the options.
- Handler `ws_lcards_info` (`websocket_api.py:167-217`).

```javascript
const info = await this.hass.connection.sendMessagePromise({ type: 'lcards/info' });
// → { available: true, version: '2026.11.0-dev.1', storage_key_count: 12,
//     options: { show_panel: true, sidebar_title: 'LCARdS Config', sidebar_icon: 'mdi:space-invaders',
//                log_level: 'info', enable_previews: false },
//     capabilities: ['scoped_storage', 'scoped_storage_replace', 'own_user_reload'] }
```

| Field | Value |
|---|---|
| `available` | always `true` (a missing or failing command is how "not available" shows) |
| `version` | `DOMAIN_VERSION` from `const.py`: the full version, with any `-dev.N` suffix |
| `storage_key_count` | number of top-level keys in the store (user and device records included), or `null` before the config entry has set up storage |
| `options` | the five config entry options with defaults filled in, or `null` when there is no config entry |
| `capabilities` | the features this backend supports, below |

| Capability | Meaning |
|---|---|
| `scoped_storage` | The per-user and per-device commands (`lcards/storage/user/*`, `users/*`, `device/*`, `devices/*`) exist |
| `scoped_storage_replace` | The four scoped `set` commands take `replace: true` (see [Scoped storage: replace](#scoped-storage-replace)) |
| `own_user_reload` | A non-admin may send `reload_connection_config` to their own sessions with `lcards/fire_event` (see [`lcards/fire_event`](#lcards-fire-event)) |

Check a capability before using the feature, so a newer frontend still works against an older backend: `integrationService.capabilities.has('scoped_storage_replace')`. The probe lifecycle is [Integration Service: Lifecycle](../architecture/subsystems/integration-service#lifecycle).

---

## `lcards/diagnostics`

**Admin only. Backend environment facts for support reports.**

- Used by the config panel's Welcome > Support & system info section (`src/utils/support-info.js`); the collector (`custom_components/lcards/support.py`, `async_collect_backend_diagnostics()`) is shared with Home Assistant's **Download diagnostics** for the integration.
- Stored data is reported as counts, never contents.
- A non-admin gets `unauthorized`; the support section then shows "Backend checks need an admin user".

```javascript
const diag = await this.hass.connection.sendMessagePromise({ type: 'lcards/diagnostics' });
// → {
//   versions: { integration, home_assistant, min_home_assistant },
//   safe_mode, recovery_mode,
//   resources: { mode, entries: [{ url, type, legacy }], lcards_count, legacy_lcards, card_mod },
//   extra_module_urls: [...],            // frontend: extra_module_url, minus LCARdS's own
//   card_mod_in_extra_module_url: bool,
//   components: { uix, hacs, card_mod },
//   config_entry: { present, options },
//   storage: { schema_version, key_count }
// }
```

Every field is described in [Home Assistant Integration: Support and Diagnostics](../architecture/ha-integration#support-and-diagnostics).

---

## `lcards/subscribe`

**The push channel: every `lcards_event` on the Home Assistant event bus, forwarded to the browser.**

- Any user. Home Assistant's own `subscribe_events` is admin-only for custom event types, so LCARdS registers this one for everyone (`ws_subscribe`, `websocket_api.py:407-436`).
- Each event arrives as the event's data dict, with no envelope: `{ action, ...fields, target_device_ids?, target_user_ids? }`.
- The subscription ends when the client unsubscribes or the WebSocket closes; `home-assistant-js-websocket` re-subscribes on reconnect.
- `IntegrationService._startEventListener()` already holds one subscription per page and dispatches every action in `_handleLcardsEvent()`. Add a new action there rather than opening a second subscription.

```javascript
const unsubscribe = await this.hass.connection.subscribeMessage(
  (payload) => {
    // payload → { action: 'reload' } or { action: 'set_log_level', level: 'debug', target_user_ids: [...] }
  },
  { type: 'lcards/subscribe' },
);
// later: unsubscribe();
```

Targeting is enforced in the browser: every subscriber receives every event, and `_isEventTargetedAtMe()` drops events whose target lists leave this device and user out. The actions and their payloads are listed in [Home Assistant Integration: Python to JS Push Channel](../architecture/ha-integration#python-to-js-push-channel); what each browser does with them is [Integration Service: Handled actions](../architecture/subsystems/integration-service#handled-actions).

---

## `lcards/fire_event`

**Relays an `lcards_event` from one browser to every subscribed browser: the same event the `lcards.*` actions fire.**

| Field | Type | Description |
|---|---|---|
| `action` | string, required | The event action, for example `reload_connection_config` or `reload` |
| `target_device_ids` | string[] | Only these devices act on it |
| `target_user_ids` | string[] | Only these users' browsers act on it |
| `data` | object | Extra payload keys, spread into the event |

- The handler (`ws_fire_event`, `websocket_api.py:467-510`) fires `{ action, ...data }` plus the two target lists when they are not empty, and returns `null`.
- **Admin only**, because the event can act on other users' sessions. One exception (`_own_user_event_allowed()`, `websocket_api.py:450-464`, capability `own_user_reload`): a non-admin may send `action: 'reload_connection_config'` with `target_user_ids` exactly `[<their own user id>]`, no `target_device_ids`, and `data` holding at most `origin_device_id` (a string). Anything else from a non-admin gets `unauthorized`.
- `ConnectionOverlayService.saveConfig()` uses the exception after a user saves their own connection overlay settings, so their other open tabs reload them; the tab that saved skips its own event by `origin_device_id`.

```javascript
await this.hass.connection.sendMessagePromise({
  type: 'lcards/fire_event',
  action: 'reload_connection_config',
  target_user_ids: [this.hass.user.id],
  data: { origin_device_id: window.lcards.core.deviceIdentityManager.getDeviceId() },
});
```

---

## Storage API

**One flat key/value store in `.storage/lcards`, kept across Home Assistant restarts and HACS updates.**

- Plain keys hold the **global** value of a setting, shared by every user and device. Two prefixes are reserved: `_user_<user_id>` is one user's record and `_device_<device_id>` one browser's record (`STORAGE_NS_USER`, `STORAGE_NS_DEVICE` in `src/core/services/ScopedSettingsConstants.js` and `const.py`).
- Setting names are snake_case constants in `ScopedSettingsConstants.js`, and the same name is the global key and the sub-key inside a record: `sound_overrides`, `sound_volume`, `sound_enabled`, `sound_scheme`, `sound_category_enabled`, `custom_sound_schemes` (global only), `theme_overrides`, the 25 `conn_overlay_*` keys (`CONN_OVERLAY_ALL_KEYS`), and in device records `display_name`, `last_seen`, `user_agent` (plus `owner_user_id`, set by the backend).
- A new setting gets its constant in `ScopedSettingsConstants.js` first, never an inline string. Which key is global, per user or per device is the [Persistent Storage: Key Layout](../architecture/internals/storage#key-layout) table; permissions in full are [Persistent Storage: Permissions](../architecture/internals/storage#permissions).

### `lcards/storage/get`

**Read one key, or the whole `data` dict when `key` is left out.**

- Any user for a plain key. A `_device_*` key follows the `device/get` rule (admin or the record's owner). A `_user_*` key and the whole store need an admin: a user's own record comes from `lcards/storage/user/get`.
- A missing key gives `value: null`.
- Handler `ws_storage_get` (`websocket_api.py:245-274`).

```javascript
const { value } = await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/get',
  key: 'custom_sound_schemes',
});
// value → { 'custom:Bridge': { card_tap: '<asset key>', ... } } or null

// The whole store (admin)
const { value: all } = await this.hass.connection.sendMessagePromise({ type: 'lcards/storage/get' });
// all → { sound_overrides: {...}, _user_8f1c...: {...}, _device_a1b2...: {...}, ... }
```

### `lcards/storage/set`

**Admin only. Shallow-merge one or more `key: value` pairs into the store.**

- Keys not in `data` are kept. A key in `data` replaces its stored value as a whole (no deep merge), and `{ key: null }` stores `null` rather than removing the key: use `delete`.
- Handler `ws_storage_set` (`websocket_api.py:277-300`). `integrationService.writeStorage(updates)` is the wrapper (returns `false` when refused).

```javascript
await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/set',
  data: { theme_overrides: { 'colors.card.button': 'var(--lcars-orange)' } },
});
// → { ok: true, keys: ['theme_overrides'] }
```

To change one entry of a global map, read it, spread, and write the whole value back:

```javascript
const { value: current } = await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/get', key: 'theme_overrides',
});
await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/set',
  data: { theme_overrides: { ...(current ?? {}), 'typography.fontSize.base': 16 } },
});
```

### `lcards/storage/delete`

**Admin only. Remove one key.** A missing key is not an error: `existed: false`. Handler `ws_storage_delete` (`websocket_api.py:303-325`).

```javascript
const { existed } = await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/delete',
  key: 'theme_overrides',
});
// existed → true | false
```

### `lcards/storage/delete_many`

**Admin only. Remove several keys with one save** (each `delete` writes the whole store). `removed` is the number of keys that existed. Handler `ws_storage_delete_many` (`websocket_api.py:328-351`); the config panel's storage explorer uses it for grouped deletes.

```javascript
const { removed } = await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/delete_many',
  keys: ['conn_overlay_enabled', 'conn_overlay_position'],
});
// removed → 2
```

### `lcards/storage/reset`

**Admin only. Wipe the whole store**, including every user and device record. Irreversible: use it only in dev tooling or behind an explicit confirmation, and drop in-memory caches afterwards, or the next save writes stale data back. Handler `ws_storage_reset` (`websocket_api.py:354-375`).

```javascript
await this.hass.connection.sendMessagePromise({ type: 'lcards/storage/reset' });
// → { ok: true }
```

### `lcards/storage/dump`

**Admin only. The whole store with its schema version**, for debug panels. Handler `ws_storage_dump` (`websocket_api.py:378-400`).

```javascript
const store = await this.hass.connection.sendMessagePromise({ type: 'lcards/storage/dump' });
// → { version: 1, data: { sound_overrides: {...}, _user_8f1c...: {...}, ... } }
```

---

## Scoped Storage

**One record per user (`_user_<id>`) and per browser (`_device_<id>`), each a dict of setting sub-keys.**

- `set` commands **deep-merge** `data` into the record: writing one sub-key keeps the others, and nested maps merge too. `replace: true` changes that (see [Scoped storage: replace](#scoped-storage-replace)).
- `ScopedSettingsService` (`window.lcards.core.scopedSettingsService`) wraps these commands and resolves a value across device, user and global; use it for settings. The direct commands are for tooling and the config panel.

### User records: `lcards/storage/user/*`

**Any user, always their own record.** The user ID comes from the authenticated connection (`connection.user.id`), never from the request, so it cannot be spoofed (`websocket_api.py:518-600`).

| Command | Fields | Result |
|---|---|---|
| `lcards/storage/user/get` | `key?` | `{ user_id, key, value }`: the sub-key's value, or the whole record when `key` is left out (`{}` when there is none) |
| `lcards/storage/user/set` | `data`, `replace?` | `{ ok, user_id, keys }` |
| `lcards/storage/user/delete` | `key` | `{ ok, user_id, existed }` |

```javascript
await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/user/set',
  data: { sound_volume: 0.6 },
});
// → { ok: true, user_id: '8f1c...', keys: ['sound_volume'] }

const { value } = await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/user/get',
  key: 'sound_volume',
});
// value → 0.6
```

### Any user's record: `lcards/storage/users/*`

**Admin only.** For the config panel's Users & Devices tab (`websocket_api.py:607-693`, `783-807`).

| Command | Fields | Result |
|---|---|---|
| `lcards/storage/users/list` | none | `{ users: { <user_id>: { key_count } } }` for every user with a record |
| `lcards/storage/users/get` | `user_id` | `{ user_id, value }` (`{}` when there is no record) |
| `lcards/storage/users/set` | `user_id`, `data`, `replace?` | `{ ok, user_id, keys }` |
| `lcards/storage/users/clear` | `user_id` | `{ ok, removed, user_id }`: deletes the whole record |

```javascript
await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/users/set',
  user_id: '8f1c...',
  data: { theme_overrides: { 'colors.card.button': 'var(--lcars-blue)' } },
});
```

### Device records: `lcards/storage/device/*`

**The browser's own record, by the device ID it keeps in `localStorage`** (`lcards_device_id`; `deviceIdentityManager.getDeviceId()`). The rules are pure functions in `custom_components/lcards/device_access.py`:

- **Owner.** The record's owner (`owner_user_id`, set by the backend) is the user signed in on that browser. Every non-admin `device/set` makes the caller the owner. An admin's `device/set` claims only a record with no owner (or whose owner user was deleted), so an admin editing a kiosk's settings from the config panel leaves the kiosk user the owner. An `owner_user_id` in `device/set` data is ignored.
- **Reads.** `device/get`, and `storage/get` of a `_device_*` key, are for admins and the current owner; anyone else gets `unauthorized` ("This device record belongs to the user signed in on that device"). A record with no living owner reads for anyone, and a new device reads as `{}`.
- **Heartbeat.** `DeviceIdentityManager` calls `device/set` on every page load with `display_name`, `last_seen` and `user_agent`, so the browser shows in the admin lists and can be targeted by name.
- Handlers `ws_storage_device_get` and `ws_storage_device_set` (`websocket_api.py:704-776`).

| Command | Fields | Result |
|---|---|---|
| `lcards/storage/device/get` | `device_id`, `key?` | `{ device_id, key, value }` |
| `lcards/storage/device/set` | `device_id`, `data`, `replace?` | `{ ok, device_id, keys }` (`keys` leaves out `owner_user_id`) |

```javascript
const deviceId = window.lcards.core.deviceIdentityManager.getDeviceId();

await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/device/set',
  device_id: deviceId,
  data: { sound_enabled: false },
});
// → { ok: true, device_id: 'a1b2c3d4-...', keys: ['sound_enabled'] }

try {
  const { value } = await this.hass.connection.sendMessagePromise({
    type: 'lcards/storage/device/get',
    device_id: deviceId,
  });
  // value → { display_name: 'Kitchen Tablet', last_seen: 1762700000000, user_agent: '...',
  //           owner_user_id: '8f1c...', sound_enabled: false }
} catch (err) {
  // err.code === 'unauthorized': another user owns this record
}
```

### Any device's record: `lcards/storage/devices/*`

**Admin only.** For the Users & Devices tab and device-name targeting (`websocket_api.py:810-934`).

| Command | Fields | Result |
|---|---|---|
| `lcards/storage/devices/list` | none | `{ devices: { <device_id>: { display_name, last_seen, user_agent, owner_user_id, key_count } } }` |
| `lcards/storage/devices/get` | `device_id` | `{ device_id, value }` (`{}` when there is no record) |
| `lcards/storage/devices/set` | `device_id`, `data`, `replace?` | `{ ok, device_id, keys }`; `data.owner_user_id` sets the owner |
| `lcards/storage/devices/clear` | `device_id` | `{ ok, removed, device_id }`: deletes the whole record |

```javascript
// Rename a kiosk and give it to the kiosk user
await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/devices/set',
  device_id: 'a1b2c3d4-...',
  data: { display_name: 'Hallway Display', owner_user_id: 'e71f94a8...' },
});
```

### Scoped storage: replace

**`replace: true` on `user/set`, `users/set`, `device/set` or `devices/set` replaces each written sub-key's value instead of deep-merging it.** The record's other sub-keys are still kept (`LCARdSStorage.async_deep_set()`, `custom_components/lcards/storage.py:86-123`). Without it, a smaller map written to the same sub-key keeps the old entries:

```javascript
// stored: { sound_overrides: { card_tap: 'beep', card_hold: 'chirp' }, sound_volume: 0.8 }
await this.hass.connection.sendMessagePromise({
  type: 'lcards/storage/user/set',
  data: { sound_overrides: { card_hold: 'chirp' } },
  replace: true,
});
// stored: { sound_overrides: { card_hold: 'chirp' }, sound_volume: 0.8 }
// (without replace, card_tap would still be there)
```

A backend without the `scoped_storage_replace` capability refuses the unknown `replace` field with `invalid_format`. `ScopedSettingsService.write()` sends `replace: true` whenever the backend supports it.

---

## Home Assistant Actions

**The integration registers 18 `lcards.*` actions; most reach the browsers as `lcards_event`s on the push channel.**

| Group | Actions |
|---|---|
| Alert mode | `set_alert_mode`, `red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert`, `clear_alert` |
| Frontend control | `reload`, `set_log_level` |
| Screen effects and sound | `trigger_effect`, `clear_effect`, `play_sound` |
| Astrometrics | `fly_to`, `set_clock` |
| Portal overlay | `show_portal_card`, `clear_portal_card` |
| Borg | `borg_assimilate`, `borg_deassimilate` |

- Names are the `SERVICE_*` constants in `custom_components/lcards/services.py:192-209`, registered in `async_setup_entry()`; they exist only while the config entry is loaded.
- Field schemas, validation errors and the payload each action fires: [Home Assistant Services: Implementation Notes](../architecture/internals/ha-services). The fields at a glance: [Home Assistant Integration: Home Assistant Services](../architecture/ha-integration#home-assistant-services-actions). The user reference with YAML: [Home Assistant Actions](/configuration/ha-actions).
- Browser code never calls these to reach other browsers: it uses [`lcards/fire_event`](#lcards-fire-event). A card calls an action like any other service, with `this.callService('lcards', 'red_alert', {})`.

### Targeting

**All 18 actions take four optional list fields that limit which browser sessions act on the event** (`_TARGET_FIELDS`, `services.py:96-101`; resolved in `_async_resolve_targets()`, `services.py:105-168`).

| Field | Resolved by |
|---|---|
| `target_device_ids` | Used as given: browser device UUIDs (`lcards_device_id` in `localStorage`) |
| `target_device_names` | Server side: matched case-insensitively against `display_name` in the `_device_*` records |
| `target_user_ids` | Used as given: Home Assistant user IDs |
| `target_user_names` | Server side: matched case-insensitively against the Home Assistant user names |

- **No targeting fields:** a broadcast (or, for the alert actions, a write to the shared `input_select.lcards_alert_mode` helper).
- **Union semantics:** the event carries the resolved `target_device_ids` and `target_user_ids`, and a browser acts on it when it is in either list.
- **A display name shared by several devices** matches all of them, a simple way to group identical kiosks.
- **Targeting that matches nobody** (a misspelt name, a device never registered) fails the call with `ServiceValidationError`; it never falls back to a broadcast.
- **Targeted alerts are local.** With targeting, the alert actions leave `input_select.lcards_alert_mode` alone and send a `set_alert_mode` event: a transient alert on the matched browsers only.

**Finding IDs and names.**

- `window.lcards.targeting.getMyIds()` in the browser console of the target browser returns `{ deviceId, userId }`.
- A device's display name is set on the config panel's **Users & Devices** tab, or with `?lcards_device=<name>` on any Home Assistant URL. The URL parameter names the device on every load and wins over the stored name (`DeviceIdentityManager.js:93`, `:202-206`). The same tab lists every registered device (admin view); see [Users and Devices](/configuration/users-devices).
- User names are the names in Home Assistant under **Settings > People > Users**.

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

**A rejected command gives `{ code, message }`.**

| `code` | When |
|---|---|
| `unauthorized` | The command needs an admin ("Admin access required"), or the device record belongs to another user ("This device record belongs to the user signed in on that device") |
| `storage_unavailable` | The store is not loaded yet: the commands are registered at Home Assistant start, storage only when the config entry sets up ("LCARdS storage is not initialised") |
| `invalid_format` | Home Assistant's own: a missing or wrongly typed field, or an unknown one (such as `replace` on a backend without `scoped_storage_replace`) |
| `unknown_command` | Home Assistant's own: the integration is not installed, or is too old for the command |

The two LCARdS codes are `_UNAUTHORIZED` and `_STORAGE_UNAVAILABLE` (`websocket_api.py:67-71`). Wrap every call:

```javascript
async _loadVolume(defaultVolume) {
  try {
    const { value } = await this.hass.connection.sendMessagePromise({
      type: 'lcards/storage/user/get',
      key: 'sound_volume',
    });
    return value ?? defaultVolume;
  } catch (err) {
    // err.code: 'storage_unavailable', 'unknown_command', ...
    lcardsLog.warn('[MyCard] Backend storage unavailable, using the default', err);
    return defaultVolume;
  }
}
```

The wrappers handle this already: `integrationService.readStorage()` returns `undefined` and `writeStorage()` / `deleteStorage()` / `resetStorage()` return `false` on any failure, logging "global storage needs a Home Assistant admin" for `unauthorized`. Before offering a global write in UI, check `canWriteGlobalStorage(hass)` and show `GLOBAL_WRITE_REFUSED_MSG` when a save is refused (`src/core/services/storage-permissions.js`; [Integration Service: Global Storage Convenience API](../architecture/subsystems/integration-service#global-storage-convenience-api)).

---

## Degraded Mode

**Without the integration (not installed, or failed to load) `integrationService.available` is `false` and every `lcards/*` command rejects.**

- Cards keep rendering: the bundle is loaded either way, and nothing in a card's render path may depend on the backend.
- Settings fall back to their defaults (for sound and alert settings, the Home Assistant helpers); per-browser conveniences may use `localStorage`.
- Push events (`lcards.reload`, targeted alerts) do not arrive, because there is no `lcards/subscribe`.

```javascript
async _loadVolume() {
  const integration = window.lcards.core.integrationService;
  await integration.onReady();

  if (integration.available) {
    const volume = await window.lcards.core.scopedSettingsService.read('sound_volume');
    if (volume !== null) return volume;
  }
  // Degrade: the shared helper value (or its registry default)
  return window.lcards.core.helperManager.getHelperValue('sound_volume');
}
```

How the service settles into degraded mode is [Integration Service: Degraded Mode](../architecture/subsystems/integration-service#degraded-mode).
