# LCARdS Slider Card - Quick Reference

**Component:** `custom:lcards-slider`
**Extends:** `custom:lcards-button`
**Purpose:** Interactive sliders and gauge displays for controlling and monitoring entity values

---

## Overview

The Slider card provides both interactive controls (for lights, covers, fans, etc.) and read-only gauge displays (for sensors) with two distinct visual styles:
- **Pills** - Segmented bar style with interpolated colors
- **Gauge** - Ruler style with tick marks and progress bar

Automatically configures itself based on entity domain, separating visual style from interactivity for maximum flexibility.

---

## Complete Schema

```yaml
type: custom:lcards-slider
entity: <entity_id>           # Required: Entity to control/display

# Component (required)
component: horizontal | vertical | picard

# Control Configuration
control:
  min: <number>               # Minimum value (default: 0 or entity min)
  max: <number>               # Maximum value (default: 100 or entity max)
  step: <number>              # Step increment (default: 1 or entity step)
  attribute: <string>         # Entity attribute to control (auto-detected by domain)
  locked: <boolean>           # Disable interaction (default: auto-set by domain)

# Style Configuration
style:
  # Track Visual Style
  track:
    type: pills | gauge       # Visual style (auto-detected by domain)
    orientation: horizontal | vertical  # Auto-detected from component
    margin: <number> | object # Margin around track zone (px)

    # Display Range (Phase 1) - Visual scale independent of control range
    display:
      min: <number>           # Minimum value shown on visual scale (default: control.min)
      max: <number>           # Maximum value shown on visual scale (default: control.max)
      unit: <string>          # Display unit for labels (overrides entity unit)

    # Pills Configuration (when type: pills)
    segments:
      count: <number>         # Number of pills (undefined = auto-calculate)
      gap: <number>           # Gap between pills in px (default: 4)
      shape:
        radius: <number>      # Border radius in px (default: 4)
      size:
        height: <number>      # Pill height in px (default: 12)
        width: <number>       # Pill width in px (auto-calculated)
      gradient:
        interpolated: <boolean>  # Always true for pills
        start: <color>        # Start color (left/bottom)
        end: <color>          # End color (right/top)
      appearance:
        unfilled:
          opacity: <number>   # Unfilled opacity (default: 0.2)
        filled:
          opacity: <number>   # Filled opacity (default: 1.0)

  # Gauge Configuration (when type: gauge)
  gauge:
    progress_bar:
      color: <color>          # Progress fill color
      height: <number>        # Bar height in px (default: 12)
      radius: <number>        # Border radius in px (default: 2)
    scale:
      tick_marks:
        major:
          enabled: <boolean>  # Show major ticks (default: true)
          interval: <number>  # Value interval (default: 10)
          color: <color>      # Tick color
          height: <number>    # Tick height in px (default: 15)
          width: <number>     # Tick width in px (default: 2)
        minor:
          enabled: <boolean>  # Show minor ticks (default: true)
          interval: <number>  # Value interval (default: 2)
          color: <color>      # Tick color
          height: <number>    # Tick height in px (default: 10)
          width: <number>     # Tick width in px (default: 1)
      labels:
        enabled: <boolean>    # Show labels (default: true)
        unit: <string>        # Unit suffix (default: '' or entity unit)
        color: <color>        # Label color
        font_size: <number>   # Font size (default: 14)
        padding: <number>     # Tick-label spacing (default: 3)
    indicator:
      enabled: <boolean>      # Show indicator (default: false)
      type: line | thumb      # Indicator type (default: line)
      color: <color>          # Indicator color
      size:
        width: <number>       # Indicator width (default: 4)
        height: <number>      # Indicator height (default: 25)
      border:
        color: <color>        # Border color
        width: <number>       # Border width (default: 1)

  # Color-Coded Ranges (Phase 2) - Visual context zones
  ranges:
    - min: <number>           # Range start value (in display space)
      max: <number>           # Range end value (in display space)
      color: <color>          # Range background color (CSS color or variable)
      label: <string>         # Optional descriptive label (for future use)
      opacity: <number>       # Background opacity (0-1, default: 0.3)
    # Add multiple ranges to create color-coded zones

  # CSS Borders (simple frame)
  border:
    left:
      size: <number>          # Border width in px
      color: <color>          # CSS color or variable
    top:
      size: <number>
      color: <color>
    right:
      size: <number>
      color: <color>
    bottom:
      size: <number>
      color: <color>

  # Text Fields (inherited from LCARdS Button)
  text:
    fields:
      <field-id>:
        content: <string>     # Text content (supports templates)
        area: left | top | right | bottom | track  # Text area placement
        position: <position-name>  # Position keyword
        color: <color>        # Text color (default: var(--lcars-white))
        font_size: <number>   # Font size (default: 14)
        # ... (all LCARdS Button text options)

# Actions (inherited from LCARdS Button)
tap_action: <action>
hold_action: <action>
double_tap_action: <action>

# Animations (inherited from LCARdS Button)
animations: <animation_config>

# Rules (inherited from LCARdS Button)
rules: <rules_config>

# Layout
grid_options:
  rows: <number>              # Grid rows for HA layout
  columns: <number>           # Grid columns for HA layout
```

---

## Quick Start

### Basic Light Slider
```yaml
type: custom:lcards-slider
entity: light.bedroom
component: horizontal
```

### Sensor Gauge Display
```yaml
type: custom:lcards-slider
entity: sensor.temperature
component: horizontal
```

### Bordered Slider with Text
```yaml
type: custom:lcards-slider
entity: light.bedroom
component: horizontal
style:
  border:
    left:
      size: 120
      color: var(--lcars-orange)
    top:
      size: 10
      color: var(--lcars-orange)
  text:
    fields:
      label:
        content: "{entity.attributes.friendly_name}"
        area: left
        position: top-left
      state:
        content: "{entity.state}"
        area: left
        position: center
```

---

## Components

Available slider components:

| Component | Orientation | Description |
|-----------|-------------|-------------|
| `basic` | Auto (any) | Simple slider track (no decorations) |
| `picard` | Vertical only | Decorative segmented elbows (TNG style) |

**Note:** For `basic` component, orientation is controlled by `style.track.orientation` config (horizontal or vertical). Styled components like `picard` lock orientation due to decorative elements.

**Example:**
```yaml
type: custom:lcards-slider
component: basic
style:
  track:
    orientation: vertical  # User controls layout direction
```

---

## Visual Styles vs Interactivity

The slider card separates **visual style** from **interactivity**:

| Property | Controls | Values |
|----------|----------|--------|
| `style.track.type` | **Visual appearance** | `pills` (segmented bar) or `gauge` (ruler with ticks) |
| `control.locked` | **Interactivity** | `true` (read-only) or `false` (controllable) |

**Examples:**
- **Interactive Pills:** Light slider with segmented bars (default for lights)
- **Interactive Gauge:** Light slider with gauge ruler visual (set `style.track.type: gauge`)
- **Read-only Gauge:** Sensor display with gauge ruler (auto-locked for sensors)

---

## Automatic Behavior

The card automatically configures itself based on entity domain:

| Domain | Default Visual | Default Locked | Default Attribute |
|--------|---------------|----------------|-------------------|
| `light` | `pills` | `false` | `brightness` |
| `cover` | `pills` | `false` | `current_position` |
| `fan` | `pills` | `false` | `percentage` |
| `input_number` | `pills` | `false` | (uses state) |
| `number` | `pills` | `false` | (uses state) |
| `sensor` | `gauge` | `true` | (uses state) |

All defaults can be overridden via configuration.

---

## Control Configuration

Configure how the slider interacts with entities:

```yaml
control:
  min: <number>               # Minimum value
  max: <number>               # Maximum value
  step: <number>              # Step increment
  attribute: <string>         # Entity attribute to control
  locked: <boolean>           # Disable interaction
```

### Custom Range for Light

```yaml
entity: light.bedroom
control:
  min: 10      # Minimum brightness 10%
  max: 50      # Maximum brightness 50%
  step: 2      # Increment by 2%
```

**How it works:**
- Visual track: Full width (0-100% positions)
- Control input: Sized to 40% width, positioned at 10% offset
- Pill fill: Based on visual position (value 30 = 30% fill)
- Brightness: Direct percentage conversion (value 30 = 30% = 76/255)

### Control Cover Position

```yaml
entity: cover.blinds
control:
  attribute: current_position
  min: 0
  max: 100
```

### Read-only Display

```yaml
control:
  locked: true  # Prevent user interaction
```

### Invert Slider Direction

Control slider value mapping and visual fill direction independently:

```yaml
control:
  invert_value: true | false   # Flip value range (min ↔ max)

style:
  track:
    invert_fill: true | false  # Flip visual fill direction
```

#### Value Inversion (`control.invert_value`)

Controls how slider position maps to entity value:

- `false` (default): Normal mapping
  - Slider at min position → entity receives min value
  - Slider at max position → entity receives max value
  
- `true`: Inverted mapping
  - Slider at min position → entity receives max value
  - Slider at max position → entity receives min value

#### Visual Fill Inversion (`style.track.invert_fill`)

Controls which end of the track fills:

- `false` (default): Fill from start
  - Horizontal: Left → Right
  - Vertical: Bottom → Top
  
- `true`: Fill from end
  - Horizontal: Right → Left
  - Vertical: Top → Bottom

### Common Cover Configurations

#### "Pull Down to Close" (Vertical Blinds)

User pulls slider down to close, visual fill grows from top:

```yaml
entity: cover.bedroom_blinds
component: vertical
control:
  invert_value: true   # Slide up = open (increase position)
style:
  track:
    invert_fill: true  # Fill from top (closed = full)
```

**Behavior:**
- Closed (position=0): Full fill from top
- User slides UP: Fill shrinks from top, cover opens
- Open (position=100): Empty fill

#### "Pull Up to Open" (Traditional Roller Shades)

User pulls slider up to open, visual fill grows from bottom:

```yaml
entity: cover.roller_shade
component: vertical
control:
  invert_value: false  # Normal: slide up = open
style:
  track:
    invert_fill: false  # Fill from bottom (open = full)
```

**Behavior:**
- Closed (position=0): Empty fill
- User slides UP: Fill grows from bottom, cover opens
- Open (position=100): Full fill from bottom

#### Garage Door (Horizontal, Left = Closed)

```yaml
entity: cover.garage_door
component: horizontal
control:
  invert_value: false
style:
  track:
    invert_fill: true  # Fill from right (closed = full on left side)
```

#### Light with Reversed Direction

```yaml
entity: light.bedroom
component: horizontal
control:
  invert_value: true   # Right = off, Left = on
style:
  track:
    invert_fill: false # Fill from left (normal visual)
```

---

## Pills Style (Segmented Bar)

Configure appearance of segmented pills:

```yaml
style:
  track:
    type: pills
    segments:
      count: <number>         # Number of pills (undefined = auto-calculate)
      gap: <number>           # Gap between pills in px (default: 4)
      shape:
        radius: <number>      # Border radius in px (default: 4)
      size:
        height: <number>      # Pill height in px (default: 12)
        width: <number>       # Pill width in px (auto-calculated)
      gradient:
        start: <color>        # Start color (CSS color or variable)
        end: <color>          # End color (CSS color or variable)
      appearance:
        unfilled:
          opacity: <number>   # Opacity for unfilled pills (default: 0.2)
        filled:
          opacity: <number>   # Opacity for filled pills (default: 1.0)
```

### Pill Count Behavior

**Auto-sizing (recommended):**
```yaml
style:
  track:
    segments:
      count: undefined        # Omit to auto-calculate
      size:
        width: 12             # Fixed pill width
        height: 12
      gap: 4
# Card calculates: count = floor((trackWidth + gap) / (width + gap))
# Pills scale automatically when grid size changes
```

**Fixed count:**
```yaml
style:
  track:
    segments:
      count: 20               # Always 20 pills
      gap: 4
# Pill width auto-calculated to fill available space
# Pill dimensions change when grid size changes
```

### Gradient Interpolation

Pills **always** use interpolated colors. Each pill receives a unique solid color:

```yaml
style:
  track:
    segments:
      count: 12
      gradient:
        start: '#FF0000'      # Red (left/bottom)
        end: '#00FF00'        # Green (right/top)
```

**Result:**
- Pill 1: Pure red (#FF0000)
- Pill 6: Yellow
- Pill 12: Pure green (#00FF00)
- Each pill is a **solid color** (not gradient within pill)

### Examples

**High-density Pills:**
```yaml
style:
  track:
    type: pills
    segments:
      count: 40
      gap: 2
      shape:
        radius: 2
      size:
        height: 8
```

**Custom Gradient:**
```yaml
style:
  track:
    type: pills
    segments:
      gradient:
        start: 'var(--lcars-blue)'
        end: 'var(--lcars-orange)'
      appearance:
        unfilled:
          opacity: 0.1        # Nearly invisible
```

**Solid Color (Same Start/End):**
```yaml
style:
  track:
    segments:
      gradient:
        start: 'var(--lcars-orange)'
        end: 'var(--lcars-orange)'
```

---

## Gauge Style (Ruler with Ticks)

Configure gauge ruler appearance:

```yaml
style:
  track:
    type: gauge
  gauge:
    progress_bar:
      color: <color>
      height: <number>
      radius: <number>
    scale:
      tick_marks:
        major:
          enabled: <boolean>
          interval: <number>  # Value units (not pixels)
          color: <color>
          height: <number>
          width: <number>
        minor:
          enabled: <boolean>
          interval: <number>
          color: <color>
          height: <number>
          width: <number>
      labels:
        enabled: <boolean>
        unit: <string>        # Suffix for labels
        color: <color>
        font_size: <number>
        padding: <number>
    indicator:
      enabled: <boolean>
      type: line | thumb
      color: <color>
      size:
        width: <number>
        height: <number>
      border:
        color: <color>
        width: <number>
```

### Tick Mark Intervals

Intervals are in **value units** (not pixels):

```yaml
control:
  min: 0
  max: 100
style:
  gauge:
    scale:
      tick_marks:
        major:
          interval: 20        # Ticks at 0, 20, 40, 60, 80, 100
        minor:
          interval: 5         # Ticks at 0, 5, 10, 15, 20, 25...
```

For temperature sensor with custom range:
```yaml
control:
  min: -20
  max: 120
style:
  gauge:
    scale:
      tick_marks:
        major:
          interval: 20        # Ticks at -20, 0, 20, 40, 60, 80, 100, 120
```

### Examples

**Minimal Gauge (No Ticks):**
```yaml
style:
  track:
    type: gauge
  gauge:
    scale:
      tick_marks:
        major:
          enabled: false
        minor:
          enabled: false
      labels:
        enabled: false
```

**Temperature Gauge:**
```yaml
entity: sensor.outdoor_temperature
style:
  track:
    type: gauge
  gauge:
    scale:
      tick_marks:
        major:
          interval: 10
          color: var(--lcars-orange)
        minor:
          interval: 2
      labels:
        unit: '°C'            # Shows as "20°C", "30°C", etc.
```

**Gauge with Line Indicator:**
```yaml
style:
  gauge:
    indicator:
      enabled: true
      type: line
      color: var(--lcars-white)
      size:
        width: 4
        height: 30
```

---

## CSS Borders

Add simple CSS borders around the slider:

```yaml
style:
  border:
    left:
      size: <number>          # Border width in px
      color: <color>          # CSS color or variable
    top:
      size: <number>
      color: <color>
    right:
      size: <number>
      color: <color>
    bottom:
      size: <number>
      color: <color>
```

**Note:** Use `size` (recommended) or `width` (legacy) for border dimensions.

### Border Layout

Borders are applied as CSS borders on the container. Track content injects into remaining space:

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

### Examples

**L-shaped Border (LCARS Style):**
```yaml
style:
  border:
    left:
      size: 120
      color: var(--lcars-orange)
    top:
      size: 10
      color: var(--lcars-orange)
```

**All Sides Bordered:**
```yaml
style:
  border:
    left:
      size: 40
      color: var(--lcars-blue)
    top:
      size: 12
      color: var(--lcars-blue)
    right:
      size: 40
      color: var(--lcars-blue)
    bottom:
      size: 12
      color: var(--lcars-blue)
```

---

## Text Fields

The slider card inherits the text field system from LCARdS Button.

```yaml
style:
  text:
    fields:
      <field-id>:             # Custom field name
        content: <string>     # Text content (supports templates)
        area: <string>        # Text area: left, top, right, bottom, track
        position: <string>    # Position within area
        color: <color>        # Text color (default: var(--lcars-white))
        font_size: <number>   # Font size (default: 14)
```

### Text Areas

| Area | Description | Available When |
|------|-------------|----------------|
| `left` | Left border area | `border.left` configured |
| `top` | Top border area | `border.top` configured |
| `right` | Right border area | `border.right` configured |
| `bottom` | Bottom border area | `border.bottom` configured |
| `track` | Track zone (over pills/gauge) | Always available |

### Position Values

Standard position keywords:
- `top-left`, `top-center`, `top-right`
- `center-left`, `center`, `center-right`
- `bottom-left`, `bottom-center`, `bottom-right`

### Template Support

```yaml
text:
  fields:
    label:
      content: "{entity.attributes.friendly_name}"
    state:
      content: "{entity.state}"
    brightness:
      content: "{entity.attributes.brightness}"
```

**Null Handling:** If a template resolves to `null` or `undefined`, it displays as an empty string.

### Examples

**Border Label Text:**
```yaml
style:
  border:
    left:
      size: 120
      color: var(--lcars-orange)
  text:
    fields:
      title:
        content: "{entity.attributes.friendly_name}"
        area: left
        position: top-left
        font_size: 16
      status:
        content: "{entity.state}"
        area: left
        position: center
        color: var(--lcars-blue)
      brightness:
        content: "{entity.attributes.brightness}"
        area: left
        position: bottom-right
        font_size: 12
```

**Track Overlay Text:**
```yaml
style:
  text:
    fields:
      value:
        content: "{entity.state}%"
        area: track
        position: center
        font_size: 18
```

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
control:
  min: -20
  max: 40
  locked: true
```

### Example 3: Minimal Cover Control

```yaml
type: custom:lcards-slider
entity: cover.living_room_blinds
component: horizontal
style:
  track:
    type: pills
    segments:
      count: 15
      gap: 4
      gradient:
        start: var(--lcars-tan)
        end: var(--lcars-blue)
control:
  attribute: current_position
  min: 0
  max: 100
tap_action:
  action: toggle
```

### Example 4: High-Density Pill Slider

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
      size:
        width: 8              # Fixed width for auto-sizing
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
style:
  track:
    type: gauge               # Visual style: gauge ruler
  gauge:
    scale:
      tick_marks:
        major:
          interval: 20
control:
  locked: false               # Explicitly enable interaction
tap_action:
  action: toggle
```

### Example 6: Custom Range Light Control

```yaml
type: custom:lcards-slider
entity: light.mood_lighting
component: horizontal
control:
  min: 10                     # Won't go below 10%
  max: 50                     # Won't go above 50%
  step: 2                     # Changes in 2% increments
style:
  track:
    type: pills
    segments:
      count: 20
      gradient:
        start: var(--lcars-orange)
        end: var(--lcars-orange)  # Solid color
tap_action:
  action: toggle
```

---

## Entity Domain Support

### Lights (`light.*`)

**Default Behavior:**
- Visual style: `pills`
- Locked: `false`
- Attribute: `brightness`
- Range: 0-100 (percentage scale)

**Brightness Conversion:**
The slider operates in percentage space (0-100%) regardless of control min/max.
- **Reading:** HA brightness (0-255) → Slider value (0-100%)
- **Writing:** Slider value (0-100%) → HA brightness (0-255)

**Custom Range:**
```yaml
control:
  min: 10
  max: 50
# Slider constrained to 10-50%
# Pills fill based on position in full visual range
# Light receives 10%-50% brightness
```

### Covers (`cover.*`)

**Default Behavior:**
- Visual style: `pills`
- Locked: `false`
- Attribute: `current_position`
- Range: 0-100
- **Value inversion: `false` (can be configured)**
- **Fill inversion: `false` (can be configured)**

**Cover Direction Options:**

Covers support flexible direction configuration to match user mental models:

1. **Traditional**: Slide up = open, fill from bottom
   ```yaml
   control:
     invert_value: false
   style:
     track:
       invert_fill: false
   ```

2. **Pull-down blinds**: Slide up = open, fill from top when closed
   ```yaml
   control:
     invert_value: true
   style:
     track:
       invert_fill: true
   ```

See "Invert Slider Direction" section for more examples.

### Fans (`fan.*`)

**Default Behavior:**
- Visual style: `pills`
- Locked: `false`
- Attribute: `percentage`
- Range: 0-100

### Input Numbers (`input_number.*`)

**Default Behavior:**
- Visual style: `pills`
- Locked: `false`
- Attribute: (uses state)
- Range: Inherits from entity or 0-100

### Numbers (`number.*`)

Same as `input_number`.

### Sensors (`sensor.*`)

**Default Behavior:**
- Visual style: `gauge`
- Locked: `true` (read-only)
- Attribute: (uses state)
- Range: 0-100 (override with `control.min`/`max`)

---

## Architecture Notes

### Extension of LCARdS Button

The slider card extends `LCARdSButton` and inherits:
- ✅ **Text field system** - `style.text.fields`
- ✅ **Template processing** - Entity tokens
- ✅ **Entity binding** - State-based behavior
- ✅ **Actions** - tap, hold, double-tap
- ✅ **Rules** - Conditional styling
- ✅ **Animations** - Transitions and effects

This provides a consistent API across button, elbow, and slider cards.

### Visual Range vs Control Range

**Important distinction:**

| Concept | Description | Range |
|---------|-------------|-------|
| **Visual Range** | What pills/gauge display | Always 0-100 |
| **Control Range** | User-configurable subset | e.g., 10-50 for lights |
| **Value Space** | Domain-agnostic percentages | 0-100% |

**Example:** Light with `min: 10, max: 50`
- Visual track: Full width (0-100% positions)
- Control input: Sized to 40% width, positioned at 10% offset
- Pill fill: Based on visual position (value 30 = 30% fill, not 50%)
- Brightness: Direct percentage (value 30 = 30% = 76/255)

### Memoization

Track content is memoized for performance:
- **Cache key:** Configuration hash
- **Invalidation:** Config or container size changes
- **Benefit:** Opacity updates don't regenerate DOM (60fps smooth)

---

## Integration with LCARdS Button

The Slider card inherits **all features** from LCARdS Button:

- ✅ **Actions** - tap, hold, double-tap
- ✅ **Rules** - Conditional styling based on state
- ✅ **Animations** - Transitions and effects
- ✅ **Templates** - Jinja2 in text content
- ✅ **Text** - Multi-field text system
- ✅ **State colors** - Active/inactive/unavailable
- ✅ **Theme tokens** - CSS variables and theme paths

**Slider-specific features:**

- ✅ **Control Range Separation** (Phase 1) - Set min/max for user control independently from visual display range
- ✅ **Color-Coded Ranges** (Phase 2) - Define visual zones for context (cold/comfort/hot, low/normal/high)
  - Gauge mode: Background segments behind ruler
  - Pills mode: Override gradient colors per range
  - Configurable opacity and labels

See [LCARdS Button Quick Reference](button.md) for details.

---

## Common Use Cases

### Temperature Gauge with Color-Coded Ranges

```yaml
type: custom:lcards-slider
entity: sensor.outdoor_temperature
preset: gauge-basic

control:
  locked: true

style:
  track:
    display:
      min: -20
      max: 60
      unit: '°C'
    orientation: horizontal
  
  ranges:
    - min: -20
      max: 0
      color: 'var(--info-color)'
      label: 'Freezing'
      opacity: 0.35
    - min: 0
      max: 15
      color: 'var(--primary-color)'
      label: 'Cold'
      opacity: 0.35
    - min: 15
      max: 25
      color: 'var(--success-color)'
      label: 'Comfortable'
      opacity: 0.35
    - min: 25
      max: 35
      color: 'var(--warning-color)'
      label: 'Hot'
      opacity: 0.35
    - min: 35
      max: 60
      color: 'var(--error-color)'
      label: 'Extreme'
      opacity: 0.35
  
  gauge:
    scale:
      tick_marks:
        major:
          interval: 10
      labels:
        enabled: true
```

### Climate Control with Comfort Zones

```yaml
type: custom:lcards-slider
entity: climate.living_room
preset: gauge-basic

control:
  min: 16
  max: 28
  step: 0.5
  attribute: temperature

style:
  track:
    display:
      min: 10
      max: 35
      unit: '°C'
  
  ranges:
    - min: 10
      max: 18
      color: '#4488ff'
      label: 'Too Cold'
      opacity: 0.4
    - min: 18
      max: 24
      color: '#44ff88'
      label: 'Comfort Zone'
      opacity: 0.4
    - min: 24
      max: 35
      color: '#ff8844'
      label: 'Too Hot'
      opacity: 0.4
  
  gauge:
    scale:
      tick_marks:
        major:
          interval: 5
      labels:
        enabled: true
```

### Dashboard Control Strip

```yaml
type: custom:lcards-slider
entity: light.living_room
component: horizontal
grid_options:
  rows: 1
  columns: 4
style:
  track:
    type: pills
    segments:
      count: 30
      gap: 2
tap_action:
  action: toggle
```

### Sensor Monitoring Panel

```yaml
type: custom:lcards-slider
entity: sensor.temperature
component: vertical
grid_options:
  rows: 6
  columns: 2
style:
  track:
    type: gauge
  gauge:
    scale:
      tick_marks:
        major:
          interval: 10
control:
  locked: true
```

### Multi-Zone Control

```yaml
# Living Room
type: custom:lcards-slider
entity: light.living_room
component: horizontal
style:
  border:
    left:
      size: 100
      color: var(--lcars-orange)
  text:
    fields:
      label:
        content: Living Room
        area: left

---

# Bedroom
type: custom:lcards-slider
entity: light.bedroom
component: horizontal
style:
  border:
    left:
      size: 100
      color: var(--lcars-blue)
  text:
    fields:
      label:
        content: Bedroom
        area: left
```

---

## Troubleshooting

### Pills don't fill correctly
- Check `control.min` and `max` match expected range
- For lights: Range should be 0-100 (percentages)
- Verify entity state is within configured range

### Slider doesn't respond
- Check `control.locked` is not `true`
- Verify entity domain is controllable (not sensor)
- Check browser console for errors

### Gauge ticks misaligned
- Ensure `control.min`/`max` match data range
- Verify `tick_marks.major.interval` is reasonable
- For temperature: Set min/max to cover expected range

### Text doesn't appear in border
- Verify border configured: `style.border.left.size: 120`
- Check text `area` matches border: `area: left`
- Ensure text `content` template is valid

### Brightness jumps to 100%
- Update to latest version (fixed in v2.2.69)
- Check control min/max configuration
- Verify entity state updates correctly

---

## Related Documentation

- [LCARdS Button Quick Reference](button.md) - Parent card features
- [LCARdS Elbow Quick Reference](elbow.md) - Similar bordered cards
- [Animation Presets](../../reference/animation-presets.md) - Animation configuration
- [Template Conditions](../template-conditions.md) - Dynamic content
- [Slider Test Plan](../../testing/slider-card-test-plan.md) - Comprehensive testing guide

---

**Version:** LCARdS 2.2.70+
**Last Updated:** December 2025
