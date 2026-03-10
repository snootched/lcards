# Sound Effects

> **LCARS-style audio feedback for card interactions and HA UI events**

LCARdS can play sounds for card taps, navigation, dialogs, alert mode changes, and more. It's opt-in — everything is off by default until you create the helpers and enable them.

---

## Setup

Open any LCARdS card editor → **Config Panel** → **Sound** tab → click **Create All Helpers**.

This creates the six HA input helpers that store your sound settings. You only need to do this once.

Alternatively, add the helpers manually in `configuration.yaml`:

```yaml
input_boolean:
  lcards_sound_enabled:
    name: LCARdS Sound Effects Enabled
    icon: mdi:volume-high
  lcards_sound_cards:
    name: LCARdS Card Interaction Sounds
    icon: mdi:gesture-tap
  lcards_sound_ui:
    name: LCARdS UI Navigation Sounds
    icon: mdi:navigation
  lcards_sound_alerts:
    name: LCARdS Alert & System Sounds
    icon: mdi:alert-circle

input_number:
  lcards_sound_volume:
    name: LCARdS Sound Volume
    min: 0
    max: 1
    step: 0.05
    mode: slider
    icon: mdi:volume-medium

input_select:
  lcards_sound_scheme:
    name: LCARdS Sound Scheme
    options:
      - none
    icon: mdi:music-box-multiple
```

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

> **Per-browser setting** — overrides are stored in `localStorage` on the current device. If you use LCARdS on multiple devices or browsers, you'll need to configure overrides on each one separately.

In the Sound tab, find the event in the overrides table and pick an asset from the dropdown, or set it to **— (use scheme default)** to revert. When any overrides are active, a **Reset all to scheme defaults** button appears above the table to clear them all at once.

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
- Overrides are per-browser. If you use multiple devices, configure each separately.
- The sound scheme helper's option list updates automatically as you install sound packs — no manual YAML edits needed.

---

## Related

- [Config Panel](../config-panel.md) — manage schemes and per-event overrides
- [User Docs Index](../README.md)
