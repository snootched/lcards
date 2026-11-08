---
description: "LCARdS card sounds: which card events play a sound, the order a sound is chosen in, and the per-card sounds block that mutes a card or changes one event's sound."
moved_anchors:
  per-card-override-sounds: /core/sounds#event-sounds
  full-schema: /core/sounds#event-sounds
  override-a-specific-event: /core/sounds#event-sounds
  custom-tap-sound-muted-hold: /core/sounds#event-sounds
  mute-the-entire-card: /core/sounds#muting-a-card
  silent-card: /core/sounds#muting-a-card
  examples: /core/sounds#event-sounds
  slider-with-custom-drag-sounds: /core/sounds#slider-events
---

# Card Sounds

**LCARdS cards can play a sound when you tap, hold, double-tap or hover over them, toggle an entity or drag a slider.** The sounds come from the active sound scheme; a card's own `sounds` block mutes the card or changes the sound of one event, for that card only.

- Sounds are off until you turn them on: [Sound Configuration](../configuration/sounds.md) covers the helpers, schemes and the per-user and per-device settings.
- Without a `sounds` block a card plays the scheme's sounds. [Which cards fire which events](#which-cards-fire-which-events) lists the cards that play them.

## How card sounds work

**Each card event looks for its sound in a fixed order, and the first answer wins.**

1. **The master switch and the Cards switch.** With either one off, no card sound plays, whatever the card says.
2. **The card's `sounds` block.** `enabled: false` silences the card; an event key plays that sound, or nothing for `null`.
3. **Per-event overrides** from the Sound tab of the LCARdS Config Panel: a device's override beats a user's, which beats the global one.
4. **The active sound scheme's sound** for that event.
5. **Silence**, when none of these gives a sound.

## Muting a card

**`enabled: false` silences every sound this card plays.** Use it on a card you tap often, or one that should stay quiet while the rest of the dashboard plays sounds.

```yaml live
type: custom:lcards-button
entity: input_boolean.lcards_test_lights
preset: lozenge
text:
  name:
    show: true
sounds:
  enabled: false
```

::: details More about muting
- **Dialogs:** a `more-info` or `assist` action opens a Home Assistant dialog, and the dialog's own sound (More info open, Dialog open) still plays.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `sounds.enabled` | boolean | `true` | `false`: this card plays no sounds |

## Event sounds

**An event key in `sounds` plays another sound for that event on this card, or none for `null`.** The other events keep the scheme's sounds.

- A sound is an asset key (the name a sound pack gives a sound, such as `lcards_default_nav` or `computer_activate`), a `media-source://` id picked from the Home Assistant media library, or a URL (`/local/sounds/beep.mp3`). `schema/registries.json` on this site lists every built-in key under `sound_assets`.
- `toggle_on` and `toggle_off` play in place of the tap, hold or double-tap sound when that action is a `toggle`: `toggle_on` when the entity is `off`, `closed` or `locked`, `toggle_off` from any other state.

```yaml live
type: custom:lcards-button
entity: input_boolean.lcards_test_lights
preset: lozenge
text:
  name:
    show: true
# not a toggle action, so a tap plays card_tap (a toggle plays toggle_on or toggle_off)
tap_action:
  action: perform-action
  perform_action: input_boolean.toggle
  target:
    entity_id: input_boolean.lcards_test_lights
sounds:
  # another sound on a tap
  card_tap: lcards_default_nav
  # no sound on a hold
  card_hold: null
```

| Key | Type | Default | Description |
|---|---|---|---|
| `sounds.card_tap` | string / `null` | the scheme's | A tap |
| `sounds.card_hold` | string / `null` | the scheme's | A hold (a press of half a second) |
| `sounds.card_double_tap` | string / `null` | the scheme's | A double tap |
| `sounds.card_hover` | string / `null` | the scheme's | The mouse pointer moving onto the card. Not on touch screens |
| `sounds.toggle_on` | string / `null` | the scheme's | A `toggle` action turning the entity on |
| `sounds.toggle_off` | string / `null` | the scheme's | A `toggle` action turning the entity off |
| [Slider events](#slider-events) | | | `slider_drag_start`, `slider_change` and `slider_drag_end` |

### Slider events

**Three more events on the slider card: grabbing the slider, each change of value, and letting go.** They take the same values as the other event keys.

- `slider_change` is silent in the built-in `lcards_default` scheme, so the slider does not click on every step; give it a sound to hear each change.

```yaml live
type: custom:lcards-slider
entity: input_number.lcards_test_value
sounds:
  slider_drag_start: lcards_default_slider_grab
  slider_drag_end: lcards_default_slider_release
  # null keeps it silent under any scheme
  slider_change: null
```

| Key | Type | Default | Description |
|---|---|---|---|
| `sounds.slider_drag_start` | string / `null` | the scheme's | Grabbing the slider |
| `sounds.slider_change` | string / `null` | the scheme's (silent in `lcards_default`) | Each change of value |
| `sounds.slider_drag_end` | string / `null` | the scheme's | Letting go of the slider |

## Which cards fire which events

**Card sounds come with actions: a card plays the tap, hold and double-tap sounds where it runs those actions.** The slider events are the slider card's alone.

| Event | Cards |
|-------|-------|
| `card_tap` | Button, elbow, select menu options, data grid cells with actions, a slider with a `tap_action`, astrometrics points and on-card buttons |
| `card_hold` | Button, elbow, select menu options, data grid cells with actions, a slider with a `hold_action`, astrometrics points |
| `card_double_tap` | Button, elbow, select menu options, data grid cells with actions, a slider with a `double_tap_action` |
| `card_hover` | Button, elbow and select menu options (not with `interactive: false`), a slider with actions |
| `toggle_on`, `toggle_off` | Any of these whose action is a `toggle` |
| `slider_drag_start`, `slider_change`, `slider_drag_end` | Slider |

On a select menu, each option is a button: give `sounds` to an option, as on the [Select Menu options](../cards/select-menu/options.md) page.

## See also

- [Sound Configuration](../configuration/sounds.md): turning sounds on, schemes, and per-user and per-device overrides
- [Home Assistant Actions: `lcards.play_sound`](../configuration/ha-actions.md#lcards-play-sound): play a sound from an automation
- [Actions](actions.md): tap, hold and double-tap actions
