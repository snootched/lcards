---
description: "LCARdS style presets: apply a whole button or slider look with one preset key, every built-in preset with pictures, how presets layer under your own config, and where they come from."
---

# Presets

**A preset is a named look for a card: one `preset:` key sets its shape, colours, text, border and how it shows each state.** Pick the nearest preset, then override only what you want to change.

- Buttons, elbows and select menus take the [button presets](#button-lcards-button); sliders take the [slider presets](#slider-lcards-slider).
- Your own config always wins over the preset, and [rules](rules/) win over both while the dashboard runs.

## Applying a Preset

**Set `preset:` to a preset's name, then add your own keys on top.** Anything you set replaces the preset's value for that key; everything else stays as the preset has it.

- Many button presets hide the entity's name; `text.name.show: true` brings it back.
- A preset can set more than `style:`: the button presets also set `min_height` and the icon and text layout, and `icon` and the `bar-label-*` presets set a fixed `height`.

```yaml live
# The lozenge preset as it is (tap to toggle the light)
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  name:
    show: true
tap_action:
  action: toggle
```

```yaml live
# The same preset with a grey fill while the light is off
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  name:
    show: true
style:
  card:
    color:
      background:
        inactive: var(--lcards-gray-dark)
tap_action:
  action: toggle
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `preset` | string | - | The preset's name. A button, elbow or select menu takes a button preset; a slider takes a slider preset. Without one a slider draws pills or a gauge, by the entity's domain |

## Built-in Presets

**Every preset in the built-in packs, with a picture of each.** A `-right` variant mirrors its preset (rounded or capped end on the other side). A test (`tests/core/presets-doc.test.js`) keeps these tables in sync with the packs.

### Button (`lcards-button`)

`base` is the foundation the others build on; the editor's preset list leaves it out.

| Preset | Description |
|--------|-------------|
| `base` | Foundation every other button preset builds on: minimal styles only |
| `lozenge` | Classic LCARS lozenge: rounded ends, primary colour fill |
| `lozenge-right` | Lozenge mirrored, with the icon shown on the right |
| `bullet` | Lozenge rounded on the right only, flat on the left: navigation bullets |
| `bullet-right` | Bullet mirrored: rounded on the left |
| `capped` | Lozenge with one capped end, rounded on the left: row labels |
| `capped-right` | Capped mirrored: rounded on the right |
| `barrel` | Square-cornered block |
| `barrel-right` | Barrel mirrored |
| `filled` | Solid filled button with its name shown |
| `filled-right` | Filled mirrored |
| `outline` | Transparent fill with a border outline |
| `outline-right` | Outline mirrored |
| `icon` | Icon-only button |
| `text-only` | Pure text label with no background or border |
| `bar-label-base` | Base bar label: a filled bar with a text "break" in it |
| `bar-label-left` | Bar label with left-aligned text |
| `bar-label-center` | Bar label with centred text |
| `bar-label-right` | Bar label with right-aligned text |
| `bar-label-square` | Bar label with square corners, for large indicators |
| `bar-label-lozenge` | Bar label with rounded ends (pill shape) |
| `bar-label-bullet-left` | Bar label rounded on the right, flat on the left |
| `bar-label-bullet-right` | Bar label flat on the right, rounded on the left |
| `bar-label-capped-left` | Bar label rounded on the left, flat on the right |
| `bar-label-capped-right` | Bar label rounded on the right, flat on the left |
| `panel-light` | Square-cornered panel with a random LCARS label (light); with an entity, the theme accent when on and the dark structure tone when off. No hover effects |
| `toggle-tab` | Dark square tab with a centred name; a coloured line along the top shows the state |
| `panel-flagged` | Dark code panel with a thin accent flag on its left edge. No hover effects |
| `panel-dark` | Square-cornered panel with a random LCARS label (dark); with an entity, the theme accent when on and the dark structure tone when off. No hover effects |

Rendered:

<CardGallery set="button-presets" />

<CardGallery set="button-bar-labels" />

<CardGallery set="button-panels" />

### Slider (`lcards-slider`)

`base` is the foundation the others build on; the editor's preset list leaves it out.

| Preset | Description |
|--------|-------------|
| `base` | Foundation every other slider preset builds on |
| `pills-basic` | Segmented pill slider |
| `pills-left-border` | Pills slider with a left border |
| `pills-left-border-rounded` | Pills with a left border and a rounded free end |
| `gauge-basic` | Ruler-style gauge for displays and controls |
| `gauge-left-border` | Gauge slider with a left border |
| `gauge-left-border-rounded` | Gauge with a left border and a rounded free end |
| `shaped-vertical` | Vertical shaped slider with exterior text labels (`style.shaped.type` picks the shape) |
| `shaped-horizontal` | Horizontal shaped slider with exterior text labels |
| `ring` | Ring gauge: a 270 degree value arc around a large value, the name above it (`component: ring`) |
| `picard-ring` | Picard-era ring: near-full thick ring with flat ends, small label over a large value |
| `picard-gauge-vertical` | Picard-style vertical gauge (`component: picard`) |

Rendered:

<CardGallery set="slider-presets" />

### Elbow and select menu

**The select menu takes the button presets above; the elbow has no presets.** An elbow's shape comes from `elbow.type` (`header-left`, `footer-right`, `frame` and more: see [Elbow](../cards/elbow/index.md)) and its look from `style`.

- The select menu's `preset:` is a button preset applied to every option button. Its `button_template.style`, its `style` and each option's own `style` go on top, in that order.
- Charts and data grids have no style presets (their `preset` keys are animation presets).

## How Presets Compose

**When a card loads, its config is built in layers, and each layer wins over the one before it.**

```
System defaults
    ↓
Preset values
    ↓
Card config (your YAML)  ← wins on conflict
    ↓
Rule patches (runtime)   ← wins over everything
```

- You only need to specify what differs from the preset. Anything you don't set falls through to the preset, and anything the preset doesn't set falls through to the system default.
- Objects merge key by key: a `style.border.radius` with only `top_left` keeps the preset's other three corners.
- On a button with a `component`, `preset` names one of the component's own presets instead (see [Button components](/cards/button/components)).
- The card editor's [Main Engineering](../cards/main-engineering.md#provenance) tab shows which layer set each value.

## Browsing Available Presets

**The card editor and the LCARdS config panel both list the presets you can use.**

- **Config tab** → the preset dropdown: shows the presets for the current card type.
- **Config panel** → **Pack Explorer**: lists every preset from every loaded pack, grouped by card type. The Theme panel of the card editor's [Main Engineering](../cards/main-engineering.md#theme) tab has a button that opens it.

## Packs and Custom Presets

**Presets come from content packs.** The built-in `lcards_buttons` and `lcards_sliders` packs provide the presets listed above, and LCARdS loads them when it starts.

- A pack registered with `window.lcards.core.packManager.registerPack()` adds its presets to the editor's lists. There is no way yet to install a pack from YAML or the editor.
- A preset can build on another with `extends` (`extends: button.lozenge`): it starts from that preset and changes only what it sets.

See [Pack System](../architecture/subsystems/pack-system.md) for how to create packs with custom presets.

## Related

- [Styles](styles.md): the `style:` block reference for overriding visual properties
- [Rules Engine](rules/): rules can patch style properties at runtime, overriding both preset and card config
- [Common Card Properties](../cards/common.md): shared card keys
