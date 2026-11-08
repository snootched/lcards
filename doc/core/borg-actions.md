---
description: "The lcards.borg_assimilate and lcards.borg_deassimilate actions: start and end the Borg assimilation from automations, scripts and buttons, on every browser or only some."
---

# Borg Actions

**The `lcards.borg_assimilate` and `lcards.borg_deassimilate` actions start and end the [Borg assimilation](/core/borg) from automations, scripts, dashboard buttons and the Developer Tools Actions panel.** Without targeting they reach every connected browser.

- The assimilation runs in each browser that is connected when the action fires. It is not stored: a reload, or a browser opened later, shows the normal dashboard, so a reload also ends it.
- [Borg Assimilation](/core/borg) explains what happens and the layers format; the [console API](/core/borg#console-api) takes the same options in camelCase.

## lcards.borg_assimilate

**`lcards.borg_assimilate` starts the assimilation; its fields tune the intro, the transition, the font, the sound and the effects left after the intro.** With no fields, the intro waits for a click and the default effects follow it.

- The flat intro fields (`site_count` to `overrun`) are shortcuts for `intro_layers.canvas`. When both are given, the keys in `intro_layers.canvas` win and the flat fields fill the rest.
- `intro_layers.canvas` takes the [intro.canvas](/core/borg#intro-canvas) keys in camelCase or snake_case (`site_count`, `tendrils_per_site`, `tendril_length`, `particle_count`, `glow_color`, `cube_style`). There `cube` is `true` or `false`, and `cubeStyle` picks the style.
- `intro_layers` and `persistent_layers` are maps, not lists; [Layers format](/core/borg#layers-format) describes them.

```yaml live
# On this page: the classic cube, auto-dismissed after 8 seconds
type: custom:lcards-button
preset: lozenge
text:
  name:
    content: ASSIMILATE
    show: true
tap_action:
  action: perform-action
  perform_action: lcards.borg_assimilate
  data:
    intro_duration: 8000
    cube: classic
```

The examples below run from an automation or a script:

```yaml
# Every browser; the intro waits for a click
action: lcards.borg_assimilate
```

```yaml
# Auto-dismiss after 12 seconds, with a gentle fade
action: lcards.borg_assimilate
data:
  intro_duration: 12000
  transition_style: fade_only
```

```yaml
# More injection sites, denser tendrils, longer reach
action: lcards.borg_assimilate
data:
  site_count: 12
  tendrils_per_site: 14
  tendril_length: 900
  particle_count: 3
```

```yaml
# No cube, gentler corruption, the dashboard still visible behind the front
action: lcards.borg_assimilate
data:
  cube: none
  corruption: 0.2
  overrun: 0.3
```

```yaml
# Flat shortcuts plus a blurred backdrop for the intro
action: lcards.borg_assimilate
data:
  intro_duration: 10000
  site_count: 12
  intro_layers:
    backdrop:
      preset: blur
      amount: 6px
```

```yaml
# Only the colours and the font: no effects after the intro
action: lcards.borg_assimilate
data:
  suppress_persistent: true
```

```yaml
# A colour tint only after the intro
action: lcards.borg_assimilate
data:
  persistent_layers:
    color:
      preset: color-tint
      color: alpha(var(--lcars-green), 0.2)
```

::: details More about lcards.borg_assimilate
- **No effects after the intro:** `persistent_layers: {}` does the same as `suppress_persistent: true`.
- **Palette hue:** the action has no hue field; the console's `paletteHue` and the Config Panel's Connectivity tab set one.
- **Ranges:** values outside a field's range are refused by Home Assistant with an error, before anything reaches a browser.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `intro_duration` | number | - | Ends the intro after this many ms, 1000 to 60000. Without it the intro waits for a click; a click still ends it earlier |
| `site_count` | number | `8` | Injection sites on the screen, 1 to 20 |
| `tendrils_per_site` | number | `5` | Tendrils per injection site, 1 to 20 |
| `tendril_length` | number | `600` | Longest tendril reach in pixels, 100 to 1200 |
| `particle_count` | number | `2` | Nano-probe particles per tendril, 0 to 6; `0` turns them off |
| `renderer` | string | `auto` | `auto` or `webgl`: the WebGL intro where the browser supports it; `canvas`: the [classic intro](/core/borg#classic-intro) |
| `cube` | string | `detailed` | WebGL intro: `detailed` (solid cube with machinery, lattice, glows and halo), `classic` (wireframe) or `none` (no cube) |
| `corruption` | number | `0.5` | WebGL intro: signal corruption strength, 0 to 1; `0` turns it off |
| `overrun` | number | `0.65` | WebGL intro: darkness behind the assimilation front, 0 to 1 |
| `transition_style` | string | `blur_fade` | Palette transition: `blur_fade`, `flash`, `fade_only` or `off` |
| `font_swap` | boolean | `true` | `false` keeps the dashboard font; everything else still runs |
| `sound` | string | the `borg_assimilate` [sound event](/core/borg#sounds) | A sound for this call: a file URL (`/local/sounds/borg.mp3`), a media library id or a sound asset key; `none` for silence |
| `suppress_persistent` | boolean | `false` | `true` leaves no effects after the intro. Ignored when `persistent_layers` is set |
| `intro_layers` | map | - | Layers for the intro, merged slot by slot with the defaults; see [Layers format](/core/borg#layers-format) |
| `persistent_layers` | map | - | Layers kept after the intro, replacing the defaults; wins over `suppress_persistent` |
| [Targeting](#targeting) | | | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

## lcards.borg_deassimilate

**`lcards.borg_deassimilate` restores the dashboard: a short glitch outro, then the normal colours, font and screen.** A browser that is not assimilated ignores it.

```yaml
# Every browser, with the default glitch outro
action: lcards.borg_deassimilate
```

```yaml
# At once, with no outro
action: lcards.borg_deassimilate
data:
  with_outro: false
```

```yaml
# A shorter, stronger glitch
action: lcards.borg_deassimilate
data:
  outro_layers:
    canvas:
      preset: glitch
      duration: 800
      intensity: 0.6
  revert_transition_style: fade_only
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `with_outro` | boolean | `true` | `false` restores at once, with no outro and no wait |
| `outro_layers` | map | glitch on `canvas` for 1200 ms | Outro layers, replacing the default. The longest `duration` in them sets the wait, at least 1200 ms. See [glitch](/core/effects/screen-effects#glitch) |
| `revert_transition_style` | string | `fade_only` | Palette transition back to normal: `fade_only`, `flash`, `blur_fade` or `off` |
| `sound` | string | the `borg_deassimilate` [sound event](/core/borg#sounds) | A sound for this call, as for `lcards.borg_assimilate` |
| [Targeting](#targeting) | | | `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` |

## Targeting

**The targeting fields limit either action to some devices or users; without them every connected browser runs it.** They work as on every other `lcards.*` action.

- A browser runs the action when its device or its user is in the lists.
- The Borg never writes `input_select.lcards_alert_mode`, targeted or not, so other browsers keep their alert mode.
- A name that matches no device or user leaves its list empty; with every list empty, the action goes to every browser.
- [Users & Devices](/configuration/users-devices) shows each browser's device name and id; `window.lcards.targeting.getMyIds()` in the browser console returns them too.

```yaml
# Only the living room TV
action: lcards.borg_assimilate
data:
  intro_duration: 10000
  target_device_names:
    - Living Room TV
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `target_device_ids` | list | all devices | Browser device ids (the `lcards_device_id` each browser stores) |
| `target_device_names` | list | all devices | Device display names, set in the LCARdS Config Panel or with `?lcards_device=`, any case. A name shared by several devices matches all of them |
| `target_user_ids` | list | all users | Home Assistant user ids |
| `target_user_names` | list | all users | Home Assistant user display names, any case |

## In an automation

**An automation can assimilate on a schedule and restore after a delay.** This one assimilates every browser at 20:00 on Halloween night and restores them 30 minutes later.

```yaml
alias: Halloween Borg mode
triggers:
  - trigger: time
    at: "20:00:00"
conditions:
  - condition: template
    value_template: "{{ now().month == 10 and now().day == 31 }}"
actions:
  - action: lcards.borg_assimilate
    data:
      intro_duration: 10000
  - delay:
      minutes: 30
  - action: lcards.borg_deassimilate
```
