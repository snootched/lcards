---
description: "Every Home Assistant helper LCARdS uses (alert mode, sounds, Alert Mode Lab colours, HA-LCARS sizing) with its type, default and purpose, how to create them from the Config Panel or by hand, and how automations use them."
moved_anchors:
  alert-mode-lab-parameters-auto-managed: /configuration/persistent-helpers#alert-mode-lab-parameters
---

# Persistent Helpers

**LCARdS keeps its shared settings in ordinary Home Assistant helpers: the alert mode, the sound switches and volume, each alert mode's colours, and the HA-LCARS sizes.** They survive restarts, show up as entities, and automations can read and change them.

- LCARdS works without them, with built-in defaults; a feature whose helper is missing simply can't be changed or saved.
- Settings that are not helpers (per-user and per-device settings, per-event sounds, the connection overlay) are kept by the integration: see [Users & Devices](./users-devices).

::: tip Create helpers from the Config Panel
Open **LCARdS Config > Helpers** and click **Create All**: every missing helper is created and given its default value. See [the Helpers tab](./index.md#helpers).
:::

---

## Helper Reference

### Alert Mode

**The alert mode itself, and how it behaves.** Shown in the Helpers tab under **Alert Lab Configuration**.

| Helper | Type | Default | Description |
|--------|------|---------|-------------|
| `input_select.lcards_alert_mode` | `input_select` | `green_alert` | The active alert mode: `green_alert`, `red_alert`, `yellow_alert`, `blue_alert`, `gray_alert` or `black_alert`. See [Alert Mode](../core/alert-mode) |
| `input_boolean.lcards_alert_mode_auto_switch` | `input_boolean` | off | On: a dashboard that opens during an alert shows it from the start. Changes to the alert mode always apply |
| `input_text.lcards_alert_message` | `input_text` | empty | A message an alert overlay can show, up to 255 characters: see [A message from a helper](../cards/alert-overlay/symbol#a-message-from-a-helper) |
| `input_select.lcards_alert_transition_style` | `input_select` | `off` | The screen transition when the alert mode changes: `off`, `blur_fade`, `fade_only`, `flash`, `color_bleed`, `flicker`, `static` or `wipe` |

### Sound

**The master sound switch, the three sound categories, the volume and the sound scheme.** Shown under **Sound System**. See [Sound Configuration](./sounds).

| Helper | Type | Default | Description |
|--------|------|---------|-------------|
| `input_boolean.lcards_sound_enabled` | `input_boolean` | off | Master switch: no LCARdS sound plays while it is off or missing |
| `input_boolean.lcards_sound_cards` | `input_boolean` | on | Card sounds: taps, holds, sliders, toggles |
| `input_boolean.lcards_sound_ui` | `input_boolean` | on | Home Assistant navigation sounds: sidebar, views, dialogs, edit mode |
| `input_boolean.lcards_sound_alerts` | `input_boolean` | on | Alert mode and system sounds |
| `input_number.lcards_sound_volume` | `input_number` | `0.5` | Volume for every sound, `0` to `1` |
| `input_select.lcards_sound_scheme` | `input_select` | `none` | The active sound scheme. Its options fill in as sound packs load |

### HA-LCARS Theme Helpers (optional)

**Sizes and switches the [HA-LCARS](https://github.com/th3jesta/ha-lcars) theme reads.** Only useful with an HA-LCARS theme. Shown under **HA-LCARS Theme Settings**.

| Helper | Type | Default | Description |
|--------|------|---------|-------------|
| `input_number.lcars_horizontal` | `input_number` | `30` | Width of the horizontal borders, `6` to `60` |
| `input_number.lcars_vertical` | `input_number` | `40` | Width of the vertical borders, `26` to `60` |
| `input_number.lcars_elbow_angle` | `input_number` | `45` | The diagonal cut angle of elbow corners, `1` to `89` degrees. Elbow segments set to **Theme Binding** follow it live |
| `input_number.lcars_menu_font` | `input_number` | `14` | Sidebar menu font size, `8` to `24` px |
| `input_boolean.lcars_sound` | `input_boolean` | off | HA-LCARS's own button and tap sounds |
| `input_boolean.lcars_texture` | `input_boolean` | off | HA-LCARS's grain pattern and backlight effect |
| `sensor.lcars_header` | template sensor | - | Text in the clock area of the HA-LCARS header. Can't be created from the panel: add the template sensor below to `configuration.yaml` |

### Alert Mode Lab Parameters

**How each alert mode recolours the dashboard: one set of `input_number` helpers per mode, named `input_number.lcards_alert_lab_<mode>_<parameter>`.** The [Alert Mode Lab](./alert-mode-lab) writes them with **Save to helpers**; **Create All** in the Helpers tab creates them first (saving fails while they are missing). Shown under **Alert Lab Configuration**.

- `<mode>` is `red`, `yellow`, `blue`, `gray` or `black`: for example `input_number.lcards_alert_lab_red_hue`.
- Saturation and lightness are stored as percentages: `140` is 1.4 times.

| Parameter | Modes | Range | Description |
|-----------|-------|-------|-------------|
| `hue` | all | `0` to `360` | The hue colours are turned toward, degrees |
| `hue_strength` | all | `0` to `1` | How far colours turn toward `hue` |
| `saturation` | all | `0` to `300` (`200` for gray and black) | Saturation, percent |
| `lightness` | all | `0` to `200` | Lightness, percent |
| `center_hue` | red, yellow, blue | `0` to `360` | Centre of the hue band colours are pulled into, degrees |
| `range` | red, yellow, blue | `0` to `180` | Half-width of that band, degrees |
| `strength` | red, yellow, blue | `0` to `1` | How strongly colours are pulled into the band |
| `threshold` | black | `0` to `100` | The lightness that splits dark colours from light ones |
| `dark_multiplier` | black | `0` to `2` | Multiplies the lightness of colours below the threshold |
| `light_multiplier` | black | `0` to `2` | Multiplies the lightness of colours above the threshold |

The defaults for each mode are on the [Alert Mode Lab](./alert-mode-lab#defaults) page.

---

## Manual YAML Setup

**You can define the helpers in `configuration.yaml` instead of creating them from the panel.** Use the same entity ids; restart Home Assistant (or reload the helpers) afterwards.

- Without an `initial` value Home Assistant starts an `input_boolean` off and an `input_number` at its minimum; the YAML below gives each helper the panel's default, so the sound categories start on and the volume at half.
- The Alert Mode Lab helpers are easiest to create with **Create All**.

### Alert Mode

```yaml
input_select:
  lcards_alert_mode:
    name: LCARdS Alert Mode
    options:
      - green_alert
      - red_alert
      - yellow_alert
      - blue_alert
      - gray_alert
      - black_alert
    initial: green_alert
    icon: mdi:alarm-light
  lcards_alert_transition_style:
    name: LCARdS Alert Transition Style
    options:
      - "off"
      - blur_fade
      - fade_only
      - flash
      - color_bleed
      - flicker
      - static
      - wipe
    initial: "off"
    icon: mdi:transition

input_boolean:
  lcards_alert_mode_auto_switch:
    name: LCARdS Auto Alert Switch
    initial: false
    icon: mdi:auto-mode

input_text:
  lcards_alert_message:
    name: LCARdS Alert Message
    max: 255
    icon: mdi:message-alert
```

### HA-LCARS Theme

```yaml
input_number:
  lcars_elbow_angle:
    name: LCARS Elbow Angle
    min: 1
    max: 89
    step: 1
    mode: slider
    unit_of_measurement: "°"
    initial: 45
    icon: mdi:angle-acute
  lcars_vertical:
    name: LCARS Vertical
    min: 26
    max: 60
    step: 1
    mode: slider
    icon: mdi:arrow-expand-vertical
  lcars_horizontal:
    name: LCARS Horizontal
    min: 6
    max: 60
    step: 1
    mode: slider
    icon: mdi:arrow-expand-horizontal
  lcars_menu_font:
    name: LCARS Menu Font
    min: 8
    max: 24
    step: 1
    mode: slider
    unit_of_measurement: "px"
    icon: mdi:format-font-size-increase

input_boolean:
  lcars_sound:
    name: LCARS Sound
    icon: mdi:volume-high
  lcars_texture:
    name: LCARS Texture
    icon: mdi:texture

template:
  - sensor:
      - name: LCARS Header
        state: >-
          {{ "LCARS " + states("sensor.time") }}
        icon: mdi:text-box
```

### Sound

```yaml
input_boolean:
  lcards_sound_enabled:
    name: LCARdS Sound Effects Enabled
    initial: false
    icon: mdi:volume-high
  lcards_sound_cards:
    name: LCARdS Card Interaction Sounds
    initial: true
    icon: mdi:gesture-tap
  lcards_sound_ui:
    name: LCARdS UI Navigation Sounds
    initial: true
    icon: mdi:navigation
  lcards_sound_alerts:
    name: LCARdS Alert & System Sounds
    initial: true
    icon: mdi:alert-circle

input_number:
  lcards_sound_volume:
    name: LCARdS Sound Volume
    min: 0
    max: 1
    step: 0.05
    initial: 0.5
    mode: slider
    icon: mdi:volume-medium

input_select:
  lcards_sound_scheme:
    name: LCARdS Sound Scheme
    options:
      - none
    icon: mdi:music-box-multiple
```

LCARdS adds the installed schemes to `lcards_sound_scheme`'s options by itself, so the list needs no editing when you add a sound pack.

---

## Using Helpers in Automations

**Because LCARdS reads these helpers live, any automation can change LCARdS, and any automation can react to it.**

- Changing `input_select.lcards_alert_mode` is the same as calling [`lcards.set_alert_mode`](./ha-actions#lcards-set-alert-mode); the `lcards.*` alert actions also work on single devices.
- See [Alert Mode](../core/alert-mode) for everything that happens when the alert mode changes.

```yaml
# Raise red alert from an automation
actions:
  - action: input_select.select_option
    target:
      entity_id: input_select.lcards_alert_mode
    data:
      option: red_alert
```

```yaml
# Run something when red alert starts
triggers:
  - trigger: state
    entity_id: input_select.lcards_alert_mode
    to: red_alert
```
