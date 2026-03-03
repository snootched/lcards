# Elbow Card

`custom:lcards-elbow`

The Elbow card creates the iconic LCARS corner/cap shapes — the L-shaped colored bars that frame sections of an LCARS interface. Extends the button card so it inherits text, actions, rules, animations, and templates.

---

## Quick Start

```yaml
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
```

---

## Top-Level Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | `custom:lcards-elbow` (required) |
| `elbow` | object | Elbow geometry and styling (required) |
| `entity` | string | Entity to monitor (for state-based styling) |
| `id` | string | Card ID for rule targeting |
| `tags` | list | Tags for rule targeting |
| `text` | object | Text labels (same as button card) |
| `style` | object | Card background, border, text styles |
| `tap_action` | object | Tap action |
| `hold_action` | object | Hold action |
| `double_tap_action` | object | Double-tap action |
| `animations` | list | Card animations |

---

## Elbow Types

| Type | Corner position |
|------|----------------|
| `header-left` | Top-left |
| `header-right` | Top-right |
| `footer-left` | Bottom-left |
| `footer-right` | Bottom-right |

Additional types (open corners, contained styles) are available from installed packs.

---

## Elbow Styles

### Simple (default)

Single elbow — one curved L-shape.

```yaml
elbow:
  type: header-left
  style: simple
  segment:
    bar_width: 90       # Vertical bar thickness (px)
    bar_height: 20      # Horizontal bar thickness (px)
    outer_curve: auto   # Corner radius — 'auto' = bar_width / 2 (LCARS formula)
    color:
      default: "#FF9900"
      active: "#FFCC44"
```

### Segmented (TNG / Picard style)

Two concentric elbows with a gap — the double-elbow look from Star Trek TNG.

```yaml
elbow:
  type: header-left
  style: segmented
  segments:
    gap: 4              # Gap between inner and outer elbow
    factor: 4           # Size ratio: outer = 3/4, inner = 1/4
    colors:
      outer: "#FF9900"
      inner: "#FFCC99"
```

---

## Segment Options (Simple Style)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bar_width` | number / `"theme"` | 90 | Vertical bar thickness in px. Use `"theme"` to bind to `input_number.lcars_vertical` |
| `bar_height` | number / `"theme"` | 20 | Horizontal bar thickness in px. Use `"theme"` to bind to `input_number.lcars_horizontal` |
| `outer_curve` | number / `"auto"` | `"auto"` | Corner arc radius. `auto` = `bar_width / 2` |
| `inner_curve` | number | — | Inner arc radius (omit for LCARS formula: `outer / 2`) |
| `color` | color / object | — | Fill color, supports state-based map |

---

## Segments Options (Segmented Style)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `gap` | number | 4 | Gap in px between outer and inner elbow |
| `factor` | number | 4 | Size division factor |
| `colors.outer` | color | main color | Outer elbow color |
| `colors.inner` | color | main color | Inner elbow color |

---

## HA-LCARS Theme Binding

If you use the [HA-LCARS theme](https://github.com/th3jesta/ha-lcars), bind bar dimensions to the theme helpers to keep all elbows synchronized:

```yaml
elbow:
  type: footer-right
  segment:
    bar_width: theme     # Reads input_number.lcars_vertical
    bar_height: theme    # Reads input_number.lcars_horizontal
```

Changing the helper value updates every elbow using `theme` binding simultaneously.

---

## Text Labels

Elbows inherit the full button text system. Common use: a label on the horizontal bar.

```yaml
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 120
    bar_height: 22
text:
  section:
    content: NAVIGATION
    position: top-right
    font_size: 11
    font_weight: bold
```

---

## Examples

### Standard header cap pair

Two elbows framing a section header:

```yaml
# Left cap
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: theme
    bar_height: theme

---

# Right cap
type: custom:lcards-elbow
elbow:
  type: header-right
  segment:
    bar_width: theme
    bar_height: theme
```

### State-reactive elbow

Changes color when a sensor is above threshold (using [Rules Engine](../../core/rules/README.md)):

```yaml
type: custom:lcards-elbow
id: alert-cap
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
    color:
      default: "#FF9900"
```

Then define a rule that patches `id: alert-cap` when the sensor is high.

---

## Background Animation Framing

Elbow cards support `inset: auto` on `background_animation` entries. When set, the animation canvas is automatically inset to sit precisely inside the LCARS bar borders — no manual pixel tuning required.

```yaml
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
background_animation:
  - preset: cascade
    config:
      format: hex
      pattern: default
      opacity: 0.6
    inset: auto   # canvas is automatically inset to sit inside the elbow bars
```

You can also specify a manual inset object for full control:

```yaml
background_animation:
  - preset: grid
    config:
      line_spacing: 40
      color: "rgba(255, 153, 0, 0.3)"
    inset:
      top: 20
      right: 0
      bottom: 0
      left: 90
```

See [Background Animations](../../core/effects/background-animations.md) for full documentation.

---

## Related

- [Button card](../button/README.md)
- [Themes — HA-LCARS binding](../../core/themes/README.md)
- [Rules Engine](../../core/rules/README.md)
- [Animations](../../core/animations.md)
