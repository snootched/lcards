---
description: "The Users & Devices tab of the LCARdS Config Panel: this browser's device name and id, the users and devices with their own settings, and how device, user and global settings combine."
moved_anchors:
  current-session: /configuration/users-devices#this-session
  users-admin-only: /configuration/users-devices#users-with-scoped-settings
  devices-admin-only: /configuration/users-devices#registered-devices
---

# Users & Devices

**The Users & Devices tab of LCARdS Config shows who this browser is to LCARdS, and lets administrators see and tidy every user and device that has its own settings.**

- Every browser gets a device record: a stable id and a display name. Device names are what [targeted actions](./ha-actions#targeting) and per-device settings use.
- Everyone sees **This Session**. Home Assistant administrators also see **Users with Scoped Settings** and **Registered Devices**.
- The settings themselves are changed in their own tabs (Sounds, Connectivity, Theme Studio > Token Overrides); this tab manages the records.

---

## This Session

**Your logged-in user and this browser's device record.** Use it to name the browser, or to find its id for an action.

- Click the pencil next to **Display Name** to rename this device; Enter saves.
- A new device is named after its browser and system (`Chrome-Android`, `Safari-iPhone`) until you rename it.
- A device can be named from its address: add `?lcards_device=<name>`, for example `http://homeassistant.local:8123/?lcards_device=Kitchen%20Tablet`. The name applies on every load with it, over a name set before. Handy for kiosk bookmarks.
- `window.lcards.targeting.getMyIds()` in the browser console returns this device's id and your user id.

| Detail | Description |
|-------|-------------|
| **Logged-in User** | Your Home Assistant user's name |
| **User ID** | Your Home Assistant user id, as `target_user_ids` takes it |
| **Device ID** | A stable id kept in this browser's `localStorage` (`lcards_device_id`). It survives reloads and logins in the same browser profile; clearing the site's data gives a new one |
| **Display Name** | The name for this browser. Editable by any user |
| **Last Seen** | When this device last checked in with the integration |
| **User Agent** | The browser and system string recorded for it |

---

## Users with Scoped Settings

**Administrators only: every Home Assistant user with at least one setting of their own.**

- Each row shows the user's name (from Home Assistant), their id and the stored keys.
- **Clear all overrides for this user** deletes that user's own settings after a confirmation; they then get the device or global values. Device records and global settings are not touched.

---

## Registered Devices

**Administrators only: every browser that has registered with the integration, with its name, id and last check-in.**

- **Rename device** edits the display name in place.
- **Remove device record** deletes the record and the settings stored for that device, after a confirmation. A browser that opens Home Assistant again registers again, with the same id.

---

## How scoped settings work

**A setting that can differ per user or device takes the first value it finds: the device's, then the user's, then the global one.**

```
Device  →  User  →  Global  →  Built-in default (or the helper)
```

- **Device** settings apply to whoever is logged in on that browser.
- **User** settings apply to one Home Assistant user on every device.
- **Global** is the installation-wide value everyone shares.
- Today these settings can be scoped: [sounds](./sounds#per-user-per-device-overrides) (master switch, volume, scheme and per-event sounds), the [connection overlay](./connectivity#scope-and-per-device-overrides), and theme token overrides (Theme Studio > Token Overrides).

---

## Related

- [Home Assistant Actions: targeting](./ha-actions#targeting): send an `lcards.*` action to some devices or users only
- [Sound Configuration](./sounds): per-user and per-device sound settings
- [Connectivity](./connectivity): per-user and per-device connection overlay settings
- [Scoped Settings Service](../architecture/subsystems/scoped-settings): developer reference for the storage behind this tab
