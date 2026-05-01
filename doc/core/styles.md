# Card Styles

The `style:` block controls the visual appearance of a card — background colours, borders, and dimensions. Style values layer on top of a preset and can be further overridden at runtime by the Rules Engine.

---

## Structure

```yaml
type: custom:lcards-button
entity: light.living_room
preset: lozenge
style:
  card:
    color:
      background:
        default: var(--lcards-orange)
        inactive: var(--lcards-gray-dark)
  border:
    color: var(--lcards-blue)
    width: 2
    radius: 8
```

---

## `style.card`

Controls the card's body.

### `style.card.color.background`

The card's fill colour. Accepts a single value or separate values per interaction state.

```yaml
style:
  card:
    color:
      background: var(--lcards-orange)          # Same for all states
```

```yaml
style:
  card:
    color:
      background:
        default: var(--lcards-orange)           # Fallback
        active: var(--lcards-orange)            # Entity state is 'on' / active
        inactive: var(--lcards-gray-dark)       # Entity state is 'off' / inactive
        unavailable: var(--lcards-gray-darkest) # Entity unavailable
        hover: var(--lcards-orange-light)       # Mouse hover
        pressed: var(--lcards-orange-dark)      # During press/tap
```

All [colour formats](colours.md) are accepted — hex, rgb(), CSS variables, and `{theme:...}` tokens.

---

## `style.border`

Controls the border drawn around the card.

| Property | Type | Description |
|----------|------|-------------|
| `color` | colour | Border colour — supports all colour formats and state variants (same structure as `card.color.background`) |
| `width` | number | Border thickness in px |
| `radius` | number / object | Corner radius in px — uniform or per-corner |

### Border radius

```yaml alternatives
style:
  border:
    radius: 8                # Uniform — all four corners

style:
  border:
    radius:                  # Per-corner
      tl: 12
      tr: 12
      br: 4
      bl: 4
```

### Border colour with state variants

```yaml
style:
  border:
    color:
      default: var(--lcards-gray)
      active: var(--lcards-orange)
      inactive: var(--lcards-gray-dark)
```

---

## `style.icon`

Controls the card's icon display (when `show_icon: true`).

```yaml
style:
  icon:
    color: var(--lcards-orange)
    size: 24              # px
```

| Property | Type | Description |
|----------|------|-------------|
| `color` | colour | Icon colour — supports state variants |
| `size` | number | Icon size in px |

---

## Dimensions

Card dimensions are set at the top level, not inside `style:`.

```yaml
type: custom:lcards-button
width: 200
height: 48
min_height: 36
```

| Property | Type | Description |
|----------|------|-------------|
| `width` | number | Card width in px |
| `height` | number | Card height in px |
| `min_height` | number | Minimum height (card expands to fit content above this) |

---

## Interaction with Presets and Rules

Style values are applied in layers:

```
System defaults
    ↓
Preset (e.g. preset: lozenge)
    ↓
style: block in card YAML  ← your overrides
    ↓
Rule patches               ← runtime, from Rules Engine
```

You only need to set the properties that differ from the preset. To inspect what's actually being applied, open the card editor → **Main Engineering** → **Provenance Tracker**.

---

## Related

- [Presets](presets.md) — named style collections for quick setup
- [Colours](colours.md) — accepted colour formats, theme tokens, state maps
- [Rules Engine](rules/) — how style patches are applied at runtime
- [Main Engineering](../cards/main-engineering.md) — inspect runtime effective config per card
