# Configuration

LCARdS configuration is managed through the **LCARdS Config Panel** — a dedicated sidebar entry in Home Assistant that serves as the central control hub for your installation. It provides access to helper management, theme browsing, alert mode customisation, sound configuration, content pack exploration, and device/user management.

The panel is registered automatically when the LCARdS integration is installed.

---

## Accessing the Panel

Look for the **LCARdS Config** entry in the Home Assistant sidebar after installation. If it is not visible:

1. Go to **Settings → Integrations → LCARdS → Configure**
2. Enable **Show sidebar panel**
3. The panel appears immediately — no restart needed

You can also customise the sidebar title and icon from the same screen.

---

## Panel Tabs

### Welcome

The first tab when opening the Config Panel:

- **Get Started checklist** — step-by-step onboarding: create helpers, configure alert mode, set up sounds
- **Panel Guide** — clickable cards for each tab with a short description; clicking navigates directly to that tab
- **Resource links** — documentation, GitHub, and community links

---

### Helpers

::: tip First launch
Open the **Helpers** tab and click **Create All Helpers** before using anything else. This creates every HA input helper LCARdS needs for alert mode, sounds, and sizing in one step.
:::

Shows all LCARdS HA input helpers, their current values, and creation status:

- Create all required helpers in one click (**Create All Helpers**)
- Inspect or manually set individual helper values
- Identify missing helpers that may affect card behaviour

Helpers are standard Home Assistant `input_*` entities and persist across restarts.

→ [Persistent Helpers reference](persistent-helpers.md)

---

### Alert Mode Lab & Theme Browser

Two tools in one tab:

**Alert Mode Lab** — customise the colour palette applied per alert level (`red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert`). Adjust hue, saturation, lightness, and anchor parameters, preview changes live across your dashboard, then save to helpers.

**Theme Browser** — browse all active theme tokens and CSS variables. Find the exact `{theme:palette.moonlight}` token path to use in card config, or inspect which CSS variable controls a particular colour.

→ [Alert Mode Lab](alert-mode-lab.md) &nbsp;·&nbsp; [Alert Mode](../core/alert-mode.md) &nbsp;·&nbsp; [Themes](../core/themes/)

---

### Connectivity

Configure a full-screen overlay displayed when Home Assistant loses its WebSocket connection — ideal for kiosk installs where you always want to know when the dashboard is offline.

- **Enable / disable** the overlay globally, per user, or per device
- **Simple text** — styled message with colour, font, size, weight, and casing controls
- **Custom card** — replace the text with any HA card defined in YAML, with position and size controls
- **Connection Restored banner** — optional auto-dismissing confirmation shown on reconnect
- **Effect layers** — independently configure the canvas animation, colour overlay, and backdrop filter applied behind the message
- **Test Controls** — simulate a disconnect live in the browser to preview the overlay before saving
- **Per-device / per-user overrides** — scope settings to specific browsers or HA accounts

→ [Connectivity](connectivity.md)

---

### Sounds

Configure LCARS-style audio feedback for card interactions and alert events:

- Enable or disable sound categories (card interactions, UI navigation, alert sounds)
- Select the active sound scheme
- Set per-event overrides — change or mute individual sound events
- Control master volume
- **Per-user / per-device overrides** *(preview)* — set different sound preferences for your own browser session without changing global defaults

→ [Sounds](./sounds.md)

---

### Users & Devices *(preview)*

Manage devices and users that have stored per-device or per-user setting overrides. Requires LCARdS integration v2026.3.0+ with `scoped_storage` capability.

- **Current Session** (all users) — view your device identity, set a display name for this browser
- **Users** (admin only) — list users with stored overrides; clear overrides for a user
- **Devices** (admin only) — list registered devices with last-seen times; rename or delete device records

→ [Users & Devices](users-devices.md)

---

### Pack Explorer

Browse all installed LCARdS content packs. For each pack you can inspect:

- **Style presets** — button and slider preset definitions
- **Animations** — available animation presets and their parameters
- **Themes** — theme tokens contributed by the pack
- **Sound schemes** — audio asset sets registered by the pack

Built-in packs (core, buttons, sliders, effects, themes) are always shown. User-installed packs appear here once loaded.

---

### Storage

> **Advanced — use with caution.** This tab exposes the raw key/value store the LCARdS integration uses for persistent configuration. Requires the LCARdS integration to be installed and connected.

- **Live key list** — all keys currently stored
- **Expandable JSON viewer** — inspect the value of any key
- **Inline JSON editor** — edit a value directly; syntax errors are caught before saving
- **Per-key delete** — remove a single key with confirmation
- **Reset All** — wipe the entire LCARdS store (requires explicit confirmation)

Typical use cases: debugging unexpected behaviour, recovering from a corrupt config value, or inspecting stored scoped settings.

---

## Related

- [Installation](../getting-started/installation.md) — how the panel is registered via the integration
- [Persistent Helpers](persistent-helpers.md) — full helper reference and manual YAML setup
- [Alert Mode Lab](alert-mode-lab.md) — colour palette customisation
- [Alert Mode](../core/alert-mode.md) — how alert mode works and how to trigger it
- [Connectivity](connectivity.md) — connection overlay reference
- [Sounds](sounds.md) — sound system reference
- [Users & Devices](users-devices.md) — scoped settings management

