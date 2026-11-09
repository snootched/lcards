---
description: "The LCARdS Config Panel: the sidebar page for helpers, alert mode colours, HA-LCARS theme profiles, sounds, the connection overlay, users and devices, content packs and stored settings."
---

# Configuration

**The LCARdS Config Panel is the sidebar page where you set LCARdS up for the whole installation: its helpers, alert mode colours, sounds, the connection overlay, and the users and devices that have their own settings.** The integration adds it to the sidebar as **LCARdS Config**.

- Card settings live in each card's YAML or editor. The panel holds what is shared: the Home Assistant helpers LCARdS reads, and settings stored by the integration.
- Some settings can differ per user or per device (sounds, the connection overlay, theme token overrides). The panel's scope switches choose which level you are editing.
- Every tab has a **Docs** link at its top right that opens its page here.

::: tip New install?
Start with [First setup](../getting-started/installation#_3-first-setup): create the helpers, then tune alert modes and sounds.
:::

| Page | Covers |
|------|--------|
| [Persistent Helpers](./persistent-helpers) | Every helper LCARdS and HA-LCARS use, and how to create them by hand |
| [Users & Devices](./users-devices) | Device names and ids, and who has their own settings |
| [HA-LCARS Theme Profiles](./ha-lcars-theme-profiles) | The two LCARdS profiles HA-LCARS ships |
| [HA-LCARS Theme Lab](./ha-lcars-theme-lab) | Building your own HA-LCARS theme profile |
| [Alert Mode Lab](./alert-mode-lab) | How each alert mode recolours your dashboards |
| [Sound Configuration](./sounds) | Sound schemes, categories, per-event sounds, browser autoplay |
| [Home Assistant Actions](./ha-actions) | The `lcards.*` actions for automations and scripts |
| [Using browser_mod](./browser-mod) | LCARdS effects next to browser_mod popups |
| [Connectivity](./connectivity) | The overlay shown when the dashboard loses Home Assistant |

---

## Accessing the Panel

**Open LCARdS Config in the Home Assistant sidebar.** The integration registers it on install; there is nothing to add to your dashboards.

- If the entry is missing, open **Settings > Devices & services > LCARdS > Configure** and turn on **Show sidebar panel**. It appears at once, with no restart.
- The same screen sets the sidebar title and icon, the log level and preview features: see [Integration options](../getting-started/installation#integration-options).
- A link can open a tab directly: `/lcards-config?tab=theme`. The tab names are `welcome`, `helpers`, `theme`, `connectivity`, `sounds`, `users`, `packs` and `storage`.

---

## Panel Tabs

**The panel has a tab for each area.** Storage shows for Home Assistant administrators only.

### Welcome

**The first tab: a setup checklist, a guide to the other tabs, a health check of your installation and links.**

- **Get Started** lists the first steps: create the helpers, customize the alert modes in the Alert Lab, customize sounds.
- **Panel guide** describes each tab; a click on one opens it.
- **Support & system info** checks your setup and shows the LCARdS, integration, Home Assistant and frontend versions. **Report an issue** opens a pre-filled GitHub bug report for you to review (nothing is sent on its own), and **Copy support info** copies the same report.

### Helpers

**Lists every Home Assistant helper LCARdS uses, with its value and whether it exists, and creates the missing ones.**

- When any helper is missing, a banner says how many; **Create All** creates them all and gives each its default value. Each table row can also create one helper.
- The helpers are grouped into **Alert Lab Configuration**, **HA-LCARS Theme Settings** and **Sound System**. **Reset to Defaults** on a group sets its helpers back to their default values (the sound scheme choice is left alone).
- Helpers are ordinary `input_*` entities: they survive restarts and automations can read and change them. See [Persistent Helpers](./persistent-helpers).

::: tip First launch
Open the **Helpers** tab and click **Create All** before using anything else. This creates every helper LCARdS uses for alert mode, sounds and the alert colours, plus the HA-LCARS theme helpers, in one step.
:::

### Theme Studio

**The theme tools, one per tab: the two labs, the token and CSS variable browsers, and token overrides.**

- **LCARdS Alert Mode Lab**: tune how each alert mode recolours your dashboards, then save it to helpers. See [Alert Mode Lab](./alert-mode-lab).
- **HA-LCARS Theme Lab**: build your own HA-LCARS theme profile, with full palettes, LCARS chrome and state colours. See [HA-LCARS Theme Lab](./ha-lcars-theme-lab).
- **LCARdS Theme Tokens**, **LCARS CSS Variables** and **All CSS Variables** browse the active theme's tokens and the page's CSS variables: find the `theme:colors.ui.primary` path to use in card config, or the variable behind a colour.
- **Token Overrides** changes a token's value for everyone, for one user or for one device.

A card editor's **Main Engineering > Theme** tab lists the tokens that card uses and links here. See also [Alert Mode](../core/alert-mode) and [Themes](../core/themes/).

### Connectivity

**Sets up the full-screen overlay shown when a browser loses its connection to Home Assistant, so a kiosk never goes stale without anyone noticing.**

- The overlay can show styled text, any card, or the Borg assimilation, over effect layers you choose.
- It is off until you turn it on, and can be set for everyone, one user or one device.

See [Connectivity](./connectivity).

### Sounds

**Turns LCARS sounds on, picks the sound scheme and changes or mutes single events.**

- Sound categories (card interactions, UI navigation, alerts) switch groups of events on and off.
- Users and devices can have their own volume, scheme and event sounds without changing the defaults.

See [Sound Configuration](./sounds).

### Users & Devices

**Shows this browser's device name and id, and lets administrators see and tidy the users and devices that have their own settings.**

- Anyone can rename their own device here. Device names are what [targeted actions](./ha-actions#targeting) use.
- Administrators also see every user with stored settings and every registered device.

See [Users & Devices](./users-devices).

### Pack Explorer

**Browses every content pack loaded in LCARdS and what each one adds.**

- Packs are listed with their themes, style presets, components and their presets, animations, SVG assets, fonts, sounds, images and textures.
- Picking an item shows its details and, for themes, presets and SVG assets, a preview.

### Storage [advanced]

**Shows the raw key and value store the integration keeps for LCARdS settings that are not in helpers.** Visible to administrators only.

:::warning Advanced: use with caution
Editing or deleting a key here changes LCARdS settings directly, with no checks. Use it to inspect or repair stored settings.
:::

- Lists every stored key, with a JSON viewer and an editor for each value.
- Deletes one key, after a confirmation, or resets the whole store, after an explicit confirmation.
- Useful for debugging, recovering from a broken stored value, or seeing what per-user and per-device settings hold.

---

## HA-LCARS Theme Profiles

**[HA-LCARS](https://github.com/th3jesta/ha-lcars) includes two theme profiles made for LCARdS.** They map the LCARdS palette onto the HA-LCARS chrome and Home Assistant's own colour tokens, so stock Home Assistant screens, LCARdS cards and the HA-LCARS chrome share one palette, alert mode colour shifts included. Pick one as your Home Assistant theme; there is nothing to install separately. See [HA-LCARS Theme Profiles](./ha-lcars-theme-profiles).
