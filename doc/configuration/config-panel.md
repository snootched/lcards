# LCARdS Config Panel

The LCARdS Config Panel is a full-page sidebar panel that serves as the central control hub for your LCARdS installation. From here you can manage HA helpers, browse theme tokens, configure sounds, and explore installed content packs.

---

## Setup

The panel must be registered once in `configuration.yaml`. Add the following and restart Home Assistant:

```yaml
panel_custom:
  - name: lcards-config-panel
    sidebar_title: LCARdS Config
    sidebar_icon: mdi:cog
    url_path: lcards-config-panel
    module_url: /hacsfiles/lcards/lcards.js
```

After restarting, **LCARdS Config** appears in the HA sidebar.

> [!NOTE]
> If you installed via HACS the module URL above is correct. For manual installs, adjust the path to match where you placed `lcards.js`.

---

## Panel Tabs

### Helpers

Shows all LCARdS HA input helpers — their current status and values.

From this tab you can:
- See which helpers exist and which are missing
- Create all required helpers in one click (**Create All Helpers**)
- Edit helper values directly (e.g. sound volume, alert mode)
- Filter by category

Helpers are `input_boolean`, `input_number`, and `input_select` entities that store persistent LCARdS settings across HA restarts. They are **not created automatically** — use this tab or the YAML tab to set them up.

> [!TIP]
> Click **Create All Helpers** on first launch. This creates every helper LCARdS needs in one step.

---

### Theme Browser

Browse all available theme tokens for the active theme.

Use this to:
- Find the exact token name for a colour or size value
- Preview token values before using them in card YAML
- See which tokens are available across all built-in themes

Tokens are referenced in card config as `{theme:token.path}` — see [Themes](../core/themes/README.md) for details.

---

### Sound

Configure LCARdS audio feedback. From here you can:
- Enable or disable sounds globally
- Toggle per-category: card interactions, UI navigation, alerts
- Set master volume
- Select or preview sound schemes
- Override individual events with a specific sound or silence them
- **Reset all overrides** to scheme defaults (button appears when any overrides are active)

Sound requires helpers to be created first. See [Sound Effects](../core/sounds.md) for full setup.

---

### Pack Explorer

Browse installed content packs. Packs can add:
- New button presets and styles
- Theme definitions
- Animation presets
- Rules
- Sound schemes

The Pack Explorer shows what each pack provides and its version. Built-in packs (`lcars_base`, `lcars_fx`) are always present.

---

### YAML Export

Generates the `configuration.yaml` snippets you need to manually create all LCARdS helpers. Useful if you prefer managing helpers via config files rather than the UI.

---

## Alert Mode

Alert mode can be triggered from the Helpers tab or via automations. Six modes are supported:

| Mode (`input_select` value) | Description |
|---|---|
| `red_alert` | Full red-alert — animations across all registered cards |
| `yellow_alert` | Caution state |
| `blue_alert` | Blue standby / information state |
| `gray_alert` | Gray subdued state |
| `black_alert` | Black / blackout state |
| `green_alert` | Normal / all-clear (default) |

```yaml
# Trigger from an automation
- action: input_select.select_option
  target:
    entity_id: input_select.lcards_alert_mode
  data:
    option: red_alert
```

Each mode fires a dedicated sound event (`alert_red`, `alert_yellow`, etc.) when a sound scheme is active. See [Sound Effects](../core/sounds.md) for details.

---
