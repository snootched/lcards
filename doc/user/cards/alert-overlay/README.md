# Alert Overlay Card

`custom:lcards-alert-overlay`

The Alert Overlay card reacts to the `input_select.lcards_alert_mode` helper and displays a full-screen backdrop and content card whenever the system enters an alert state. It is a **singleton infrastructure card** — add one instance to every dashboard that should show overlays, place it last in the view so it stacks above other cards, and leave it alone. It has no visual presence when the alert mode is `green_alert` or `default`.

```
green_alert / default  →  overlay is hidden
red_alert              →  full-screen red backdrop + content card
yellow_alert           →  full-screen yellow backdrop + content card
blue_alert             →  full-screen blue backdrop + content card
black_alert            →  full-screen dark backdrop + content card
gray_alert             →  full-screen grey backdrop + content card
```

---

## Prerequisites

The `input_select.lcards_alert_mode` helper entity must exist in Home Assistant. This is created automatically when the LCARdS helper pack is installed, or can be created manually with the options: `green_alert`, `red_alert`, `yellow_alert`, `blue_alert`, `black_alert`, `gray_alert`, `default`.

---

## Quick Start

```yaml
# Minimal — add this to every dashboard that should react to alert modes
type: custom:lcards-alert-overlay
```

The built-in defaults display an LCARS shield symbol styled for the active condition with appropriate colours and animations.

---

## Placement

Add the card as the last item in a Lovelace view. The overlay renders in a portal attached to `document.body` rather than inside the card slot, so it always covers the full viewport regardless of where in the grid the card element sits.

```yaml
views:
  - cards:
      - type: custom:lcards-button
        # ... your other cards ...
      - type: custom:lcards-alert-overlay   # ← last card in the view
        dismiss_mode: reset
```

---

## Top-Level Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | — | `custom:lcards-alert-overlay` (required) |
| `dismiss_mode` | string | `dismiss` | What happens when the user taps the backdrop — see [Dismiss](#dismiss) |
| `position` | string | `center` | Where to place the content card within the overlay — see [Position](#position) |
| `width` | string | `auto` | Global content card width (CSS value, e.g. `400px`, `50vw`) |
| `height` | string | `auto` | Global content card height (CSS value) |
| `backdrop` | object | — | Global backdrop styling — see [Backdrop](#backdrop) |
| `conditions` | object | — | Per-condition overrides — see [Conditions](#conditions) |

---

## Backdrop

Controls the visual treatment applied over the dashboard when the overlay is active. The backdrop is rendered in two layers: a `backdrop-filter` blur layer (which blurs what's behind) and a separate tint layer (which applies a translucent colour wash). This split is required so that blur and opacity don't interact in a way that defeats both effects.

```yaml
backdrop:
  blur: 8px               # CSS length — how much to blur the content behind the overlay
  opacity: 0.6            # 0–1 — opacity of the colour tint layer
  color: rgba(0,0,0,0.5)  # Background colour of the tint layer
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `blur` | string | `8px` | CSS `backdrop-filter: blur()` value |
| `opacity` | number | `0.6` | Tint layer opacity (0–1) |
| `color` | string | `rgba(0,0,0,0.5)` | Tint layer background colour |

> **Color values**: Only CSS values work here — hex, `rgb()`, `rgba()`, or `var(--css-variable)`. Theme tokens (`theme:palette.moonlight`) are not supported for backdrop config because the overlay is rendered outside the LCARdS card hierarchy. Use `var(--lcards-*)` variables for alert-mode-aware colours.

---

## Position

Where within the viewport the content card is placed.

| Value | Description |
|-------|-------------|
| `center` | Centred horizontally and vertically (default) |
| `top`, `top-center` | Horizontally centred, pinned to top |
| `top-left` | Top-left corner |
| `top-right` | Top-right corner |
| `left`, `left-center` | Vertically centred, pinned to left |
| `right`, `right-center` | Vertically centred, pinned to right |
| `bottom`, `bottom-center` | Horizontally centred, pinned to bottom |
| `bottom-left` | Bottom-left corner |
| `bottom-right` | Bottom-right corner |

---

## Dismiss

When the user taps the backdrop tint:

| `dismiss_mode` | Behaviour |
|----------------|-----------|
| `dismiss` | Hides the overlay on this dashboard only. Alert mode stays active — other dashboards still show overlays. The overlay will reappear if the mode changes again. |
| `reset` | Hides the overlay **and** calls `input_select.select_option` to set `lcards_alert_mode` back to `green_alert`, clearing the alert system-wide. |

---

## Conditions

Override any default for a specific alert mode. All keys are optional — only specify what you want to change.

```yaml
conditions:
  red_alert:
    content: ...         # Custom content card config
    backdrop:
      blur: 12px
      opacity: 0.75
      color: rgba(180,0,0,0.35)
    position: center
    width: 500px
    height: auto
```

Condition keys: `red_alert`, `yellow_alert`, `blue_alert`, `black_alert`, `gray_alert`.

### Per-Condition Options

| Option | Type | Description |
|--------|------|-------------|
| `content` | object | Full HA card config to render inside the overlay. Any card type works. Overrides `alert_button` entirely. |
| `alert_button` | object | Patch merged onto the default alert button — override only the fields you need. See [Default Alert Button Overrides](#default-alert-button-overrides). |
| `backdrop` | object | Backdrop overrides merged on top of the global `backdrop` setting |
| `position` | string | Position override for this condition |
| `width` | string | Content card width override |
| `height` | string | Content card height override |

---

## Content Cards

The `content` value inside a condition is a standard HA card config. Any card type can be used — it is instantiated and mounted exactly as it would be on a normal dashboard. LCARdS cards have full support for templates, entities, actions, and animations.

```yaml
conditions:
  red_alert:
    content:
      type: custom:lcards-button
      component: alert
      preset: condition_red
      text:
        alert_text:
          content: INTRUDER ALERT
        sub_text:
          content: SECURITY TEAM TO MAIN BRIDGE
```

If no `content` is specified for a condition, a built-in default is used: the LCARS alert shield symbol (`lcards-button` with `component: alert`) styled for that condition:

| Condition | Default preset |
|-----------|---------------|
| `red_alert` | `condition_red` |
| `yellow_alert` | `condition_yellow` |
| `blue_alert` | `condition_blue` |
| `black_alert` | `condition_black` |
| `gray_alert` | `condition_gray` |

---

## Default Alert Button Overrides

The `alert_button` key lets you patch specific fields on the built-in default alert button **without having to supply a full `content:` block**. Only specify the fields you want to change — `type`, `component`, and `preset` are inherited from the built-in default automatically.

This is the "middle tier" between no customisation and a full `content:` override:

```
_getDefaultContent(condition)          ← floor: built-in preset + hardcoded text
  ↑ deepMerge
conditions.<key>.alert_button          ← user delta: text, colors, etc.
  ↑ replaced entirely by
conditions.<key>.content               ← full card config override (existing)
```

> **Note**: `alert_button` is ignored when `content` is also present. `content` always takes full precedence.

### Supported `alert_button` sub-keys

| Key | Type | Description |
|-----|------|-------------|
| `text` | object | Text field overrides — mirrors the `text` property of `lcards-button` |
| `text.alert_text.content` | string | Override the top alert label (default: `ALERT`) |
| `text.sub_text.content` | string | Override the sub-text message. Supports static strings and LCARdS templates. |
| `alert` | object | Alert component config overrides — e.g. `alert.color.shape`, `alert.color.bars` |

### Static text override

```yaml
conditions:
  blue_alert:
    alert_button:
      text:
        sub_text:
          content: SECURITY LOCKDOWN IN PROGRESS
```

### Entity-driven message via `input_text.lcards_alert_message`

Wire the sub-text to the `input_text.lcards_alert_message` helper so automations can set the alert message dynamically:

```yaml
conditions:
  blue_alert:
    alert_button:
      text:
        sub_text:
          content: "{{states('input_text.lcards_alert_message')}}"
```

Set the message from an automation or script:

```yaml
action: call-service
service: input_text.set_value
service_data:
  entity_id: input_text.lcards_alert_message
  value: SECURITY LOCKDOWN IN PROGRESS
```

Or combine with a JS template for a fallback when the message is empty:

```yaml
conditions:
  blue_alert:
    alert_button:
      text:
        sub_text:
          content: '[[[
            const msg = hass.states["input_text.lcards_alert_message"]?.state;
            return msg?.trim() || "CONDITION: BLUE";
          ]]]'
```

---

## Examples

### Minimal — built-in defaults for everything

```yaml
type: custom:lcards-alert-overlay
```

---

### Custom backdrop for all conditions

```yaml
type: custom:lcards-alert-overlay
dismiss_mode: reset
backdrop:
  blur: 12px
  opacity: 0.65
  color: rgba(0,0,0,0.4)
```

---

### Corner notification (non-blocking position)

```yaml
type: custom:lcards-alert-overlay
position: top-right
width: 380px
backdrop:
  blur: 0px
  opacity: 0
  color: transparent
conditions:
  red_alert:
    content:
      type: custom:lcards-button
      preset: lozenge
      text:
        name:
          content: RED ALERT
      style:
        card:
          color:
            background:
              default: var(--lcards-orange-dark)
```

Note: Setting `opacity: 0` and `color: transparent` disables the tint. Setting `blur: 0px` disables the blur. This gives a pure notification card in a corner with no overlay treatment on the rest of the dashboard.

---

### Per-condition content and backdrop

```yaml
type: custom:lcards-alert-overlay
dismiss_mode: reset
position: center
backdrop:
  blur: 8px
  opacity: 0.6
  color: rgba(0,0,0,0.5)

conditions:
  red_alert:
    width: 500px
    backdrop:
      blur: 16px
      opacity: 0.75
      color: rgba(180,0,0,0.35)
    content:
      type: custom:lcards-button
      component: alert
      preset: condition_red
      text:
        alert_text:
          content: ALERT
        sub_text:
          content: CONDITION RED — ALL HANDS TO BATTLE STATIONS

  yellow_alert:
    width: 500px
    backdrop:
      color: rgba(180,160,0,0.3)
    content:
      type: custom:lcards-button
      component: alert
      preset: condition_yellow
      text:
        alert_text:
          content: ALERT
        sub_text:
          content: CONDITION YELLOW

  black_alert:
    width: 500px
    backdrop:
      blur: 20px
      opacity: 0.85
      color: rgba(0,0,0,0.7)
    content:
      type: custom:lcards-button
      component: alert
      preset: condition_black
      text:
        alert_text:
          content: ALERT
        sub_text:
          content: CONDITION BLACK — SILENT RUNNING
```

---

## Limitations

- **No theme tokens in backdrop config** — `theme:palette.moonlight` and similar token paths are not evaluated for `backdrop.color`. Use explicit CSS values or `var(--lcards-*)` / `var(--lcars-*)` CSS variables instead.
- **Single instance per dashboard** — each card element creates its own portal and overlay. If you add multiple instances to the same view you will get stacked overlays.
- **Not targetable by the rules engine** — the overlay does not extend `LCARdSCard` and has no card ID or tags. Rules cannot target it. The content card *inside* the overlay does support rules if it is an `lcards-*` card type.

---

## Triggering Alert Modes

Set the `input_select.lcards_alert_mode` helper from:

```yaml
# In an action, automation, or script
action: call-service
service: input_select.select_option
service_data:
  entity_id: input_select.lcards_alert_mode
  option: red_alert    # red_alert | yellow_alert | blue_alert | black_alert | gray_alert | green_alert
```

Or from the browser console:

```javascript
window.lcards.setAlertMode('red_alert')   // Set alert
window.lcards.setAlertMode('green_alert') // Clear alert
```

---

## Related

- [Alert Mode System](../../core/themes/alert-modes.md)
- [Button Card](../button/README.md)
- [Templates](../../core/templates/README.md)
