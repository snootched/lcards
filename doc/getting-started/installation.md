# Installation

## Quick Start

1. Install from HACS
2. Add LCARdS integration to HA
3. Initialize and Configure LCARdS from LCARdS Config Panel

:::tip
For the best visual experience, use [**HA-LCARS themes**](https://github.com/th3jesta/ha-lcars).
:::

## 1. Install via HACS

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=snootched&repository=LCARdS&category=integration)

1. Open **HACS** in Home Assistant
2. Go to **Integrations** and search for **LCARdS**
3. Click **Download** and confirm
4. **Restart Home Assistant**
5. Go to **Settings → Integrations → Add Integration** and search for **LCARdS**
6. Click through the setup (configuration options below)

LCARdS is now active. It automatically:
- Loads `lcards.js` on every Home Assistant page
- Registers the **LCARdS Config** sidebar panel

### Manual Installation

<details><summary>Manual installation (unmanaged updates)</summary>

1. Download `lcards.zip` from the [latest GitHub release](https://github.com/snootched/lcards/releases/latest)
2. Extract the contents into `config/custom_components/lcards/`
   (the directory should contain `manifest.json` and `__init__.py` directly — not a nested `lcards/lcards/` folder)
3. **Restart Home Assistant**
No `configuration.yaml` changes are required.
4. Go to **Settings → Integrations → Add Integration → LCARdS**

</details>

## 2. Configuration (Integration)

After installation, LCARdS integration options can be configured from the integration configuration:

**Settings → Integrations → LCARdS → Configure**

| Option | Default | Description |
|--------|---------|-------------|
| Show sidebar panel | On | Display the LCARdS Config entry in the Home Assistant sidebar. Disable if you prefer a cleaner sidebar — the integration stays active and all cards continue to work. |
| Sidebar Title | LCARdS Config | Customizable title for the sidebar entry. |
| Sidebar Icon | `mdi:space-invaders` | Customizable icon for the sidebar entry. |
| Log Level | `warn` | Default logging level for all cards. `debug`, `trace` are excessively versbose - only used for deep troubleshooting. |
| Enable Preview Features | `false` | Unlocks features that are still under active development. These may change during development - Please provide your feedback, discuss or get help on GitHub Issues and Discussions. |

Changes take effect immediately — no restart required.

## 3. LCARdS Configuarion - Config Panel

The **LCARdS Config Panel** is registered automatically by the integration.
Access it via the **LCARdS Config** entry in the Home Assistant sidebar.

From the Config Panel you can:
- **Create all required helpers** in one click (alert mode, sounds, sizing)
- Customise Alert Mode colour palettes per alert level
- Configure sound schemes and per-event overrides
- Browse theme tokens and CSS variables live
- Explore installed packs

After setup, if you don't want it visible all the time, toggle **Show sidebar panel** off in the integration options — it can be re-enabled at any time.

See [Configuration overview](../configuration/) for full details.
