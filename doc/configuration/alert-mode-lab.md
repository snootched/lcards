---
description: "The LCARdS Alert Mode Lab: tune how each alert mode recolours your dashboards (hue, strength, saturation, lightness, hue anchors, black alert contrast), preview it, and save it to helpers."
moved_anchors:
  what-it-does: /configuration/alert-mode-lab
  accessing-the-lab: /configuration/alert-mode-lab#using-the-lab
  per-mode-parameters: /configuration/alert-mode-lab#core-transform-parameters
  hsl-parameters: /configuration/alert-mode-lab#core-transform-parameters
  anchor-parameters-red-yellow-blue: /configuration/alert-mode-lab#hue-anchoring
  contrast-parameters-black: /configuration/alert-mode-lab#contrast-enhancement
  live-preview: /configuration/alert-mode-lab#using-the-lab
  saving-settings: /configuration/alert-mode-lab#using-the-lab
---

# Alert Mode Lab

**The Alert Mode Lab tunes how each alert mode recolours your dashboards, shows the result, and saves it to helpers so it lasts.** It is the first tab of **LCARdS Config > Theme Studio**.

- An alert mode turns every theme colour toward one hue and changes its saturation and lightness. Red, yellow and blue alert also pull colours into a hue band; black alert pushes dark colours darker and light ones lighter.
- Green alert is the baseline (the theme's own colours) and has nothing to tune.
- [Alert Mode](../core/alert-mode) explains what alert mode does and how to raise it.

::: tip Prerequisites
**Save to helpers** needs the Alert Mode Lab helpers. Click **Create All** in the [Helpers tab](./index.md#helpers) first.
:::

---

## Using the Lab

**Pick a mode, move the sliders, apply it to see it, then save.**

- **Alert mode** picks the mode to tune. With **Apply the mode when selected** on, choosing a mode also applies it.
- **Apply Live** applies the mode with the Lab's current values in this browser, so you can open a dashboard and look. It does not change `input_select.lcards_alert_mode` or other browsers.
- **Reset** puts the mode's sliders back to their built-in values. **Save to helpers** writes them to the mode's [helpers](./persistent-helpers#alert-mode-lab-parameters); every browser uses the saved values the next time that mode is raised.
- The right side has three views: **Live Preview** (key LCARS colours in the mode), **HSL Wheel** (how each colour moves; circles are green alert, squares the selected mode) and **Full Comparison** (every LCARS colour variable, before and after).

---

## Core Transform Parameters

**The four sliders every mode has: the hue colours turn toward, how far they turn, and how saturated and light they are.**

| Slider | Range | Description |
|--------|-------|-------------|
| **Hue Target** | 0 to 360° | The hue every colour is turned toward |
| **Hue Strength** | 0 to 1 | How far colours turn: `0` leaves hues alone, `1` turns them all the way |
| **Saturation** | 0 to 3× | Multiplies saturation: below 1 is more muted, above 1 more vivid |
| **Lightness** | 0 to 2× | Multiplies lightness: below 1 is darker, above 1 brighter |

## Hue Anchoring

**Red, yellow and blue alert also pull colours into a band of hues, so the whole palette reads as one colour family.** Colours already near the band move little; the rest are pulled in.

| Slider | Range | Description |
|--------|-------|-------------|
| **Center Hue** | 0 to 360° | Centre of the band |
| **Range** | 0 to 180° | How far the band reaches either side of the centre |
| **Pull Strength** | 0 to 1 | How strongly colours are pulled into the band |

## Contrast Enhancement

**Black alert splits colours at a lightness threshold: colours below it get darker and colours above it get lighter, which keeps text readable on a near-black screen.**

| Slider | Range | Description |
|--------|-------|-------------|
| **Threshold** | 0 to 100% | The lightness that splits dark colours from light ones |
| **Dark Multiplier** | 0 to 1 | Multiplies the lightness of colours below the threshold |
| **Light Multiplier** | 1 to 2 | Multiplies the lightness of colours above the threshold |

---

## Defaults

**The values each mode starts with: what its helpers are created with, and what LCARdS uses when they are missing.** Saturation and lightness are shown as multipliers here; the helpers store them as percentages (`1.4` is `140`).

| Mode | Hue Target | Hue Strength | Saturation | Lightness | Anchor (centre, range, strength) | Contrast (threshold, dark, light) |
|------|-----------|--------------|------------|-----------|----------------------------------|-----------------------------------|
| Red | 0° | 0.8 | 1.4× | 0.9× | 0°, 60°, 0.9 | - |
| Yellow | 45° | 0.9 | 1.5× | 1.05× | 45°, 50°, 0.9 | - |
| Blue | 210° | 0.85 | 1.5× | 1.0× | 210°, 70°, 0.85 | - |
| Gray | 0° | 0 | 0× | 1.0× | - | - |
| Black | 0° | 0 | 0× | 0.7× | - | 69%, 0.6, 1.0 |

---

## Related

- [Alert Mode](../core/alert-mode): how alert mode works, how to raise it, and how cards respond
- [Persistent Helpers](./persistent-helpers#alert-mode-lab-parameters): the helper behind each slider
- [Sound Configuration](./sounds): the sound each alert mode plays
