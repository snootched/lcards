# Persistent Storage

LCARdS keeps its settings in a **persistent key/value store** on Home Assistant's `homeassistant.helpers.storage.Store`. The file lives in the Home Assistant config directory, outside `custom_components/`, so it survives restarts and HACS upgrades.

This page is the backend view: the store, its key layout, every storage WebSocket command and what it does to the data. The browser side is [Scoped Settings](../subsystems/scoped-settings) (the read waterfall and the scope selector) and [Integration Service: Global Storage Convenience API](../subsystems/integration-service#global-storage-convenience-api); calling the commands from card code is [Backend API](../../development/backend-api).

---

## Overview

| Property | Value |
|---|---|
| **Python file** | `custom_components/lcards/storage.py` (`LCARdSStorage`) |
| **File** | `<config>/.storage/lcards` (`Store(hass, STORAGE_VERSION, "lcards")`) |
| **Schema version** | `STORAGE_VERSION = 1` (no migrations exist yet) |
| **Instance** | `hass.data["lcards"]["storage"]`, created and loaded in `async_setup_entry()` |
| **Access** | the `lcards/storage/*` WebSocket commands (`websocket_api.py`) and, read-only, `services.py` (device name targeting) and `support.py` (key count) |

On disk the file has Home Assistant's `Store` envelope around LCARdS's own `data` dict:

```json
{
  "version": 1,
  "minor_version": 1,
  "key": "lcards",
  "data": {
    "sound_overrides": { "card_tap": "beep_1" },
    "_user_8f1c...": { "sound_volume": 0.4, "theme_overrides": { "...": "..." } },
    "_device_3b2a...": { "display_name": "Kitchen Tablet", "last_seen": "2026-11-09T18:02:11.000Z", "user_agent": "...", "owner_user_id": "9f1c..." }
  }
}
```

`LCARdSStorage` keeps `data` in memory (`self._data`); every write changes the dict and then awaits `Store.async_save({"data": self._data})`, which writes the whole file at once (it is not the delayed `async_delay_save`). Reads never touch the disk.

---

## Key Layout

The store is one flat namespace of top-level keys. LCARdS uses three kinds:

| Key | Holds | Written by |
|---|---|---|
| A plain name (`sound_overrides`, `theme_overrides`, `conn_overlay_*`, `custom_sound_schemes`) | the **global** value of that setting, shared by every user and device | admins only, through `lcards/storage/set` / `delete` (`IntegrationService.writeStorage()` / `deleteStorage()`, `ScopedSettingsService` global scope) |
| `_user_<home-assistant-user-id>` | one **user record**: a dict of that user's settings | `lcards/storage/user/*` (the user), `lcards/storage/users/*` (admins) |
| `_device_<uuid>` | one **device record**: a dict of that browser's settings, plus its identity | `lcards/storage/device/set` (any signed-in user, including the device heartbeat; a non-admin writer becomes the record's owner), `lcards/storage/devices/*` (admins) |

The prefixes are `STORAGE_NS_USER = "_user"` and `STORAGE_NS_DEVICE = "_device"` (`const.py:47-48`; the same constants in `src/core/services/ScopedSettingsConstants.js:21-24`). A record key is `f"{namespace}_{id}"`. The setting names are flat snake_case constants in `ScopedSettingsConstants.js`; the same name is used as the global key and as the sub-key inside a record:

| Setting key | Global | In user and device records | Used by |
|---|---|---|---|
| `sound_overrides` | yes | yes | SoundManager per-event sound overrides |
| `sound_volume`, `sound_enabled`, `sound_scheme`, `sound_category_enabled` | no (the shared defaults are Home Assistant helpers) | yes | SoundManager |
| `custom_sound_schemes` | yes (global only) | no | SoundManager custom schemes (`_writeCustomSchemes`) |
| `theme_overrides` | yes | yes | ThemeManager token overrides, merged `{ ...global, ...user, ...device }` |
| `conn_overlay_*` (25 keys, `CONN_OVERLAY_ALL_KEYS`) | yes | yes | ConnectionOverlayService, one key per setting |
| `display_name`, `last_seen`, `user_agent` | no | device records only | DeviceIdentityManager (the heartbeat), the devices list, name targeting |

How a value is resolved across device, user and global is the [Scoped Settings](../subsystems/scoped-settings#backend-storage-layout) waterfall. Device records are kept in step by `DeviceIdentityManager`: on load it sends `lcards/storage/device/set` with `display_name` (the existing name is read first and never overwritten by a default), `last_seen` and `user_agent`, so the device shows in the admin lists and can be targeted by name.

Nothing else is stored here. Dashboard and layout configuration is saved by Home Assistant (`lovelace.saveConfig`), and the alert mode lives in the `input_select.lcards_alert_mode` helper.

---

## `LCARdSStorage` Methods

`custom_components/lcards/storage.py`. All writes persist at once.

| Method | Lines | Does |
|---|---|---|
| `async_load()` | `:57-63` | Loads the file into `_data` (`stored.get("data", {})`), returns `self` |
| `async_get(key=None)` | `:69-76` | One key's value (`None` when missing), or a shallow copy of the whole dict |
| `async_set(updates)` | `:78-84` | `self._data.update(updates)`: a **shallow** merge at the top level. A key in `updates` replaces that key's whole value |
| `async_deep_set(namespace, entity_id, data, replace=False)` | `:86-123` | Merges `data` into the record `f"{namespace}_{entity_id}"` (creating it). `replace=False`: recursive merge with `_deep_merge()`. `replace=True`: `{**existing, **data}` (see [Replace](#merge-and-replace)) |
| `async_entity_delete_key(namespace, entity_id, key)` | `:125-145` | Deletes one sub-key from a record; returns whether it existed. An emptied record stays |
| `get_namespaced_entities(namespace)` | `:147-164` | `{ id: record }` for every key starting with `f"{namespace}_"` (synchronous) |
| `async_clear_entity(namespace, entity_id)` | `:166-180` | Deletes the whole record key; returns whether it existed |
| `async_delete(key)` | `:182-189` | Deletes one top-level key; returns whether it existed |
| `async_delete_many(keys)` | `:191-199` | Deletes every existing key in `keys` with **one** save; returns how many existed (no save when none did) |
| `async_reset()` | `:201-206` | Replaces `_data` with `{}` and saves |
| `dump()` | `:208-210` | `{ "version": STORAGE_VERSION, "data": <shallow copy> }` (synchronous) |

### Merge and replace

`_deep_merge(base, override)` (`storage.py:217-237`) returns a new dict: where both sides hold a mapping under the same key it recurses, everything else (lists, scalars, `None`) is replaced by the override. Neither input is changed.

```python
existing = {"sound_overrides": {"card_tap": "beep", "toggle_on": "chirp"}, "sound_volume": 0.5}
data     = {"sound_overrides": {"card_tap": "click"}}

# replace=False (deep merge)
{"sound_overrides": {"card_tap": "click", "toggle_on": "chirp"}, "sound_volume": 0.5}

# replace=True (each written sub-key replaced as a whole)
{"sound_overrides": {"card_tap": "click"}, "sound_volume": 0.5}
```

A deep merge cannot make a map smaller: an entry removed on the client survives in the record. `replace: true` is for callers that write a whole map (the sound overrides, the theme overrides): sibling sub-keys of the record are still kept, but each sub-key in `data` is replaced outright. `ScopedSettingsService.write()` sends `replace: true` on every user and device write when the backend advertises the `scoped_storage_replace` capability, and nothing when it does not (an older backend would reject the unknown field).

A sub-key set to `null` is stored as `null`; there is no device sub-key delete command, so `ScopedSettingsService.clear(key, 'device')` (and the admin clear of another user's key) writes `{ key: null }`, which the read waterfall treats as a miss. The own-user clear uses `lcards/storage/user/delete`, which removes the sub-key.

The global `lcards/storage/set` never deep-merges: it uses `async_set`, so writing `theme_overrides` globally replaces the whole map.

Writes are not raced: Home Assistant runs the WebSocket handlers on its event loop, and each handler's read-modify-write in `LCARdSStorage` has no `await` between reading and changing `_data`.

---

## Permissions

| Command | Non-admin | Admin |
|---|---|---|
| `lcards/storage/get` with a plain key | yes | yes |
| `lcards/storage/get` with a `_device_*` key | as `device/get` | yes |
| `lcards/storage/get` with a `_user_*` key, or without a key (whole store) | no (`unauthorized`) | yes |
| `lcards/storage/set`, `delete`, `delete_many`, `reset`, `dump` | no | yes |
| `lcards/storage/user/get`, `user/set`, `user/delete` | own record only (ID from the connection) | own record only |
| `lcards/storage/users/list`, `users/get`, `users/set`, `users/clear` | no | any user |
| `lcards/storage/device/get` | the device they own (the user signed in on it last), or one with no owner | any device |
| `lcards/storage/device/set` | any device whose ID they send; the write makes them its owner | any device (claims only an unowned record) |
| `lcards/storage/devices/list`, `devices/get`, `devices/set`, `devices/clear` | no | any device |

(`_require_admin()` in `websocket_api.py`; the admin check runs before the storage check.) Global settings and the whole store are admin-only because every user shares them, and the whole store contains every user's record. Users keep what they need: their own user record and the device records of the browsers they are signed in on (so a non-admin's device still registers on load). A device ID is a random UUID that lives in that browser's `localStorage`, so writing a record from the browser and knowing its ID are the same thing, and the record's owner (`owner_user_id`, set by the backend) is the user signed in on that browser: every non-admin `device/set` (the heartbeat on each page load, device-scoped settings) makes the caller the owner. An admin's `device/set` claims only a record with no owner, so an admin editing a kiosk's settings from the config panel leaves the kiosk user the owner. `device/get` and `storage/get` of a `_device_*` key are for admins and the current owner (`unauthorized` for anyone else); a record with no owner (new, written before owners existed, or whose owner user was deleted) reads for anyone. `device/set` ignores an `owner_user_id` in `data`; an admin sets the owner with `devices/set` (`data: { owner_user_id }`). A user who learns another device's UUID can take it over by writing to it, the same as signing in on that browser. The rules are `custom_components/lcards/device_access.py` (node test `tests/support/device-access.test.js`). The frontend never offers the global scope to non-admins (`src/core/services/storage-permissions.js`: `canWriteGlobalStorage`, `defaultSettingsScope`), and a refused save shows an error. Layer C tests: `tests/ha/ha.spec.js` "global storage is admin-only; a non-admin keeps their own user and device storage" and "a device record follows the user signed in on it: the kiosk case"; node: `tests/core/storage-scopes.test.js`.

---

## WebSocket API: Global Store

All storage commands are registered in `async_setup()` and answer `storage_unavailable` until `async_setup_entry()` has created the instance. This section covers the six global-store commands; the scoped commands follow.

### `lcards/storage/get`

One key, or the whole `data` dict when `key` is omitted (admin).

```json
{ "type": "lcards/storage/get", "key": "theme_overrides" }
{ "type": "lcards/storage/get" }
```

```json
{ "key": "theme_overrides", "value": { "colors.ui.primary": "#ff9900" } }
{ "key": null, "value": { "theme_overrides": { "...": "..." }, "_user_8f1c...": { "...": "..." } } }
```

A missing key gives `value: null`, not an error.

### `lcards/storage/set`

**Admin.** Shallow-merges `data` into the store (`async_set`): keys not in `data` are kept, a key in `data` is replaced as a whole.

```json
{ "type": "lcards/storage/set", "data": { "sound_overrides": { "card_tap": "beep_1" } } }
```

```json
{ "ok": true, "keys": ["sound_overrides"] }
```

### `lcards/storage/delete`

**Admin.** Removes one top-level key; `existed: false` when it was not there.

```json
{ "type": "lcards/storage/delete", "key": "custom_sound_schemes" }
```

```json
{ "ok": true, "existed": true }
```

### `lcards/storage/delete_many`

**Admin.** Removes several top-level keys with one save (`delete` saves the whole file per key). The config panel's Storage tab uses it to delete a group of keys.

```json
{ "type": "lcards/storage/delete_many", "keys": ["conn_overlay_enabled", "conn_overlay_position"] }
```

```json
{ "ok": true, "removed": 2 }
```

`removed` counts the keys that existed.

### `lcards/storage/reset`

**Admin.** Wipes the whole store, including every user and device record, and saves the empty dict. Irreversible.

```json
{ "type": "lcards/storage/reset" }
```

```json
{ "ok": true }
```

### `lcards/storage/dump`

**Admin.** The whole store with the schema version, for debugging.

```json
{ "type": "lcards/storage/dump" }
```

```json
{ "version": 1, "data": { "...": "..." } }
```

---

## WebSocket API: User and Device Records

| Command | Request | Storage call | Result |
|---|---|---|---|
| `lcards/storage/user/get` | `key?` | `async_get("_user_<caller>")`, then the sub-key | `{ user_id, key, value }` (`value` is `{}` for no record) |
| `lcards/storage/user/set` | `data`, `replace?` | `async_deep_set("_user", <caller>, data, replace)` | `{ ok, user_id, keys }` |
| `lcards/storage/user/delete` | `key` | `async_entity_delete_key("_user", <caller>, key)` | `{ ok, user_id, existed }` |
| `lcards/storage/users/list` | none | `get_namespaced_entities("_user")` | `{ users: { <id>: { key_count } } }` |
| `lcards/storage/users/get` | `user_id` | `async_get("_user_<id>")` | `{ user_id, value }` |
| `lcards/storage/users/set` | `user_id`, `data`, `replace?` | `async_deep_set("_user", user_id, data, replace)` | `{ ok, user_id, keys }` |
| `lcards/storage/users/clear` | `user_id` | `async_clear_entity("_user", user_id)` | `{ ok, removed, user_id }` |
| `lcards/storage/device/get` | `device_id`, `key?` | read check (owner or admin), `async_get("_device_<id>")`, then the sub-key | `{ device_id, key, value }` |
| `lcards/storage/device/set` | `device_id`, `data`, `replace?` | `owner_user_id` dropped from `data`, then set to the caller (a non-admin always, an admin on an unowned record), then `async_deep_set("_device", device_id, data, replace)` | `{ ok, device_id, keys }` |
| `lcards/storage/devices/list` | none | `get_namespaced_entities("_device")` | `{ devices: { <id>: { display_name, last_seen, user_agent, key_count } } }` |
| `lcards/storage/devices/get` | `device_id` | `async_get("_device_<id>")` | `{ device_id, value }` |
| `lcards/storage/devices/set` | `device_id`, `data`, `replace?` | `async_deep_set("_device", device_id, data, replace)` | `{ ok, device_id, keys }` |
| `lcards/storage/devices/clear` | `device_id` | `async_clear_entity("_device", device_id)` | `{ ok, removed, device_id }` |

`replace` defaults to `false`. A `key` that is an empty string is treated like no key (the whole record comes back). The client wrapper and the scope rules are in [Scoped Settings: WebSocket Commands](../subsystems/scoped-settings#websocket-commands).

---

## Lifecycle

```
Home Assistant start
  async_setup()          registers the storage commands (they answer storage_unavailable for now)
                         hass.data.setdefault("lcards", {})
  async_setup_entry()    storage = await LCARdSStorage(hass).async_load()   reads .storage/lcards
                         hass.data["lcards"]["storage"] = storage
  WebSocket commands     look up hass.data["lcards"]["storage"] on every call (_check_storage)

Options change / entry reload
  async_unload_entry()   leaves hass.data["lcards"]["storage"] in place
  async_setup_entry()    a new LCARdSStorage loaded from disk replaces it
                         (nothing is lost: every write was already saved)
```

`lcards/storage/reset` saves the empty dict at once, so it survives a restart.

---

## Browser Console Testing

Home Assistant's WebSocket connection is available in the browser console as `window.hassConnection` (a Promise). Sign in as an admin to try the global commands; a non-admin gets `unauthorized` for them.

**One-time setup:**
```javascript
const { conn } = await window.hassConnection
```

**Commands:**
```javascript
// Is the integration answering?
conn.sendMessagePromise({ type: "lcards/info" }).then(console.log)
// → { available: true, version: "2026.11.0-dev.1", storage_key_count: 12,
//     options: { show_panel: true, ... },
//     capabilities: ["scoped_storage", "scoped_storage_replace", "own_user_reload"] }

// The whole store (admin)
conn.sendMessagePromise({ type: "lcards/storage/dump" }).then(console.log)
// → { version: 1, data: { ... } }

// Write and read back a global key (admin)
conn.sendMessagePromise({ type: "lcards/storage/set", data: { "test_key": "hello" } }).then(console.log)
// → { ok: true, keys: ["test_key"] }
conn.sendMessagePromise({ type: "lcards/storage/get", key: "test_key" }).then(console.log)
// → { key: "test_key", value: "hello" }

// Your own user record (any user)
conn.sendMessagePromise({ type: "lcards/storage/user/get" }).then(console.log)
// → { user_id: "8f1c...", key: null, value: { ... } }

// Delete it again (admin)
conn.sendMessagePromise({ type: "lcards/storage/delete", key: "test_key" }).then(console.log)
// → { ok: true, existed: true }
```

::: tip Catching errors
Chain `.catch(console.error)` to see a rejected command's error:
```javascript
conn.sendMessagePromise({ type: "lcards/storage/dump" })
  .then(console.log)
  .catch(console.error)
```
`code: "unauthorized"` means the command needs an admin. `code: "storage_unavailable"` means `async_setup_entry()` has not run: reload the integration from **Settings > Devices & services > LCARdS > ⋮ > Reload** and try again.
:::

The config panel's **Storage** tab (admin only, `src/panels/components/lcards-storage-explorer-tab.js`) shows the same data with editing and grouped deletes.

---

## Inspecting the Storage File Directly

The raw JSON is `<config>/.storage/lcards`:

```bash
cat /config/.storage/lcards | python3 -m json.tool
```

Edit it only with Home Assistant stopped: the integration holds the data in memory and overwrites the file on the next write.

---

## User Files: `/lcards-user`

Files users add themselves (today: their own 3D models) are not in this store. They live in `<config>/www/lcards/` (`USER_DIR`), served on `/lcards-user` (`USER_URL`), with models in `www/lcards/models/` on `/lcards-user/models` (`const.py:12-23`).

- `frontend.py` creates `www/lcards/models/` at startup when it is missing, then registers the static path without cache headers, so a replaced file shows on the next load. If the folder cannot be created, a warning is logged and the path is not registered.
- It is outside `custom_components/lcards/` on purpose: HACS replaces that folder on every update, but never `www/`, so no HACS `persistent_directory` is needed.
- It has its own path because `/local/` exists only when `<config>/www` existed at Home Assistant start.
- `media_source.py` lists the models as **My models** in the LCARdS media folder, which is how editors pick them (`accept: ['model/*']`); there is no upload, users copy files in with the File editor or Samba.
- Like every Home Assistant static path, `/lcards-user` is served without authentication. The folder is inside `<config>/www`, so the same files are also public on `/local/lcards/...` whenever `www` existed at Home Assistant start.

→ See [Home Assistant Integration Architecture: Static Paths](../ha-integration#static-paths) and [Media Source Platform](../ha-integration#media-source-platform).
