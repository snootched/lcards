---
description: "Raising and dismissing LCARdS alerts: the lcards.* alert actions, targeting devices and users, dismiss_mode and auto-dismiss timers, and screen transition effects."
---

# Raising and Dismissing

How an alert starts and ends: the actions that raise it, what a tap on the overlay does, timers that clear it, and the transition played when the alert mode changes.

## Triggering alert modes

**The `lcards.*` alert actions raise and clear alerts from automations, scripts and dashboard buttons.** Without targeting they set `input_select.lcards_alert_mode`, so every dashboard with an alert overlay shows the alert.

- `lcards.red_alert`, `lcards.yellow_alert`, `lcards.blue_alert`, `lcards.black_alert` and `lcards.gray_alert` raise that alert; `lcards.clear_alert` returns to `green_alert`; `lcards.set_alert_mode` takes the mode as `mode`.
- With a targeting field the alert is local to the matching devices or users, and the global helper is not changed: the alert overlay on those devices shows it, the others don't. [Users & Devices](/configuration/users-devices) explains broadcast and targeted alerts in full.
- You can also set the helper with Home Assistant's own `input_select.select_option` action.

```yaml live
# A dashboard button that raises red alert
type: custom:lcards-button
preset: lozenge
text:
  name:
    content: RED ALERT
    show: true
style:
  card:
    color:
      background:
        default: var(--lcars-alert-red)
tap_action:
  action: perform-action
  perform_action: lcards.red_alert
```

```yaml
# In an automation or script: every dashboard
action: lcards.red_alert
```

```yaml
# Only on the kitchen tablet; the global helper is not changed
action: lcards.red_alert
data:
  target_device_names:
    - Kitchen tablet
```

```yaml
# The helper directly: red_alert, yellow_alert, blue_alert, black_alert, gray_alert or green_alert
action: input_select.select_option
target:
  entity_id: input_select.lcards_alert_mode
data:
  option: red_alert
```

::: details More about triggering
- **From the browser console:** `window.lcards.setAlertMode('red_alert')` or `window.lcards.redAlert()` sets an alert, and `window.lcards.setAlertMode('green_alert')` or `window.lcards.greenAlert()` clears it. There are also `yellowAlert()`, `blueAlert()`, `grayAlert()` and `blackAlert()`. With the helper in place they write it, so every dashboard follows; without it the alert shows in this browser only.
- **The same mode again:** setting the mode that is already active changes nothing, so a dismissed alert comes back only when the mode changes.
- **More:** the [Alert Mode](/core/alert-mode) page covers what else an alert changes (theme colours, sounds), and [Actions](/configuration/ha-actions) lists every `lcards.*` action.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `mode` | string | required | `lcards.set_alert_mode` only: `red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert` or `green_alert` |
| `target_device_ids` | list | all devices | Browser device ids (the `lcards_device_id` each browser stores) |
| `target_device_names` | list | all devices | Device display names, set in the LCARdS Config Panel or with `?lcards_device=`. A name shared by several devices matches all of them |
| `target_user_ids` | list | all users | Home Assistant user ids |
| `target_user_names` | list | all users | Home Assistant user display names, any case |

## Dismiss

**`dismiss_mode` sets what happens when someone taps outside the symbol: hide the alert on this screen, or clear it everywhere.** The auto modes do the same on a timer.

- `dismiss` and `auto-dismiss` hide the overlay on this dashboard only: the alert mode stays active, other dashboards still show it, and it shows again when the mode changes.
- `reset` and `auto-reset` also set `lcards_alert_mode` back to `green_alert`, clearing the alert everywhere. A targeted alert (on this device only) is cleared on this device.
- With an auto mode the user can still tap to dismiss early. In `display: band` the tap is on the symbol.

```yaml live
# Hides after 30 seconds and clears the alert; red alerts after 15
type: custom:lcards-alert-overlay
dismiss_mode: auto-reset
auto_dismiss_seconds: 30
conditions:
  red_alert:
    auto_dismiss_seconds: 15
```

::: details More about dismiss
- **The timer:** the countdown starts when the overlay shows (for an alert raised in edit mode, when you leave edit mode). A dismiss cancels it. If the alert changes to another condition while it runs, it starts again for that condition.
- **Without a time:** an auto mode with no `auto_dismiss_seconds` starts no timer, and the alert stays until it is dismissed or the mode changes.
- **Where to tap:** the whole screen outside the symbol's box (its `width` by `height`) dismisses, whether or not there are screen effects. A tap inside the box goes to the symbol or content card.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `dismiss_mode` | string | `dismiss` | `dismiss`, `reset`, `auto-dismiss` or `auto-reset` |
| `auto_dismiss_seconds` | number | - | Seconds before an auto mode hides the alert, at least 1. Needed for `auto-dismiss` and `auto-reset`; a condition can set its own |

## Transition effects

**A transition effect plays over the whole screen while the new alert colours are applied, whenever the alert mode changes.** The `input_select.lcards_alert_transition_style` helper picks it.

- The helper is optional. Without it, or with it set to `off`, the colours change at once with no effect.
- Create it from the **LCARdS Config Panel** (Alert System section), or in Home Assistant with that entity id and the values below. Once it exists, change the effect at any time from the Config Panel, a dashboard dropdown or an automation.
- The effect plays on the whole page on every alert mode change, whichever dashboard or device raised it; it is not part of any one alert overlay.

```yaml
# Pick the effect from an automation
action: input_select.select_option
target:
  entity_id: input_select.lcards_alert_transition_style
data:
  option: blur_fade
```

| Value | Effect |
|-------|--------|
| `off` | No transition: the colours change at once (the default) |
| `blur_fade` | The view blurs and dims, the colours change, then it sharpens again |
| `fade_only` | The view fades to near black, the colours change, then it fades back in |
| `flash` | A full-screen flash in the alert colour fades in and out over the change |
| `color_bleed` | The hues turn a full 360° and the brightness dips while the colours change |
| `flicker` | The view flickers in uneven steps, changing colour part way through |
| `static` | Pixelated noise, tinted to the alert colour, plays over the change |
| `wipe` | A see-through panel in the alert colour wipes across the screen and back |

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `input_select.lcards_alert_transition_style` | helper | `off` | One of the values above |
