# Colours

LCARdS accepts several colour formats wherever a colour value is expected. You can also define state-based colour maps so colours change automatically with entity state.

---

## Colour Value Formats

| Format | Example | Notes |
|--------|---------|-------|
| Hex 6-digit | `#FF9900` | Standard RGB hex |
| Hex 8-digit | `#FF990080` | Last two digits are alpha (00–FF) |
| RGB | `rgb(255, 153, 0)` | Standard CSS rgb() |
| RGBA | `rgba(255, 153, 0, 0.5)` | CSS rgba() with 0–1 alpha |
| CSS variable | `var(--lcards-orange)` | Any `--lcards-*` or HA CSS variable |
| Theme token path | `{theme:colors.ui.primary}` | Resolved from active theme |
| Computed token | `darken(var(--lcards-orange), 0.2)` | Computed by ThemeTokenResolver |

### CSS Variables

The `--lcards-*` variables are defined by the active theme pack. Common ones:

```yaml
var(--lcards-orange)
var(--lcards-orange-medium)
var(--lcards-blue)
var(--lcards-blue-light)
var(--lcards-moonlight)        # Near-white; default text and label colour
var(--lcards-gray)             # Standby / inactive state colour
var(--lcards-alert-red)
var(--lcards-alert-yellow)
```

### Theme Token Paths

Use `{theme:path.to.token}` to reference a value from the active theme's token tree:

```yaml
color: "{theme:colors.text.onDark}"
color: "{theme:colors.ui.primary}"
color: "{theme:colors.ui.secondary}"
color: "{theme:colors.alert.red}"
```

See [Themes](themes/README.md) for available token paths.

### Computed Colour Tokens

The ThemeTokenResolver supports derived colours:

```yaml
color: "darken(var(--lcards-orange), 0.2)"    # Darken by 20%
color: "lighten(var(--lcards-blue), 0.15)"    # Lighten by 15%
color: "alpha(var(--lcards-orange), 0.6)"     # Set opacity to 60%
```

---

## State-Based Colour Maps

Instead of a single colour string, you can supply an object whose keys are entity states. LCARdS resolves the right colour based on the entity bound to the card.

```yaml
style:
  border:
    color:
      default: "var(--lcards-gray)"
      active: "var(--lcards-orange)"
      inactive: "var(--lcards-gray)"
      unavailable: "var(--lcards-alert-red)"
      heat: "var(--lcards-alert-red)"       # Custom state — exact match
      cool: "var(--lcards-blue)"            # Custom state — exact match
```

### State Keys

| Key | Matched entity states |
|-----|-----------------------|
| `default` | Fallback for any unmatched state, or cards without an entity |
| `active` | `on` · `open` · `playing` · `home` · `heat` · `cool` · `auto` · `fan_only` · `dry` · `locked` · `armed_home` · `armed_away` · `armed_night` · `armed_vacation` · `armed_custom_bypass` · `cleaning` · `mowing` · `docked` · `returning` · `paused` · `active` · `above_horizon` |
| `inactive` | `off` · `closed` · `away` · `idle` · `stopped` · `standby` · `unlocked` · `disarmed` · `inactive` — and any state not in the `active` or `unavailable` lists |
| `unavailable` | `unavailable` · `unknown` |
| Any custom string | Exact match — e.g. `heat`, `cool`, `buffering`, `charging` |

### Resolution Order

For each colour field, the resolved value is determined in this order:

1. **Exact state match** — e.g. the entity state is `"heat"` and `heat:` key exists
2. **Classified state** — `active`, `inactive`, or `unavailable` based on the state table above
3. **`default`** key — fallback for any unmatched state
4. **Fallback parameter** — hard-coded theme default for that field

---

## Where Colour Maps Are Valid

State-based colour objects are accepted in all `color:` fields:

- `style.card.color.background`
- `style.border.color`
- `style.text.default.color` and `style.text.<field>.color`
- `icon_style.color`
- `shape_texture.config.color` (and `color_a`, `color_b`)
- `elbow.segment.color`
- Background animation `config.color`
- Divider `color`

---

## Comprehensive Example

A button that changes background, border, and text colour based on a climate entity's state:

```yaml
type: custom:lcards-button
entity: climate.living_room
preset: lozenge
text:
  label:
    content: Climate
    position: top-left
    color:
      default: "var(--lcards-moonlight)"
      active: "var(--lcards-orange)"
      unavailable: "var(--lcards-alert-red)"
  state:
    content: "{entity.state}"
    position: center
    color:
      heat: "var(--lcards-alert-red)"
      cool: "var(--lcards-blue)"
      auto: "var(--lcards-orange)"
      default: "var(--lcards-moonlight)"
style:
  card:
    color:
      background:
        default: "var(--ha-card-background)"
        active: "alpha(var(--lcards-orange), 0.08)"
  border:
    color:
      default: "var(--lcards-gray)"
      active: "var(--lcards-orange)"
      heat: "var(--lcards-alert-red)"
      cool: "var(--lcards-blue)"
      unavailable: "var(--lcards-alert-red)"
    width: 2
```

---
