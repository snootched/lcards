# Using LCARdS with browser_mod

LCARdS and [browser_mod](https://github.com/thomasloven/hass-browser_mod) are complementary — LCARdS handles full-screen graphical alerts and theme transforms, browser_mod handles popups, navigation, and device sensors. They work side-by-side without conflict.

::: info No dependency
LCARdS works fully without browser_mod installed. Everything here is optional.
:::

---

## Integration Patterns

### Pattern 1 — LCARdS effects alongside a browser_mod popup

Use browser_mod for the information/button layer; LCARdS for the visual atmosphere:

```yaml alternatives
action:
  - service: browser_mod.popup
    data:
      title: "⚠ Security Alert"
      content:
        type: entities
        entities:
          - sensor.front_door
          - sensor.motion_hall
      right_button: Acknowledge
      right_button_action:
        service: browser_mod.close_popup

  - service: lcards.trigger_effect
    data:
      layers:
        backdrop: { preset: blur, amount: 10px }
        color: { preset: color-tint, color: rgba(180, 0, 0, 0.3) }
        canvas: { preset: static, opacity: 0.25 }
      duration: 10000
```

---

### Pattern 2 — Full LCARS alert with browser_mod acknowledgement button

LCARdS owns the persistent alert state; browser_mod provides the confirm dialog:

```yaml
action:
  - service: lcards.red_alert

  - service: browser_mod.popup
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

### Pattern 3 — Targeted effect on one device

::: warning Independent device IDs
`lcards_device_id` and browser_mod's `BrowserID` are separate identifiers. To use the same name in both, set it at the URL:
`?lcards_device=kitchen-tablet&BrowserID=kitchen-tablet`
:::

```yaml alternatives
action:
  - service: lcards.trigger_effect
    data:
      layers:
        backdrop: { preset: blur, amount: 8px }
        color: { preset: color-tint, color: rgba(180, 0, 0, 0.35) }
      duration: 15000
      target_device_ids:
        - kitchen-tablet

  - service: browser_mod.popup
    data:
      title: "Kitchen Timer"
      content: "Timer expired — check the oven!"
      timeout: 15000
    target:
      browser_id:
        - kitchen-tablet
```

---

### Pattern 4 — browser_mod activity sensor gating an LCARdS effect

Only fire the effect on a tablet that is actively in use:

```yaml
condition:
  - condition: state
    entity_id: binary_sensor.kitchen_tablet_browser
    state: "on"

action:
  - service: lcards.trigger_effect
    data:
      layers:
        canvas: { preset: glitch, intensity: 0.5 }
      duration: 5000
      target_device_ids:
        - kitchen-tablet
```

---

### Pattern 5 — Trigger LCARdS effects from browser_mod JavaScript

No server round-trip — runs entirely in the browser:

```yaml alternatives
service: browser_mod.javascript
data:
  code: window.lcards?.screenEffect?.play('static', { duration: 2000, opacity: 0.4 })
```

As a card `tap_action`:

```yaml alternatives
tap_action:
  action: fire-dom-event
  browser_mod:
    service: browser_mod.javascript
    data:
      code: window.lcards?.screenEffect?.play('glitch', { duration: 1500 })
```

Persistent slot effect (stays until cleared):

```yaml alternatives
service: browser_mod.javascript
data:
  code: window.lcards?.core?.screenEffectManager?.applySlot('canvas', 'scanlines', { opacity: 0.2 })
```

---

## Reference

### Service quick reference

| Intent | Service |
|---|---|
| Global red alert | `lcards.red_alert` |
| Targeted alert (one device) | `lcards.red_alert` + `target_device_ids` |
| Screen blur / canvas effect | `lcards.trigger_effect` |
| Clear screen effects | `lcards.clear_effect` |
| Clear alert state | `lcards.clear_alert` |
| Informational popup with buttons | `browser_mod.popup` |
| Navigate browser | `browser_mod.navigate` |
| Toast notification | `browser_mod.notification` |
| Reload browser | `lcards.reload` / `browser_mod.refresh` |
| Run JS in browser | `browser_mod.javascript` |
| Set HA theme on browser | `browser_mod.set_theme` |

### Capability comparison

| | LCARdS | browser_mod |
|---|---|---|
| Full-screen visual overlay | ✅ Portal with backdrop/color/canvas slots | ⚠️ `<ha-dialog>` — not a screen portal |
| Global theme transform | ✅ HSL rewrite of `--lcars-*` and `--lcards-*` vars | ❌ |
| Backdrop filter / canvas animations | ✅ | ❌ |
| Persistent alert state | ✅ `input_select.lcards_alert_mode` | ❌ Transient |
| Popup dialogs with buttons | ⚠️ Only via `alert-overlay` card on dashboard (it attaches to the portal) | ✅ |
| Browser navigation | ❌ | ✅ |
| Per-browser device sensors | ❌ | ✅ path, activity, battery, viewport… |
| Screen on/off (FullyKiosk) | ❌ | ✅ |
| Per-device / per-user targeting | ✅ | ✅ |
| Remote JS execution | ❌ | ✅ `browser_mod.javascript` |
