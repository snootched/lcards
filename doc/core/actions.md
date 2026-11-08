---
description: "LCARdS card actions: tap_action, hold_action and double_tap_action with toggle, perform-action, navigate, more-info, url and assist, plus hover effects and the cursor."
moved_anchors:
  action-object-options: /core/actions#action-keys
  hover-effects-cursor: /core/actions#hover-and-cursor
  double-tap-disambiguation: /core/actions#tap-hold-and-double-tap
---

# Actions

**What a card does when you tap it, hold it or double-tap it: toggle a light, run any Home Assistant action, open a dashboard, a page or a dialog.** Actions follow Home Assistant's own action model, so YAML from Home Assistant's cards works here too.

- A card takes up to three actions: `tap_action`, `hold_action` and `double_tap_action`. Each is an object whose `action` key picks what happens.
- The button, elbow, slider, select menu, data grid and astrometrics cards take actions; each card's page says where on the card they apply.

## Quick start

**A button that raises a red alert when tapped and clears it when held.** Try it here: the alert recolours this page.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  label:
    content: RED ALERT
    show: true
# tap: raise a red alert
tap_action:
  action: perform-action
  perform_action: lcards.red_alert
# hold: back to normal
hold_action:
  action: perform-action
  perform_action: lcards.clear_alert
```

## Action types

**The `action` key picks what happens: toggle the entity, run an action, open a dashboard, a page or a dialog, or nothing.**

- `toggle` picks its service as Home Assistant's own cards do: from `off`, `closed` or `locked` it turns the entity on, from any other state off.
- `none` is how to stop a card's default: a button toggles its entity on a tap until its `tap_action` says otherwise.

```yaml live
type: custom:lcards-button
entity: input_boolean.lcards_test_lights
preset: lozenge
text:
  name:
    show: true
tap_action:
  action: toggle
```

| `action` | What it does |
|----------|--------------|
| `toggle` | Toggle the entity. Locks unlock and lock, covers and valves open and close, buttons are pressed, scenes are turned on |
| `perform-action` | Run a Home Assistant action: name it in `perform_action` and give its data in `data` |
| `call-service` | The older name for `perform-action` |
| `more-info` | Open Home Assistant's more-info dialog for the entity |
| `navigate` | Go to another dashboard or view (`navigation_path`) |
| `url` | Open an address in a new browser tab (`url_path`) |
| `assist` | Open Home Assistant's Assist dialog |
| `fly-to`, `set-clock`, `set-model-scale` | Move the camera, the scene date or the model size of an astrometrics card: see [Scene actions](/cards/astrometrics/points#scene-actions) |
| `none` | Do nothing, in place of the card's default |

::: details More about toggle
- **Groups** toggle through Home Assistant's `homeassistant` domain (`homeassistant.turn_on`, `homeassistant.turn_off`).
- **An entity with no state yet** gets its domain's own `toggle` action (`light.toggle`).
:::

## Action keys

**The keys of an action object, besides `action`: which entity it acts on, what to run, and where to go.**

- `target` and `data` are merged into one set of data for the action. A key in both takes the value from `target`.
- The older names `service` and `service_data` still work. When an action sets both an old and a new name, the old one wins.

```yaml live
type: custom:lcards-button
entity: input_boolean.lcards_test_doors
preset: lozenge
text:
  name:
    show: true
# tap: turn the doors on
tap_action:
  action: perform-action
  perform_action: input_boolean.turn_on
  target:
    entity_id: input_boolean.lcards_test_doors
# hold: turn them off
hold_action:
  action: perform-action
  perform_action: input_boolean.turn_off
  target:
    entity_id: input_boolean.lcards_test_doors
```

| Key | Type | Default | Description |
|---|---|---|---|
| `action` | string | required | What happens: see [Action types](#action-types) |
| `entity` | string | the card's entity | The entity `toggle` and `more-info` act on |
| `perform_action` | string | - | `perform-action`: the action to run, as `domain.action` (`light.turn_on`) |
| `service` | string | - | The older name for `perform_action` |
| `data` | object | - | `perform-action`: the action's data (`brightness_pct: 50`) |
| `service_data` | object | - | The older name for `data` |
| `target` | object | - | `perform-action`: what the action acts on |
| `target.entity_id` | string / list | - | Entity ids to act on |
| `target.device_id` | string / list | - | Device ids to act on |
| `target.area_id` | string / list | - | Area ids to act on |
| `navigation_path` | string | - | `navigate`: the dashboard path, starting with `/` (`/lovelace/bridge`). Required |
| `url_path` | string | - | `url`: the address to open. Required |
| `pipeline_id` | string | `preferred` | `assist`: the Assist pipeline to use |
| `start_listening` | boolean | `true` | `assist`: start listening as soon as the dialog opens |
| [Scene action keys](/cards/astrometrics/points#scene-actions) | | | `card`, `view`, `point`, `duration`, `warp`, `date`, `rate` and `model_scale` for the astrometrics actions |

## Tap, hold and double-tap

**When each of the three actions runs.** A hold is a press of half a second; a double tap is two taps close together.

- A hold runs `hold_action` after 500 ms, and the tap that would follow when you let go is skipped.
- When a card has a `double_tap_action`, a single tap waits 300 ms for a second tap before it runs `tap_action`. A card without one runs its tap at once.
- Each action can name its own `entity`, so one card can control several things.

```yaml live
type: custom:lcards-button
entity: input_boolean.lcards_test_lights
preset: lozenge
text:
  name:
    show: true
# tap: the lights
tap_action:
  action: toggle
# double tap: the doors
double_tap_action:
  action: toggle
  entity: input_boolean.lcards_test_doors
```

| Key | Type | Default | Description |
|---|---|---|---|
| `tap_action` | object | `toggle` on a button, none on an elbow or slider | What a tap does. The select menu, data grid and astrometrics pages give their own defaults |
| `hold_action` | object | - | What a press held for 500 ms does |
| `double_tap_action` | object | - | What two taps within 300 ms do |

## Hover and cursor

**The button and elbow cards change colour and can animate when the mouse pointer is over them, and show a hand cursor.** Two card-level keys (not keys of an action) turn that off or change the cursor.

### interactive

**`interactive: false` makes a button or elbow decorative: no hover colour, no hover animations and the arrow cursor.** Use it for a label or panel that should not look clickable.

- Tap, hold and double-tap actions still run on a card with `interactive: false`.
- The hover sound (`card_hover`, see [Card Sounds](/core/sounds)) does not play either.

```yaml live
type: custom:lcards-button
entity: input_boolean.lcards_test_lights
preset: lozenge
# decorative: no hand cursor or hover effects
interactive: false
text:
  name:
    show: true
# still runs on a tap
tap_action:
  action: toggle
```

| Key | Type | Default | Description |
|---|---|---|---|
| `interactive` | boolean | `true` | `false`: no hover colour, hover animations or hover sound, and the arrow cursor. Actions still run |

### style.cursor

**The mouse cursor over a button or elbow, whatever `interactive` says.** Use it for hover effects with another cursor shape, or for the hand cursor on a decorative card.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  label:
    content: TARGET
    show: true
style:
  cursor: crosshair
```

| Key | Type | Default | Description |
|---|---|---|---|
| `style.cursor` | string | `pointer`, or `default` with `interactive: false` | Any CSS cursor: `pointer`, `default`, `none`, `not-allowed`, `crosshair`, `grab`, `zoom-in`, `help`, `wait`, `progress`, `move`, `copy`, `text` |
