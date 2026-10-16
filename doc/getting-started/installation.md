---
description: "Install LCARdS from HACS, add the integration (Home Assistant 2026.10 or newer) and set it up from the LCARdS Config Panel."
---

# Installation

## Requirements

- **Home Assistant 2026.10 or newer.** LCARdS relies on 2026.10's dashboard visibility handling and validation library; on older versions the integration logs an error and does not load.

Something not working after installing? See [Getting Help](getting-help.md); the LCARdS panel's Welcome tab has a built-in health check.

## Quick Start

1. [Install from HACS](#_1-install-via-hacs)
2. [Add the LCARdS integration](#_2-add-the-integration)
3. [First setup in the LCARdS panel](#_3-first-setup): create the helpers, then tune alert modes and sounds

:::tip HA-LCARS Theme Integration
LCARdS supports and integrates well with [**HA-LCARS themes**](https://github.com/th3jesta/ha-lcars).  Use these two together for the best experience.

HA-LCARS includes LCARdS theme profiles (**LCARS Picard [LCARdS Red Accent]** and **[LCARdS Blue Accent]**): choose one as your Home Assistant theme and HA's own screens match your LCARdS cards. See [HA-LCARS Theme Profiles](../configuration/ha-lcars-theme-profiles.md).
:::

## 1. Install via HACS

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=snootched&repository=LCARdS&category=integration)

1. Open **HACS** in Home Assistant
2. Go to **Integrations** and search for **LCARdS**
3. Click **Download** and confirm
4. **Restart Home Assistant**, then [add the integration](#_2-add-the-integration).

### Manual Installation

<details><summary>Manual installation (unmanaged updates)</summary>

1. Download `lcards.zip` from the [latest GitHub release](https://github.com/snootched/lcards/releases/latest)
2. Extract the contents into `config/custom_components/lcards/`
   (the directory should contain `manifest.json` and `__init__.py` directly, not a nested `lcards/lcards/` folder)
3. **Restart Home Assistant**, then [add the integration](#_2-add-the-integration).

</details>

::: info Using `custom:layout-card`?
LCARdS has its own [Layout Card](../cards/layout-card/), which fixes the sizing and margin problems LCARdS cards have inside `custom:layout-card` and adds a visual editor. Moving over is a one-line change: see [Sizing inside `custom:layout-card`](../cards/common#sizing-inside-custom-layout-card).
:::

## 2. Add the integration

Go to **Settings > Devices & services > Add integration** and pick **LCARdS**. The integration adds the **LCARdS Config** panel to the sidebar and loads the cards on every dashboard. Its options are listed under [Integration options](#integration-options).

## 3. First setup

Open **LCARdS Config** in the sidebar. The **Welcome** tab walks you through the same steps:

1. **Create the helpers.** In the **Helpers** tab, click **Create All Helpers**. LCARdS keeps alert mode, sound and sizing settings in Home Assistant helpers, and several features (alert mode, the alert overlay, sounds) need them. Do this first.
2. **Pick your alert colours** (optional). The **Alert Mode Lab** in **Theme Studio** sets how each alert mode recolours your dashboards. See [Alert Mode Lab](../configuration/alert-mode-lab).
3. **Set up sounds** (optional). The **Sounds** tab turns sounds on, picks a sound scheme and sets volumes. See [Sound Configuration](../configuration/sounds).
4. **Choose your HA-LCARS theme** (recommended), ideally one of the LCARdS profiles HA-LCARS includes. See [HA-LCARS Theme Profiles](../configuration/ha-lcars-theme-profiles).

Then check the setup: **Welcome > Support & system info** runs a health check (versions, browser cache, card-mod leftovers).

The [Configuration](../configuration/) section covers every panel tab in detail.

## Next steps

- **[Build a dashboard](building-dashboards)**: pick cards and lay out your first LCARS screen.
- **[Browse the gallery](dashboard-gallery)**: start from a complete dashboard.
- Stuck? See **[Getting Help](getting-help)**.

## Integration options

**Settings > Devices & services > LCARdS > Configure**. Changes take effect immediately; no restart needed.

| Option | Default | Description |
|--------|---------|-------------|
| Show sidebar panel | On | Display the LCARdS Config entry in the Home Assistant sidebar. Disable if you prefer a cleaner sidebar; the integration stays active and all cards continue to work. |
| Sidebar Title | LCARdS Config | Customizable title for the sidebar entry. |
| Sidebar Icon | `mdi:space-invaders` | Customizable icon for the sidebar entry. |
| Log Level | `warn` | Default logging level for all cards. `debug`, `trace` are very verbose: only use them for deep troubleshooting. |
| Enable Preview Features | `false` | Unlocks features that are still under active development. These may change during development - Please provide your feedback, discuss or get help on GitHub Issues and Discussions. |

If you don't want the panel in the sidebar all the time, turn **Show sidebar panel** off; it can be turned back on at any time.
