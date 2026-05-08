# HA Actions

> **Control LCARdS from automations, scripts, voice assistants, and Developer Tools**

LCARdS registers a set of HA **actions** under the `lcards` domain. Once the integration is installed they appear automatically in:

- **Automations & Scripts** — `action:` blocks in YAML or the visual editor
- **Voice assistants** that call HA services
- **Developer Tools → Actions** (one-shot testing)
- The **REST / WebSocket API** for external integrations

---

## Targeting {#targeting}

Several `lcards.*` actions support targeting specific browsers/devices and/or users.  Set any combination of the below fields for supported services.
If these options are omitted, then the action is global and every connected browser will pick it up.

| Field | Type | Description |
|-------|------|-------------|
| `target_device_ids` | list | Browser device UUIDs (`localStorage.lcards_device_id` in each tab) |
| `target_device_names` | list | Display names set in Config Panel → Users & Devices or via `?lcards_device=` URL param. Non-unique names match every device sharing that name. |
| `target_user_ids` | list | HA user UUIDs |
| `target_user_names` | list | HA user display names (case-insensitive) |

See [Users & Devices](/configuration/users-devices) for how device IDs and display names are assigned.

---

## Alert Mode Actions

Alert state is stored in `input_select.lcards_alert_mode` — the single source of truth. All alert actions update that entity, which propagates automatically to the `ThemeManager` (colour palette), `SoundManager` (alert sounds), and any `lcards-alert-overlay` cards on the dashboards.

### `lcards.set_alert_mode`

Set any alert mode by name.

| Field | Type | Required | Options |
|-------|------|----------|---------|
| `mode` | select | ✅ | `red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert`, `green_alert` |

```yaml
action: lcards.set_alert_mode
data:
  mode: red_alert
```

### Shortcut actions

One-shot actions that each set the corresponding alert mode directly. All support [targeting](#targeting) — when targeting fields are present only the matched browsers update their local alert state (global `input_select.lcards_alert_mode` is not written).

| Action | Effect |
|--------|--------|
| `lcards.red_alert` | Activates red alert |
| `lcards.yellow_alert` | Activates yellow alert |
| `lcards.blue_alert` | Activates blue alert |
| `lcards.gray_alert` | Activates gray alert |
| `lcards.black_alert` | Activates black alert |
| `lcards.clear_alert` | Returns to normal (`green_alert`) |

```yaml
action: lcards.red_alert
```

---

## Screen Effect Actions

Play or clear layered screen effects on connected browser tabs. Supports [targeting](#targeting).

Effects are applied per slot — `backdrop` (CSS filters), `color` (colour overlay), and `canvas` (animated canvas). Slots are independent: you can update one without touching the others. See [Screen Effects](/core/effects/screen-effects) for the full preset reference and parameter docs.

### `lcards.trigger_effect`

Play one or more layered screen effects.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `layers` | object | ✅ | Per-slot effect config — see below |
| `duration` | number | | Auto-clear all effects after this many ms (100–300000). Omit for a persistent effect that must be cleared manually. |
| `target_device_ids` | list | | → [Targeting](#targeting) |
| `target_device_names` | list | | → [Targeting](#targeting) |
| `target_user_ids` | list | | → [Targeting](#targeting) |
| `target_user_names` | list | | → [Targeting](#targeting) |

**`layers` object** — each key is a slot name; omit a slot to leave it unchanged, set it to `null` to clear it. Each slot object requires a `preset` key plus any preset-specific overrides:

| Slot | Preset | Key params |
|------|--------|------------|
| `backdrop` | `blur` | `amount` (e.g. `"8px"`) |
| `backdrop` | `grayscale` | `amount` (e.g. `"100%"`) |
| `backdrop` | `saturate` | `amount` (e.g. `"200%"`) |
| `backdrop` | `contrast` | `amount` (e.g. `"200%"`) |
| `backdrop` | `hue-rotate` | `angle` (e.g. `"90deg"`) |
| `color` | `color-tint` | `color` (e.g. `"rgba(200,0,0,0.35)"`) |
| `color` | `vignette` | `opacity` (e.g. `0.7`) |
| `canvas` | `static` | `opacity`, `scale` |
| `canvas` | `pixelate` | `opacity`, `pixelSize` |
| `canvas` | `glitch` | `opacity`, `intensity` |
| `canvas` | `scanlines` | `opacity` |

See [Screen Effects](/core/effects/screen-effects) for full parameter details.

```yaml
# Red-tinted blur — persistent until cleared
action: lcards.trigger_effect
data:
  layers:
    backdrop:
      preset: blur
      amount: "12px"
    color:
      preset: color-tint
      color: "rgba(180,0,0,0.35)"
```

```yaml
# TV static for 5 seconds, then auto-clear
action: lcards.trigger_effect
data:
  duration: 5000
  layers:
    canvas:
      preset: static
      opacity: 0.4
```

```yaml
# Target one device, all three slots
action: lcards.trigger_effect
data:
  target_device_names:
    - Kitchen Tablet
  layers:
    backdrop:
      preset: grayscale
      amount: "80%"
    color:
      preset: vignette
      opacity: 0.5
    canvas:
      preset: scanlines
      opacity: 0.3
```

### `lcards.clear_effect`

Clear one or all active screen effects. Supports [targeting](#targeting).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `slot` | select | | Which slot to clear: `backdrop`, `canvas`, or `color`. Omit to clear all slots. |
| `target_device_ids` | list | | → [Targeting](#targeting) |
| `target_device_names` | list | | → [Targeting](#targeting) |
| `target_user_ids` | list | | → [Targeting](#targeting) |
| `target_user_names` | list | | → [Targeting](#targeting) |

```yaml
# Clear all active effects on all browsers
action: lcards.clear_effect
```

```yaml
# Clear only the backdrop slot
action: lcards.clear_effect
data:
  slot: backdrop
```

```yaml
# Clear everything on a specific device
action: lcards.clear_effect
data:
  target_device_names:
    - Kitchen Tablet
```

---

## Portal Overlay Actions

Display or clear a custom HA card over the full-screen portal on connected browser tabs. Supports [targeting](#targeting).

Cards are mounted in the `'ha-service'` portal slot, which is independent of the Alert and Connection overlay slots — they do not interfere with each other.

For more advanced use-cases, you can refer to [using browser_mod](./browser-mod.md) integration page.

### `lcards.show_portal_card`

Displays a card or message in the portal overlay.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `content` | object | ✅ | Any HA card config (`type: custom:lcards-button`, `type: entities`, etc.) |
| `layers` | object | | SEM effect layers — same shape as `lcards.trigger_effect` |
| `position` | select | | Content anchor. Default: `center`. Options: `center`, `top`, `top-left`, `top-right`, `bottom`, `bottom-left`, `bottom-right`, `left`, `right` |
| `width` | string | | CSS width for the content container, e.g. `'400px'` |
| `height` | string | | CSS height for the content container |
| `duration` | number | | Auto-dismiss after this many milliseconds (100–300000) |
| `dismiss` | boolean | | Whether clicking the backdrop dismisses the overlay |
| `target_device_ids` | list | | → [Targeting](#targeting) |
| `target_device_names` | list | | → [Targeting](#targeting) |
| `target_user_ids` | list | | → [Targeting](#targeting) |
| `target_user_names` | list | | → [Targeting](#targeting) |

```yaml
action: lcards.show_portal_card
data:
  content:
    type: custom:lcards-button
    entity: light.bridge
  position: center
  width: "360px"
  duration: 10000
  dismiss: true
  layers:
    backdrop:
      preset: blur
      amount: "8px"
    color:
      preset: color-tint
      color: "rgba(0,0,0,0.5)"
```

```yaml
# Target a specific device
action: lcards.show_portal_card
data:
  content:
    type: markdown
    content: "# Alert!\nDoor opened."
  target_device_names:
    - Kitchen Tablet
```

### `lcards.clear_portal_card`

Hides the portal card shown by `show_portal_card`. Only clears the `'ha-service'` slot — alert and connection overlays are unaffected. Supports [targeting](#targeting).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `target_device_ids` | list | | → [Targeting](#targeting) |
| `target_device_names` | list | | → [Targeting](#targeting) |
| `target_user_ids` | list | | → [Targeting](#targeting) |
| `target_user_names` | list | | → [Targeting](#targeting) |

```yaml
action: lcards.clear_portal_card
```

```yaml
# Clear on a specific device only
action: lcards.clear_portal_card
data:
  target_device_names:
    - Kitchen Tablet
```

---

## Borg Assimilation Actions

Trigger and clear the [Borg Assimilation mode](/core/borg) from automations. Both actions support [targeting](#targeting).

To clear, you can call [`lcards.borg_deassimilate`](#lcards-borg-deassimilate) or simply relaod the page - this does not persist across reloads.

### `lcards.borg_assimilate`

Trigger the Borg assimilation on one or all connected browsers.

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `intro_duration` | No | — | Auto-dismiss the intro after this many ms (1000–60000). Omit for click-to-dismiss. |
| `site_count` | No | `8` | Number of injection sites on screen (1–20) |
| `tendrils_per_site` | No | `5` | Bézier tendrils per injection site (1–24) |
| `tendril_length` | No | `600` | Maximum tendril reach in pixels (100–1200) |
| `particle_count` | No | `2` | Nano-probe particles per tendril (0–6); `0` disables particles |
| `transition_style` | No | `blur_fade` | Palette transition: `blur_fade`, `flash`, `fade_only`, `off` |
| `font_swap` | No | `true` | Set to `false` to skip the Borg font injection — all other effects (palette, canvas intro, persistent layers) still run. |
| `suppress_persistent` | No | `false` | Suppress all persistent effects after intro. Ignored if `persistent_layers` is also set. |
| `intro_layers` | No | — | **Advanced.** Full per-slot layers dict. Canvas param keys accept either snake_case or camelCase — both are normalised. Values override the corresponding flat shortcuts. |
| `persistent_layers` | No | — | **Advanced.** Full per-slot layers dict. Overrides `suppress_persistent` when set. Pass `{}` to suppress all. |
| `target_device_ids` | No | — | → [Targeting](#targeting) |
| `target_device_names` | No | — | → [Targeting](#targeting) |
| `target_user_ids` | No | — | → [Targeting](#targeting) |
| `target_user_names` | No | — | → [Targeting](#targeting) |

```yaml
# Broadcast — click-to-dismiss
action: lcards.borg_assimilate
```

```yaml
# Auto-dismiss after 12 seconds
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
# Custom intro with extra blur backdrop
action: lcards.borg_assimilate
data:
  intro_duration: 10000
  site_count: 12
  intro_layers:
    backdrop:
      preset: blur
      amount: "6px"
```

```yaml
# Suppress all persistent effects — palette + font only
action: lcards.borg_assimilate
data:
  suppress_persistent: true
```

```yaml
# Keep the existing font — palette + canvas intro still run
action: lcards.borg_assimilate
data:
  font_swap: false
```

```yaml
# Target a specific device
action: lcards.borg_assimilate
data:
  intro_duration: 10000
  target_device_names:
    - Living Room TV
```

### `lcards.borg_deassimilate`

Reverse the Borg assimilation and restore all browsers to normal.

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `with_outro` | No | `true` | Play outro layers before reverting. `false` = immediate silent revert. |
| `outro_layers` | No | — | Layers dict for the outro. Longest `duration` param determines wait time. Omit for defaults (glitch on canvas, 1200 ms). |
| `revert_transition_style` | No | `fade_only` | Palette transition back to normal: `flash`, `fade_only`, `blur_fade`, `off` |
| `target_device_ids` | No | — | → [Targeting](#targeting) |
| `target_device_names` | No | — | → [Targeting](#targeting) |
| `target_user_ids` | No | — | → [Targeting](#targeting) |
| `target_user_names` | No | — | → [Targeting](#targeting) |

```yaml
# Broadcast — default glitch outro
action: lcards.borg_deassimilate
```

```yaml
# Immediate silent revert
action: lcards.borg_deassimilate
data:
  with_outro: false
```

```yaml
# Custom outro
action: lcards.borg_deassimilate
data:
  outro_layers:
    canvas:
      preset: glitch
      duration: 800
      intensity: 0.6
  revert_transition_style: fade_only
```

---

## Frontend Control Actions

These actions can be helpful for troubleshooting, or just clean loading front-end.  Both support [targeting](#targeting).

### `lcards.reload`

Forces the matching browser tabs to reload (`window.location.reload()`). Useful after pushing new assets or changing configuration.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `target_device_ids` | list | | → [Targeting](#targeting) |
| `target_device_names` | list | | → [Targeting](#targeting) |
| `target_user_ids` | list | | → [Targeting](#targeting) |
| `target_user_names` | list | | → [Targeting](#targeting) |

```yaml
# Broadcast — reload all tabs
action: lcards.reload
```

```yaml
# Reload a single device
action: lcards.reload
data:
  target_device_names:
    - Kitchen Tablet
```

::: warning
This *immediately* reloads the matched browser tabs. Use with care if users are actively interacting with dashboards.
:::

### `lcards.set_log_level`

Changes the JS frontend log level at runtime across matched tabs and updates the Python logger hierarchy simultaneously. Verbose output appears in the browser console immediately — no HA restart or page reload required. Supports [targeting](#targeting).

| Field | Type | Required | Options |
|-------|------|----------|---------|
| `level` | select | ✅ | `off`, `error`, `warn`, `info`, `debug`, `trace` |
| `target_device_ids` | list | | → [Targeting](#targeting) |
| `target_device_names` | list | | → [Targeting](#targeting) |
| `target_user_ids` | list | | → [Targeting](#targeting) |
| `target_user_names` | list | | → [Targeting](#targeting) |

```yaml
action: lcards.set_log_level
data:
  level: debug
```

---

## Automation Examples

### Red alert on motion

```yaml
alias: Red alert on motion
trigger:
  - platform: state
    entity_id: binary_sensor.hallway_motion
    to: "on"
action:
  - action: lcards.red_alert
```

### Cycle through alert modes on a button press

```yaml
alias: Demo alert cycle
trigger:
  - platform: state
    entity_id: input_button.demo_alert
action:
  - action: lcards.set_alert_mode
    data:
      mode: "{{ states('input_select.demo_alert_cycle') }}"
```

### Enable debug logging when a dev mode flag is set

```yaml
alias: LCARdS debug on dev mode
trigger:
  - platform: state
    entity_id: input_boolean.lcards_dev_mode
action:
  - choose:
      - conditions:
          - condition: state
            entity_id: input_boolean.lcards_dev_mode
            state: "on"
        sequence:
          - action: lcards.set_log_level
            data:
              level: debug
      - conditions:
          - condition: state
            entity_id: input_boolean.lcards_dev_mode
            state: "off"
        sequence:
          - action: lcards.set_log_level
            data:
              level: warn
```

### Borg mode — assimilate all browsers, auto-revert after 30 minutes

```yaml
automation:
  - alias: "Borg Mode"
    trigger:
      - platform: time
        at: "20:00:00"
    action:
      - action: lcards.borg_assimilate
        data:
          intro_duration: 10000
      - delay:
          minutes: 30
      - action: lcards.borg_deassimilate
```

---

## Related

- [Borg Assimilation](/core/borg) — full console API, layer params, and sequence documentation
- [Screen Effects](/core/effects/screen-effects) — full preset reference for `layers` params used by `trigger_effect`, `show_portal_card`, and the borg actions
- [Users & Devices](/configuration/users-devices) — how device IDs and display names are assigned
- [Alert Mode Lab](/configuration/alert-mode-lab) — interactive alert mode configuration
