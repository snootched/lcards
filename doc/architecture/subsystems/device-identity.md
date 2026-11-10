# Device Identity Manager

> **Subsystem**: `window.lcards.core.deviceIdentityManager`
> **Class**: `DeviceIdentityManager` (`src/core/services/DeviceIdentityManager.js`, extends `BaseService`)

---

## Overview

`DeviceIdentityManager` gives the current browser profile a **stable, human-labelled identity**. The ID is the key for device-scoped settings in the [`ScopedSettingsService`](scoped-settings.md) waterfall and for `target_device_ids` / `target_device_names` targeting of LCARdS actions (checked in `IntegrationService._isEventTargetedAtMe()`).

### What makes a "device"?

A **device** in LCARdS is one browser profile on one machine, not the physical hardware: the ID lives in that profile's `localStorage`. Two Chrome profiles on the same laptop are two devices; clearing site data makes a new device. This matches how browser_mod and similar integrations handle device identity.

| Concept | Implementation |
|---------|---------------|
| Stable ID | UUID v4 stored in `localStorage['lcards_device_id']` |
| Display name | Stored in the backend device record; seeded from the user agent; renamed from the config panel or with `?lcards_device=` |
| Backend registration | Heartbeat (`lcards/storage/device/set`) once per page load, after the integration probe succeeds |
| Name at launch | `?lcards_device=<name>` URL parameter |

---

## API

```javascript
const dim = window.lcards.core.deviceIdentityManager;
```

### Properties (getters)

| Property | Type | Description |
|----------|------|-------------|
| `dim.deviceId` | `string` | Stable UUID; same as `getDeviceId()` |
| `dim.displayName` | `string` | Current display name; same as `getDisplayName()` |
| `dim.lastSeen` | `string \| null` | ISO timestamp of this page's heartbeat, or `null` before it ran |
| `dim.userAgent` | `string` | `navigator.userAgent` |

### Methods

| Method | Returns | Description |
|---|---|---|
| `getDeviceId()` | `string` | The UUID; loads it from `localStorage`, or creates and stores one, on first call |
| `getDisplayName()` | `string` | The display name; the seeded user-agent label when none is set yet |
| `setDisplayName(name)` | `Promise<void>` | Set the name locally and write `display_name` to the backend record (skipped silently when the integration is unavailable) |
| `registerHeartbeat()` | `Promise<void>` | Read the stored record, then write `display_name`, `last_seen` and `user_agent`. Runs automatically; you rarely call it |

```javascript
await dim.setDisplayName('Kitchen Tablet');
```

---

## First-Load Behaviour

`updateHass()` runs `_init()` once, on the first HASS the core distributes:

1. **UUID**: `_loadOrCreateId()` reads `localStorage['lcards_device_id']`, or generates a UUID and stores it. If `localStorage` throws (some private modes), an ephemeral UUID is used for this page load only.
2. **URL parameter**: `?lcards_device=<name>` (trimmed) becomes the display name for this page load and is remembered in memory as `_urlName`. It is not written to `localStorage`.
3. **Seed**: with no name yet, `_seedDisplayName()` derives one from the user agent.
4. **Heartbeat**: once `integrationService.onReady()` resolves, and only if `integrationService.available`, `registerHeartbeat()` runs:
   - It reads the backend record (`lcards/storage/device/get`). A stored `display_name` replaces the seeded name, **unless** this page load has a `?lcards_device=` name: the URL name always wins.
   - It writes `display_name`, `last_seen` (now) and `user_agent` with `lcards/storage/device/set` (deep merge, so device-scoped settings in the same record are kept).

Without the integration nothing is written anywhere: the name stays in memory and is seeded again on the next load.

### UUID generation

`generateUUID()` has three tiers, because `crypto.randomUUID()` exists only in a secure context (HTTPS or `localhost`) and many Home Assistant installs are reached over plain HTTP on the LAN:

1. `crypto.randomUUID()`
2. `crypto.getRandomValues()` with the v4 version and variant bits set
3. `Math.random()` (logged as a warning; not cryptographically secure)

---

## Naming with the URL Parameter

Following the `?lcards_log_level=debug` convention, a device is named with:

```
https://your-home-assistant/lovelace/?lcards_device=Kitchen+Tablet
```

The name reaches the backend in that page load's heartbeat. On later loads **without** the parameter the stored name is read back, so a single visit is enough. A load **with** the parameter renames the device again, which suits kiosk bookmarks. The name persists only through the backend: without the integration the parameter lasts for that page load.

---

## Auto-Seeded Display Names

`_seedDisplayName()` builds `<Browser>-<Platform>` from `navigator.userAgent`:

| Check (first match wins) | Platform |
|---|---|
| `Android` | `Android` |
| `iPhone`, `iPad` or `iPod` | `iPhone` |
| `Windows` | `Windows` |
| `Mac OS X` | `Mac` |
| `Linux` | `Linux` |
| `CrOS` | `ChromeOS` |
| none | `Unknown` |

| Check (first match wins) | Browser |
|---|---|
| `Edg/` | `Edge` |
| `OPR/` | `Opera` |
| `Chrome` | `Chrome` |
| `Safari` | `Safari` |
| `Firefox` | `Firefox` |
| none | `Browser` |

Examples: `Chrome-Android`, `Safari-iPhone`, `Edge-Windows`, `Firefox-Linux`. If reading the user agent throws, the name is `Unknown-Device`.

---

## Config Panel

The **Users & Devices** tab (`src/panels/components/lcards-users-devices-tab.js`):

- **Current Session** (every user): this browser's name, UUID and last-seen time; renaming calls `setDisplayName()`.
- **Users** (admins): users with stored settings; clear a user's overrides.
- **Devices** (admins): every registered device with last-seen time; rename (`lcards/storage/devices/set`) or delete the whole record (`lcards/storage/devices/clear`).

---

## Backend Storage

Device data is the flat key `_device_<uuid>` in the LCARdS store:

```json
{
  "display_name": "Kitchen Tablet",
  "last_seen":    "2026-04-12T09:21:05.000Z",
  "user_agent":   "Mozilla/5.0 (Linux; Android ...)"
}
```

Device-scoped settings written with `ScopedSettingsService.write(key, value, 'device')` are extra keys in the same object. The Python action targeting resolves `target_device_names` against `display_name` here (case-insensitive).

---

## See Also

- [Scoped Settings Service](scoped-settings.md)
- [Integration Service](integration-service.md)
- [Users and devices (user guide)](../../configuration/users-devices.md)
