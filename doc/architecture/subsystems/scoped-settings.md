# Scoped Settings Service

> **Subsystem**: `window.lcards.core.scopedSettingsService`
> **Class**: `ScopedSettingsService` (`src/core/services/ScopedSettingsService.js`)
> **Requires**: LCARdS Integration v1.12+ with `scoped_storage` capability

---

## Overview

`ScopedSettingsService` implements a **three-tier waterfall** for any LCARdS setting:

```
Card YAML config
      ↓  (highest priority)
Device scope  — localStorage UUID → _device_<uuid> in HA backend
      ↓
User scope    — HA user ID (server-side) → _user_<userid> in HA backend
      ↓
Global tier   — HA input helpers / legacy flat storage key
      ↓  (lowest priority / fallback)
globalFallback() function — provided by caller
```

Settings are **resolved at read time** by walking the scope list and returning the first non-null hit. Writes target a single explicit scope.

---

## Capability Guard

All scoped operations are **no-ops** (silent pass-through to the global fallback) if the backend does not advertise `scoped_storage` in its capabilities. This ensures graceful degradation when running against an older LCARdS integration version.

```javascript
const integration = window.lcards.core.integrationService;
const supported = integration.capabilities.has('scoped_storage');
```

---

## API Reference

### `read(key, scopes, globalFallback)`

Async waterfall read. Stops at the first scope that returns a non-null value; if all scopes miss, calls `globalFallback()`.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `key` | `string` | — | Storage key (use a constant from `ScopedSettingsConstants.js`) |
| `scopes` | `string[]` | `['device','user','global']` | Ordered list of scopes to probe |
| `globalFallback` | `function\|null` | `null` | Synchronous function returning the global value |

```javascript
const sss = window.lcards.core.scopedSettingsService;
const hm  = window.lcards.core.helperManager;

const volume = await sss.read(
  STORAGE_KEY_SOUND_VOLUME,
  ['device', 'user', 'global'],
  () => hm.getHelperValue('sound_volume')
);
```

---

### `write(key, value, scope)`

Writes a value to exactly one scope. Auto-downgrades to the global tier if scoped storage is unavailable.

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | `string` | Storage key |
| `value` | `any` | Value to store |
| `scope` | `'user'\|'device'\|'global'` | Target scope |

```javascript
await sss.write(STORAGE_KEY_SOUND_VOLUME, 0.85, 'user');
await sss.write(STORAGE_KEY_SOUND_SCHEME, 'enterprise', 'device');
```

---

### `clear(key, scope)`

Removes a scoped override, allowing the setting to fall through to the parent scope.

```javascript
await sss.clear(STORAGE_KEY_SOUND_VOLUME, 'device');
```

---

### `readAllScopes(key, globalFallback)`

Reads the setting value at all three tiers simultaneously and returns a diagnostic object. Useful for admin UIs and debugging.

```javascript
const result = await sss.readAllScopes(STORAGE_KEY_SOUND_VOLUME, fallback);
// result = { device: 0.9, user: null, global: 0.5, resolved: 0.9 }
```

| Field | Description |
|-------|-------------|
| `device` | Value stored at device scope (null = not set) |
| `user` | Value stored at user scope (null = not set) |
| `global` | Value from the global tier / fallback |
| `resolved` | Effective value after waterfall resolution |

---

## Constants

All storage key strings live in `src/core/services/ScopedSettingsConstants.js` to prevent magic-string drift between JS and the Python backend.

| Constant | Value | Used for |
|----------|-------|---------|
| `STORAGE_KEY_SOUND_OVERRIDES` | `'sound_overrides'` | Per-event sound override map |
| `STORAGE_KEY_SOUND_VOLUME` | `'sound_volume'` | Master volume (0.0–1.0) |
| `STORAGE_KEY_SOUND_ENABLED` | `'sound_enabled'` | Master on/off flag |
| `STORAGE_KEY_SOUND_SCHEME` | `'sound_scheme'` | Active sound scheme name |
| `STORAGE_KEY_SOUND_CATEGORY_ENABLED` | `'sound_category_enabled'` | Per-category toggles |
| `STORAGE_NS_USER` | `'_user'` | Backend namespace prefix for user entries |
| `STORAGE_NS_DEVICE` | `'_device'` | Backend namespace prefix for device entries |
| `DEVICE_KEY_DISPLAY_NAME` | `'display_name'` | Device display name field |
| `DEVICE_KEY_LAST_SEEN` | `'last_seen'` | Device last-seen ISO timestamp |
| `DEVICE_KEY_USER_AGENT` | `'user_agent'` | Device user-agent string |
| `URL_PARAM_DEVICE_NAME` | `'lcards_device'` | URL param to set device display name |
| `LOCALSTORAGE_DEVICE_ID` | `'lcards_device_id'` | localStorage key for device UUID |

---

## Backend Storage Layout

Settings are stored under the existing LCARdS integration key in HA's `.storage/lcards`. The flat key format is:

```
_user_<ha-user-id>       → { sound_volume: 0.8, sound_scheme: "enterprise" }
_device_<uuid>           → { sound_volume: 0.6, display_name: "Kitchen Tablet" }
sound_overrides          → { tap: "beep.wav" }   ← legacy global flat key
```

User IDs are always derived **server-side** from the authenticated WebSocket connection — the browser never sends a user ID for per-user operations.

---

## WebSocket Commands

| Command | Direction | Auth | Description |
|---------|-----------|------|-------------|
| `lcards/storage/user/get` | → backend | any user | Read caller's user-scoped data |
| `lcards/storage/user/set` | → backend | any user | Deep-merge into caller's user data |
| `lcards/storage/user/delete` | → backend | any user | Delete a sub-key from caller's user data |
| `lcards/storage/device/get` | → backend | any user | Read a device's scoped data |
| `lcards/storage/device/set` | → backend | any user | Deep-merge into a device's data |
| `lcards/storage/users/list` | → backend | **admin** | List all user IDs with stored data |
| `lcards/storage/users/get` | → backend | **admin** | Read any user's data |
| `lcards/storage/users/set` | → backend | **admin** | Write any user's data |
| `lcards/storage/users/clear` | → backend | **admin** | Delete all data for a user |
| `lcards/storage/devices/list` | → backend | **admin** | List all registered devices |
| `lcards/storage/devices/get` | → backend | **admin** | Read any device's data |
| `lcards/storage/devices/set` | → backend | **admin** | Write any device's data |
| `lcards/storage/devices/clear` | → backend | **admin** | Delete a device's entire record |

---

## Field-Level Dirty Tracking in Config UIs

Config Panel tabs that use `ScopedSettingsService` should track **which specific fields** the user changed, not just whether any field changed. This prevents all 25 keys being written to the target scope on every save, which would cause per-field "device" badges to appear on unchanged fields.

The connectivity tab implements this via `_dirtyServiceKeys: Set<string>` — a set of flat storage key names (e.g. `'conn_overlay_msg_size'`) that are added whenever `_set()` or a YAML editor fires. On save, `_buildSparseConfig()` builds a config object containing only those keys. Since `ConnectionOverlayService.saveConfig()` checks `'key' in config` before each write, only the dirty keys hit storage.

When implementing new config tabs:
- Track a `Set` of which flat keys were touched
- Build a sparse config on save from only those keys
- Clear the set on scope change, reset, and successful save

---

## Adding a New Scoped Setting

1. Add a constant to `ScopedSettingsConstants.js`:
   ```javascript
   export const STORAGE_KEY_MY_SETTING = 'my_setting';
   ```

2. Read in your component with the three-tier waterfall:
   ```javascript
   const value = await sss.read(
     STORAGE_KEY_MY_SETTING,
     ['device', 'user', 'global'],
     () => getGlobalFallback()
   );
   ```

3. Write via the service (not via `integration.writeStorage` or `setHelperValue` directly):
   ```javascript
   await sss.write(STORAGE_KEY_MY_SETTING, newValue, 'user');
   ```

---

## See Also

- [Device Identity Manager](device-identity.md)
- [Sound System](sound-system.md)
- [Integration Service](integration-service.md)
- [Storage (Python backend)](../internals/storage.md)
