# Users & Devices

::: warning Preview feature
The **Users & Devices** tab requires the LCARdS HA integration (v2026.3.0+) with the `scoped_storage` capability. If the integration is absent or on an older version, the tab is hidden.
:::

The **Users & Devices** tab in the [LCARdS Config Panel](config-panel.md) is the central place to view and manage the devices and users that have stored per-device or per-user setting overrides.

It has three sections. Non-admin users see only **Current Session**. HA admins see all three.

---

## Current Session

Shows the identity of the current browser session — this is your **device record** as seen by LCARdS.

| Field | Description |
|-------|-------------|
| **Device name** | Human-readable label for this browser. Editable by any user — click the edit icon, type a new name, and save. Also settable via the URL parameter `?lcards_device=My%20Tablet` on first visit. |
| **Device ID** | Stable UUID stored in this browser's `localStorage`. Persists across page reloads and HA logins from the same browser profile. |
| **Last seen** | Timestamp of this device's last heartbeat to the backend. |
| **User agent** | Browser/OS string recorded at last registration. |

Setting a device name is optional but makes it much easier to identify sessions in the Devices list and when using [targeted HA services](../architecture/internals/ha-services.md).

---

## Users *(admin only)*

Lists every HA user who has at least one stored per-user override. For each entry you can see:

- The HA display name (resolved from the HA auth list)
- The opaque HA user ID
- A **Clear overrides** action — removes all per-user scoped settings for that user, reverting them to Device → Global fallback

> Clearing overrides does not affect the user's device records or any global settings.

---

## Devices *(admin only)*

Lists every device that has ever registered a heartbeat with the LCARdS backend. For each device:

| Column | Description |
|--------|-------------|
| **Name** | Display name — click the edit (pencil) icon to rename inline |
| **Last seen** | ISO timestamp of the last heartbeat |
| **Device ID** | Stable UUID for targeting services |
| **Delete** | Removes the entire device record from the backend (requires confirmation). Any scoped overrides stored for this device are also deleted. |

Deleting a device does not prevent it from re-registering — if the browser visits the dashboard again it will create a new record with the same UUID.

---

## How scoped settings work

LCARdS settings (currently: sound scheme, per-event sound overrides) are resolved in this order, using the first non-null value found:

```
Device scope  →  User scope  →  Global scope  →  HA helper fallback
```

- **Device** overrides apply to any HA user logged in on that specific browser.
- **User** overrides apply to a specific HA user regardless of which device they use.
- **Global** is the installation-wide default, shared by everyone.

Per-user and per-device overrides are configured in the individual feature tabs (e.g. [Sound](../core/sounds.md) → *Per-User / Per-Device Overrides* section). The **Users & Devices** tab is the admin view for managing *existing* records — it does not expose raw setting values.

---

## Related

- [Sounds](sounds.md) — configure per-user/device sound overrides
- [Configuration overview](./index.md) — panel setup and all tabs overview
- [HA Services — targeting](../architecture/internals/ha-services.md) — use device/user IDs in `lcards.*` service calls
- [Scoped Settings Service](../architecture/subsystems/scoped-settings.md) — developer reference for the underlying storage system
