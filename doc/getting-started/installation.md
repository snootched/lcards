---
description: "Install LCARdS from the Home Assistant Marketplace (HACS), add the integration (Home Assistant 2026.11 or newer) and set it up from the LCARdS Config panel."
---

# Installation

**Install LCARdS from the Home Assistant Marketplace, add the LCARdS integration, then create its helpers in the LCARdS Config panel.** There is nothing else to install: the integration loads the cards on every dashboard.

- **Needs Home Assistant 2026.11 or newer.** LCARdS relies on 2026.11's chip styling and dashboard card paths, and on 2026.10's dashboard visibility handling and validation library. The Marketplace doesn't offer it to older versions, and on an older version the integration logs an error and does not load.
- Something not working after installing? See [Getting Help](getting-help). The LCARdS Config panel's **Welcome** tab also has a health check for common installation problems.

::: tip Pair it with HA-LCARS
LCARdS is designed to pair with the [HA-LCARS themes](https://github.com/th3jesta/ha-lcars). HA-LCARS includes LCARdS theme profiles (**LCARS Picard [LCARdS Red Accent]** and **[LCARdS Blue Accent]**): choose one as your Home Assistant theme and Home Assistant's own screens match your LCARdS cards. See [HA-LCARS Theme Profiles](../configuration/ha-lcars-theme-profiles).
:::

## 1. Install from the Home Assistant Marketplace (HACS)

**Download LCARdS as a Marketplace integration, then restart Home Assistant.**

[![Open your Home Assistant instance and open a repository in the Marketplace.](https://my.home-assistant.io/badges/marketplace_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=snootched&repository=lcards&category=integrations)

1. Open **Marketplace** in Home Assistant.
2. Go to **Integrations** and search for **LCARdS**.
3. Click **Download** and confirm.
4. **Restart Home Assistant**, then [add the integration](#_2-add-the-integration).

::: details Manual installation (unmanaged updates)
1. Download `lcards.zip` from the [latest GitHub release](https://github.com/snootched/lcards/releases/latest).
2. Extract the contents into `config/custom_components/lcards/`. The folder should hold `manifest.json` and `__init__.py` directly, not a nested `lcards/lcards/` folder.
3. **Restart Home Assistant**, then [add the integration](#_2-add-the-integration).

Updates don't arrive by themselves this way: repeat these steps for each release.
:::

## 2. Add the integration

**Go to Settings > Devices & services > Add integration and pick LCARdS.** It asks no questions, and only one LCARdS entry can be added.

- The integration connects Home Assistant to the LCARdS cards, and adds the **LCARdS Config** panel to the sidebar.
- Its options are listed under [Integration options](#integration-options).

## 3. First setup

**Choose a theme, then create the helpers in the LCARdS Config panel.** The panel's **Welcome** tab walks you through the same steps.

1. **Choose your HA-LCARS theme** (recommended), ideally one of the LCARdS profiles HA-LCARS includes. See [HA-LCARS Theme Profiles](../configuration/ha-lcars-theme-profiles).
2. **Create the helpers.** Open **LCARdS Config** in the sidebar, go to the **Helpers** tab and click **Create All**. LCARdS keeps alert mode, sound and sizing settings in Home Assistant helpers, and several features (alert mode, the alert overlay, sounds) need them.
3. **Optional: customize your alert colours.** The **Alert Mode Lab** in **Theme Studio** sets how each alert mode recolours your dashboards. See [Alert Mode Lab](../configuration/alert-mode-lab).
4. **Optional: set up sounds.** The **Sounds** tab turns sounds on and picks a sound scheme you can customize. See [Sound Configuration](../configuration/sounds).
5. **Check the setup.** **Welcome > Support & system info** runs a health check (versions, browser cache, card-mod leftovers).

The [Configuration](../configuration/) section covers every panel tab in detail.

## Next steps

- **[Build a dashboard](building-dashboards)**: pick cards and lay out your first LCARS screen.
- **[Browse the gallery](dashboard-gallery)**: start from a complete dashboard.
- Stuck? See **[Getting Help](getting-help)**.

## Integration options

**Settings > Devices & services > LCARdS > Configure sets the sidebar entry, the log level and preview features.** Changes take effect when you save, with no restart; reload the browser page to pick up a new log level.

| Option | Default | Description |
|--------|---------|-------------|
| Show sidebar panel | On | Show the LCARdS Config entry in the sidebar. Turn it off for a cleaner sidebar: the integration stays active, every card keeps working, and you can turn it back on at any time |
| Sidebar title | `LCARdS Config` | The sidebar entry's label |
| Sidebar icon | `mdi:space-invaders` | The sidebar entry's icon |
| Log level | `warn` | How much LCARdS logs, in the browser console and in the Home Assistant log: `off`, `error`, `warn`, `info`, `debug` or `trace`. `debug` and `trace` are very verbose: use them only for deep troubleshooting. `?lcards_log_level=debug` on a page's address overrides it for that page |
| Enable Preview Features | Off | Unlocks features still under active development. They may change; please give feedback, discuss or get help on GitHub Issues and Discussions |
