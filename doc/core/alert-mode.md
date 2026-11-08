---
description: "LCARdS alert mode: red, yellow, blue, gray and black alert recolour every dashboard at once, play the alert sound and raise the alert overlay."
moved_anchors:
  configuring-alert-appearance: /core/alert-mode#alert-colours
  alert-mode-lab: /core/alert-mode#alert-colours
---

# Alert Mode

**Alert mode switches every LCARdS dashboard into red, yellow, blue, gray or black alert at once, and back to normal (green) when the alert clears.** One action from an automation, a script or a dashboard button raises it.

When the alert mode changes:

- **The colours change everywhere.** The LCARS theme colours, the LCARdS palette and Home Assistant's state colours shift toward the alert's colour, so every card recolours in place. The [Alert Mode Lab](/configuration/alert-mode-lab) tunes each level.
- **The alert sound plays**, through the LCARdS sound scheme.
- **The [alert overlay](/cards/alert-overlay/) shows the alert symbol** over every dashboard that has the card.
- **Cards can react through rules**: a rule on the alert mode helper can make chosen cards pulse or change style. Nothing animates unless you add a rule.
- **The `input_select.lcards_alert_mode` helper holds the current mode**, so automations can raise an alert and react to one.

::: tip Try it
The red alert button under [Triggering alert mode](#triggering-alert-mode) raises a red alert on this page; the clear button under it ends it. The **Alert Mode Lab** in the LCARdS Config Panel previews each level on your own dashboard.
:::

| Page | Covers |
|------|--------|
| [Alert Overlay Card](/cards/alert-overlay/) | The alert symbol, band and screen effects shown during an alert |
| [Raising and Dismissing](/cards/alert-overlay/raising) | The `lcards.*` alert actions, targeting, dismiss timers and transition effects |
| [Alert Mode Lab](/configuration/alert-mode-lab) | Tuning the colours of each alert level |
| [Users & Devices](/configuration/users-devices) | Device names and ids for targeted alerts |

## Alert levels

**Six alert modes: `green_alert` is normal operation, and the other five each shift the colours their own way.** The alert overlay below shows the symbol for each one; pick a condition under the mock screen.

```yaml live
type: custom:lcards-alert-overlay
```

| Mode | Colours | Sound event |
|------|---------|-------------|
| `green_alert` | The theme's own colours (normal operation, the default) | Alert Cleared (`alert_clear`) |
| `red_alert` | Shifted toward red, more saturated and slightly darker | Red Alert (`alert_red`) |
| `yellow_alert` | Shifted toward amber, more saturated | Yellow Alert (`alert_yellow`) |
| `blue_alert` | Shifted toward deep blue, more saturated | Blue Alert (`alert_blue`) |
| `gray_alert` | All colour removed: grayscale | Gray Alert (`alert_gray`) |
| `black_alert` | All colour removed and much darker, with the contrast raised so text stays readable | Black Alert (`alert_black`) |

## Triggering alert mode

**The `lcards.*` alert actions raise and clear alerts from automations, scripts and dashboard buttons.** `lcards.red_alert`, `lcards.yellow_alert`, `lcards.blue_alert`, `lcards.gray_alert` and `lcards.black_alert` raise that alert, `lcards.clear_alert` returns to `green_alert`, and `lcards.set_alert_mode` takes the mode as `mode`.

- Without targeting, the action sets the `input_select.lcards_alert_mode` helper, so every browser follows.
- With a targeting field (`target_device_names` and the others), the alert is applied only on the matching devices or users, and the helper is not changed. It lasts until the mode changes again or the page reloads. [Raising and Dismissing](/cards/alert-overlay/raising#triggering-alert-modes) lists the targeting fields.
- Home Assistant's own `input_select.select_option` action on the helper works too.
- In the Config Panel, pick a mode in the **Alert Mode Lab** (Theme Studio tab) and click **Apply Live**.

```yaml live
# Raises red alert on this page
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

```yaml live
# Returns to green alert
type: custom:lcards-button
preset: lozenge
text:
  name:
    content: CLEAR ALERT
    show: true
tap_action:
  action: perform-action
  perform_action: lcards.clear_alert
```

These run from an automation or a script, so they are plain blocks:

```yaml
# Every dashboard
action: lcards.yellow_alert
```

```yaml
# Only on two devices, by the names set in the LCARdS Config Panel
action: lcards.red_alert
data:
  target_device_names:
    - Kitchen Tablet
    - Hallway Display
```

```yaml
# Every session of one Home Assistant user
action: lcards.yellow_alert
data:
  target_user_names:
    - jane
```

```yaml
# The helper directly
action: input_select.select_option
target:
  entity_id: input_select.lcards_alert_mode
data:
  option: red_alert
```

::: details More about triggering
- **The same mode again:** an action that sets the mode already active changes nothing: no sound, no transition, and a dismissed alert overlay stays dismissed.
- **Without the helper:** an `lcards.*` alert action with no targeting only writes the helper, so nothing happens and the integration logs a warning. Targeted actions and the browser console still work.
- **A name that matches nothing:** a `target_device_names` or `target_user_names` entry that matches no device or user leaves the targeting empty, and the action then acts as if untargeted: it sets the helper for every browser.
- **Finding device ids:** `window.lcards.targeting.getMyIds()` in the browser console returns this browser's device id and user id.
:::

## From the browser console

**The `window.lcards.alert` console API sets and reads the alert mode in the browser's developer tools.** It runs in the browser console, so it is not a live example.

- With the helper in place, the console calls write it, so every browser follows. Without it, the alert shows in this browser only.
- The older root shortcuts (`window.lcards.redAlert()`, `yellowAlert()`, `blueAlert()`, `grayAlert()`, `blackAlert()`, `greenAlert()`, `setAlertMode()`, `getAlertMode()`) still work.

```js
window.lcards.alert.red();        // also yellow(), blue(), gray(), black()
window.lcards.alert.off();        // back to green_alert (green() does the same)
window.lcards.alert.set('red_alert');
window.lcards.alert.get();        // the current mode, for example 'red_alert'
```

## Required helper

**Alert mode across dashboards needs the `input_select.lcards_alert_mode` helper in Home Assistant.** The **Helpers** tab of the LCARdS Config Panel creates it, with the other LCARdS helpers, in one click.

- To create it by hand, add an input select with exactly these options, in `configuration.yaml` or as a helper in the Home Assistant UI.
- When a page loads, it shows the colours of the helper's current mode only if `input_boolean.lcards_alert_mode_auto_switch` is on; with it off (the default), a page opened during an alert keeps the normal colours until the mode next changes. The alert overlay follows the helper either way.

```yaml
# configuration.yaml
input_select:
  lcards_alert_mode:
    name: LCARdS Alert Mode
    options:
      - green_alert
      - red_alert
      - yellow_alert
      - blue_alert
      - gray_alert
      - black_alert
    initial: green_alert
    icon: mdi:alarm-light
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `input_select.lcards_alert_mode` | helper | `green_alert` | The current alert mode: one of the six modes above |
| `input_boolean.lcards_alert_mode_auto_switch` | helper | `off` | `on`: a page applies the helper's current mode when it loads |
| `input_select.lcards_alert_transition_style` | helper | `off` | The screen transition played when the mode changes; see [Transition effects](/cards/alert-overlay/raising#transition-effects) |
| `input_text.lcards_alert_message` | helper | - | A message for the alert overlay; see [A message from a helper](/cards/alert-overlay/symbol#a-message-from-a-helper) |

## Alert colours

**Each alert level shifts the colours with its own hue, hue strength, saturation and lightness.** The **Alert Mode Lab** (LCARdS Config Panel, Theme Studio tab) adjusts these per level with a live preview, and **Save to helpers** keeps them across restarts.

- The shift starts from the theme's normal colours each time, so switching from red to blue gives the same blue as switching from green.
- Colours given as `var(--lcars-*)` or `var(--lcards-*)` in a card follow the alert at once, without the card redrawing.
- The [Alert Mode Lab](/configuration/alert-mode-lab) page lists every parameter.

```yaml live
# A card that uses theme colours recolours with the alert
type: custom:lcards-button
preset: lozenge
text:
  name:
    content: SYSTEMS
    show: true
style:
  card:
    color:
      background:
        default: var(--lcars-orange)
```

::: details More about alert colours
- **From the console:** `window.lcards.alert.config` tunes the same parameters without the Lab. `setParam(mode, parameter, value, applyNow)` sets one (for example `setParam('red_alert', 'saturationMultiplier', 1.5, true)`), `getTransform(mode)` reads them, `reset(mode, applyNow)` and `resetAll()` go back to the defaults, and `export()` returns the changed values. Console changes last until the page reloads.
- **Borg:** [Borg Assimilation](/core/borg) uses its own colour shift, toward yellow-green.
:::

## Alert overlay card

**The alert overlay card shows the alert symbol, or a band, over the dashboard while an alert is raised.** Add one to every dashboard that should show alerts; where it sits in the view doesn't matter.

- Backdrop effects, the symbol's text and colours, your own content card, per-condition settings and dismissing are all covered on the [Alert Overlay Card](/cards/alert-overlay/) pages.

```yaml live
# The symbol in the top right corner, over the default blur
type: custom:lcards-alert-overlay
position: top-right
width: 40%
```

## Sounds

**Every alert mode change plays that mode's alert sound, in the Alerts sound category.** Assign or change the sounds in the **Sounds** tab of the LCARdS Config Panel.

- The sound events are listed in [Alert levels](#alert-levels). Clearing the alert plays Alert Cleared.
- The Alerts switch and the master sound switch in the Config Panel turn them off.
- [Sounds](/configuration/sounds) covers schemes and overrides.

## Rules-driven animations

**A rule on the alert mode helper can make chosen cards pulse, flash or restyle while a given alert is active.** It is opt-in: give the cards a tag and add a rule that targets it.

- The animation stops when the rule stops matching, that is when the mode changes.
- On this page there is no alert mode helper, so the rule below never matches and the button stays still.

```yaml live
type: custom:lcards-button
preset: lozenge
tags:
  - status-indicator
text:
  name:
    content: STATUS
    show: true
rules:
  - id: red-alert-pulse
    when:
      entity: input_select.lcards_alert_mode
      state: red_alert
    apply:
      animations:
        - tag: status-indicator
          preset: pulse
          loop: true
```

The [Rules Engine](/core/rules/) page covers conditions and everything a rule can apply.
