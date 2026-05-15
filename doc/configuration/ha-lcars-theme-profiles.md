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

Both profiles include independent **light** and **dark** mode sections and cover the full 11-shade HA core colour token range.

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

Home Assistant's frontend exposes an 11-shade scale (05 → 95) for five colour families: `primary`, `neutral`, `orange`, `red`, and `green`.  These are consumed by stock HA components.  The profiles map each HA shade to the nearest stop on the [LCARdS 7-stop palette scale](../core/themes/index.md#lcards-css-colour-palette).

The family mapping differs per profile accent:

| HA family | Red Accent profile | Blue Accent profile |
|---|---|---|
| `primary` | `--lcards-orange-*` | `--lcards-blue-*` |
| `neutral` | `--lcards-gray-*` | `--lcards-gray-*` |
| `orange` | `--lcards-yellow-*` | `--lcards-yellow-*` |
| `red` | `--lcards-orange-*` | `--lcards-orange-*` |
| `green` | `--lcards-green-*` | `--lcards-green-*` |

---

## Related

- [HA-LCARS repository](https://github.com/th3jesta/ha-lcars)
- [LCARdS Colour Palette](../core/themes/index.md#lcards-css-colour-palette)
- [LCARdS Themes](../core/themes/index.md)
- [Alert Mode](../core/alert-mode.md)
- [Installation](../getting-started/installation.md)
