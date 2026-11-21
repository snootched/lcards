---
description: "Every lcards.* Home Assistant action: alert modes, screen effects, sounds, astrometrics camera and clock, portal cards, the Borg, page reload and log level, with their fields, defaults and device or user targeting."
moved_anchors:
  cycle-through-alert-modes-on-a-button-press: /configuration/ha-actions#set-the-alert-mode-from-a-helper
  enable-debug-logging-when-a-dev-mode-flag-is-set: /configuration/ha-actions#debug-logging-while-a-dev-mode-switch-is-on
  subtle-chime-when-a-kiosk-tablet-wakes: /configuration/ha-actions#a-soft-chime-when-a-kiosk-tablet-wakes
  borg-mode-assimilate-all-browsers-auto-revert-after-30-minutes: /configuration/ha-actions#borg-mode-for-30-minutes
---

# Home Assistant Actions

**LCARdS adds Home Assistant actions under the `lcards` domain, so automations, scripts, voice assistants and dashboard buttons can raise alerts, play effects and sounds, move an astrometrics camera and more.** They appear wherever Home Assistant lists actions: the automation and script editors, **Developer Tools > Actions**, and the REST and WebSocket APIs.

- Each action reaches every browser that has a dashboard open, or only the devices and users you [target](#targeting).
- The examples on this page are plain YAML for an automation's or script's actions (or **Developer Tools > Actions** in YAML mode): actions can't run as live cards on this site. A dashboard button runs one with `tap_action: action: perform-action`.
- Home Assistant checks every field before anything reaches a browser: a value out of range, or a missing required field, fails the action with an error.

| Group | Actions |
|-------|---------|
| [Alert Mode](#alert-mode-actions) | `lcards.set_alert_mode`, `lcards.red_alert`, `lcards.yellow_alert`, `lcards.blue_alert`, `lcards.gray_alert`, `lcards.black_alert`, `lcards.clear_alert` |
| [Screen Effects](#screen-effect-actions) | `lcards.trigger_effect`, `lcards.clear_effect` |
| [Sound](#sound-actions) | `lcards.play_sound` |
| [Astrometrics](#astrometrics-actions) | `lcards.fly_to`, `lcards.set_clock` |
| [Portal Overlay](#portal-overlay-actions) | `lcards.show_portal_card`, `lcards.clear_portal_card` |
| [Borg Assimilation](#borg-assimilation-actions) | `lcards.borg_assimilate`, `lcards.borg_deassimilate` |
| [Frontend Control](#frontend-control-actions) | `lcards.reload`, `lcards.set_log_level` |

---

## Targeting {#targeting}

**Four optional fields send an action to some devices or users only; without them it reaches every connected browser.** Every `lcards.*` action takes them, in any combination.

- A browser acts when its device or its user is in the lists. Device names and user names are matched in any case, and a name shared by several devices matches all of them.
- If the fields are set but match no device and no user (a typo in a name, say), the action fails with an error instead of reaching every browser. A list that matches only some of its names acts on the ones it matches.
- [Users & Devices](./users-devices) shows each browser's device name and id; `window.lcards.targeting.getMyIds()` in the browser console returns them too.

```yaml
# Red alert on the kitchen tablet only
action: lcards.red_alert
data:
  target_device_names:
    - Kitchen Tablet
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `target_device_ids` | list | every device | Browser device ids (the `lcards_device_id` each browser keeps in `localStorage`) |
| `target_device_names` | list | every device | Device display names, set in **LCARdS Config > Users & Devices** or with `?lcards_device=` |
| `target_user_ids` | list | every user | Home Assistant user ids |
| `target_user_names` | list | every user | Home Assistant user display names |

---

## Alert Mode Actions

**The alert actions change the [alert mode](../core/alert-mode): the colours, the alert sound and any [alert overlay](../cards/alert-overlay/) on the page.** Without targeting they set `input_select.lcards_alert_mode`, so every browser follows and the mode survives reloads.

- With [targeting](#targeting) the helper is not changed: only the matched browsers change their alert mode, until they reload or the helper changes.
- Without targeting the actions need the `input_select.lcards_alert_mode` helper: create it in **LCARdS Config > Helpers** (see [Persistent Helpers](./persistent-helpers#alert-mode)).

### lcards.set_alert_mode

**Sets any alert mode by name.** Use it when the mode comes from a template or a helper.

```yaml
action: lcards.set_alert_mode
data:
  mode: red_alert
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `mode` | string | required | `red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert` or `green_alert` |
| [Targeting](#targeting) | - | every browser | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

### Shortcut actions

**One action per alert mode, with no fields but the targeting ones.** `lcards.clear_alert` returns to normal.

| Action | Effect |
|--------|--------|
| `lcards.red_alert` | Red alert |
| `lcards.yellow_alert` | Yellow alert |
| `lcards.blue_alert` | Blue alert |
| `lcards.gray_alert` | Gray alert |
| `lcards.black_alert` | Black alert |
| `lcards.clear_alert` | Back to normal (`green_alert`) |

```yaml
action: lcards.red_alert
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| [Targeting](#targeting) | - | every browser | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

---

## Screen Effect Actions

**Full-screen effects over the dashboard, in three independent layers: `backdrop` (a CSS filter on the page), `color` (a colour over it) and `canvas` (an animation).** [Screen Effects](/core/effects/screen-effects) describes every preset and its settings.

### lcards.trigger_effect

**Plays one or more screen effect layers, until cleared or for a set time.** Each layer in `layers` takes a `preset` and that preset's settings.

- A layer left out of `layers` keeps whatever it shows; a layer set to `null` is cleared.
- `duration` clears the layers this call set after that many milliseconds; each layer keeps its own timer, so a later call is never cut short by an earlier one. Without it the effect stays until [`lcards.clear_effect`](#lcards-clear-effect).
- An alert overlay, the connection overlay or a portal card with `layers` replaces only the layers it sets, and clears only its own when it closes, so an effect from this action on another layer keeps running.

```yaml
# A red-tinted blur, until cleared
action: lcards.trigger_effect
data:
  layers:
    backdrop:
      preset: blur
      amount: 12px
    color:
      preset: color-tint
      color: alpha(var(--lcars-alert-red), 0.35)
```

```yaml
# TV static for 5 seconds
action: lcards.trigger_effect
data:
  duration: 5000
  layers:
    canvas:
      preset: static
      opacity: 0.4
```

```yaml
# All three layers, on one device
action: lcards.trigger_effect
data:
  target_device_names:
    - Kitchen Tablet
  layers:
    backdrop:
      preset: grayscale
      amount: 80%
    color:
      preset: vignette
      opacity: 0.5
    canvas:
      preset: scanlines
      opacity: 0.3
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `layers` | object | required | A map of layers: `backdrop`, `color` and `canvas`, each a `preset` with its settings, or `null` to clear it |
| `duration` | number | until cleared | Clear the layers this call sets after this many ms, at least `100` |
| [Targeting](#targeting) | - | every browser | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

The presets for each layer, with their main settings:

| Layer | Preset | Main settings |
|-------|--------|---------------|
| `backdrop` | `blur` | `amount` (`8px`) |
| `backdrop` | `grayscale` | `amount` (`100%`) |
| `backdrop` | `saturate` | `amount` (`200%`) |
| `backdrop` | `contrast` | `amount` (`200%`) |
| `backdrop` | `hue-rotate` | `angle` (`180deg`) |
| `color` | `color-tint` | `color` |
| `color` | `vignette` | `opacity` (`0.7`) |
| `canvas` | `static` | `opacity`, `scale` |
| `canvas` | `pixelate` | `opacity`, `pixelSize` |
| `canvas` | `glitch` | `opacity`, `intensity` |
| `canvas` | `scanlines` | `opacity`, `lineHeight`, `scroll` |

### lcards.clear_effect

**Clears one screen effect layer, or all of them.**

```yaml
# Clear every layer on every browser
action: lcards.clear_effect
```

```yaml
# Clear only the backdrop layer, on one device
action: lcards.clear_effect
data:
  slot: backdrop
  target_device_names:
    - Kitchen Tablet
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `slot` | string | every layer | `backdrop`, `canvas` or `color` |
| [Targeting](#targeting) | - | every browser | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

---

## Sound Actions

### lcards.play_sound

**Plays a sound, without changing the alert mode, the theme or the screen.** Use it for a soft chime when a kiosk tablet wakes, or a beep when a door opens.

- `event_type` plays the sound each browser has for that event (its own per-event sound, else its scheme's), and the event's [sound category](./sounds#enabling-sounds) switch applies.
- `asset_key` plays one exact sound whatever the scheme says: a sound asset key (**LCARdS Config > Sounds** lists them), a file URL such as `/local/sounds/chime.mp3`, or a `media-source://` id. Only the master switch applies.
- Give one of the two: a call with neither is refused. If both are given, `asset_key` wins. A browser whose master switch (`input_boolean.lcards_sound_enabled`) is off stays silent. [Sound Configuration](./sounds) has the schemes and the per-user and per-device settings.

```yaml
# The "notification" sound, as each browser has it set up
action: lcards.play_sound
data:
  event_type: notification
```

```yaml
# One exact sound on one tablet
action: lcards.play_sound
data:
  asset_key: lcards_default_system_ready
  target_device_names:
    - Kitchen Tablet
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `event_type` | string | - | One of the 27 event keys in [What Events Are Covered](./sounds#what-events-are-covered), such as `notification`, `card_tap` or `alert_red` |
| `asset_key` | string | - | A sound asset key, a file URL or a `media-source://` id |
| [Targeting](#targeting) | - | every browser | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

---

## Astrometrics Actions

**Move the camera or set the clock of an [astrometrics card](/cards/astrometrics/) from an automation**, for example to show the front door on the wall panel when the doorbell rings. The card needs an `id`; every open dashboard showing that card follows, unless you target devices or users.

### lcards.fly_to

**Flies the card's camera to one of its named views or to one of its points.** Give a `view` or a `point`; with both, `point` wins, and with neither the action fails.

- From another LCARdS card on the same dashboard, the `fly-to` card action does the same without a round trip: see [Fly-to from other cards](/cards/astrometrics/data#fly-to-from-other-cards-and-automations).

```yaml
# Show the front door on every dashboard with the house map
action: lcards.fly_to
data:
  card_id: house_map
  point: front_door
```

```yaml
# The sector overview on the bridge tablet, slowly, with warp streaks
action: lcards.fly_to
data:
  card_id: galaxy
  view: sector
  duration: 4000
  warp: true
  target_device_names:
    - Bridge Tablet
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `card_id` | string | required | The astrometrics card's `id` |
| `view` | string | - | A named view of the card (`camera.views`) |
| `point` | string | - | A point id of the card; the camera flies to it as a tap on it would |
| `duration` | number | the card's `camera.fly_duration` | Flight time in ms, `0` to `60000` |
| `warp` | boolean | the view's `warp`, else the card's `camera.warp` | `true`: stars and dust streak on the way; `false`: they don't |
| [Targeting](#targeting) | - | every browser | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

### lcards.set_clock

**Sets the card's [scene date](/cards/astrometrics/scale#the-scene-clock) and how fast it runs: where its real planets and moons are, and how they are turned.** Give a `date`, a `rate` or both (with neither the action fails); the one you leave out keeps running as it was.

- From another LCARdS card, the `set-clock` card action does the same: see [the scene clock](/cards/astrometrics/scale#the-scene-clock).

```yaml
# Show the planets on the date in a helper, held still
action: lcards.set_clock
data:
  card_id: sol
  date: "{{ states('input_datetime.lcards_test_date') }}"
  rate: 0
```

```yaml
# Back to now, running an hour a second
action: lcards.set_clock
data:
  card_id: sol
  date: now
  rate: 1 h/s
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `card_id` | string | required | The astrometrics card's `id` |
| `date` | string | keeps running | `now`, or an ISO date and time (`2026-10-30`, `2026-10-30T12:00:00Z`). A date and time helper's state works too (local time) |
| `rate` | string / number | unchanged | Days per second (`1` a day a second, `0` holds it, negative runs back), `live` for real time, or with a unit as the time slider shows it: `1 h/s`, `30 d/s`, `1 y/s` (units `s`, `min`, `h`, `d`, `w`, `mo`, `y`) |
| [Targeting](#targeting) | - | every browser | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

---

## Portal Overlay Actions

**Show any Home Assistant card over the whole screen of the connected browsers, with screen effects behind it if you like.** The card has its own layer: it doesn't disturb an [alert overlay](../cards/alert-overlay/) or the [connection overlay](./connectivity), and they don't disturb it. For popups with buttons, see [Using browser_mod](./browser-mod).

### lcards.show_portal_card

**Shows a card in the portal overlay, until cleared, dismissed or for a set time.**

```yaml
# A light button over a blurred, darkened screen for 10 seconds
action: lcards.show_portal_card
data:
  content:
    type: custom:lcards-button
    entity: light.bridge
  position: center
  width: 360px
  duration: 10000
  layers:
    backdrop:
      preset: blur
      amount: 8px
    color:
      preset: color-tint
      color: alpha(var(--lcars-black), 0.5)
```

```yaml
# A markdown note on one device, until cleared
action: lcards.show_portal_card
data:
  content:
    type: markdown
    content: "# Alert!\nDoor opened."
  target_device_names:
    - Kitchen Tablet
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `content` | object | required | Any card config (`type: custom:lcards-button`, `type: entities` ...) |
| `layers` | object | none | Screen effect layers behind the card, as in [`lcards.trigger_effect`](#lcards-trigger-effect) |
| `position` | string | `center` | `center`, `top`, `top-left`, `top-right`, `bottom`, `bottom-left`, `bottom-right`, `left` or `right` |
| `width` | string | `auto` | CSS width of the card's box: `400px`, `40vw`, `auto` |
| `height` | string | `auto` | CSS height of the card's box: `300px`, `30vh`, `auto` |
| `duration` | number | until cleared | Close it after this many ms, at least `100` |
| `dismiss` | boolean | `true` | A click on the backdrop closes it |
| [Targeting](#targeting) | - | every browser | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

### lcards.clear_portal_card

**Takes away the card shown by `lcards.show_portal_card`.** Alert and connection overlays stay.

```yaml
# Clear it on one device only
action: lcards.clear_portal_card
data:
  target_device_names:
    - Kitchen Tablet
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| [Targeting](#targeting) | - | every browser | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

---

## Borg Assimilation Actions

**Start and end the [Borg assimilation](/core/borg) from automations.** It is not stored: a reload, or a browser opened later, shows the normal dashboard, so a reload also ends it. [Borg Actions](/core/borg-actions) has more examples.

### lcards.borg_assimilate

**Starts the assimilation; its fields tune the intro, the transition, the font, the sound and the effects left after the intro.** With no fields, the intro waits for a click and the default effects follow it.

- The flat intro fields (`site_count` to `overrun`) are shortcuts for `intro_layers.canvas`. When both are given, the keys in `intro_layers.canvas` win; they may be camelCase or snake_case.
- The Borg never writes `input_select.lcards_alert_mode`, targeted or not.

```yaml
# Every browser; the intro waits for a click
action: lcards.borg_assimilate
```

```yaml
# Auto-dismiss after 12 seconds, more and longer tendrils, palette and font only afterwards
action: lcards.borg_assimilate
data:
  intro_duration: 12000
  transition_style: fade_only
  site_count: 12
  tendrils_per_site: 14
  tendril_length: 900
  suppress_persistent: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `intro_duration` | number | wait for a click | End the intro after this many ms, `1000` to `60000`; a click still ends it earlier |
| `site_count` | number | `8` | Injection sites on the screen, `1` to `20` |
| `tendrils_per_site` | number | `5` | Tendrils per injection site, `1` to `20` |
| `tendril_length` | number | `600` | Longest tendril reach in pixels, `100` to `1200` |
| `particle_count` | number | `2` | Nano-probe particles per tendril, `0` to `6`; `0` turns them off |
| `renderer` | string | `auto` | `auto` or `webgl`: the WebGL intro where the browser supports it; `canvas`: the [classic intro](/core/borg#classic-intro) |
| `cube` | string | `detailed` | WebGL intro: `detailed` (solid cube with machinery), `classic` (wireframe) or `none` |
| `corruption` | number | `0.5` | WebGL intro: signal corruption strength, `0` to `1`; `0` turns it off |
| `overrun` | number | `0.65` | WebGL intro: darkness behind the assimilation front, `0` to `1` |
| `transition_style` | string | `blur_fade` | Palette transition: `blur_fade`, `flash`, `fade_only` or `off` |
| `font_swap` | boolean | `true` | `false` keeps the dashboard font; everything else still runs |
| `sound` | string | the `borg_assimilate` [sound event](/core/borg#sounds) | A file URL (`/local/sounds/borg.mp3`), a `media-source://` id or a sound asset key; `none` for silence |
| `suppress_persistent` | boolean | `false` | `true` leaves no effects after the intro. Ignored when `persistent_layers` is set |
| `intro_layers` | object | - | Layers for the intro, merged slot by slot with the defaults; see [Layers format](/core/borg#layers-format) |
| `persistent_layers` | object | - | Layers kept after the intro, replacing the defaults; `{}` keeps none. Wins over `suppress_persistent` |
| [Targeting](#targeting) | - | every browser | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

### lcards.borg_deassimilate

**Restores the dashboard: a short glitch outro, then the normal colours, font and screen.** A browser that is not assimilated ignores it.

```yaml
# At once, with no outro
action: lcards.borg_deassimilate
data:
  with_outro: false
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `with_outro` | boolean | `true` | `false` restores at once, with no outro and no wait |
| `outro_layers` | object | glitch on `canvas` for 1200 ms | Outro layers, replacing the default. The longest `duration` in them sets the wait, at least 1200 ms |
| `revert_transition_style` | string | `fade_only` | Palette transition back to normal: `fade_only`, `flash`, `blur_fade` or `off` |
| `sound` | string | the `borg_deassimilate` [sound event](/core/borg#sounds) | A sound for this call, as for `lcards.borg_assimilate` |
| [Targeting](#targeting) | - | every browser | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

---

## Frontend Control Actions

**Reload dashboards, or change how much LCARdS logs, from an automation.** Useful for troubleshooting and for kiosks nobody stands at.

### lcards.reload

**Reloads the page in every matched browser tab, at once.** Use it after updating LCARdS or changing a resource.

::: warning
The page reloads immediately: anyone using that dashboard loses what they were doing.
:::

```yaml
# Reload one device
action: lcards.reload
data:
  target_device_names:
    - Kitchen Tablet
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| [Targeting](#targeting) | - | every browser | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

### lcards.set_log_level

**Changes how much LCARdS writes to the browser console and the Home Assistant log, at once and with no reload.** Use `debug` while chasing a problem, then go back to `warn`.

- The browser level changes in the matched tabs only. The Home Assistant log level is one for the whole server, so it changes whatever the targeting says.
- The level lasts until the page reloads; the integration's **Log level** option sets the lasting one (see [Integration options](../getting-started/installation#integration-options)).

```yaml
action: lcards.set_log_level
data:
  level: debug
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `level` | string | required | `off`, `error`, `warn`, `info`, `debug` or `trace` |
| [Targeting](#targeting) | - | every browser | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

---

## Automation Examples

### Red alert on motion

```yaml
alias: Red alert on motion
triggers:
  - trigger: state
    entity_id: binary_sensor.hallway_motion
    to: "on"
actions:
  - action: lcards.red_alert
```

### Set the alert mode from a helper

```yaml
# input_select.ship_condition is your own helper, with alert mode names as its options
alias: Alert mode from a helper
triggers:
  - trigger: state
    entity_id: input_select.ship_condition
actions:
  - action: lcards.set_alert_mode
    data:
      mode: "{{ states('input_select.ship_condition') }}"
```

### Debug logging while a dev mode switch is on

```yaml
alias: LCARdS debug on dev mode
triggers:
  - trigger: state
    entity_id: input_boolean.lcards_dev_mode
actions:
  - action: lcards.set_log_level
    data:
      level: "{{ 'debug' if is_state('input_boolean.lcards_dev_mode', 'on') else 'warn' }}"
```

### A soft chime when a kiosk tablet wakes

```yaml
alias: Tablet wake chime
triggers:
  - trigger: state
    entity_id: binary_sensor.hallway_motion
    to: "on"
actions:
  # your existing screen-wake action first
  - action: rest_command.fully_kiosk_wake_screen
  - action: lcards.play_sound
    data:
      event_type: notification
      target_device_names:
        - Kitchen Tablet
```

### Borg mode for 30 minutes

```yaml
alias: Borg mode
triggers:
  - trigger: time
    at: "20:00:00"
actions:
  - action: lcards.borg_assimilate
    data:
      intro_duration: 10000
  - delay:
      minutes: 30
  - action: lcards.borg_deassimilate
```

---

## From AI agents

**An AI agent connected to Home Assistant (through the Model Context Protocol server, a voice assistant, or the REST or WebSocket API) can drive LCARdS with the same actions.** They are ordinary `lcards.*` actions, so anything that can call a Home Assistant action can raise an alert, run a screen effect, play a sound or show a portal card.

- Every action and its fields is on this page; `services.yaml` in the integration carries the same descriptions, so agents that read the action list see them too.
- Without [targeting](#targeting) fields an action reaches every connected browser. Agents should target a device or user when the request is about one screen.
- To change what a dashboard looks like (rather than trigger something on it), an agent edits dashboard YAML instead. Point it at the [JSON Schemas and the config checker](/getting-started/ai-assistance) so it only writes keys LCARdS has.

---

## Related

- [Borg Actions](/core/borg-actions) and [Borg Assimilation](/core/borg): more Borg examples, the layers format and the console API
- [Screen Effects](/core/effects/screen-effects): every preset for the `layers` of `trigger_effect`, `show_portal_card` and the Borg actions
- [Sound Configuration](./sounds): the events, schemes and per-user and per-device settings `play_sound` uses
- [Users & Devices](./users-devices): how device ids and names are set
- [Alert Mode](../core/alert-mode) and the [Alert Mode Lab](./alert-mode-lab): what the alert actions change
