# Alert Mode Lab

The **Alert Mode Lab** is a tab in the [LCARdS Config Panel](./index.md) for customising the colour palette applied to each alert level. Changes can be previewed live before saving.

---

## What It Does

LCARdS Alert Mode shifts card colours across your entire dashboard when an alert is active. The Lab lets you tune how each alert level looks by adjusting per-mode colour parameters — then saves those values as HA input helpers so they persist across restarts.

---

## Accessing the Lab

1. Open the **LCARdS Config Panel** (sidebar entry in Home Assistant)
2. Navigate to the **Alert Mode Lab** tab

::: tip Prerequisites
[Persistent helpers](persistent-helpers.md) must exist before saving Lab settings. Run **Create All Helpers** from the Helpers tab first.
:::

---

## Per-Mode Parameters

Each alert level (`red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert`) has its own set of colour parameters.

### HSL Parameters

These shift the overall colour of cards while that mode is active.

| Parameter | Description |
|-----------|-------------|
| **Hue** | Base hue shift (0–360°) applied to all colours |
| **Hue Strength** | How strongly the hue shift is applied (0–1) |
| **Saturation** | Overall saturation adjustment |
| **Lightness** | Overall lightness adjustment |

### Anchor Parameters *(Red, Yellow, Blue)*

Anchor parameters lock specific colours to a target hue, useful for keeping key UI elements (like accent colours) visually correct even under a hue shift.

| Parameter | Description |
|-----------|-------------|
| **Anchor Center Hue** | The hue value to anchor (the colour you want to protect) |
| **Anchor Range** | How wide a hue band around the center is affected |
| **Anchor Strength** | How strongly the anchor effect is applied (0–1) |

### Contrast Parameters *(Black)*

The `black_alert` mode uses contrast parameters instead of hue anchors to create the near-monochrome blackout effect.

| Parameter | Description |
|-----------|-------------|
| **Contrast Threshold** | Lightness threshold below which colours are pushed dark |
| **Dark Multiplier** | Multiplier applied to dark colours (< threshold) |
| **Light Multiplier** | Multiplier applied to light colours (> threshold) |

---

## Live Preview

Changes in the Lab are reflected in real time on any open Lovelace dashboard. You can switch between alert levels and adjust parameters while watching the effect on your actual cards before committing.

---

## Saving Settings

Click **Save** in the Lab to write all current parameter values to their corresponding `input_number` helpers. These helpers are created and managed automatically — you don't need to set them up manually.

Helper naming convention: `input_number.lcards_alert_lab_<mode>_<parameter>`, for example:
- `input_number.lcards_alert_lab_red_hue`
- `input_number.lcards_alert_lab_yellow_saturation`
- `input_number.lcards_alert_lab_black_threshold`

---

## Related

- [Alert Mode](../core/alert-mode.md) — how alert mode works, how to trigger it, and how cards respond
- [Persistent Helpers](persistent-helpers.md) — full helper reference including alert Lab parameters
- [Sounds](../core/sounds.md) — per-mode sound events fired when alert mode changes
