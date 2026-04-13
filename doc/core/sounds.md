# Sound Effects

> **LCARS-style audio feedback for card interactions and HA UI events**

LCARdS can play sounds for card taps, navigation, dialogs, alert mode changes, and more. It's opt-in — everything is off by default until you create the helpers and enable them.

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

Set to **none** to disable all sounds without turning off the helpers.

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

## Notes

- Sounds require at least one user click before they'll play (browser autoplay policy). The first tap on any card unlocks audio.
- Volume is shared across all events — there's no per-event volume.
- Global overrides apply to all users and devices. User-scoped and device-scoped overrides apply only to that user or device respectively; device-scope wins over user-scope on a per-event basis.
- The sound scheme helper's option list updates automatically as you install sound packs — no manual YAML edits needed.

---
