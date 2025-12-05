# LCARdS Slider Card - Official Schema Definition

**Purpose:** Single source of truth for slider schema - update tokens, presets, code, and docs from this
**Status:** 🎯 DEFINITIVE - All implementations must match this
**Extends:** [LCARdS Button Schema](button-schema-definition.md)

---

## Overview

The Slider card extends the Button card, inheriting all its features while adding:
- **Interactive sliders** for controlling entity values (lights, covers, fans)
- **Read-only gauges** for displaying sensor values
- **Two visual styles:** Pills (segmented bar) and Gauge (ruler with ticks)
- **Track-specific configuration** for appearance and behavior
- **CSS borders** for framing and labels
- **Text areas** adapted for borders and track zones

---

## Complete YAML Schema

```yaml
type: custom:lcards-slider

# ═══════════════════════════════════════════════════════════════
# INHERITED FROM BUTTON (see button-schema-definition.md)
# ═══════════════════════════════════════════════════════════════
entity: <entity-id>              # Required for sliders (unlike button)
text:                            # Multi-text field system (inherited)
  <field-id>:
    content: <string>
    area: left | top | right | bottom | track  # NEW: 'track' area for slider
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

# Actions (inherited)
tap_action: <action>
hold_action: <action>
double_tap_action: <action>

# Rules (inherited)
rules: <rules-config>

# Animations (inherited)
animations: <animation-config>

# ═══════════════════════════════════════════════════════════════
# SLIDER-SPECIFIC CONFIGURATION
# ═══════════════════════════════════════════════════════════════

# Component (required)
component: horizontal | vertical | picard

# Control Configuration
control:
  min: <number>                  # Minimum value (default: 0 or entity min)
  max: <number>                  # Maximum value (default: 100 or entity max)
  step: <number>                 # Step increment (default: 1 or entity step)
  attribute: <string>            # Entity attribute to control (auto-detected by domain)
  locked: <boolean>              # Disable interaction (default: auto-set by domain)

# Style Configuration
style:
  # Track Configuration
  track:
    type: pills | gauge          # Visual style (auto-detected by domain)
    orientation: horizontal | vertical  # Auto-detected from component
    margin: <number> | object    # Margin around track zone (px)
    # OR per-side:
    margin:
      top: <number>
      right: <number>
      bottom: <number>
      left: <number>

    # Pills Configuration (when type: pills)
    segments:
      count: <number>            # Number of pills (undefined = auto-calculate)
      gap: <number>              # Gap between pills in px (default: 4)
      shape:
        radius: <number>         # Border radius in px (default: 4)
      size:
        height: <number>         # Pill height in px (default: 12)
        width: <number>          # Pill width in px (auto-calculated if count set)
      gradient:
        interpolated: <boolean>  # Always true for pills (each pill is solid color)
        start: <color>           # Start color (left/bottom)
        end: <color>             # End color (right/top)
      appearance:
        unfilled:
          opacity: <number>      # Unfilled opacity (default: 0.2)
        filled:
          opacity: <number>      # Filled opacity (default: 1.0)

  # Gauge Configuration (when type: gauge)
  gauge:
    progress_bar:
      color: <color>             # Progress fill color
      height: <number>           # Bar height in px (default: 12)
      radius: <number>           # Border radius in px (default: 2)
    scale:
      tick_marks:
        major:
          enabled: <boolean>     # Show major ticks (default: true)
          interval: <number>     # Value interval (not pixels) (default: 10)
          color: <color>         # Tick color
          height: <number>       # Tick height in px (default: 15)
          width: <number>        # Tick width in px (default: 2)
        minor:
          enabled: <boolean>     # Show minor ticks (default: true)
          interval: <number>     # Value interval (not pixels) (default: 2)
          color: <color>         # Tick color
          height: <number>       # Tick height in px (default: 10)
          width: <number>        # Tick width in px (default: 1)
      labels:
        enabled: <boolean>       # Show labels (default: true)
        unit: <string>           # Unit suffix (default: '' or entity unit)
        color: <color>           # Label color
        font_size: <number>      # Font size (default: 14)
        padding: <number>        # Tick-label spacing (default: 3)
    indicator:
      enabled: <boolean>         # Show indicator (default: false)
      type: line | thumb         # Indicator type (default: line)
      color: <color>             # Indicator color
      size:
        width: <number>          # Indicator width (default: 4)
        height: <number>         # Indicator height (default: 25)
      border:
        color: <color>           # Border color
        width: <number>          # Border width (default: 1)

  # CSS Borders (simple frame)
  border:
    left:
      size: <number>             # Border width in px (also accepts 'width')
      color: <color>             # CSS color or variable
    top:
      size: <number>             # Border width in px (also accepts 'width')
      color: <color>
    right:
      size: <number>             # Border width in px (also accepts 'width')
      color: <color>
    bottom:
      size: <number>             # Border width in px (also accepts 'width')
      color: <color>

  # Text Fields (inherited with slider-specific areas)
  text:
    fields:
      <field-id>:
        content: <string>
        area: left | top | right | bottom | track  # Text area placement
        position: <position-name>  # Position within area
        # ... (all other text properties from button)

# Layout
grid_options:
  rows: <number>                 # Grid rows for HA layout
  columns: <number>              # Grid columns for HA layout
```

---

## Component Types

| Component | Orientation | Description |
|-----------|-------------|-------------|
| `horizontal` | Horizontal | Simple horizontal track |
| `vertical` | Vertical | Simple vertical track |
| `picard` | Vertical | Decorative segmented elbows (TNG style) |

**Note:** Component determines **orientation only**. Visual style (pills vs gauge) is controlled by `style.track.type`.

---

## Automatic Domain Behavior

The slider automatically configures itself based on entity domain:

| Domain | Default Visual | Default Locked | Default Attribute | Default Range |
|--------|---------------|----------------|-------------------|---------------|
| `light` | `pills` | `false` | `brightness` | 0-100 |
| `cover` | `pills` | `false` | `current_position` | 0-100 |
| `fan` | `pills` | `false` | `percentage` | 0-100 |
| `input_number` | `pills` | `false` | (uses state) | entity min/max or 0-100 |
| `number` | `pills` | `false` | (uses state) | entity min/max or 0-100 |
| `sensor` | `gauge` | `true` | (uses state) | 0-100 (override recommended) |

All defaults can be overridden via configuration.

---

## Visual Styles

### Pills Style (Segmented Bar)

**Behavior:**
- Each pill is a **solid color** (not gradient within pill)
- Colors are **interpolated** across all pills (gradient start → end)
- Unfilled pills shown at reduced opacity

**Auto-sizing:**
```yaml
style:
  track:
    segments:
      # Omit 'count' for auto-calculation
      size:
        width: 12              # Fixed pill width
      gap: 4
# count = floor((trackWidth + gap) / (width + gap))
# Pills scale when grid size changes
```

**Fixed count:**
```yaml
style:
  track:
    segments:
      count: 20                # Always 20 pills
      gap: 4
# Pill width auto-calculated to fill space
# Pill dimensions change when grid size changes
```

### Gauge Style (Ruler)

**Behavior:**
- Progress bar shows current value
- Tick marks at configurable intervals (in **value units**, not pixels)
- Optional labels with unit suffix
- Optional indicator (line or thumb)

**Tick Interval Example:**
```yaml
control:
  min: 0
  max: 100
style:
  gauge:
    scale:
      tick_marks:
        major:
          interval: 20         # Ticks at 0, 20, 40, 60, 80, 100
        minor:
          interval: 5          # Ticks at 0, 5, 10, 15, 20...
```

---

## Control Configuration

### Range Behavior

**Visual Range vs Control Range:**

| Concept | Description | Range |
|---------|-------------|-------|
| **Visual Range** | What pills/gauge display | Always 0-100 (positions) |
| **Control Range** | User-configurable subset | e.g., 10-50 for lights |
| **Value Space** | Domain-agnostic percentages | 0-100% |

**Example:** Light with `min: 10, max: 50`
- Visual track: Full width (0-100% positions)
- Control input: Sized to 40% width, positioned at 10% offset
- Pill fill: Based on visual position (value 30 = 30% fill)
- Brightness: Direct percentage (value 30 = 30% = 76/255)

### Brightness Conversion (Lights)

The slider operates in **percentage space** (0-100%) regardless of control min/max:
- **Reading:** HA brightness (0-255) → Slider value (0-100%)
- **Writing:** Slider value (0-100%) → HA brightness (0-255)

**Custom Range Example:**
```yaml
entity: light.bedroom
control:
  min: 10                      # Won't go below 10%
  max: 50                      # Won't go above 50%
  step: 2                      # Changes in 2% increments
# Light receives 10%-50% brightness
# Pills fill based on position in full visual range
```

### Locking Behavior

```yaml
control:
  locked: true                 # Prevent user interaction (read-only display)
```

**Auto-locking:**
- Sensors: Automatically locked (read-only)
- Controllable domains (light, cover, fan): Unlocked by default
- Override with explicit `locked: true/false`

---

## Text Areas

The slider defines specific text areas:

| Area | Description | Available When |
|------|-------------|----------------|
| `left` | Left border area | `style.border.left` configured |
| `top` | Top border area | `style.border.top` configured |
| `right` | Right border area | `style.border.right` configured |
| `bottom` | Bottom border area | `style.border.bottom` configured |
| `track` | Track zone (over pills/gauge) | Always available |

**Position Keywords:** (within each area)
- `top-left`, `top-center`, `top-right`
- `center-left`, `center`, `center-right`
- `bottom-left`, `bottom-center`, `bottom-right`

**Text Area Example:**
```yaml
style:
  border:
    left:
      size: 120
      color: var(--lcars-orange)
  text:
    fields:
      label:
        content: "{entity.attributes.friendly_name}"
        area: left                # Placed in left border
        position: top-left
      value:
        content: "{entity.state}%"
        area: track               # Overlay on track
        position: center
```

---

## CSS Borders

Borders create simple frames around the slider:

```yaml
style:
  border:
    left:
      size: <number>             # Border width in px
      color: <color>             # CSS color or variable
    # ... (top, right, bottom same structure)
```

**Border Layout:**
```
┌─────────────────────────────────┐
│ Top Border (10px)               │
├────┬────────────────────────────┤
│ L  │ Track Zone                 │
│ e  │ (pills/gauge inject here)  │
│ f  │                            │
│ t  │                            │
│    │                            │
│ B  │                            │
│ o  │                            │
│ r  │                            │
│ d  │                            │
│ e  │                            │
│ r  │                            │
└────┴────────────────────────────┘
```

Track content injects into remaining space after borders.

---

## Color Value Types

Colors can be any of:
- **CSS Variables:** `var(--lcars-orange)`, `var(--ha-card-background)`
- **Theme Tokens:** `theme:components.slider.track.background.active`
- **Computed Tokens:** `alpha(colors.accent.primary, 0.7)`, `darken(colors.ui.error, 20)`
- **Direct CSS:** `'#FF9900'`, `'rgb(255, 153, 0)'`, `'orange'`

---

## Template Support

Text content supports templates with entity tokens:

```yaml
text:
  fields:
    label:
      content: "{entity.attributes.friendly_name}"
    brightness:
      content: "{entity.attributes.brightness}"
    state:
      content: "{entity.state}"
```

**Null Handling:** If a template resolves to `null` or `undefined`, it displays as an empty string (not "null").

---

## Complete Examples

### Example 1: Classic LCARS Light Control

```yaml
type: custom:lcards-slider
entity: light.bedroom
component: horizontal
grid_options:
  rows: 2
  columns: 3
style:
  border:
    left:
      size: 120
      color: var(--lcars-orange)
    top:
      size: 10
      color: var(--lcars-orange)
  track:
    type: pills
    segments:
      count: 20
      gap: 3
      gradient:
        start: var(--lcars-red)
        end: var(--lcars-green)
  text:
    fields:
      label:
        content: "{entity.attributes.friendly_name}"
        area: left
        position: top-left
        font_size: 16
      state:
        content: "{entity.state}"
        area: left
        position: center
        color: var(--lcars-blue)
tap_action:
  action: toggle
```

### Example 2: Vertical Temperature Gauge

```yaml
type: custom:lcards-slider
entity: sensor.outdoor_temperature
component: vertical
grid_options:
  rows: 6
  columns: 2
control:
  min: -20
  max: 40
  locked: true
style:
  track:
    type: gauge
  gauge:
    progress_bar:
      color: var(--lcars-orange)
    scale:
      tick_marks:
        major:
          interval: 10
          color: var(--lcars-white)
        minor:
          interval: 2
      labels:
        enabled: true
        unit: '°C'
```

### Example 3: Minimal Cover Control

```yaml
type: custom:lcards-slider
entity: cover.living_room_blinds
component: horizontal
control:
  attribute: current_position
  min: 0
  max: 100
style:
  track:
    type: pills
    segments:
      count: 15
      gap: 4
      gradient:
        start: var(--lcars-tan)
        end: var(--lcars-blue)
tap_action:
  action: toggle
```

### Example 4: High-Density Auto-Sized Pills

```yaml
type: custom:lcards-slider
entity: light.desk_lamp
component: horizontal
grid_options:
  rows: 1
  columns: 4
style:
  track:
    type: pills
    segments:
      # Omit count for auto-sizing
      size:
        width: 8                 # Fixed width
        height: 10
      gap: 2
      shape:
        radius: 2
      gradient:
        start: '#FF0000'
        end: '#00FF00'
tap_action:
  action: toggle
```

### Example 5: Interactive Gauge (Controllable Ruler)

```yaml
type: custom:lcards-slider
entity: light.bedroom
component: horizontal
control:
  locked: false                  # Explicitly enable interaction
style:
  track:
    type: gauge                  # Visual style: gauge ruler
  gauge:
    scale:
      tick_marks:
        major:
          interval: 20
tap_action:
  action: toggle
```

### Example 6: Custom Range Light Control

```yaml
type: custom:lcards-slider
entity: light.mood_lighting
component: horizontal
control:
  min: 10                        # Won't go below 10%
  max: 50                        # Won't go above 50%
  step: 2                        # Changes in 2% increments
style:
  track:
    type: pills
    segments:
      count: 20
      gradient:
        start: var(--lcars-orange)
        end: var(--lcars-orange)  # Solid color (same start/end)
tap_action:
  action: toggle
```

---

## Architecture Notes

### Extension Model

The slider card extends `LCARdSButton`:
- ✅ **Text field system** - Inherited with new 'track' area
- ✅ **Template processing** - Entity tokens work identically
- ✅ **Entity binding** - State-based behavior
- ✅ **Actions** - tap, hold, double-tap
- ✅ **Rules** - Conditional styling
- ✅ **Animations** - Transitions and effects

This provides a **consistent API** across button, elbow, and slider cards.

### Visual Range vs Control Range

**Important distinction:**

The slider separates visual representation from control range:
1. **Visual track**: Always full width (0-100% positions)
2. **Control input**: Sized and positioned according to min/max
3. **Pill fill**: Based on visual position (not normalized to control range)
4. **Brightness**: Direct percentage conversion (for lights)

**Example:** Light with `min: 10, max: 50`
- Track: 0────────10════════50──────100 (full width)
- Input:          [══40% input══]       (sized/positioned)
- Value 30:       ████████30░░░░░░░░░░ (30% fill, not 50%)
- Brightness: 30% = 76/255

### Memoization

Track content is **memoized** for performance:
- **Cache key:** Configuration hash + container dimensions
- **Invalidation:** Config changes or resize
- **Benefit:** Opacity updates don't regenerate DOM (60fps smooth)

### Component vs Visual Style

**Separation of concerns:**

| Property | Controls | Values |
|----------|----------|--------|
| `component` | **Orientation & SVG structure** | `horizontal`, `vertical`, `picard` |
| `style.track.type` | **Visual appearance** | `pills` (segmented) or `gauge` (ruler) |
| `control.locked` | **Interactivity** | `true` (read-only) or `false` (controllable) |

This allows:
- Interactive pills (light slider with segmented bars)
- Interactive gauge (light slider with ruler visual)
- Read-only gauge (sensor display)
- Read-only pills (sensor with segmented display)

---

## Implementation Status

### ✅ Completed (v2.2.70)
- [x] Slider extends LCARdSButton
- [x] Text field system inherited
- [x] Border configuration (CSS borders)
- [x] Text areas (left/top/right/bottom/track)
- [x] Pills visual style (interpolated gradient)
- [x] Gauge visual style (ticks, labels, indicator)
- [x] Control configuration (min/max/step/attribute/locked)
- [x] Domain-based defaults (lights, covers, fans, sensors)
- [x] Brightness percentage conversion
- [x] Template support with null handling
- [x] Actions (tap, hold, double-tap)
- [x] Rules engine support
- [x] Animations support
- [x] Memoization for performance

### 📋 Documentation
- [x] User guide: `doc/user/configuration/cards/slider.md`
- [x] Schema definition: `doc/architecture/schemas/slider-schema-definition.md`
- [x] Test plan: `doc/testing/slider-card-test-plan.md`

### 🧪 Testing
- [x] Phase 4: Border testing (left/top borders, text areas, control alignment)
- [x] 40+ test configurations in test plan
- [x] Build validation (v2.2.70)

---

## Related Documentation

- [LCARdS Button Schema Definition](button-schema-definition.md) - Parent card schema
- [Slider Card User Guide](../../user/configuration/cards/slider.md) - User documentation
- [Slider Test Plan](../../testing/slider-card-test-plan.md) - Comprehensive testing

---

**Status:** 🎯 DEFINITIVE SCHEMA - Use this to update all implementations
**Version:** LCARdS 2.2.70+
**Last Updated:** December 2025
