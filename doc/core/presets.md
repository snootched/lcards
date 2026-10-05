# Presets

Presets are named collections of style properties. Applying a preset to a card sets its shape, colours, typography, border, and state appearances in one step, instead of writing all those properties manually.

---

## Applying a Preset

```yaml
type: custom:lcards-button
entity: light.living_room
preset: lozenge
```

That's it. The preset fills in every visual detail. You can then override any individual property on top:

```yaml
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

### Button (`lcards-button`)

| Preset | Description |
|--------|-------------|
| `lozenge` | Classic LCARS lozenge: bevelled rounded pill shape, primary colour fill |
| `bullet` | Flat left-anchored lozenge used as navigation bullets |
| `capped` | Cap-style short block, typically used for row labels |
| `pill` | Symmetrical pill shape with no angled ends |
| `outline` | Transparent fill with a border outline |
| `text` | Minimal: no border, no background, text only |
| `text-label` | Text-only with a subtle label style |
| `base` | Foundation all other presets build on: minimal styles only |

### Slider (`lcards-slider`)

| Preset | Description |
|--------|-------------|
| `pills` | Segmented pill bar: default LCARS-style slider |
| `gauge` | Ruler-style gauge with tick marks |

### Elbow (`lcards-elbow`)

| Preset | Description |
|--------|-------------|
| `header-left` | Standard LCARS top-left corner |
| `header-right` | Standard LCARS top-right corner |
| `footer-left` | Standard LCARS bottom-left corner |
| `footer-right` | Standard LCARS bottom-right corner |

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

Presets come from content packs. The built-in `lcards_buttons` pack provides all the presets listed above. Additional packs (including community packs) can add their own presets; these appear in the editor's preset list automatically once the pack is installed.

See [Pack System](../architecture/subsystems/pack-system.md) for how to create packs with custom presets.

---

## Related

- [Styles](styles.md): the `style:` block reference for overriding visual properties
- [Rules Engine](rules/): rules can patch style properties at runtime, overriding both preset and card config
- [Common Card Properties](../cards/common.md): `preset` is available on all cards
