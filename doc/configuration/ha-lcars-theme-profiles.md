---
description: "The two LCARdS theme profiles HA-LCARS ships (LCARdS Red Accent and Blue Accent): one palette for Home Assistant's own screens, the HA-LCARS chrome and LCARdS cards, and how their colours are mapped."
---

# LCARdS Theme Profiles for HA-LCARS

**[HA-LCARS](https://github.com/th3jesta/ha-lcars) includes two themes made for LCARdS: LCARS Picard [LCARdS Red Accent] and LCARS Picard [LCARdS Blue Accent].** Pick one, and Home Assistant's own screens, the HA-LCARS chrome and your LCARdS cards all share one palette.

- They use the LCARdS colour palette (the `--lcards-*` variables), which the integration provides.
- Home Assistant's core colour tokens (`--ha-color-*`), used by stock Home Assistant components, are mapped onto LCARdS palette colours, so the whole interface looks of a piece.
- Every colour points at a palette variable rather than a fixed value, so alert mode colour shifts and the switch between light and dark mode reach everything.

---

## Using a profile

**Install or update HA-LCARS, then pick one of the profiles as your theme.** There is nothing to copy into `themes.yaml`.

1. Install or update [HA-LCARS](https://github.com/th3jesta/ha-lcars): the LCARdS profiles are part of its theme file, so update it if you don't see them.
2. In Home Assistant, open your **Profile** and pick **LCARS Picard [LCARdS Red Accent]** or **LCARS Picard [LCARdS Blue Accent]** as the theme.

To make your own profile, use the [HA-LCARS Theme Lab](./ha-lcars-theme-lab) in LCARdS Config: start from one of these profiles, change its palettes, and add the result to HA-LCARS.

---

## Available Profiles

**Two profiles, differing in the accent colour Home Assistant's own buttons and controls use.**

| Profile name | Accent colour | Notes |
|---|---|---|
| `LCARS Picard [LCARdS Red Accent]` | Orange and red (`--lcards-orange-*`) | Home Assistant's primary colour is the LCARdS orange family |
| `LCARS Picard [LCARdS Blue Accent]` | Blue (`--lcards-blue-*`) | Home Assistant's primary colour is the LCARdS blue family |

Both profiles have separate **light** and **dark** mode sections. They cover all 11 shades of Home Assistant's core colour tokens, and Home Assistant's `on-*`, `fill-*`, `border-*` and `surface-*` colours (the ones behind buttons, chips, form fields and dialogs).

---

## How the Colour Mapping Works

### Home Assistant Core Colour Tokens

**Home Assistant's frontend has an 11-shade scale (05 to 95) for five colour families: `primary`, `neutral`, `orange`, `red` and `green`.** Stock Home Assistant components use them.

- The profiles map each Home Assistant shade one to one onto the matching stop of the [LCARdS 11-stop palette](../core/themes/index.md#lcards-css-colour-palette).
- The LCARdS palette grew from its original 7 canon stops to 11 for exactly this, so no two Home Assistant shades have to share one colour.

The family mapping differs per profile:

| Home Assistant family | Red Accent profile | Blue Accent profile |
|---|---|---|
| `primary` | `--lcards-orange-*` | `--lcards-blue-*` |
| `neutral` | `--lcards-gray-*` | `--lcards-gray-*` |
| `orange` | `--lcards-yellow-*` | `--lcards-yellow-*` |
| `red` | `--lcards-orange-*` | `--lcards-orange-*` |
| `green` | `--lcards-green-*` | `--lcards-green-*` |

### Semantic Tokens (text-on-fill contrast)

**Both profiles also set Home Assistant's text and fill colours themselves, so button and chip text stays readable.**

- Home Assistant picks the text colour of buttons, chips and form fields (`--ha-color-on-*`) as a fixed tone of the same palette, such as "tone 40 of whatever primary is", assuming any colour a theme puts there still reads well at that tone.
- That doesn't hold equally for every hue: the LCARdS orange family has a narrower readable range of lightness than the blue one, so the Red Accent profile would otherwise get low-contrast button text.
- The profiles therefore set the whole `on-*`, `fill-*`, `border-*` and `surface-*` layer, with every text and background pair checked against WCAG contrast and corrected where Home Assistant's default would fail. See [ha-css-vars.md](../development/ha-css-vars.md#layer-2-semantic-colour-tokens) for the technical detail.

---

## Related

- [HA-LCARS repository](https://github.com/th3jesta/ha-lcars)
- [HA-LCARS Theme Lab](./ha-lcars-theme-lab): build your own profile
- [LCARdS Colour Palette](../core/themes/index.md#lcards-css-colour-palette)
- [LCARdS Themes](../core/themes/index.md)
- [Alert Mode](../core/alert-mode.md)
- [Installation](../getting-started/installation.md)
