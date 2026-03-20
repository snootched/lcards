# Alert Mode

Alert Mode gives LCARdS coordinated, dashboard-wide visual states that match the classic Star Trek red/yellow alert experience.

Alert mode is more than a colour change — it shifts the entire dashboard UI together:

- **Theme colours transform** — the whole HA UI palette shifts; hues, saturation, and token values rotate to match the alert level across every element on screen. All transform parameters are fully configurable per alert mode via the **Alert Mode Lab** in the LCARdS Config Panel.
- **Sound plays** — the Sound Manager fires the matching alert audio scheme automatically.
- **Alert Overlay activates** — the `lcards-alert-overlay` card reacts and displays its full-screen backdrop and content card for the triggered alert condition.
- **Rules-driven animations** — cards and MSD overlays can be configured to pulse, flash, or animate when a specific alert level is active. This is opt-in via the Rules Engine, not automatic.
- **HA helpers stay in sync** — the `input_select.lcards_alert_mode` helper always reflects the current state, so HA automations can both trigger and react to alert level changes.

---

## Alert Levels

| Level | Description |
|-------|-------------|
| `green` | Normal operation — default state |
| `yellow` | Caution / yellow alert |
| `red` | Red alert — maximum urgency |
| `blue` | Blue alert (specific condition) |
| `gray` | Reduced / standby mode |
| `black` | Black alert |

---

## Triggering Alert Mode

Alert mode can be triggered from multiple places:

:::: tabs
=== Card Action

Set a tap action on any card to call the `input_select.select_option` service:

```yaml
tap_action:
  action: call-service
  service: input_select.select_option
  service_data:
    entity_id: input_select.lcards_alert_mode
    option: red_alert
```

=== HA Automation

Use the helper in any automation:

```yaml
action:
  - service: input_select.select_option
    data:
      entity_id: input_select.lcards_alert_mode
      option: yellow_alert
```

=== Browser Console

Use the `window.lcards.alert` console API from the browser dev tools:

```javascript
// Mode shortcuts
window.lcards.alert.red();
window.lcards.alert.yellow();
window.lcards.alert.blue();
window.lcards.alert.gray();
window.lcards.alert.black();
window.lcards.alert.off();       // Reset to normal (green)

// Set / get by mode name
window.lcards.alert.set('red_alert');
window.lcards.alert.get();       // → 'red_alert'

// Live parameter tuning (see also Alert Mode Lab)
window.lcards.alert.config.setParam('red_alert', 'saturationMultiplier', 1.5, true);
await window.lcards.alert.config.getTransform('red_alert');
await window.lcards.alert.config.reset('red_alert', true);
await window.lcards.alert.config.export();  // Export runtime overrides as JSON
```

> Root-level shortcuts `window.lcards.redAlert()`, `.yellowAlert()` etc. still exist and are kept for backward compatibility.

=== Config Panel

Click any alert level button in the **Alert Mode Lab** tab of the LCARdS Config Panel.

::::
---

## Required Helper

Alert mode requires the `input_select.lcards_alert_mode` helper to be defined in Home Assistant.

The easiest way to create it is via the **Helpers** tab in the LCARdS Config Panel (one click to create all required helpers). Alternatively, add the following to `configuration.yaml`:

```yaml
input_select:
  lcards_alert_mode:
    name: LCARdS Alert Mode
    options:
      - green_alert
      - yellow_alert
      - red_alert
      - blue_alert
      - gray_alert
      - black_alert
    initial: green_alert
    icon: mdi:alert
```

::: tip
The **Helpers** tab in the Config Panel creates all LCARdS helpers — including this one — in a single click.
:::

---

## Configuring Alert Appearance

### Alert Mode Lab

The **Alert Mode Lab** tab in the LCARdS Config Panel is the primary tool for configuring how each alert level looks and behaves:

- Colour palette transforms — adjust hue rotation, saturation shift, and lightness for the full dashboard palette per alert level
- Preview transforms live before saving
- Configure sounds per alert level

### Alert Overlay Card

The `lcards-alert-overlay` card provides the full-screen backdrop and content card. Place one instance on any dashboard view where you want overlay behaviour:

```yaml
type: custom:lcards-alert-overlay
backdrop:
  blur: 4px
  tint_color: "rgba(255, 0, 0, 0.15)"
content_card:
  position: center
  width: 400px
```

See [Alert Overlay Card](/cards/alert-overlay/) for the full configuration reference.

### Rules-Driven Animations

Cards can be configured to animate when specific alert levels are active. This is done through the Rules Engine rather than automatically. Example:

```yaml
rules:
  - conditions:
      - entity: input_select.lcards_alert_mode
        state: red_alert
    apply:
      animation: pulse_red
    targets:
      tags: [status-indicator]
```

See [Rules Engine](rules/) for the full condition and apply reference.
