---
description: "LCARdS sound configuration: the master switch and categories, sound schemes (built-in and your own), per-event sounds, per-user and per-device settings, the events that play sounds, and the browser autoplay setting."
moved_anchors:
  silencing-a-specific-event: /configuration/sounds#per-event-overrides
  notes: /configuration/sounds#enabling-sounds
---

# Sound Configuration

**LCARdS can play LCARS sounds when you tap cards, move around Home Assistant, open dialogs and change the alert mode.** The **Sounds** tab of **LCARdS Config** turns them on, picks the sound scheme and changes single events.

- Sounds are off until you create the sound helpers and turn on the master switch.
- A new installation's scheme is **None (silent)**: pick **lcards_default** (or another scheme) in **Sound Scheme** to hear the built-in sounds.
- A card can mute itself or play other sounds: see [Card Sounds](../core/sounds).

---

## Setup

**Create the sound helpers once: LCARdS Config > Helpers > Create All.** They hold the master switch, the three category switches, the volume and the scheme. See [Persistent Helpers](./persistent-helpers#sound).

## Enabling Sounds

**No sound plays until `input_boolean.lcards_sound_enabled` is on.** Turn it on with **Sound effects enabled** in the Sounds tab's **Master Controls**, from a dashboard, or from an automation.

- **Volume** sets the volume of every sound, `0` to `1` (default `0.5`). There is no volume per event.
- **Sound Categories** switch groups of events: **Card interaction sounds** (`lcards_sound_cards`), **UI navigation sounds** (`lcards_sound_ui`) and **Alert and system sounds** (`lcards_sound_alerts`). They are on by default, and a missing category helper counts as on.
- The category switches are the same for everyone; the master switch, volume and scheme can also be set per user or device (see [below](#per-user-per-device-overrides)).

## Sound Schemes

**A scheme gives every event its sound.** Pick it in the Sounds tab's **Sound Scheme** section, or set `input_select.lcards_sound_scheme`. **Preview** plays a sample.

- **lcards_default** is built in and covers every event with LCARS beeps and tones, except **Slider Value Change** (silent, so dragging a slider doesn't beep on every step) and the two Borg events. Sound packs add more schemes; the helper's options update by themselves.
- **None (silent)** is an empty scheme: nothing plays except the events you give a sound below. To turn every sound off, use the master switch instead.
- **Save as new scheme…** (under Per-Event Overrides) saves the current per-event sounds as a scheme of your own, listed as *name (custom)*. With a custom scheme active, per-event edits change that scheme directly; **Delete** removes it permanently.

## Per-Event Overrides

**Give any single event another sound, or mute it, whatever the scheme says.** Open **Per-Event Overrides** inside the Sound Scheme section and pick a sound for the event.

- Each event offers **(Use scheme default)**, **Mute this event**, **Browse Home Assistant Media…** (a sound from the media library) and every sound asset from the loaded packs. The play button next to it previews the result.
- Click **Save** to keep your changes, or **Discard**. **Reset to scheme defaults** clears every override at once.
- Overrides made here are global: they apply to every user and device that has no override of its own. They are stored by the integration (see the Storage tab), not in helpers.

---

## Per-User / Per-Device Overrides

**Your own sound settings, for your Home Assistant user on any device, or for this one browser, without changing everyone else's.** The section is at the bottom of the Sounds tab.

### Scope selector

**The User and Device switches choose which one you are editing.**

- **User:** applies to your Home Assistant user on every device.
- **Device:** applies to this browser, whoever is logged in.
- Each setting shows where its current value comes from; the clear button next to an override removes it, and the next level takes over.

### What can be overridden per-user / per-device

| Setting | User | Device |
|---------|------|--------|
| Sound effects enabled | yes | yes |
| Volume | yes | yes |
| Sound scheme | yes | yes |
| Per-event overrides | yes | yes |
| Sound categories | no | no |

### Resolution order

**Each setting takes the first value it finds, in this order.**

```
Card sounds → Device → User → Global → Scheme
```

| Level | What it is |
|-------|------------|
| **Card sounds** | A card's own [`sounds`](../core/sounds) block, for that card's events only |
| **Device** | Set in the Device scope for this browser |
| **User** | Set in the User scope for your Home Assistant user |
| **Global** | The helpers and the global per-event overrides |
| **Scheme** | The active scheme's sound for the event |

### Admin: editing other users / devices

**Home Assistant administrators can edit another user's or device's settings.** **Edit as admin** in each scope lists the users or devices; pick one to see and change its overrides. The change applies the next time that user or device plays a sound.

---

## What Events Are Covered

**Every event that can play a sound, with the key that card `sounds` blocks and [`lcards.play_sound`](./ha-actions#lcards-play-sound) use.**

### Card Interactions

| Event | Key | When |
|-------|-----|------|
| Card Tap | `card_tap` | A tap on an LCARdS card, or a click on a standard Home Assistant card |
| Card Hold | `card_hold` | A hold action |
| Card Double-Tap | `card_double_tap` | A double-tap action |
| Card Hover (Desktop) | `card_hover` | The mouse pointer moving onto a card |
| Toggle → On / Off | `toggle_on`, `toggle_off` | A toggle action turning an entity on or off |
| Slider Grab / Release | `slider_drag_start`, `slider_drag_end` | Grabbing or letting go of a slider |
| Slider Value Change | `slider_change` | Each step while a slider moves |
| More Info Open | `more_info_open` | A more-info dialog opening |

### Home Assistant UI Navigation

| Event | Key | When |
|-------|-----|------|
| Sidebar Menu Expand / Collapse | `menu_expand` | The sidebar menu button |
| Page / View Navigation | `nav_page` | Moving between views and sidebar pages |
| Dialog Open | `dialog_open` | Any Home Assistant dialog opening |
| Dialog Close | `dialog_close` | Any Home Assistant dialog closing |
| Dashboard Edit Start | `dashboard_edit_start` | Entering dashboard edit mode |
| Dashboard Edit Save / Done | `dashboard_edit_save` | Leaving dashboard edit mode |

### Alerts & System

| Event | Key | When |
|-------|-----|------|
| Red Alert | `alert_red` | The alert mode changes to `red_alert` |
| Yellow Alert | `alert_yellow` | The alert mode changes to `yellow_alert` |
| Blue Alert | `alert_blue` | The alert mode changes to `blue_alert` |
| Gray Alert | `alert_gray` | The alert mode changes to `gray_alert` |
| Black Alert | `alert_black` | The alert mode changes to `black_alert` |
| Alert Cleared (Green Alert) | `alert_clear` | The alert mode returns to `green_alert` |
| System Ready | `system_ready` | LCARdS has finished starting |
| System Error | `error` | LCARdS fails to start |
| Notification | `notification` | A Home Assistant notification appears |
| Borg assimilation | `borg_assimilate` | The [Borg assimilation](/core/borg#sounds) starts (silent until you give it a sound) |
| Borg deassimilation | `borg_deassimilate` | The Borg deassimilation starts (silent until you give it a sound) |

---

## Triggering from Automations

**[`lcards.play_sound`](./ha-actions#lcards-play-sound) plays a sound from an automation**, for example a soft chime when a kiosk tablet wakes, without changing the alert mode or the screen.

- With `event_type` it plays that event's sound as the browser has it set up (its overrides and scheme), and that event's category switch applies.
- With `asset_key` it plays one exact sound: an asset key, a file URL such as `/local/sounds/chime.mp3` (a file in the `www` folder of your Home Assistant configuration) or a `media-source://` id. Only the master switch applies.
- Like the other `lcards.*` actions, it can [target](./ha-actions#targeting) devices or users.

```yaml
action: lcards.play_sound
data:
  event_type: notification
```

---

## Browser Audio Policy {#browser-audio-policy}

**Browsers block sound until you have clicked, tapped or pressed a key on the page.** For almost every LCARdS sound that is no trouble: your first tap is the interaction, and sounds play from then on.

The **System Ready** sound is the exception: it plays as soon as LCARdS has started, before you have touched the page, so the browser blocks it unless your Home Assistant address may play sound on its own. The Sounds tab shows the same notice with a link here.

:::: tabs
=== Chrome / Edge

1. Open **Settings > Privacy and security > Site settings > Additional content settings > Sound**.
2. Under **Allowed to play sound**, click **Add** and enter your Home Assistant address (for example `http://homeassistant.local:8123`).
3. Hard-refresh your dashboard: the startup sound now plays on page load.

Or click the site icon at the left of the address bar on your Home Assistant page, open **Site settings** and set **Sound** to **Allow**.

=== Firefox

1. Open **Settings > Privacy & Security**, scroll to **Permissions**, and click **Settings...** next to **Autoplay**.
2. Enter your Home Assistant address, set it to **Allow Audio and Video** and click **Save Changes**.
3. Hard-refresh your dashboard.

Or, when Firefox shows the autoplay-blocked icon in the address bar, click it and choose **Allow Audio and Video**.

::::

::: tip
If you don't use the System Ready sound, no browser change is needed.
:::
