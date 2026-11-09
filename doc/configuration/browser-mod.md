---
description: "Using LCARdS with browser_mod: LCARdS screen effects and alerts next to browser_mod popups, one-device effects, activity-gated effects, LCARdS effects from browser_mod JavaScript, and which tool does what."
---

# Using LCARdS with browser_mod

**LCARdS and [browser_mod](https://github.com/thomasloven/hass-browser_mod) work side by side: LCARdS draws full-screen alerts, effects and colour changes, and browser_mod handles popups, navigation and browser sensors.** They don't get in each other's way.

- A typical pairing: browser_mod shows the popup with the buttons, LCARdS sets the mood behind it.
- Each tool has its own id for a browser: see [Pattern 3](#pattern-3-targeted-effect-on-one-device).

::: info No dependency
LCARdS works fully without browser_mod installed. Everything here is optional.
:::

---

## Integration Patterns

### Pattern 1: LCARdS effects alongside a browser_mod popup

**browser_mod shows the information and the buttons; an LCARdS screen effect darkens and tints the screen behind them.**

```yaml
actions:
  - action: browser_mod.popup
    data:
      title: Security Alert
      content:
        type: entities
        entities:
          - binary_sensor.front_door
          - binary_sensor.hallway_motion
      right_button: Acknowledge
      right_button_action:
        service: browser_mod.close_popup
  - action: lcards.trigger_effect
    data:
      duration: 10000
      layers:
        backdrop:
          preset: blur
          amount: 10px
        color:
          preset: color-tint
          color: alpha(var(--lcars-alert-red), 0.3)
        canvas:
          preset: static
          opacity: 0.25
```

---

### Pattern 2: Full LCARS alert with browser_mod acknowledgement button

**LCARdS holds the alert; browser_mod's popup clears it when someone acknowledges.**

```yaml
actions:
  - action: lcards.red_alert
  - action: browser_mod.popup
    data:
      title: CONDITION RED
      content:
        type: markdown
        content: Motion detected at **Front Entrance**. Acknowledge to clear.
      right_button: Acknowledge & Clear
      right_button_action:
        service: lcards.clear_alert
      left_button: Keep Active
      left_button_close: true
      dismissable: false
```

---

### Pattern 3: Targeted effect on one device

**Both tools can act on one browser, each by its own id.**

::: warning Independent device IDs
The LCARdS device name and browser_mod's `BrowserID` are separate. To give a tablet the same name in both, open it once with both URL parameters: `?lcards_device=kitchen-tablet&BrowserID=kitchen-tablet`.
:::

```yaml
actions:
  - action: lcards.trigger_effect
    data:
      duration: 15000
      target_device_names:
        - kitchen-tablet
      layers:
        backdrop:
          preset: blur
          amount: 8px
        color:
          preset: color-tint
          color: alpha(var(--lcars-alert-red), 0.35)
  - action: browser_mod.popup
    data:
      title: Kitchen Timer
      content: Timer expired - check the oven!
      timeout: 15000
    target:
      browser_id:
        - kitchen-tablet
```

---

### Pattern 4: browser_mod activity sensor gating an LCARdS effect

**browser_mod's sensors tell you whether a tablet is in use; play the effect only then.**

```yaml
conditions:
  - condition: state
    entity_id: binary_sensor.kitchen_tablet_browser
    state: "on"
actions:
  - action: lcards.trigger_effect
    data:
      duration: 5000
      target_device_names:
        - kitchen-tablet
      layers:
        canvas:
          preset: glitch
          intensity: 0.5
```

---

### Pattern 5: Trigger LCARdS effects from browser_mod JavaScript

**browser_mod can run LCARdS's browser console API directly, with no round trip to the server.**

- `window.lcards.screenEffect.play()` plays one effect for a while; `window.lcards.screenEffect.applySlot()` keeps one on a layer until it is cleared. See the [console API](/core/effects/screen-effects#console-api).

```yaml
action: browser_mod.javascript
data:
  code: "window.lcards?.screenEffect?.play('static', { duration: 2000, opacity: 0.4 })"
```

As a card's `tap_action`:

```yaml
tap_action:
  action: fire-dom-event
  browser_mod:
    service: browser_mod.javascript
    data:
      code: "window.lcards?.screenEffect?.play('glitch', { duration: 1500 })"
```

An effect that stays until cleared:

```yaml
action: browser_mod.javascript
data:
  code: "window.lcards?.screenEffect?.applySlot('canvas', 'scanlines', { opacity: 0.2 })"
```

---

## Reference

### Service quick reference

**Which action to use for what.** The LCARdS ones are on the [Home Assistant Actions](./ha-actions) page.

| Intent | Action |
|---|---|
| Red alert everywhere | `lcards.red_alert` |
| Red alert on one device | `lcards.red_alert` with `target_device_names` |
| Screen blur, tint or canvas effect | `lcards.trigger_effect` |
| Clear screen effects | `lcards.clear_effect` |
| Clear the alert | `lcards.clear_alert` |
| A card over the whole screen | `lcards.show_portal_card` |
| A popup with buttons | `browser_mod.popup` |
| Navigate a browser | `browser_mod.navigate` |
| A toast notification | `browser_mod.notification` |
| Reload a browser | `lcards.reload` or `browser_mod.refresh` |
| Run JavaScript in a browser | `browser_mod.javascript` |
| Set a browser's Home Assistant theme | `browser_mod.set_theme` |

### Capability comparison

**What each tool can do.**

| | LCARdS | browser_mod |
|---|---|---|
| Full-screen visual overlay | Yes: backdrop, colour and canvas layers | Partly: a dialog, not a screen overlay |
| Recolouring the whole interface | Yes: alert modes shift every `--lcars-*` and `--lcards-*` colour | No |
| Backdrop filters and canvas animations | Yes | No |
| An alert state that lasts | Yes: `input_select.lcards_alert_mode` | No |
| Popup dialogs with buttons | Partly: an [alert overlay](../cards/alert-overlay/) card or [`lcards.show_portal_card`](./ha-actions#lcards-show-portal-card) can show any card | Yes |
| Browser navigation | No | Yes |
| Per-browser sensors | No | Yes: path, activity, battery, viewport and more |
| Screen on and off (Fully Kiosk) | No | Yes |
| Per-device and per-user targeting | Yes | Yes |
| Running JavaScript remotely | No | Yes: `browser_mod.javascript` |
