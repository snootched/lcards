---
description: "Alert overlay per-condition settings: different content, symbol text, screen effects, position, size, display and timeout for red, yellow, blue, black and gray alert."
---

# Per-Condition Settings

`conditions` gives one alert condition its own settings: its own message, effects, size or display.

## Condition keys

**Under `conditions`, each alert condition (`red_alert`, `yellow_alert`, `blue_alert`, `black_alert`, `gray_alert`) can override any of the card's settings for that alert.** All keys are optional: set only what you want to change.

- A condition you leave out, or list with no keys, uses the card's settings and the built-in symbol in its own colours.
- `dismiss_mode` is set on the card only; a condition can change only its `auto_dismiss_seconds`.

```yaml live
type: custom:lcards-alert-overlay
dismiss_mode: auto-reset
auto_dismiss_seconds: 60
conditions:
  red_alert:
    auto_dismiss_seconds: 15 # red alerts time out faster
    position: center
    width: 500px
    alert_button:
      text:
        sub_text:
          content: CONDITION RED - ALL HANDS TO BATTLE STATIONS
  yellow_alert:
    display: band
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `content` | object | - | A card to show instead of the symbol; overrides `alert_button` entirely. See [Content cards](./symbol#content-cards) |
| `alert_button` | object | - | Changes to the symbol, merged over the card's `alert_button`. Ignored when `content` is set. See [alert_button](./symbol#alert-button) |
| `layers` | object | the card's `layers` | Effect slots for this condition, over the card's; see [Layers per condition](#layers-per-condition) |
| `display` | string | the card's `display` | `overlay` or `band` for this condition; see [Alert Band](./band#per-condition-band) |
| `band` | object | the card's `band` | Band keys, merged over the card's `band` |
| `position` | string | the card's `position` | Where the symbol sits; see [Position](./overlay#position) |
| `width` | string | the card's `width` | Symbol or content width. SVG component cards (such as the built-in symbol) take their height from it |
| `height` | string | the card's `height` | Height, for a content card that can't size itself from its width |
| `auto_dismiss_seconds` | number | the card's value | Timeout for this condition, at least 1. Only used when the card's `dismiss_mode` is `auto-dismiss` or `auto-reset` |

## Layers per condition

**A condition's `layers` changes only the slots it lists; the others come from the card's `layers`.** Set a slot to `null` to turn it off for that condition.

- **Older configs:** a condition's own `backdrop` (`blur`, `opacity`, `color`, from older versions) sets that condition's `backdrop` and `color` slots, read as the card-level one is ([Layers](./overlay#layers)); its `canvas` still comes from the card. Slots in the condition's `layers` win over it, and the Alert Studio converts it to `layers` when you change a layer.

```yaml live
type: custom:lcards-alert-overlay
layers:
  backdrop:
    preset: blur
    amount: 8px
  canvas:
    preset: scanlines
conditions:
  red_alert:
    layers:
      # a red tint on top of the card's blur
      color:
        preset: color-tint
        color: alpha(theme:colors.alert.red, 0.35)
      # no scanlines for red alert
      canvas: null
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `layers.backdrop` | object or `null` | the card's | The [backdrop filter](./overlay#layers-backdrop) for this condition |
| `layers.color` | object or `null` | the card's | The [colour layer](./overlay#layers-color) for this condition |
| `layers.canvas` | object or `null` | the card's | The [canvas animation](./overlay#layers-canvas) for this condition |

## Putting it together

**A full setup: a blur and dark tint for every condition, and red, yellow and black alert each with their own message, width and effects.**

```yaml live
type: custom:lcards-alert-overlay
dismiss_mode: reset
position: center
layers:
  backdrop:
    preset: blur
    amount: 8px
  color:
    preset: color-tint
    color: alpha(var(--primary-background-color), 0.5)
conditions:
  # red: a heavier blur and a red tint
  red_alert:
    width: 500px
    layers:
      backdrop:
        preset: blur
        amount: 16px
      color:
        preset: color-tint
        color: alpha(theme:colors.alert.red, 0.35)
    content:
      type: custom:lcards-button
      component: alert
      preset: condition_red
      text:
        alert_text:
          content: ALERT
        sub_text:
          content: CONDITION RED - ALL HANDS TO BATTLE STATIONS
  # yellow: the card's blur, a yellow tint
  yellow_alert:
    width: 500px
    layers:
      color:
        preset: color-tint
        color: alpha(theme:colors.alert.yellow, 0.3)
    content:
      type: custom:lcards-button
      component: alert
      preset: condition_yellow
      text:
        alert_text:
          content: ALERT
        sub_text:
          content: CONDITION YELLOW
  # black: a heavy blur, nearly dark
  black_alert:
    width: 500px
    layers:
      backdrop:
        preset: blur
        amount: 20px
      color:
        preset: color-tint
        color: alpha(var(--primary-background-color), 0.7)
    content:
      type: custom:lcards-button
      component: alert
      preset: condition_black
      text:
        alert_text:
          content: ALERT
        sub_text:
          content: CONDITION BLACK - SILENT RUNNING
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| [Condition keys](#condition-keys) | | | `content`, `alert_button`, `layers`, `display`, `band`, `position`, `width`, `height`, `auto_dismiss_seconds` |
