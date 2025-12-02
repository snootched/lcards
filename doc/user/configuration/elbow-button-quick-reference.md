# Elbow Button Card - Quick Reference

**Component:** `custom:lcards-elbow`
**Extends:** `custom:lcards-button`
**Purpose:** Classic LCARS elbow/corner designs with curved borders

---

## Overview

The Elbow Button Card creates the iconic LCARS interface aesthetic with L-shaped designs featuring:
- Configurable elbow positions (header/footer, left/right)
- Two styles: simple (single elbow) and segmented (Picard-style double elbow)
- LCARS arc formula-based geometry for authentic curves
- Uniform-width curved lines (like borders/overlays)
- Full Simple Button functionality (actions, rules, animations, templates)

---

## Complete Schema

```yaml
type: custom:lcards-elbow
entity: <entity_id>           # Optional: Home Assistant entity

# Elbow Configuration
elbow:
  type: header-left | header-right | footer-left | footer-right  # Elbow position
  style: simple | segmented   # Style: 'simple' (default) or 'segmented' (double elbow)

  # Simple Style (single elbow)
  segment:
    bar_width: <number>       # Width of vertical sidebar (pixels)
    bar_height: <number>      # Height of horizontal bar (pixels, optional)
                              # Default: same as bar_width
    outer_curve: <number> | 'auto'  # Outer corner radius (pixels)
                              # 'auto' = bar_width / 2 (LCARS tangent at midpoint)
    inner_curve: <number>     # Inner corner radius (pixels, optional)
                              # Default: outer_curve / 2 (LCARS formula)
    color: <color>            # Segment color (optional)

  # Segmented Style (double concentric elbow)
  segments:
    gap: <number>             # Gap between outer/inner segments (pixels, default: 4)

    # Outer segment (required)
    outer_segment:
      bar_width: <number>     # Width of vertical sidebar (pixels)
      bar_height: <number>    # Height of horizontal bar (pixels)
      outer_curve: <number>   # Outer corner radius (pixels)
      inner_curve: <number>   # Inner corner radius (pixels, optional)
                              # Default: outer_curve / 2 (LCARS formula)
      color: <color>          # Segment color (optional)

    # Inner segment (required)
    inner_segment:
      bar_width: <number>     # Width of vertical sidebar (pixels)
      bar_height: <number>    # Height of horizontal bar (pixels)
      outer_curve: <number>   # Outer corner radius (pixels, optional)
                              # Default: (outer_segment.inner_curve - gap) for concentricity
      inner_curve: <number>   # Inner corner radius (pixels, optional)
                              # Default: outer_curve / 2 (LCARS formula)
      color: <color>          # Segment color (optional)

  # Elbow-specific styling
  colors:
    background: <color>       # Override button background color for elbow

# All Simple Button features available
preset: <preset_name>         # Optional: Style preset
icon: <icon_config>           # Icon configuration (see Simple Button)
text:                         # Multi-text labels (auto-adjusted for elbow)
  <field-id>:
    content: <string>
    position: <position-name>
    # ... (all Simple Button text options)

# Actions (inherited from Simple Button)
tap_action: <action>
hold_action: <action>
double_tap_action: <action>

# Animations (inherited from Simple Button)
animations: <animation_config>

# Rules (inherited from Simple Button)
rules: <rules_config>

# Layout
grid_options:
  rows: <number>              # Grid rows for HA layout
  columns: <number>           # Grid columns for HA layout
```

---

## Elbow Types

### Header Elbows (Top)

**`header-left`** - Elbow in top-left corner
- Vertical bar on left edge
- Horizontal bar along top edge
- Curved corner connecting them

**`header-right`** - Elbow in top-right corner
- Vertical bar on right edge
- Horizontal bar along top edge
- Curved corner connecting them

### Footer Elbows (Bottom)

**`footer-left`** - Elbow in bottom-left corner
- Vertical bar on left edge
- Horizontal bar along bottom edge
- Curved corner connecting them

**`footer-right`** - Elbow in bottom-right corner
- Vertical bar on right edge
- Horizontal bar along bottom edge
- Curved corner connecting them

---

## Elbow Styles

### Simple Style (Default)

Single elbow path with configurable outer and inner radii.

```yaml
elbow:
  type: header-left
  style: simple          # Optional: 'simple' is default
  border:
    horizontal: 90
    vertical: 20
  radius:
    outer: 'auto'        # = horizontal / 2 = 45px
    # inner: auto-calculated via LCARS formula (outer / 2)
```

### Segmented Style (Picard)

Double concentric elbow paths with gap between them - the TNG aesthetic seen in Picard-era interfaces.

**Basic Segmented Elbow:**
```yaml
elbow:
  type: header-left
  style: segmented
  segments:
    gap: 4               # Gap between segments (pixels)
    outer_segment:
      bar_width: 30      # Outer segment sidebar width
      bar_height: 30     # Outer segment top bar height
      outer_curve: 60    # Outer segment outer radius
      color: '#FF9C00'   # Outer segment color
      # inner_curve: auto (= outer_curve / 2 = 30)
    inner_segment:
      bar_width: 60      # Inner segment sidebar width
      bar_height: 60     # Inner segment top bar height
      color: '#FFCC99'   # Inner segment color
      # outer_curve: auto (= outer.inner_curve - gap = 26 for concentricity)
      # inner_curve: auto (= outer_curve / 2 = 13)
```

**Key Points:**
- **No `border` parameter needed** - segment dimensions come from `bar_width` and `bar_height`
- All 8 parameters can be explicitly set for complete control
- Defaults maintain LCARS formula (inner_curve = outer_curve / 2)
- Defaults maintain concentricity between segments
- Override any curve radius for custom designs

---

## LCARS Arc Formula

The elbow uses authentic LCARS geometry:

```
Auto Outer Curve:
  outer_curve = bar_width / 2
  (Arc reaches flat edge at midpoint)

LCARS Inner Curve:
  inner_curve = outer_curve / 2
  (Semicircle arc relationship)

Uniform Line Width:
  lineWidth = outer_curve - inner_curve
```

### Example Calculations

For `bar_width: 150px`:
```yaml
segment:
  bar_width: 150
  outer_curve: auto      # = 150 / 2 = 75px
  # inner_curve: auto = 75 / 2 = 37.5px
  # line width: 75 - 37.5 = 37.5px
```

For uniform 30px line width:
```yaml
segment:
  bar_width: 30
  bar_height: 30
  outer_curve: 100
  inner_curve: 70        # 100 - 30 = 70
  # Result: 30px uniform thickness throughout
```

---

## Basic Examples

### Simple Header Elbow

```yaml
type: custom:lcards-elbow
entity: light.living_room
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
text:
  name:
    content: Engineering
tap_action:
  action: toggle
```

### Large Sweeping Arc (Uniform Line)

```yaml
type: custom:lcards-elbow
entity: light.bedroom
elbow:
  type: footer-left
  segment:
    bar_width: 30      # Line thickness
    bar_height: 30     # Line thickness
    outer_curve: 120   # Large arc
    inner_curve: 90    # 120 - 30 = 30px uniform line
text:
  name:
    content: Operations
    color: white
    position: bottom-left
tap_action:
  action: toggle
grid_options:
  rows: 4             # Tall card for large arc
```

### Footer Elbow with State Colors

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
  state:
    content: '{{entity.state}}'
    position: bottom-right
    color:
      heat: var(--lcars-orange)
      cool: var(--lcars-blue)
      'off': var(--lcars-gray)
tap_action:
  action: more-info
```

---

## Text Auto-Adjustment

Text fields are automatically adjusted to avoid overlapping the elbow:

### Header-Left Example
```yaml
elbow:
  type: header-left
  segment:
    bar_width: 90     # Sidebar width
    bar_height: 20    # Top bar height
text:
  name:
    content: Engineering
    # Auto-adjusted:
    # - align: left (matches elbow side)
    # - padding_left: 110 (90 + 20)
    # - padding_top: 30 (20 + 10)
```

### Footer-Right Example
```yaml
elbow:
  type: footer-right
  segment:
    bar_width: 90
    bar_height: 20
text:
  status:
    content: Online
    # Auto-adjusted:
    # - align: right (matches elbow side)
    # - padding_right: 110 (90 + 20)
    # - padding_bottom: 30 (20 + 10)
```

You can override these auto-adjustments with explicit values.

---

## Advanced Configuration

### Multiple Text Fields

```yaml
type: custom:lcards-elbow
entity: sensor.temperature
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
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
    color:
      default: var(--lcars-blue)
  status:
    content: Normal
    position: bottom-right
    font_size: 12
tap_action:
  action: more-info
```

### With Icon

```yaml
type: custom:lcards-elbow
entity: light.bridge
elbow:
  type: footer-left
  segment:
    bar_width: 90
    bar_height: 20
icon:
  icon: mdi:lightbulb
  position: center-left
  size: 32
  color:
    active: var(--lcars-orange)
    inactive: var(--lcars-gray)
text:
  name:
    content: Bridge Lighting
tap_action:
  action: toggle
```

### Custom Curves (Non-LCARS)

```yaml
type: custom:lcards-elbow
entity: switch.warp_core
elbow:
  type: header-right
  segment:
    bar_width: 100
    bar_height: 25
    outer_curve: 80    # Custom outer curve
    inner_curve: 50    # Custom inner curve (not LCARS formula)
text:
  name:
    content: Warp Core
tap_action:
  action: toggle
```

### State-Based Background Color

```yaml
type: custom:lcards-elbow
entity: binary_sensor.security
elbow:
  type: footer-right
  segment:
    bar_width: 90
    bar_height: 20
  colors:
    background: |
      {% if is_state('binary_sensor.security', 'on') %}
        var(--lcars-red)
      {% else %}
        var(--lcars-green)
      {% endif %}
text:
  name:
    content: Security Status
tap_action:
  action: more-info
```

### Segmented Elbow (Picard Style)

**Basic Segmented Header:**
```yaml
type: custom:lcards-elbow
entity: light.ready_room
elbow:
  type: header-left
  style: segmented
  segments:
    gap: 4
    outer_segment:
      bar_width: 30
      bar_height: 30
      outer_curve: 60
    inner_segment:
      bar_width: 60
      bar_height: 60
text:
  name:
    content: Ready Room
tap_action:
  action: toggle
```

**Segmented with Custom Colors:**
```yaml
type: custom:lcards-elbow
entity: sensor.warp_core_temp
elbow:
  type: footer-right
  style: segmented
  segments:
    gap: 6
    outer_segment:
      bar_width: 40
      bar_height: 40
      outer_curve: 80
      color: '#FF9C00'   # Warm orange for outer
    inner_segment:
      bar_width: 80
      bar_height: 80
      color: '#FFCC99'   # Light cream for inner
text:
  title:
    content: Warp Core
  value:
    content: '{{entity.state}}°C'
    position: center
    font_size: 28
tap_action:
  action: more-info
```

**Wide Segmented Footer:**
```yaml
type: custom:lcards-elbow
entity: light.bridge
elbow:
  type: footer-left
  style: segmented
  segments:
    gap: 8
    outer_segment:
      bar_width: 50
      bar_height: 50
      outer_curve: 100
      color: var(--lcars-gold)
    inner_segment:
      bar_width: 100
      bar_height: 100
      color: var(--lcars-tan-light)
text:
  name:
    content: Bridge Systems
    font_size: 22
tap_action:
  action: toggle
grid_options:
  rows: 2
  columns: 3
```

**Equal-Sized Segments (Uniform Double Line):**
```yaml
type: custom:lcards-elbow
entity: light.corridor
elbow:
  type: header-left
  style: segmented
  segments:
    gap: 4
    outer_segment:
      bar_width: 30
      bar_height: 30
      outer_curve: 60
      color: '#FF9C00'
    inner_segment:
      bar_width: 30       # Same as outer
      bar_height: 30      # Same as outer
      outer_curve: 26     # outer.inner_curve - gap for concentricity
      color: '#FFCC99'
text:
  name:
    content: Corridor Lighting
tap_action:
  action: toggle
```

**Narrow Outer Band (Border Effect):**
```yaml
type: custom:lcards-elbow
entity: sensor.power_level
elbow:
  type: footer-left
  style: segmented
  segments:
    gap: 4
    outer_segment:
      bar_width: 30      # Narrow uniform outer band
      bar_height: 30
      outer_curve: 60
      color: '#FF9C00'
    inner_segment:
      bar_width: 120     # Wide inner segment
      bar_height: 120
      color: '#FFCC99'
text:
  value:
    content: '{{entity.state}}%'
    position: center
    font_size: 32
tap_action:
  action: more-info
```

**Custom Curve Radii (Breaking LCARS Formula):**
```yaml
type: custom:lcards-elbow
entity: light.engineering
elbow:
  type: header-right
  style: segmented
  segments:
    gap: 6
    outer_segment:
      bar_width: 50
      bar_height: 50
      outer_curve: 100
      inner_curve: 40     # Custom (not outer_curve / 2)
      color: '#00AAFF'
    inner_segment:
      bar_width: 80
      bar_height: 80
      outer_curve: 30     # Custom (breaking concentricity)
      inner_curve: 10     # Custom
      color: '#66CCFF'
text:
  name:
    content: Engineering Bay
tap_action:
  action: toggle
```

---

## Design Guidelines

### Uniform Line Width

For consistent visual weight (like CSS borders):
```yaml
# 30px uniform line
segment:
  bar_width: 30
  bar_height: 30
  outer_curve: 100
  inner_curve: 70    # 100 - 30 = 30
```

### Classic LCARS Proportions

Use auto curves with LCARS formula:
```yaml
elbow:
  segment:
    bar_width: 90
    bar_height: 20
    outer_curve: auto  # 90 / 2 = 45px
    # inner_curve: auto = 45 / 2 = 22.5px
```

### Large Sweeping Arcs

For dramatic curved lines:
```yaml
segment:
  bar_width: 30      # Thin line
  bar_height: 30
  outer_curve: 150   # Large arc
  inner_curve: 120   # Maintains 30px line
grid_options:
  rows: 6            # Tall card needed
```

---

## Integration with Simple Button

The Elbow Button inherits **all features** from Simple Button:

- ✅ **Actions** - tap, hold, double-tap
- ✅ **Rules** - conditional styling based on state
- ✅ **Animations** - segment animations, transitions
- ✅ **Templates** - Jinja2 in text content
- ✅ **Icons** - Full icon configuration
- ✅ **Text** - Multi-field text system
- ✅ **State colors** - Active/inactive/unavailable
- ✅ **Presets** - Style preset system

See [Simple Button Quick Reference](button-quick-reference.md) for details.

---

## Common Use Cases

### Dashboard Headers

```yaml
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
text:
  name:
    content: Main Engineering
    font_size: 20
tap_action:
  action: none
```

### Decorative Corners

```yaml
type: custom:lcards-elbow
elbow:
  type: footer-right
  segment:
    bar_width: 50
    bar_height: 50
    outer_curve: 100
    inner_curve: 50
tap_action:
  action: none
grid_options:
  rows: 3
```

### Interactive Controls

```yaml
type: custom:lcards-elbow
entity: cover.bay_door
elbow:
  type: header-right
  segment:
    bar_width: 90
    bar_height: 20
icon:
  icon: mdi:garage
  size: 32
text:
  name:
    content: Bay Door
  state:
    content: '{{entity.state}}'
tap_action:
  action: toggle
hold_action:
  action: more-info
```

---

## Troubleshooting

### Arc doesn't look smooth
- Ensure `outer` and `inner` radii maintain proper relationship
- For uniform lines: `inner = outer - lineWidth`
- Check that card dimensions allow full arc to render

### Text overlaps elbow
- Text is auto-adjusted, but may need explicit positioning
- Use `position` for relative placement
- Use `x`, `y` or `x_percent`, `y_percent` for absolute control

### Actions don't work
- Ensure entity is configured (if using entity-based actions)
- Check tap_action configuration
- Verify button is not disabled by rules

### Elbow appears clipped
- Increase card height with `grid_options.rows`
- Check that `outer` radius fits within card dimensions
- Maximum outer radius is clamped to card dimensions

---

## Performance Notes

- Elbow rendering is optimized (single SVG path)
- No performance difference from Simple Button
- Large radii may require larger cards but don't impact render performance
- Text auto-adjustment happens once at config processing

---

## Related Documentation

- [Simple Button Quick Reference](button-quick-reference.md) - Parent card features
- [Animation Presets](../reference/animation-presets.md) - Animation configuration
- [Component Presets](../reference/component-presets.md) - Preset system

---

**Version:** LCARdS 1.24+
**Last Updated:** December 2025
