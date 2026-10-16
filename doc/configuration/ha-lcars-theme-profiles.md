# LCARdS Theme Profiles for HA-LCARS

[**HA-LCARS**](https://github.com/th3jesta/ha-lcars) includes two themes made for LCARdS: **LCARS Picard [LCARdS Red Accent]** and **LCARS Picard [LCARdS Blue Accent]**. Pick one and Home Assistant's own screens, the HA-LCARS chrome and your LCARdS cards all share one palette.

- Uses the **LCARdS colour palette** (`--lcards-*` variables) that are provided automatically by the integration.
- The **HA core colour tokens** (`--ha-color-*`) which are used by stock Home Assistant components are remapped to LCARdS palette entries.  This helps bring more theme consistency across across the UI.
- All variables are assigned dynamic HA-LCARS/LCARdS palette references, meaning alert-mode hue rotations and light/dark mode switches propagate automatically.

---

## Using a profile

1. Install or update [HA-LCARS](https://github.com/th3jesta/ha-lcars) (the LCARdS profiles are part of its theme file; update if you don't see them).
2. In Home Assistant, open your **Profile** and pick **LCARS Picard [LCARdS Red Accent]** or **LCARS Picard [LCARdS Blue Accent]** as the theme.

That's all: there is nothing to copy into `themes.yaml`.

To make your own profile, use the [HA-LCARS Theme Lab](ha-lcars-theme-lab) in the LCARdS panel: start from one of these profiles, change its palettes, and add the result to HA-LCARS.

---

## Available Profiles

| Profile name | Accent colour | Notes |
|---|---|---|
| `LCARS Picard [LCARdS Red Accent]` | Orange/Red (`--lcards-orange-*`) | Primary accent mapped to the LCARdS orange family |
| `LCARS Picard [LCARdS Blue Accent]` | Blue (`--lcards-blue-*`) | Primary accent mapped to the LCARdS blue family |

Both profiles include independent **light** and **dark** mode sections and cover the full 11-shade HA core colour token range, plus HA's `on-*`/`fill-*`/`border-*`/`surface-*` semantic layer (the vars behind buttons, chips, form fields, and dialogs).

---

## How the Colour Mapping Works

### HA Core Colour Tokens

Home Assistant's frontend exposes an 11-shade scale (05 → 95) for five colour families: `primary`, `neutral`, `orange`, `red`, and `green`.  These are consumed by stock HA components.  The profiles map each HA shade **1:1** to the matching stop on the [LCARdS 11-stop palette scale](../core/themes/index.md#lcards-css-colour-palette); LCARdS's own palette was expanded from its original 7 canon stops specifically so this mapping wouldn't need to lossily collapse multiple HA shades onto the same colour.

The family mapping differs per profile accent:

| HA family | Red Accent profile | Blue Accent profile |
|---|---|---|
| `primary` | `--lcards-orange-*` | `--lcards-blue-*` |
| `neutral` | `--lcards-gray-*` | `--lcards-gray-*` |
| `orange` | `--lcards-yellow-*` | `--lcards-yellow-*` |
| `red` | `--lcards-orange-*` | `--lcards-orange-*` |
| `green` | `--lcards-green-*` | `--lcards-green-*` |

### Semantic Tokens (text-on-fill contrast)

Remapping the shade scale alone isn't enough for readable text: HA computes button, chip, and form-field text colours (`--ha-color-on-*`) by referencing a fixed tone number within the same palette (e.g. "text = tone 40 of whatever primary is"), on the assumption that any colour a theme substitutes will still read clearly at that tone. That assumption doesn't hold equally for every hue: LCARdS's orange family has a narrower readable-lightness range than its blue family, which is why the Red Accent profile could otherwise generate low-contrast button text.

Both profiles now explicitly set the full `on-*`/`fill-*`/`border-*`/`surface-*` semantic layer, with every text/background pairing checked against real WCAG contrast math and corrected where HA's mechanical default would fail, rather than relying on the shade-scale remapping to produce readable results by chance. See [ha-css-vars.md](../development/ha-css-vars.md#layer-2-semantic-colour-tokens) for the full technical detail.

---

## Related

- [HA-LCARS repository](https://github.com/th3jesta/ha-lcars)
- [LCARdS Colour Palette](../core/themes/index.md#lcards-css-colour-palette)
- [LCARdS Themes](../core/themes/index.md)
- [Alert Mode](../core/alert-mode.md)
- [Installation](../getting-started/installation.md)
