# Presets

Presets are named collections of style properties. Applying a preset to a card sets its shape, colours, typography, border, and state appearances in one step, instead of writing all those properties manually.

---

## Applying a Preset

```yaml live
type: custom:lcards-button
entity: light.living_room
preset: lozenge
```

That's it. The preset fills in every visual detail. You can then override any individual property on top:

```yaml live
type: custom:lcards-button
entity: light.living_room
preset: lozenge
style:
  card:
    color:
      background:
        inactive: var(--lcards-gray-dark)
```

Card-level config values always win; they are layered on top of the preset.

---

## Built-in Presets

These tables list every preset in the built-in packs (`src/core/packs/style-presets/`). A `-right` variant mirrors its preset (rounded or capped end on the other side). A test (`tests/core/presets-doc.test.js`) keeps these tables in sync with the packs.

### Button (`lcards-button`)

| Preset | Description |
|--------|-------------|
| `base` | Foundation every other button preset builds on: minimal styles only |
| `lozenge` | Classic LCARS lozenge: rounded ends, primary colour fill |
| `lozenge-right` | Lozenge mirrored |
| `bullet` | Lozenge rounded on one side only, flat on the other: navigation bullets |
| `bullet-right` | Bullet mirrored |
| `capped` | Lozenge with one capped end: row labels |
| `capped-right` | Capped mirrored |
| `barrel` | Square-cornered block |
| `barrel-right` | Barrel mirrored |
| `filled` | Solid filled button |
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
| `panel-light` | Square-cornered panel with a random LCARS label (light); with an entity, the theme accent when on and the dark structure tone when off |
| `toggle-tab` | Dark square tab with a centred name; a coloured line along the top shows the state |
| `panel-flagged` | Dark code panel with a thin accent flag on its left edge |
| `panel-dark` | Square-cornered panel with a random LCARS label (dark); with an entity, the theme accent when on and the dark structure tone when off |

Rendered:

<CardGallery set="button-presets" />

<CardGallery set="button-bar-labels" />

<CardGallery set="button-panels" />

### Slider (`lcards-slider`)

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
| `picard-gauge-vertical` | Picard-style vertical gauge |

Rendered:

<CardGallery set="slider-presets" />

### Elbow and select menu

The elbow accepts the **button** presets above (`preset:` styles its segments the way it styles a button). Its geometry is chosen separately with `elbow.type` (`header-left`, `header-right`, `footer-left`, `footer-right`, and more: see [Elbow](../cards/elbow/index.md)).

The select menu's `preset:` is a button preset applied to every option button.

Charts and data grids have no style presets (their `preset` keys are animation presets).

---

## How Presets Compose

When a card loads, preset resolution works in layers:

```
System defaults
    ↓
Preset values
    ↓
Card config (your YAML)  ← wins on conflict
    ↓
Rule patches (runtime)   ← wins over everything
```

You only need to specify what differs from the preset. Anything you don't set falls through to the preset, and anything the preset doesn't set falls through to the system default.

---

## Browsing Available Presets

The card editor surfaces presets in two ways:

- **Config tab** → the "Preset" dropdown: shows all presets for the current card type
- **Config Panel** → Pack Explorer: lists all presets from every installed pack, grouped by card type

---

## Packs and Custom Presets

Presets come from content packs. The built-in `lcards_buttons` and `lcards_sliders` packs provide the presets listed above. Additional packs (including community packs) can add their own presets; these appear in the editor's preset list automatically once the pack is installed.

See [Pack System](../architecture/subsystems/pack-system.md) for how to create packs with custom presets.

---

## Related

- [Styles](styles.md): the `style:` block reference for overriding visual properties
- [Rules Engine](rules/): rules can patch style properties at runtime, overriding both preset and card config
- [Common Card Properties](../cards/common.md): shared card keys
