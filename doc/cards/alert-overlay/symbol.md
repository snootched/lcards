---
description: "Alert overlay symbol and content: change the built-in alert symbol's text, colours and speed with alert_button, show a message from a helper, or replace the symbol with your own card."
---

# Symbol and Content

What the alert shows in the middle: the built-in alert symbol, changed as little or as much as you like, or a card of your own.

## alert_button

**`alert_button` changes the built-in alert symbol without replacing it: set only what you want to change, and it is merged over the symbol.** Use it for your own message, a different text colour or size, or a faster bar sweep.

- Without a `content` card each condition shows the built-in symbol: an `lcards-button` with the `alert` component, its condition's preset for the colours, and the text `ALERT` over `CONDITION: RED` (and so on).
- `alert_button` on the card changes the symbol for every condition; `conditions.<key>.alert_button` changes it for one condition, merged over the card's; `conditions.<key>.content` replaces the symbol entirely, and `alert_button` is ignored for that condition.
- Any `lcards-button` key can be changed: text fields (`content`, `color`, `font_size`, ...), `style`, `animations`, `sounds` and the rest. `type`, `component` and `preset` stay fixed, so each condition keeps its own colours.

```text
built-in symbol (the condition's preset and text)
  ← alert_button                    (every condition)
    ← conditions.<key>.alert_button (this condition)
conditions.<key>.content            (replaces all of it)
```

```yaml live
type: custom:lcards-alert-overlay
alert_button:
  text:
    sub_text:
      content: ALL HANDS TO BATTLE STATIONS
  alert:
    color:
      shape: var(--lcars-orange)
```

::: details More about alert_button
- **Merging:** objects merge key by key, so a text field keeps the settings you don't change. A list (such as `animations`) in a condition's `alert_button` replaces the card's list rather than adding to it.
- **In the Alert Studio:** the Config tab's **Alert symbol** section edits the card's `alert_button`, and each condition picks **Alert symbol** (as it is), **Customise the symbol** (its `alert_button`, in the symbol's own button editor) or **Your own card** (`content`). The studio saves only what you change.
- **More keys:** the [alert component](/cards/button/components#alert) lists the symbol's own settings and text fields.
:::

| Condition | Preset | Text |
|-----------|--------|------|
| `red_alert` | `condition_red` | `ALERT`, `CONDITION: RED` |
| `yellow_alert` | `condition_yellow` | `ALERT`, `CONDITION: YELLOW` |
| `blue_alert` | `condition_blue` | `ALERT`, `CONDITION: BLUE` |
| `black_alert` | `condition_black` | `ALERT`, `CONDITION: BLACK` |
| `gray_alert` | `condition_gray` | `ALERT`, `CONDITION: GRAY` |

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `alert_button` | object | - | Changes to the symbol for every condition: any `lcards-button` key except `type`, `component` and `preset` |
| `alert_button.text.alert_text` | object | `content: ALERT` | The top label: `content` and any text field setting (`color`, `font_size`, ...) |
| `alert_button.text.sub_text` | object | `content: CONDITION: RED` and so on | The message: `content` (static text or a template) and any text field setting |
| `alert_button.alert.color.shape` | colour | the condition colour | Fill of the shield |
| `alert_button.alert.color.bars` | colour | the condition colour | Colour of the bars |
| `alert_button.speed` | number | `1` | Bar sweep speed, 0.25 to 4 (`2` is twice as fast). In band mode it follows `band.speed` unless set |
| `conditions.<key>.alert_button` | object | - | Changes for one condition, over the card's `alert_button`. Ignored when the condition has `content` |

### One message for every condition

**Set the message once in the card's `alert_button`, and override it for a condition that needs its own.** Every condition shows the message in its own colours.

```yaml live
type: custom:lcards-alert-overlay
alert_button:
  text:
    sub_text:
      content: ALL HANDS TO BATTLE STATIONS
      font_size: 22
conditions:
  blue_alert:
    alert_button:
      text:
        sub_text:
          content: SECURITY LOCKDOWN IN PROGRESS
```

Blue alert shows its own message, still at size 22, because the condition's `sub_text` is merged over the card's.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| [alert_button keys](#alert-button) | | | `text.sub_text`, `text.alert_text`, `alert`, `speed` |

### A message from a helper

**Point the message at the `input_text.lcards_alert_message` helper, so an automation can set the words when it raises the alert.** Create the helper from the LCARdS Config Panel ([Helpers](/configuration/persistent-helpers)).

```yaml live
type: custom:lcards-alert-overlay
conditions:
  blue_alert:
    alert_button:
      text:
        sub_text:
          content: "{{ states('input_text.lcards_alert_message') }}"
```

Set the message in an automation or script before raising the alert:

```yaml
action: input_text.set_value
target:
  entity_id: input_text.lcards_alert_message
data:
  value: SECURITY LOCKDOWN IN PROGRESS
```

A JavaScript template can fall back to the usual text when the message is empty:

```yaml live
type: custom:lcards-alert-overlay
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

::: details More about messages
- **When templates are read:** a Jinja template (`{{ }}` or `{% %}`) is worked out by Home Assistant once, when the alert shows. A JavaScript template (`[[[ ]]]`) or a token (`{entity.state}`) is worked out by the button itself, so it follows the helper while the alert is up.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| [alert_button keys](#alert-button) | | | `text.sub_text.content` takes static text or a template |

## Content cards

**`conditions.<key>.content` shows a card of your own for that condition instead of the symbol.** Any card type works: it is created and mounted as it would be on a dashboard, and LCARdS cards keep their templates, entities, actions and animations.

- The alert symbol as content (`component: alert`) is sized like the built-in one; any other card keeps its own height unless you set `height` ([Size](./overlay#size)).

```yaml live
type: custom:lcards-alert-overlay
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

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `conditions.<key>.content` | object | the built-in symbol | A full card config (`type` required) shown for this condition. Replaces the symbol and its `alert_button` |
