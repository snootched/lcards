# Sound Effects

> **LCARS-style audio feedback for card interactions and HA UI events**

LCARdS can play sounds for card taps, navigation, dialogs, alert mode changes, and more. Sounds are **off by default** — you need to create the helper entities and enable the master toggle before any sound plays. Once enabled, all categories are on and the built-in scheme plays immediately with no further configuration.

---

## Setup

Open **Config Panel** → **Helpers** tab and create the helpers.

The HA input helpers that store and control certain global sound settings. You only need to do this once.

---

## Enabling Sounds

Sounds won't play until `input_boolean.lcards_sound_enabled` is turned on. Toggle it from:

- The **Sound** tab in the Config Panel
- Your HA dashboard directly
- An automation

The three category toggles (`lcards_sound_cards`, `lcards_sound_ui`, `lcards_sound_alerts`) let you enable/disable each group independently. All three default to enabled once the master is on.

---

## Sound Schemes

A scheme maps every event to an audio file. Select your scheme from the **Sound Scheme** dropdown in the Sound tab (or via the `input_select.lcards_sound_scheme` entity).

**Built-in scheme: `lcards_default`**

Covers all event types with LCARS-style beeps and tones. Additional schemes become available when sound packs are installed.

Set to **none** to use the default built-in scheme. To disable all sounds, turn off the master **Sound Effects Enabled** toggle.

---

## Per-Event Overrides

You can assign a different sound (or silence) to any individual event, independent of the active scheme.

In the Sound tab, find the event in the overrides table and pick an asset from the dropdown, or set it to **— (use scheme default)** to revert. When any overrides are active, a **Reset all to scheme defaults** button appears above the table to clear them all at once.

Overrides set in the **Global Settings** section are shared across all users and all devices (they apply to everyone who hasn't set a more specific override).

To set overrides that only apply to you or a specific device, use the **Per-User / Per-Device Overrides** section below.

---

## Per-User / Per-Device Overrides

> **Requires**: LCARdS integration v1.12+ with `scoped_storage` capability.

The **Per-User / Per-Device Overrides** section at the bottom of the Sound tab lets you set sound settings that only apply to a specific user or device, without changing the global defaults.

### Scope selector

Use the **User** / **Device** buttons to switch between the two scopes:

- **User** — settings apply to your HA user account on any device
- **Device** — settings apply to this specific browser/device only

### What can be overridden per-user / per-device

| Setting | User scope | Device scope |
|---------|------------|-------------|
| Master enable | ✅ | ✅ |
| Volume | ✅ | ✅ |
| Sound scheme | ✅ | ✅ |
| Per-event overrides | ✅ | ✅ |

### Resolution order

Every sound setting — volume, scheme, and per-event overrides — follows the same priority chain. The first non-null value found wins:

```
Card config → Device override → User override → Global setting → Scheme default
```

| Priority | What it is |
|----------|------------|
| **Card config** | `tap_action.sound` in a card's YAML — highest, overrides everything |
| **Device override** | Set in the Device scope for this browser/device |
| **User override** | Set in the User scope for your HA account |
| **Global setting** | The shared default (helpers + global per-event overrides) |
| **Scheme default** | The active sound scheme's mapping for that event |

Clearing an override at any level (the × button, or setting a per-event override back to **Use scheme default**) drops that level out of the chain — the next level down takes over automatically.

### Admin — editing other users / devices

HA admin users see an **Edit as admin** dropdown in each scope section. Selecting a user or device lets the admin view and modify that subject's overrides directly. Changes take effect on the target's next playback.

---

## What Events Are Covered

### Card Interactions
| Event | When |
|-------|------|
| Card Tap | Tapping any LCARdS card or standard HA card |
| Card Hold | Hold action |
| Card Double-Tap | Double-tap action |
| Card Hover | Mouse hover (desktop only) |
| Toggle → On / Off | Toggle state changes |
| Slider Grab / Release | Grabbing or releasing a slider |
| More Info Open | Opening the more-info panel |

### HA UI Navigation
| Event | When |
|-------|------|
| Menu Expand / Collapse | Hamburger menu button |
| Page / View Navigation | Moving between dashboard views and sidebar nav items |
| Dialog Open | Any HA dialog opens |
| Dialog Close | Any HA dialog dismissed |
| Dashboard Edit Start | Entering dashboard edit mode |
| Dashboard Edit Save / Done | Exiting dashboard edit mode |

### Alerts & System
| Event | When |
|-------|------|
| Red Alert | Alert mode set to `red_alert` |
| Yellow Alert | Alert mode set to `yellow_alert` |
| Blue Alert | Alert mode set to `blue_alert` |
| Gray Alert | Alert mode set to `gray_alert` |
| Black Alert | Alert mode set to `black_alert` |
| Alert Clear | Alert mode cleared (back to normal) |
| System Ready | LCARdS initialization complete |
| System Error | System error condition |
| Notification | General notification |

---

## Silencing a Specific Event

In the overrides table, set the event's asset to **Silence** (the explicit silence option, distinct from "use scheme default"). The active scheme may also silence events — `slider_change` is silenced in `lcards_default` to avoid sound on every value tick.

---

## Browser Audio Policy {#browser-audio-policy}

Browsers block audio playback until the user has interacted with the page (clicked, tapped, or pressed a key). For most LCARdS sounds this is transparent — the first tap on a card or navigation link is the interaction, and sounds play normally from that point on.

The **System Ready** startup sound is different: it plays immediately after LCARdS finishes initializing, before any user interaction. Browsers will block it by default unless your HA dashboard URL is explicitly allowed to autoplay audio.

:::: tabs
=== Chrome / Edge

1. Open **Chrome Settings** → **Privacy and security** → **Site settings** → **Additional content settings** → **Sound**
2. Under **Allowed to play sound**, click **Add** and enter your HA URL (e.g. `http://homeassistant.local:8123` or `https://my.ha.instance`)
3. Hard-refresh your HA dashboard — the startup sound will now play on page load

Alternatively, click the **🔒 / ℹ️** icon in the address bar while on your HA page → **Site settings** → change **Sound** to **Allow**.

=== Firefox

1. Open **Firefox Settings** → **Privacy & Security** → scroll to **Permissions** → **Block websites from automatically playing sound** → click **Exceptions...**
2. Enter your HA URL and click **Allow** → **Save Changes**
3. Hard-refresh your HA dashboard

Alternatively, when Firefox shows the autoplay blocked icon (🔇) in the address bar, click it and select **Allow Audio and Video**.

::::

::: tip
If you don't use the System Ready sound, no browser changes are needed — all other sounds fire after a user interaction and play without restriction.
:::

---

## Notes

- Sounds are off by default. Nothing plays until `input_boolean.lcards_sound_enabled` exists and is set to `on`.
- Category toggles (`lcards_sound_cards`, `lcards_sound_ui`, `lcards_sound_alerts`) default to enabled once the master is on — you only need to create them if you want to disable a specific category.
- Volume is shared across all events — there's no per-event volume.
- Global overrides apply to all users and devices. User-scoped and device-scoped overrides apply only to that user or device respectively; device-scope wins over user-scope on a per-event basis.
- The sound scheme helper's option list updates automatically as you install sound packs — no manual YAML edits needed.
- Setting the scheme to **none** uses the default built-in scheme. To disable all sounds, use the master **Sound Effects Enabled** toggle.

---
