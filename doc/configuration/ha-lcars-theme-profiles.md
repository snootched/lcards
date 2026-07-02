# LCARdS Theme Profiles for HA-LCARS

LCARdS ships a set of ready-made theme profiles designed to be used alongside the [**HA-LCARS**](https://github.com/th3jesta/ha-lcars) community theme.

- Uses the **LCARdS colour palette** (`--lcards-*` variables) that are provided automatically by the integration.
- The **HA core colour tokens** (`--ha-color-*`) which are used by stock Home Assistant components are remapped to LCARdS palette entries.  This helps bring more theme consistency across across the UI.
- All variables are assigned dynamic HA-LCARS/LCARdS palette references, meaning alert-mode hue rotations and light/dark mode switches propagate automatically.

---

## Prerequisites

You need **HA-LCARS** installed before applying these profiles.  Follow the installation guide on the [HA-LCARS repository](https://github.com/th3jesta/ha-lcars) first.

---

## Profile YAML

Download or copy from the file below and paste at the end of your `themes.yaml`:

→ **[ha-lcars-lcards-themes.yaml](https://github.com/snootched/lcards/tree/main/yaml/theme/ha-lcars-lcards-themes.yaml)**

---

## Available Profiles

| Profile name | Accent colour | Notes |
|---|---|---|
| `LCARS Picard [LCARdS Red Accent]` | Orange/Red (`--lcards-orange-*`) | Primary accent mapped to the LCARdS orange family |
| `LCARS Picard [LCARdS Blue Accent]` | Blue (`--lcards-blue-*`) | Primary accent mapped to the LCARdS blue family |

Both profiles include independent **light** and **dark** mode sections and cover the full 11-shade HA core colour token range, plus HA's `on-*`/`fill-*`/`border-*`/`surface-*` semantic layer (the vars behind buttons, chips, form fields, and dialogs).

---

## Installation

The profiles are appended to the end of your existing HA-LCARS `themes.yaml` file.  This is the standard HA-LCARS extension pattern — no existing theme entries are modified.

1. Open your HA-LCARS `themes.yaml` file (typically `config/themes/ha-lcars/themes.yaml`).
2. Scroll to the **very end** of the file.
3. Copy the entire contents of the profile YAML file linked below and paste it after the last line.
4. Reload themes in Home Assistant:  **Developer Tools → YAML → Reload Themes**, or call the `frontend.reload_themes` service.
5. Select the profile in **Profile → Theme** in the HA frontend.

---

## How the Colour Mapping Works

### HA Core Colour Tokens

Home Assistant's frontend exposes an 11-shade scale (05 → 95) for five colour families: `primary`, `neutral`, `orange`, `red`, and `green`.  These are consumed by stock HA components.  The profiles map each HA shade **1:1** to the matching stop on the [LCARdS 11-stop palette scale](../core/themes/index.md#lcards-css-colour-palette) — LCARdS's own palette was expanded from its original 7 canon stops specifically so this mapping wouldn't need to lossily collapse multiple HA shades onto the same colour.

The family mapping differs per profile accent:

| HA family | Red Accent profile | Blue Accent profile |
|---|---|---|
| `primary` | `--lcards-orange-*` | `--lcards-blue-*` |
| `neutral` | `--lcards-gray-*` | `--lcards-gray-*` |
| `orange` | `--lcards-yellow-*` | `--lcards-yellow-*` |
| `red` | `--lcards-orange-*` | `--lcards-orange-*` |
| `green` | `--lcards-green-*` | `--lcards-green-*` |

### Semantic Tokens (text-on-fill contrast)

Remapping the shade scale alone isn't enough for readable text: HA computes button, chip, and form-field text colours (`--ha-color-on-*`) by referencing a fixed tone number within the same palette (e.g. "text = tone 40 of whatever primary is"), on the assumption that any colour a theme substitutes will still read clearly at that tone. That assumption doesn't hold equally for every hue — LCARdS's orange family has a narrower readable-lightness range than its blue family, which is why the Red Accent profile could otherwise generate low-contrast button text.

Both profiles now explicitly set the full `on-*`/`fill-*`/`border-*`/`surface-*` semantic layer, with every text/background pairing checked against real WCAG contrast math and corrected where HA's mechanical default would fail — rather than relying on the shade-scale remapping to produce readable results by chance. See [ha-css-vars.md](../development/ha-css-vars.md#layer-2--semantic-colour-tokens) for the full technical detail.

---

## Related

- [HA-LCARS repository](https://github.com/th3jesta/ha-lcars)
- [LCARdS Colour Palette](../core/themes/index.md#lcards-css-colour-palette)
- [LCARdS Themes](../core/themes/index.md)
- [Alert Mode](../core/alert-mode.md)
- [Installation](../getting-started/installation.md)
