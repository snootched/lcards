# LCARdS Elbow Card - Official Schema Definition

**Purpose:** Single source of truth for elbow schema - update tokens, presets, code, and docs from this
**Status:** 🎯 DEFINITIVE - All implementations must match this
**Extends:** [LCARdS Button Schema](button-schema-definition.md)

---

## Overview

The Elbow card creates iconic LCARS L-shaped corner designs with:
- **Four elbow positions**: header-left, header-right, footer-left, footer-right
- **Two styles**: Simple (single elbow) and Segmented (double concentric elbow)
- **LCARS arc formula**: Authentic curved geometry with tangent-at-midpoint curves
- **Uniform-width strokes**: Like borders and overlays
- **Full button inheritance**: Actions, rules, animations, templates, text, icons

The elbow card extends `LCARdSButton` and inherits all its features.

---

## Complete YAML Schema

```yaml
type: custom:lcards-elbow

# ═══════════════════════════════════════════════════════════════
# INHERITED FROM BUTTON (see button-schema-definition.md)
# ═══════════════════════════════════════════════════════════════
entity: <entity-id>              # Optional - if omitted, always uses 'active' state
text:                            # Multi-text field system (auto-adjusted for elbow)
  <field-id>:
    content: <string>
    position: <position-name>
    x: <number>
    y: <number>
    x_percent: <number>
    y_percent: <number>
    rotation: <number>
    padding: <number|object>
    font_size: <number>
    color: <color|object>
    font_weight: <css-value>
    font_family: <css-value>
    text_transform: none | uppercase | lowercase | capitalize
    anchor: start | middle | end
    baseline: hanging | central | alphabetic
    show: <boolean>
    template: <boolean>

preset: <preset-name>            # Style preset (inherited)

# Icon Configuration (inherited)
icon_area: left | right | top | bottom | none
icon_area_size: <number>
icon: <icon-config>              # See button schema for full icon configuration

# Actions (inherited)
tap_action: <action>
hold_action: <action>
double_tap_action: <action>

# Rules (inherited)
rules: <rules-config>

# Animations (inherited)
animations: <animation-config>

# ═══════════════════════════════════════════════════════════════
# ELBOW-SPECIFIC CONFIGURATION
# ═══════════════════════════════════════════════════════════════

# Elbow Configuration (required)
elbow:
  # Elbow Type (required)
  type: header-left | header-right | footer-left | footer-right

  # Elbow Style (optional, default: simple)
  style: simple | segmented

  # ─────────────────────────────────────────────────────────────
  # SIMPLE STYLE (single elbow)
  # ─────────────────────────────────────────────────────────────
  segment:
    bar_width: <number>          # Width of vertical sidebar (pixels, required)
    bar_height: <number>         # Height of horizontal bar (pixels, optional)
                                 # Default: same as bar_width

    outer_curve: <number> | 'auto'  # Outer corner radius (pixels, required)
                                    # 'auto' = bar_width / 2 (LCARS tangent at midpoint)

    inner_curve: <number>        # Inner corner radius (pixels, optional)
                                 # Default: outer_curve / 2 (LCARS formula)

    color: <color>               # Segment color (optional)
                                 # Default: from preset or style.card.color.background

  # ─────────────────────────────────────────────────────────────
  # SEGMENTED STYLE (double concentric elbow)
  # ─────────────────────────────────────────────────────────────
  segments:
    gap: <number>                # Gap between outer/inner segments (pixels, default: 4)

    # Outer segment (required for segmented style)
    outer_segment:
      bar_width: <number>        # Width of vertical sidebar (pixels, required)
      bar_height: <number>       # Height of horizontal bar (pixels, optional)
                                 # Default: same as bar_width

      outer_curve: <number> | 'auto'  # Outer corner radius (pixels, required)
                                      # 'auto' = bar_width / 2 (LCARS tangent)

      inner_curve: <number>      # Inner corner radius (pixels, optional)
                                 # Default: outer_curve / 2 (LCARS formula)

      color: <color>             # Segment color (optional)

    # Inner segment (required for segmented style)
    inner_segment:
      bar_width: <number>        # Width of vertical sidebar (pixels, required)
      bar_height: <number>       # Height of horizontal bar (pixels, optional)
                                 # Default: same as bar_width

      outer_curve: <number> | 'auto'  # Outer corner radius (pixels, optional)
                                      # Default: (outer_segment.inner_curve - gap) for concentricity

      inner_curve: <number>      # Inner corner radius (pixels, optional)
                                 # Default: outer_curve / 2 (LCARS formula)

      color: <color>             # Segment color (optional)

  # Elbow-specific colors
  colors:
    background: <color>          # Override button background for elbow area
                                 # Default: from style.card.color.background

# Layout
grid_options:
  rows: <number>                 # Grid rows for HA layout
  columns: <number>              # Grid columns for HA layout
```

---

## Elbow Types

### Header Elbows (Top Corners)

**`header-left`** - Elbow in top-left corner
```
┌─────────────┐
│█████         │
│██            │
│              │
└──────────────┘
```
- Vertical bar on **left** edge
- Horizontal bar along **top** edge
- Curved corner connecting them

**`header-right`** - Elbow in top-right corner
```
┌─────────────┐
│         █████│
│            ██│
│              │
└──────────────┘
```
- Vertical bar on **right** edge
- Horizontal bar along **top** edge
- Curved corner connecting them

### Footer Elbows (Bottom Corners)

**`footer-left`** - Elbow in bottom-left corner
```
┌──────────────┐
│              │
│██            │
│█████         │
└─────────────┘
```
- Vertical bar on **left** edge
- Horizontal bar along **bottom** edge
- Curved corner connecting them

**`footer-right`** - Elbow in bottom-right corner
```
┌──────────────┐
│              │
│            ██│
│         █████│
└─────────────┘
```
- Vertical bar on **right** edge
- Horizontal bar along **bottom** edge
- Curved corner connecting them

---

## Elbow Styles

### Simple Style (Default)

Single elbow path with configurable outer and inner radii.

**Minimal Configuration:**
```yaml
elbow:
  type: header-left
  segment:
    bar_width: 90              # Required
    outer_curve: auto          # = bar_width / 2 = 45px (LCARS tangent)
    # bar_height: auto = 90 (same as bar_width)
    # inner_curve: auto = 22.5 (outer_curve / 2, LCARS formula)
```

**Full Configuration:**
```yaml
elbow:
  type: header-left
  style: simple                # Optional: 'simple' is default
  segment:
    bar_width: 90              # Vertical sidebar width
    bar_height: 20             # Horizontal bar height (different from width)
    outer_curve: 45            # Explicit outer radius
    inner_curve: 25            # Explicit inner radius (non-LCARS)
    color: var(--lcars-orange) # Segment color
```

### Segmented Style (Picard)

Double concentric elbow paths with gap between them - the TNG aesthetic seen in Picard-era interfaces.

**Basic Segmented Elbow:**
```yaml
elbow:
  type: header-left
  style: segmented
  segments:
    gap: 4                     # Gap between segments
    outer_segment:
      bar_width: 90            # Required
      bar_height: 20           # Optional
      outer_curve: 45          # Required
      # inner_curve: auto = 22.5 (outer_curve / 2, LCARS)
      color: var(--lcars-orange)
    inner_segment:
      bar_width: 70            # Required (thinner than outer)
      bar_height: 20           # Optional
      # outer_curve: auto = 18.5 (outer_segment.inner_curve - gap, concentric)
      # inner_curve: auto = 9.25 (outer_curve / 2, LCARS)
      color: var(--lcars-blue)
```

**Concentric Arcs:**
The system automatically calculates curves for concentricity:
- `inner_segment.outer_curve` defaults to `(outer_segment.inner_curve - gap)`
- This ensures the inner segment follows the outer segment's arc precisely

---

## LCARS Arc Formula

### Tangent-at-Midpoint Curves

The LCARS aesthetic uses a specific geometric relationship:
- **Outer curve** = `bar_width / 2` (tangent at midpoint of bar)
- **Inner curve** = `outer_curve / 2` (LCARS formula)

**Example:**
```yaml
segment:
  bar_width: 90
  outer_curve: auto          # = 90 / 2 = 45px
  inner_curve: auto          # = 45 / 2 = 22.5px
```

### Custom Curves

You can override LCARS defaults for different aesthetics:

**Tight Inner Curve:**
```yaml
segment:
  bar_width: 90
  outer_curve: 45
  inner_curve: 35            # Tighter than LCARS (45/2 = 22.5)
```

**Wide Sweeping Arc:**
```yaml
segment:
  bar_width: 30              # Thin line
  outer_curve: 150           # Large radius
  inner_curve: 120           # Maintains 30px line width
```

---

## Dimension Calculations

### Bar Height

If `bar_height` is omitted, it defaults to `bar_width`:

```yaml
segment:
  bar_width: 90
  # bar_height: 90 (automatic)
```

For L-shaped designs with different dimensions:
```yaml
segment:
  bar_width: 90              # Wide vertical bar
  bar_height: 20             # Thin horizontal bar
```

### Line Width Calculation

The visual line width is:
```
line_width = outer_curve - inner_curve
```

**Example:**
```yaml
segment:
  outer_curve: 100
  inner_curve: 70
# Line width = 100 - 70 = 30px
```

For uniform line width, ensure:
```
inner_curve = outer_curve - desired_line_width
```

---

## Text Auto-Adjustment

Text fields are **automatically adjusted** to avoid overlapping the elbow.

### Adjustment Rules

| Elbow Type | Text Alignment | Horizontal Padding | Vertical Padding |
|------------|----------------|-------------------|------------------|
| `header-left` | `left` | `padding_left: bar_width + 20` | `padding_top: bar_height + 10` |
| `header-right` | `right` | `padding_right: bar_width + 20` | `padding_top: bar_height + 10` |
| `footer-left` | `left` | `padding_left: bar_width + 20` | `padding_bottom: bar_height + 10` |
| `footer-right` | `right` | `padding_right: bar_width + 20` | `padding_bottom: bar_height + 10` |

### Example: Header-Left

```yaml
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
text:
  label:
    content: Engineering
    # Auto-applied:
    # - align: left
    # - padding_left: 110 (90 + 20)
    # - padding_top: 30 (20 + 10)
```

### Override Auto-Adjustment

You can explicitly override the automatic adjustments:

```yaml
text:
  label:
    content: Custom Position
    padding_left: 50         # Override auto-padding
    padding_top: 15          # Override auto-padding
```

---

## Color Value Types

Colors can be any of:
- **CSS Variables:** `var(--lcars-orange)`, `var(--ha-card-background)`
- **Theme Tokens:** `theme:components.elbow.segment.color.active`
- **Computed Tokens:** `alpha(colors.accent.primary, 0.7)`, `darken(colors.ui.error, 20)`
- **Direct CSS:** `'#FF9900'`, `'rgb(255, 153, 0)'`, `'orange'`

---

## State-Based Properties

Elbow segments support state-based colors via the inherited button system:

```yaml
elbow:
  segment:
    color:
      active: var(--lcars-orange)
      inactive: var(--lcars-gray)
      unavailable: var(--lcars-ui-red)
```

Or via `elbow.colors.background`:
```yaml
elbow:
  colors:
    background:
      active: var(--lcars-orange)
      inactive: var(--lcars-gray)
```

---

## Complete Examples

### Example 1: Classic LCARS Header-Left

```yaml
type: custom:lcards-elbow
entity: light.bridge
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
    outer_curve: auto         # 45px (tangent at midpoint)
    color: var(--lcars-orange)
text:
  label:
    content: Bridge Lighting
    font_size: 16
tap_action:
  action: toggle
grid_options:
  rows: 3
  columns: 2
```

### Example 2: Segmented Footer-Right

```yaml
type: custom:lcards-elbow
entity: sensor.warp_core_temperature
elbow:
  type: footer-right
  style: segmented
  segments:
    gap: 4
    outer_segment:
      bar_width: 90
      bar_height: 20
      outer_curve: 45
      color: var(--lcars-orange)
    inner_segment:
      bar_width: 70
      bar_height: 20
      color: var(--lcars-blue)
text:
  title:
    content: Warp Core
    position: top-right
    font_size: 18
  value:
    content: '{{entity.state}}°C'
    position: center
    font_size: 24
tap_action:
  action: more-info
grid_options:
  rows: 4
  columns: 3
```

### Example 3: Simple Footer-Left with Icon

```yaml
type: custom:lcards-elbow
entity: switch.deflector_shields
elbow:
  type: footer-left
  segment:
    bar_width: 90
    bar_height: 20
    outer_curve: auto
    color:
      active: var(--lcars-blue)
      inactive: var(--lcars-gray)
icon:
  icon: mdi:shield
  position: center-left
  size: 32
  color:
    active: var(--lcars-orange)
    inactive: var(--lcars-gray)
text:
  label:
    content: Deflector Shields
tap_action:
  action: toggle
```

### Example 4: Large Sweeping Arc

```yaml
type: custom:lcards-elbow
entity: sensor.operations
elbow:
  type: header-right
  segment:
    bar_width: 30             # Thin line
    bar_height: 30
    outer_curve: 150          # Large radius
    inner_curve: 120          # Maintains 30px line
    color: var(--lcars-tan)
text:
  label:
    content: Operations
    position: bottom-left
    font_size: 14
tap_action:
  action: more-info
grid_options:
  rows: 4                     # Tall card for large arc
  columns: 2
```

### Example 5: State-Based Colors with Rules

```yaml
type: custom:lcards-elbow
entity: climate.hvac
elbow:
  type: footer-right
  segment:
    bar_width: 90
    bar_height: 20
    outer_curve: auto
text:
  name:
    content: Climate Control
    position: top-right
  state:
    content: '{{entity.state}}'
    position: bottom-right
tap_action:
  action: more-info
rules:
  - when:
      entity: climate.hvac
      state: heat
    apply:
      elbow:
        segment:
          color: var(--lcars-orange)
      text:
        state:
          color: var(--lcars-orange)
  - when:
      entity: climate.hvac
      state: cool
    apply:
      elbow:
        segment:
          color: var(--lcars-blue)
      text:
        state:
          color: var(--lcars-blue)
  - when:
      entity: climate.hvac
      state: 'off'
    apply:
      elbow:
        segment:
          color: var(--lcars-gray)
      text:
        state:
          color: var(--lcars-gray)
```

### Example 6: Multiple Text Fields

```yaml
type: custom:lcards-elbow
entity: sensor.temperature
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
    outer_curve: auto
    color: var(--lcars-blue)
text:
  title:
    content: Main Engineering
    position: top-left
    font_size: 18
    font_weight: bold
  value:
    content: '{{entity.state}}°C'
    position: center
    font_size: 24
    color: var(--lcars-blue)
  status:
    content: Normal
    position: bottom-right
    font_size: 12
    color: var(--lcars-tan)
tap_action:
  action: more-info
grid_options:
  rows: 3
  columns: 3
```

---

## Architecture Notes

### Extension Model

The elbow card extends `LCARdSButton`:
- ✅ **Text field system** - Inherited with auto-adjustment
- ✅ **Template processing** - Entity tokens work identically
- ✅ **Entity binding** - State-based behavior
- ✅ **Actions** - tap, hold, double-tap
- ✅ **Rules** - Conditional styling
- ✅ **Animations** - Segment animations, transitions
- ✅ **Icons** - Full icon configuration
- ✅ **Presets** - Style preset system

This provides a **consistent API** across button, elbow, and slider cards.

### SVG Path Generation

Elbow paths are generated using the LCARS arc formula:
1. **Outer path**: Defined by `outer_curve` and elbow geometry
2. **Inner path**: Defined by `inner_curve` and elbow geometry
3. **Stroke**: Not used - filled path between outer and inner curves
4. **Uniform width**: Achieved by precise inner curve calculation

### Concentric Segments (Segmented Style)

For segmented elbows:
- **Gap**: Space between outer and inner segments
- **Auto-concentricity**: Inner segment's outer curve calculated to follow outer segment's inner curve
- **Formula**: `inner_segment.outer_curve = outer_segment.inner_curve - gap`

### Text Layout

Text is automatically adjusted to avoid elbow:
1. Card renders elbow paths first
2. Text areas calculated based on elbow dimensions
3. Padding applied based on elbow type (header/footer, left/right)
4. User can override with explicit values

---

## Design Guidelines

### Classic LCARS Proportions

For authentic LCARS appearance:
```yaml
segment:
  bar_width: 90
  bar_height: 20              # Thin horizontal bar
  outer_curve: auto           # Tangent at midpoint
  inner_curve: auto           # LCARS formula (outer / 2)
```

### Thick Lines

For prominent elbow lines:
```yaml
segment:
  bar_width: 120
  bar_height: 30
  outer_curve: 100
  inner_curve: 70             # 100 - 70 = 30px line
```

### Thin Arc Lines

For delicate curved borders:
```yaml
segment:
  bar_width: 30
  bar_height: 30
  outer_curve: 150            # Large radius
  inner_curve: 120            # 150 - 120 = 30px line
```

### Segmented Style Best Practices

**Equal Line Widths:**
```yaml
segments:
  gap: 4
  outer_segment:
    bar_width: 90
    outer_curve: 45
    inner_curve: 22.5         # Line width: 22.5px
  inner_segment:
    bar_width: 70
    # outer_curve: auto = 18.5 (22.5 - 4)
    # inner_curve: auto = 9.25 (half of outer)
    # Line width: 9.25px ≈ half of outer segment
```

**Equal Segment Widths:**
```yaml
segments:
  gap: 4
  outer_segment:
    bar_width: 90
    outer_curve: 45
    inner_curve: 30           # Line width: 15px
  inner_segment:
    bar_width: 70
    outer_curve: 26           # (30 - 4 = 26)
    inner_curve: 11           # (26 - 15 = 11) Line width: 15px
```

---

## Integration with LCARdS Button

The Elbow card inherits **all features** from LCARdS Button:

- ✅ **Actions** - tap, hold, double-tap
- ✅ **Rules** - Conditional styling based on state
- ✅ **Animations** - Segment animations, transitions
- ✅ **Templates** - Jinja2 in text content
- ✅ **Icons** - Full icon configuration
- ✅ **Text** - Multi-field text system
- ✅ **State colors** - Active/inactive/unavailable
- ✅ **Presets** - Style preset system

See [LCARdS Button Quick Reference](button.md) for complete details on inherited features.

---

## Common Use Cases

### Dashboard Headers

```yaml
# Header elbow for section title
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
    color: var(--lcars-orange)
text:
  title:
    content: Engineering Section
    font_size: 18
```

### Corner Accent Cards

```yaml
# Footer accent with status
type: custom:lcards-elbow
entity: sensor.system_status
elbow:
  type: footer-right
  segment:
    bar_width: 60
    bar_height: 15
    color: var(--lcars-blue)
text:
  status:
    content: '{{entity.state}}'
    position: bottom-right
```

### Interactive Controls

```yaml
# Toggle control with elbow frame
type: custom:lcards-elbow
entity: switch.main_power
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
    color:
      active: var(--lcars-orange)
      inactive: var(--lcars-gray)
text:
  label:
    content: Main Power
tap_action:
  action: toggle
```

---

## Troubleshooting

### Elbow not appearing
- Check `elbow.type` is valid (header-left, header-right, footer-left, footer-right)
- Ensure `elbow.segment.bar_width` or `elbow.segments.outer_segment.bar_width` is set
- Verify `outer_curve` is defined or set to `'auto'`

### Text overlaps elbow
- Text auto-adjustment may be overridden by explicit values
- Remove explicit `padding` values to use auto-adjustment
- Check elbow dimensions match text padding calculations

### Curves look wrong
- Use `outer_curve: auto` for LCARS tangent-at-midpoint formula
- Use `inner_curve: auto` for LCARS formula (outer / 2)
- For custom curves, ensure `inner_curve < outer_curve`

### Segmented gaps misaligned
- Check `gap` value is appropriate (default: 4)
- Ensure `inner_segment.outer_curve` follows outer segment
- Use `auto` for automatic concentricity

### State colors not working
- Check entity is valid and has state
- Use `color` object with `active`, `inactive`, `unavailable` keys
- Or use `elbow.colors.background` for state-based colors

---

## Implementation Status

### ✅ Completed (v1.24+)
- [x] Elbow extends LCARdSButton
- [x] Four elbow types (header/footer, left/right)
- [x] Two styles (simple, segmented)
- [x] LCARS arc formula (tangent-at-midpoint)
- [x] Auto-calculation for curves and dimensions
- [x] Concentric segmented elbows
- [x] Text auto-adjustment
- [x] State-based colors
- [x] Full button feature inheritance
- [x] Icon support
- [x] Rules engine support
- [x] Animation support

### 📋 Documentation
- [x] User guide: `doc/user/configuration/cards/elbow.md`
- [x] Schema definition: `doc/architecture/schemas/elbow-schema-definition.md`

---

## Related Documentation

- [LCARdS Button Schema Definition](button-schema-definition.md) - Parent card schema
- [Elbow Card User Guide](../../user/configuration/cards/elbow.md) - User documentation
- [LCARdS Card Foundation](../cards/lcards-card-foundation.md) - Base architecture

---

**Status:** 🎯 DEFINITIVE SCHEMA - Use this to update all implementations
**Version:** LCARdS 1.24+
**Last Updated:** December 2025
