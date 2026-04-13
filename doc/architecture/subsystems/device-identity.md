# Device Identity Manager

> **Subsystem**: `window.lcards.core.deviceIdentityManager`
> **Class**: `DeviceIdentityManager` (`src/core/services/DeviceIdentityManager.js`)

---

## Overview

`DeviceIdentityManager` provides a **stable, human-labelled identity** for the current browser profile. This identity is used as the key for device-scoped settings in the [`ScopedSettingsService`](scoped-settings.md) waterfall.

### What makes a "device"?

A **device** in LCARdS is a specific browser profile on a specific machine — not the physical hardware. Two different Chrome profiles on the same laptop are two different devices. This matches how browser_mod and similar integrations handle device identity.

| Concept | Implementation |
|---------|---------------|
| Stable ID | UUID (`crypto.randomUUID()`) stored in `localStorage['lcards_device_id']` |
| Display name | User-settable string; auto-seeded from user-agent on first boot |
| Backend registration | Heartbeat WS call at startup (after IntegrationService probe) |
| Override at launch | `?lcards_device=<name>` URL parameter |

---

## API

```javascript
const dim = window.lcards.core.deviceIdentityManager;
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `dim.deviceId` | `string` | Stable UUID for this browser profile |
| `dim.displayName` | `string` | Human-readable name |
| `dim.lastSeen` | `string\|null` | ISO timestamp of last heartbeat, or null |
| `dim.userAgent` | `string` | `navigator.userAgent` |

### Methods

```javascript
// Rename this device (persists to backend immediately)
await dim.setDisplayName('Kitchen Tablet');

// Explicit heartbeat (called automatically at startup — you rarely need this)
await dim.registerHeartbeat();
```

---

## First-Boot Behaviour

On the first HASS update, `_init()` runs once and:

1. **Loads or creates UUID** — checks `localStorage['lcards_device_id']`; generates a v4 UUID if absent.
2. **Applies `?lcards_device=` URL parameter** — if present, sets the display name *and* persists it to localStorage.
3. **Seeds display name** — if no display name is set, auto-derives one from the user-agent string (e.g. `Chrome-Android`, `Safari-iPhone`, `Firefox-Linux`).
4. **Registers heartbeat** — after `IntegrationService.onReady()` resolves, sends display name, ISO timestamp, and user-agent to `_device_<uuid>` in backend storage.

---

## Naming Convention — URL Parameter

Following the `?lcards_log_level=debug` convention, device names are set via:

```
https://your-ha-instance/lovelace/?lcards_device=Kitchen+Tablet
```

The name is persisted to localStorage on first boot so the URL parameter only needs to be used once per browser profile. Subsequent navigations without the parameter retain the set name.

---

## Auto-Seeded Display Names

When no display name has been set, `_seedDisplayName()` produces a readable label from `navigator.userAgent`:

| User-agent pattern | Auto-seed |
|--------------------|-----------|
| Chrome + Android | `Chrome-Android` |
| Chrome + Windows | `Chrome-Windows` |
| Safari + iPhone | `Safari-iPhone` |
| Firefox + Linux | `Firefox-Linux` |
| … | (two-segment `Browser-OS` pattern) |

---

## Admin Panel

Admins can view and manage all registered devices from the **LCARdS Config Panel → Users & Devices** tab:

- List all devices with display name and last-seen timestamp
- Rename any device
- Delete a device's entire record from the backend

Non-admin users can update their own device's display name from the same tab's **This Device** section.

---

## Backend Storage

Device data is stored as a flat key `_device_<uuid>` in the LCARdS integration store:

```json
{
  "display_name": "Kitchen Tablet",
  "last_seen":    "2026-04-12T09:21:05.000Z",
  "user_agent":   "Mozilla/5.0 (Linux; Android …)"
}
```

Any device-scoped settings are stored as additional keys in the same object via `ScopedSettingsService.write()`.

---

## See Also

- [Scoped Settings Service](scoped-settings.md)
- [Integration Service](integration-service.md)
