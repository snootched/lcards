# Scoped Settings Service

> **Subsystem**: `window.lcards.core.scopedSettingsService`
> **Class**: `ScopedSettingsService` (`src/core/services/ScopedSettingsService.js`, extends `BaseService`)
> **Requires**: the LCARdS integration, advertising the `scoped_storage` capability in `lcards/info` (every current backend does)

---

## Overview

`ScopedSettingsService` implements a **waterfall** for LCARdS settings stored in the integration backend:

```
Card YAML config        (resolved by the card itself, not by this service)
      ↓
Device scope            _device_<device uuid>.<key>   (lcards/storage/device/get)
      ↓
User scope              _user_<user id>.<key>         (lcards/storage/user/get)
      ↓
Global scope            <key>                          (lcards/storage/get, via IntegrationService.readStorage)
      ↓
globalFallback()        supplied by the caller, e.g. a Home Assistant helper value
```

Settings are **resolved at read time** by walking the requested scopes in order and returning the first value that is not `null` or `undefined`. Writes and clears target one explicit scope.

The device ID comes from [`DeviceIdentityManager`](device-identity.md); the user ID is never sent by the browser for the caller's own data: the backend takes it from the authenticated connection.

---

## Availability and Permissions

**Integration and capability.** `_isScopedAvailable()` is true when `integrationService.available`, the cached HASS has a `connection`, and `integrationService.capabilities.has('scoped_storage')`. When it is false:

- `read()` and `readAllScopes()` skip the device and user scopes; the global scope and `globalFallback` are still tried (the global read returns nothing when the integration is unavailable).
- `write()` returns `false` without writing when the integration is unavailable or there is no connection. With the integration present but the capability missing, a device or user write is downgraded to the global scope (and then needs an admin).

**Admin only for global.** The backend refuses `lcards/storage/set`, `delete`, `reset` and `dump` for non-admins (`_require_admin()` in `custom_components/lcards/websocket_api.py`). The service checks first: `write()` and `clear()` with `scope: 'global'` return `false` without sending anything unless `canWriteGlobalStorage(hass)` (`src/core/services/storage-permissions.js`: `hass.user.is_admin === true`). User scope stays open to every signed-in user (their own record), and device scope to the user signed in on that device, so non-admins can still keep their own settings and register their device.

UI built on this service follows the same check: the shared scope selector (`src/panels/components/shared/lcards-scope-selector.js`) only shows the Global tab when it is asked for and `canWriteGlobalStorage(hass)` is true, and falls back to the User tab otherwise; settings tabs start on `defaultSettingsScope(hass)` (`'global'` for admins, `'user'` for everyone else) and show `GLOBAL_WRITE_REFUSED_MSG` when a global save is refused.

---

## API Reference

### `read(key, scopes?, globalFallback?) → Promise<any>`

Walks `scopes` and returns the first non-null hit; if every scope misses, awaits `globalFallback()` and returns its result (or `null`).

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `key` | `string` | | Storage key (a constant from `ScopedSettingsConstants.js`) |
| `scopes` | `string[]` | `['device', 'user', 'global']` | Ordered scopes to try |
| `globalFallback` | `function \| null` | `null` | Sync or async function giving the value when every scope misses |

```javascript
const sss = window.lcards.core.scopedSettingsService;
const hm  = window.lcards.core.helperManager;

const volume = await sss.read(
  STORAGE_KEY_SOUND_VOLUME,
  ['device', 'user', 'global'],
  () => hm.getHelperValue('sound_volume')
);
```

A failed scope read is logged and counts as a miss.

---

### `write(key, value, scope, opts?) → Promise<boolean>`

Writes one value to one scope. Returns `true` on success, `false` when the integration is unavailable, a global write is refused, there is no device ID, or the command fails.

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | Storage key |
| `value` | `any` | JSON-serialisable value |
| `scope` | `'device' \| 'user' \| 'global'` | Target scope |
| `opts.targetDeviceId` | `string` | Write another device's record instead of this browser's |
| `opts.targetUserId` | `string` | Write another user's record (admin: `lcards/storage/users/set`) |

```javascript
await sss.write(STORAGE_KEY_SOUND_VOLUME, 0.85, 'user');
await sss.write(STORAGE_KEY_SOUND_SCHEME, 'enterprise', 'device');
```

| Scope | Command |
|---|---|
| `device` | `lcards/storage/device/set` with `device_id` (own, or `opts.targetDeviceId`) and `data: { [key]: value }` |
| `user` | `lcards/storage/user/set` (own), or `lcards/storage/users/set` with `user_id` for `opts.targetUserId` |
| `global` | `integrationService.writeStorage({ [key]: value })` (`lcards/storage/set`) |

A write sets the key to exactly `value`. When the backend advertises the `scoped_storage_replace` capability, the device and user commands carry `replace: true`, so an object value replaces the stored one instead of being deep-merged into it: writing a smaller map (a sound override removed, `{}` to clear them all) really removes the missing entries. Other keys of the record are kept either way. Against an older backend without the capability the flag is left out (it would refuse the unknown key) and the write deep-merges as before. The global scope's `lcards/storage/set` already replaces the key's value.

---

### `clear(key, scope, opts?) → Promise<boolean>`

Removes an override so the next `read()` falls through to the next scope. Same `opts` and return value as `write()`; a global clear needs an admin.

| Scope | How it clears |
|---|---|
| `device` | `lcards/storage/device/set` with `{ [key]: null }` (there is no device sub-key delete; `null` reads as a miss) |
| `user` (own) | `lcards/storage/user/delete` with `key` |
| `user` (`opts.targetUserId`) | `lcards/storage/users/set` with `{ [key]: null }` |
| `global` | `integrationService.deleteStorage(key)` (`lcards/storage/delete`) |

```javascript
await sss.clear(STORAGE_KEY_SOUND_VOLUME, 'device');
```

---

### `readAllScopes(key, globalFallback?, opts?) → Promise<{ device, user, global, resolved }>`

Reads every scope (device and user only when scoped storage is available) and returns the raw value of each, for origin badges in admin UIs. `global` falls back to `globalFallback()` when the stored global value is `null`. `resolved` is `device ?? user ?? global`. `opts.targetDeviceId` / `opts.targetUserId` read another device or user (the latter through `lcards/storage/users/get`, admin only).

```javascript
const result = await sss.readAllScopes(STORAGE_KEY_SOUND_VOLUME, fallback);
// → { device: 0.9, user: null, global: 0.5, resolved: 0.9 }
```

---

## Constants

All storage key strings live in `src/core/services/ScopedSettingsConstants.js`, so JavaScript and the Python backend agree on them.

| Constant | Value | Used for |
|----------|-------|---------|
| `STORAGE_NS_USER` | `'_user'` | Backend prefix for user records |
| `STORAGE_NS_DEVICE` | `'_device'` | Backend prefix for device records |
| `STORAGE_KEY_SOUND_OVERRIDES` | `'sound_overrides'` | Per-event sound override map |
| `STORAGE_KEY_SOUND_VOLUME` | `'sound_volume'` | Master volume (0.0-1.0) |
| `STORAGE_KEY_SOUND_ENABLED` | `'sound_enabled'` | Master on/off |
| `STORAGE_KEY_SOUND_CATEGORY_ENABLED` | `'sound_category_enabled'` | Per-category toggles |
| `STORAGE_KEY_SOUND_SCHEME` | `'sound_scheme'` | Active sound scheme name |
| `STORAGE_KEY_CUSTOM_SOUND_SCHEMES` | `'custom_sound_schemes'` | User-made sound schemes; a global flat key read and written through `IntegrationService` directly, not through this service |
| `STORAGE_KEY_THEME_OVERRIDES` | `'theme_overrides'` | Theme token overrides per scope; `ThemeManager` merges `{ ...global, ...user, ...device }` |
| `DEVICE_KEY_DISPLAY_NAME` | `'display_name'` | Device display name field |
| `DEVICE_KEY_LAST_SEEN` | `'last_seen'` | Device last-seen ISO timestamp |
| `DEVICE_KEY_USER_AGENT` | `'user_agent'` | Device user-agent string |
| `URL_PARAM_DEVICE_NAME` | `'lcards_device'` | URL parameter that names the device |
| `LOCALSTORAGE_DEVICE_ID` | `'lcards_device_id'` | `localStorage` key of the device UUID |
| `CONN_OVERLAY_*` (25 keys, all in `CONN_OVERLAY_ALL_KEYS`) | `'conn_overlay_enabled'`, ... | One flat key per [Connection Overlay](connection-overlay.md) setting |

---

## Backend Storage Layout

Everything lives in the LCARdS store (`.storage/lcards`). Scoped records are flat keys holding an object:

```
_user_<home-assistant-user-id>   → { sound_volume: 0.8, sound_scheme: "enterprise" }
_device_<uuid>                   → { display_name: "Kitchen Tablet", last_seen: "...", user_agent: "...", owner_user_id: "...", sound_volume: 0.6 }
sound_overrides                  → { card_tap: "beep" }        ← global scope: the key itself
```

`user/set`, `users/set`, `device/set` and `devices/set` deep-merge `data` into the record (`LCARdSStorage.async_deep_set()` in `custom_components/lcards/storage.py`), so writing one sub-key keeps the others. With `replace: true` each sub-key in `data` replaces its stored value outright (the other sub-keys are still kept); `ScopedSettingsService.write()` always sends it when the backend has the `scoped_storage_replace` capability.

---

## WebSocket Commands

| Command | Auth | Description |
|---------|------|-------------|
| `lcards/storage/user/get` | any user | Read the caller's user record (or one `key`) |
| `lcards/storage/user/set` | any user | Deep-merge into the caller's user record (`replace: true`: replace each sub-key) |
| `lcards/storage/user/delete` | any user | Delete one sub-key from the caller's user record |
| `lcards/storage/device/get` | the device's current owner, or **admin** (a record with no owner: any user) | Read a device record (or one `key`) by `device_id` |
| `lcards/storage/device/set` | any user (a non-admin becomes the owner; an admin claims only an unowned record) | Deep-merge into a device record (`replace: true`: replace each sub-key); also the device heartbeat. `owner_user_id` in `data` is ignored |
| `lcards/storage/users/list` | **admin** | User IDs with stored data and their key counts |
| `lcards/storage/users/get` | **admin** | Read any user's record |
| `lcards/storage/users/set` | **admin** | Deep-merge into any user's record (`replace: true`: replace each sub-key) |
| `lcards/storage/users/clear` | **admin** | Delete a user's whole record |
| `lcards/storage/devices/list` | **admin** | All registered devices |
| `lcards/storage/devices/get` | **admin** | Read any device's record |
| `lcards/storage/devices/set` | **admin** | Deep-merge into any device's record (`replace: true`: replace each sub-key); `data: { owner_user_id }` sets the owner |
| `lcards/storage/devices/clear` | **admin** | Delete a device's whole record |
| `lcards/storage/get` | any user for global keys; a `_device_*` key as `device/get`; **admin** for `_user_*` keys and the full store | Global scope read |
| `lcards/storage/set`, `delete`, `delete_many`, `reset`, `dump` | **admin** | Global scope writes and whole-store operations |

The device ID lives in the browser's `localStorage`, so a device record's owner (`owner_user_id`, set by the backend) is the user signed in on that browser: a non-admin's write makes them the owner, and reads are for the owner and admins ([Device Identity: Backend Storage](./device-identity#backend-storage)). Someone who learns another device's ID can take it over by writing to it, the same as signing in on that browser. User records are protected by the server-side user ID.

---

## Field-Level Dirty Tracking in Config UIs

Config panel tabs that use `ScopedSettingsService` should track **which fields** the user changed, not only whether anything changed. Writing every key on save would copy all of them into the target scope and light up per-field origin badges on fields the user never touched.

The connectivity tab (`src/panels/components/lcards-connectivity-tab.js`) does this with `_dirtyServiceKeys: Set<string>`, the flat storage keys (e.g. `'conn_overlay_msg_size'`) touched by `_set()` or a YAML editor. On save, `_buildSparseConfig()` builds a config with only those keys, and `ConnectionOverlayService.saveConfig()` writes a key only when it is `in` that config.

When implementing a new config tab:

- Track a `Set` of the flat keys that were touched.
- Build a sparse config on save from only those keys.
- Clear the set on scope change, reset and successful save.
- Start on `defaultSettingsScope(hass)` and show the refusal message when a save returns `false`.

---

## Adding a New Scoped Setting

1. Add a constant to `ScopedSettingsConstants.js`:
   ```javascript
   export const STORAGE_KEY_MY_SETTING = 'my_setting';
   ```

2. Read it with the waterfall:
   ```javascript
   const value = await sss.read(
     STORAGE_KEY_MY_SETTING,
     ['device', 'user', 'global'],
     () => getGlobalFallback()
   );
   ```

3. Write through the service (not `integration.writeStorage()` or `setHelperValue()` directly), and handle `false`:
   ```javascript
   const scope = defaultSettingsScope(hass);
   const ok = await sss.write(STORAGE_KEY_MY_SETTING, newValue, scope);
   if (!ok) {
     showError(scope === 'global' && !canWriteGlobalStorage(hass) ? GLOBAL_WRITE_REFUSED_MSG : 'Save failed');
   }
   ```

---

## See Also

- [Device Identity Manager](device-identity.md)
- [Integration Service](integration-service.md)
- [Sound System](sound-system.md)
- [Storage (Python backend)](../internals/storage.md)
- [Users and devices (user guide)](../../configuration/users-devices.md)
