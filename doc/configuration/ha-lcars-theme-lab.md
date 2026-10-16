---
description: "Build your own HA-LCARS theme profile in the LCARdS panel's HA-LCARS Theme Lab: palettes for HA's five colour roles, LCARS chrome, state colours, a live preview, and YAML to add to HA-LCARS."
---

# HA-LCARS Theme Lab

The **HA-LCARS Theme Lab** builds your own theme profile for [HA-LCARS](https://github.com/th3jesta/ha-lcars), the same kind as the [LCARdS profiles](ha-lcars-theme-profiles) HA-LCARS ships. Start from any HA-LCARS theme, change its colours, check the result, and copy the YAML into HA-LCARS.

- **Five full palettes:** the colour roles Home Assistant's own screens use (primary, neutral, warning, danger, success), each an 11-tone scale, with separate light and dark versions if you want them.
- **Readable by design:** button text colours are checked for contrast and corrected automatically.
- **Everything else in one place:** the LCARS chrome (sidebar, header, status bars), legacy HA colours and the colour of every entity state.

Open it from the LCARdS panel: **Theme Studio > HA-LCARS Theme Lab**.

![The HA-LCARS Theme Lab: the Start section with a theme to load, below the Configuration and Preview & Export switch](/img/theme-lab/start.webp)

## 1. Start from a theme

- **Load from HA-LCARS:** pick a theme. Ones installed on your Home Assistant are marked *installed on this HA*; the others are reference copies bundled with LCARdS. A good start is one of the LCARdS profiles, **LCARS Picard [LCARdS Red Accent]** or **[LCARdS Blue Accent]**.
- **Paste theme YAML:** bring in a theme you already have, including one you made here earlier.
- Give your theme a **Theme Name**. That is the name you'll pick in Home Assistant later.

## 2. Palette Seed: the five colour roles

![Palette Seed: the Primary role with its 11-tone light and dark scales, button badges and contrast notes, and the other four roles below](/img/theme-lab/palette-seed.webp)

Each role (**Primary**, **Neutral**, **Orange (Warning)**, **Red (Danger)**, **Green (Success)**) gets a full scale of tones, from darkest to lightest. For each role, choose where it comes from:

- **None:** leave it to Home Assistant's own default.
- **LCARdS Palettes:** use one of the LCARdS colour families (orange, gray, blue, green, yellow).
- **Custom:** set the tones yourself.
- **Imported:** keep the scale of the theme you loaded.

Tips:

- Turn on separate **dark mode** tones for a role when light and dark mode should look different.
- The small **A**, **F**, **T** and **O** badges show which tone becomes a button's background or text (open *The A/F/T/O badges* for details).
- When a tone wouldn't be readable as button text, the lab picks a readable one on export and explains it under the role.

## 3. The other sections

- **HA-LCARS & Legacy HA Semantic Colours:** the LCARS chrome (sidebar, header, status bars, buttons) and the older Home Assistant colour variables. Anything you leave unset keeps HA-LCARS's or Home Assistant's default.
- **Domain & State Colours:** the colour of an entity's icon in each state, per domain (lights, locks, climate and more), with a global fallback.
- **Advanced / Raw Overrides:** any other theme variable, by name.

## 4. Preview and export

Switch to **Preview & Export** to check the theme in **Light** and **Dark**: the full palettes, a mock-up of the LCARS chrome, and real Home Assistant controls (buttons, switches, inputs) drawn with your colours.

![Preview & Export: the five palettes in dark mode with their button badges](/img/theme-lab/preview.webp)

At the bottom, **Copy YAML** copies the finished theme.

![Generated Theme YAML: the instructions and the Copy YAML button above the theme's YAML](/img/theme-lab/export.webp)

## 5. Add it to HA-LCARS

The theme builds on HA-LCARS's shared settings (its fonts, chrome and styling), so it goes into HA-LCARS's own theme file, as HA-LCARS's own guide to [making your own colour themes](https://github.com/th3jesta/ha-lcars#make-your-own-color-themes) describes:

1. Open HA-LCARS's theme file, `lcars.yaml`, in the `themes` folder of your Home Assistant configuration.
2. Paste the YAML at the very end of the file.
3. Reload themes: **Developer tools > YAML > Themes**, or the `frontend.reload_themes` action.
4. Pick your theme in your **Profile** (or set it as the default theme).

::: warning Keep a copy of your theme
Updating HA-LCARS (for example through HACS) replaces `lcars.yaml`, and your theme with it. Keep the YAML somewhere safe and paste it back after an update. To change it later, load it again with **Paste theme YAML**.
:::

## Related

- [HA-LCARS Theme Profiles](ha-lcars-theme-profiles): the ready-made LCARdS profiles
- [Alert Mode Lab](alert-mode-lab): how each alert mode recolours your dashboards
- [Themes](../core/themes/): LCARdS theme tokens and the colour palette
