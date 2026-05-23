# Persistent Helpers

LCARdS uses Home Assistant `input_*` helpers to store settings persistently — alert mode state, sound configuration, and HA-LCARS sizing values. They survive HA restarts and can be used in automations.

::: tip Create helpers from the Config Panel
The easiest way is the **Config Panel** → **Helpers** tab → **Create All Helpers** — one click creates everything. See [LCARdS Config Panel](./index.md) for setup.
:::

---

## Helper Reference

### Alert Mode

| Helper | Type | Purpose |
|--------|------|---------|
| `input_select.lcards_alert_mode` | `input_select` | Active alert level — `green_alert`, `red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert` |
| `input_boolean.lcards_alert_mode_auto_switch` | `input_boolean` | Automatically activates alert mode when the `input_select` changes |
| `input_text.lcards_alert_message` | `input_text` | Custom message displayed in the alert overlay content card |
| `input_select.lcards_alert_transition_style` | `input_select` | Screen-transition effect when alert mode switches — `off`, `blur_fade`, `fade_only`, `flash`, `color_bleed`, `flicker`, `static`, `wipe` |

### Sound

| Helper | Type | Purpose |
|--------|------|---------|
| `input_boolean.lcards_sound_enabled` | `input_boolean` | Master sound on/off toggle |
| `input_boolean.lcards_sound_cards` | `input_boolean` | Card interaction sounds (tap, hold, etc.) |
| `input_boolean.lcards_sound_ui` | `input_boolean` | UI navigation sounds |
| `input_boolean.lcards_sound_alerts` | `input_boolean` | Alert and system sounds |
| `input_number.lcards_sound_volume` | `input_number` | Master volume (0–1) |
| `input_select.lcards_sound_scheme` | `input_select` | Active sound scheme |

### HA-LCARS Theme Helpers (optional)

These helpers control dimensions, appearance, and features of the HA-LCARS theme. They are only relevant when using the `ha_lcars` or compatible theme.

| Helper | Type | Purpose |
|--------|------|---------|
| `input_number.lcars_horizontal` | `input_number` | Dashboard-wide horizontal bar width |
| `input_number.lcars_vertical` | `input_number` | Dashboard-wide vertical bar height |
| `input_number.lcars_elbow_angle` | `input_number` | Dashboard-wide elbow diagonal angle (1–89°). Elbow segments set to **Theme Binding** follow this value live. |
| `input_boolean.lcars_sound` | `input_boolean` | Toggles button/tap sounds within the HA-LCARS theme |
| `input_boolean.lcars_texture` | `input_boolean` | Toggles the grain pattern and backlight effect in HA-LCARS |
| `input_number.lcars_menu_font` | `input_number` | Sidebar menu font size (8–24 px) |
| `sensor.lcars_header` | template sensor | Text displayed in the clock area of the HA-LCARS header. Must be defined manually in `configuration.yaml` as a template sensor |

### Alert Mode Lab Parameters (auto-managed)

The [Alert Mode Lab](alert-mode-lab.md) creates and manages a set of `input_number` helpers for each alert level — controlling hue, saturation, lightness, and anchor/contrast parameters. These helpers are created automatically when you save from the Lab and **do not need to be created manually**. See [Alert Mode Lab](alert-mode-lab.md) for details.

---

## Manual YAML Setup

If you prefer to define helpers manually rather than using the Config Panel, add the following to `configuration.yaml`:

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
    icon: mdi:alert-circle
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
```

### Sound

```yaml
input_boolean:
  lcards_sound_enabled:
    name: LCARdS Sound Effects Enabled
    icon: mdi:volume-high
  lcards_sound_cards:
    name: LCARdS Card Interaction Sounds
    icon: mdi:gesture-tap
  lcards_sound_ui:
    name: LCARdS UI Navigation Sounds
    icon: mdi:navigation
  lcards_sound_alerts:
    name: LCARdS Alert & System Sounds
    icon: mdi:alert-circle

input_number:
  lcards_sound_volume:
    name: LCARdS Sound Volume
    min: 0
    max: 1
    step: 0.05
    mode: slider
    icon: mdi:volume-medium

input_select:
  lcards_sound_scheme:
    name: LCARdS Sound Scheme
    options:
      - none
    icon: mdi:music-box-multiple
```

---

## Using Helpers in Automations

Because LCARdS reads from these helpers at runtime, you can control LCARdS from any HA automation:

```yaml
# Trigger red alert from an automation
action:
  - service: input_select.select_option
    data:
      entity_id: input_select.lcards_alert_mode
      option: red_alert
```

```yaml
# React when alert mode changes
trigger:
  - platform: state
    entity_id: input_select.lcards_alert_mode
    to: red_alert
```

See [Alert Mode](../core/alert-mode.md) for what all happens when alert mode changes, and how to use it from card actions.
