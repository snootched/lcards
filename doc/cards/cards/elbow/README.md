# Elbow Card

`custom:lcards-elbow`

The Elbow card creates the iconic LCARS corner/cap shapes — the L-shaped coloured bars that frame sections of an LCARS interface. Extends the button card so it inherits text, actions, rules, animations, and templates.

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
| `text` | object | Text labels — see [Text Fields](../../../core/text-fields.md) |
| `style` | object | Card background, border, text styles — see [Button card](../button/README.md#style-object) |
| `tap_action` | object | Tap action — see [Actions](../../../core/actions.md) |
| `hold_action` | object | Hold action |
| `double_tap_action` | object | Double-tap action |
| `animations` | list | Card animations — see [Animations](../../../core/animations.md) |
| `background_animation` | list / object | Canvas background animations — see below |
| `shape_texture` | object | SVG texture inside the elbow shape fill |

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
      default: "var(--lcards-orange)"
      active: "var(--lcards-orange-medium)"
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
      outer: "var(--lcards-orange)"
      inner: "var(--lcards-moonlight)"
```

---

## Segment Options (Simple Style)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bar_width` | number / `"theme"` | `90` | Vertical bar thickness in px. Use `"theme"` to bind to `input_number.lcars_vertical` |
| `bar_height` | number / `"theme"` | `20` | Horizontal bar thickness in px. Use `"theme"` to bind to `input_number.lcars_horizontal` |
| `outer_curve` | number / `"auto"` | `"auto"` | Corner arc radius. `auto` = `bar_width / 2` |
| `inner_curve` | number | — | Inner arc radius (omit for LCARS formula: `outer / 2`) |
| `color` | string / object | — | Fill colour — [state map](../../../core/colours.md) supported |

---

## Segments Options (Segmented Style)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `gap` | number | `4` | Gap in px between outer and inner elbow |
| `factor` | number | `4` | Size division factor |
| `colors.outer` | string | main colour | Outer elbow colour |
| `colors.inner` | string | main colour | Inner elbow colour |

---

## HA-LCARS Theme Binding

If you use the [HA-LCARS theme](https://github.com/th3jesta/ha-lcars), bind bar dimensions to the theme helpers to keep all elbows synchronised:

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
    color: "var(--lcards-moonlight)"
```

See [Text Fields](../../../core/text-fields.md) for the complete reference.

---

## Background Animation Inset

Elbow cards support a canvas-level `inset` on `background_animation` so the animation fills only the open content area, not the LCARS bars.

### Auto inset (recommended)

Use `inset: auto` to let the card automatically derive the correct inset from its bar geometry:

```yaml
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
background_animation:
  inset: auto       # canvas sized to avoid the elbow bars
  effects:
    - preset: grid
      config:
        line_spacing: 40
        color: "alpha(var(--lcards-orange), 0.3)"
```

### Manual inset

Supply explicit pixel values when you need precise control:

```yaml
background_animation:
  inset:
    top: 20         # height of horizontal top bar
    left: 90        # width of vertical left bar
    right: 0
    bottom: 0
  effects:
    - preset: starfield
      config:
        count: 150
```

> **Note**: `inset: auto` is computed from the resolved bar geometry at runtime and updates automatically when theme bar dimensions change via `input_number` helpers.

---

## Shape Texture

Elbow cards support the same `shape_texture` feature as button cards — an SVG-native texture or animation clipped to the elbow shape fill (simple and segmented styles). Configuration is identical.

See [Button card — Shape Texture](../button/README.md#shape-texture) for the full preset reference and examples.

---

## Examples

### Standard header cap pair

```yaml
# Left cap
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: theme
    bar_height: theme

# Right cap
type: custom:lcards-elbow
elbow:
  type: header-right
  segment:
    bar_width: theme
    bar_height: theme
```

### State-reactive elbow

Changes colour when a sensor is above threshold (using [Rules Engine](../../../core/rules/README.md)):

```yaml
type: custom:lcards-elbow
id: alert-cap
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
    color:
      default: "var(--lcards-orange)"
```

Then define a rule that patches `id: alert-cap` when the sensor is high.

---
