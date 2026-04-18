# Persistent Storage

LCARdS stores user preferences and application state in a **persistent key/value store** backed by Home Assistant's `homeassistant.helpers.storage.Store`. Data survives HA restarts and HACS upgrades.

---

## Overview

| Property | Value |
|---|---|
| **Python file** | `custom_components/lcards/storage.py` |
| **HA storage key** | `.storage/lcards` (inside the HA config directory) |
| **Format** | JSON — `{ "data": { "<key>": <value> } }` |
| **Schema version** | 1 |
| **Access** | WebSocket API — `lcards/storage/*` commands |
| **Instance** | `hass.data["lcards"]["storage"]` — initialised in `async_setup_entry()` |

---

## Storage Schema

The schema is a flat namespace. All keys are arbitrary strings; values are any JSON-serialisable type. The frontend owns key naming conventions.

```json
{
  "data": {
    "dashboard.layout": { "cols": 3 },
    "user.preferences": { "theme": "dark" },
    "some.flag": true
  }
}
```

The `version` field is written by HA's `Store` automatically and is not part of the `data` dict.

### Key naming convention

Use dot-separated namespaces to avoid collisions:

| Prefix | Intended use |
|---|---|
| `dashboard.*` | Dashboard layout and state |
| `user.*` | User preferences |
| `panel.*` | Config panel UI state |
| `cache.*` | Transient cached values (may be reset freely) |

---

## WebSocket API

All commands are under the `lcards/storage/` namespace. Access them via `hass.connection` (see [Troubleshooting / browser console](#browser-console-testing) below).

### `lcards/storage/get`

Get one key, or the entire `data` dict if `key` is omitted.

**Request:**
```json
{ "type": "lcards/storage/get" }
{ "type": "lcards/storage/get", "key": "user.preferences" }
```

**Response:**
```json
{ "key": null,               "value": { "user.preferences": { "theme": "dark" } } }
{ "key": "user.preferences", "value": { "theme": "dark" } }
```

Returns `value: null` for a missing key (not an error).

---

### `lcards/storage/set`

Shallow-merge one or many key→value pairs into the store. Existing keys not mentioned in `data` are preserved.

**Request:**
```json
{
  "type": "lcards/storage/set",
  "data": {
    "user.preferences": { "theme": "dark" },
    "some.flag": true
  }
}
```

**Response:**
```json
{ "ok": true, "keys": ["user.preferences", "some.flag"] }
```

---

### `lcards/storage/delete`

Remove a single key. Returns `existed: false` if the key was not present — not an error.

**Request:**
```json
{ "type": "lcards/storage/delete", "key": "cache.stale" }
```

**Response:**
```json
{ "ok": true, "existed": true }
```

---

### `lcards/storage/reset`

Wipe the entire store. **Irreversible.**

**Request:**
```json
{ "type": "lcards/storage/reset" }
```

**Response:**
```json
{ "ok": true }
```

---

### `lcards/storage/dump`

Return the full store contents including the schema version. Intended for debugging and dev-tools inspection.

**Request:**
```json
{ "type": "lcards/storage/dump" }
```

**Response:**
```json
{
  "version": 1,
  "data": {
    "user.preferences": { "theme": "dark" }
  }
}
```

---

## Lifecycle

```
HA start
  → async_setup()         seeds hass.data["lcards"] = {}
  → async_setup_entry()   creates LCARdSStorage(hass)
                          calls async_load() → reads .storage/lcards from disk
                          stores instance at hass.data["lcards"]["storage"]
  → WS commands           look up hass.data["lcards"]["storage"] at call time

Options change / entry reload
  → async_unload_entry()  (storage instance is NOT cleared — the dict key persists)
  → async_setup_entry()   creates a fresh LCARdSStorage and reloads from disk
                          overwrites hass.data["lcards"]["storage"]
```

::: warning Storage not persistent across `reset` + reload
Calling `lcards/storage/reset` wipes the in-memory dict and persists the empty state to disk immediately. A subsequent HA restart will load the empty state.
:::

---

## Browser Console Testing

Home Assistant's WebSocket connection is accessible from the browser console as `window.hassConnection` (a Promise). Use it to test storage commands directly without writing any code.

**One-time setup:**
```javascript
const { conn } = await window.hassConnection
```

**Test commands:**
```javascript
// Verify the integration is responding
conn.sendMessagePromise({ type: "lcards/info" }).then(console.log)
// → { available: true, version: "2026.3.25" }

// Inspect the full store
conn.sendMessagePromise({ type: "lcards/storage/dump" }).then(console.log)
// → { version: 1, data: { ... } }

// Write values
conn.sendMessagePromise({
  type: "lcards/storage/set",
  data: { "test.key": "hello", "test.num": 42 }
}).then(console.log)
// → { ok: true, keys: ["test.key", "test.num"] }

// Read one value back
conn.sendMessagePromise({ type: "lcards/storage/get", key: "test.key" }).then(console.log)
// → { key: "test.key", value: "hello" }

// Read entire store
conn.sendMessagePromise({ type: "lcards/storage/get" }).then(console.log)
// → { key: null, value: { "test.key": "hello", "test.num": 42 } }

// Delete a key
conn.sendMessagePromise({ type: "lcards/storage/delete", key: "test.key" }).then(console.log)
// → { ok: true, existed: true }

// Wipe everything
conn.sendMessagePromise({ type: "lcards/storage/reset" }).then(console.log)
// → { ok: true }
```

::: tip Catching errors
If a command is rejected, chain `.catch(console.error)` to see the error object:
```javascript
conn.sendMessagePromise({ type: "lcards/storage/dump" })
  .then(console.log)
  .catch(console.error)
```
A `code: "storage_unavailable"` error means `async_setup_entry()` did not complete — reload the integration from **Settings → Integrations → LCARdS → ⋮ → Reload** and try again.
:::

---

## Inspecting the Storage File Directly

The raw JSON is at `<HA config dir>/.storage/lcards`. You can inspect it on the host:

```bash
cat /config/.storage/lcards | python3 -m json.tool
```

---

## Future: Content Pack Directory

A separate `user/` subdirectory inside `custom_components/lcards/` is planned for user-installed content packs (extra fonts, SVGs, sounds distributed outside the core LCARdS release). HACS's `persistent_directory` option will protect this directory from being wiped on upgrades. This is a different concern from the JSON Store and will be implemented as a separate phase.

→ See [Pack System](pack-system) for the planned content pack architecture.
